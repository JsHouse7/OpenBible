import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Check if environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase environment variables not configured for search history API');
}

// Create Supabase client with fallback handling
const supabase = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// GET /api/search/history - Get user's search history
export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const searchType = searchParams.get('type'); // 'verse', 'reference', 'keyword'
    const offset = (page - 1) * limit;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate limit
    if (limit > 100) {
      return NextResponse.json(
        { error: 'Limit cannot exceed 100' },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from('search_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (searchType) {
      query = query.eq('search_type', searchType);
    }

    const { data: history, error } = await query;

    if (error) {
      console.error('Search history error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch search history' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('search_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (searchType) {
      countQuery = countQuery.eq('search_type', searchType);
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error('Count error:', countError);
    }

    return NextResponse.json({
      history: history || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
        hasNext: page * limit < (totalCount || 0),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/search/history - Add new search to history
export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { userId, query, searchType, filters = {}, resultsCount = 0 } = body;

    if (!userId || !query || !searchType) {
      return NextResponse.json(
        { error: 'User ID, query, and search type are required' },
        { status: 400 }
      );
    }

    // Validate search type
    const validTypes = ['verse', 'reference', 'keyword'];
    if (!validTypes.includes(searchType)) {
      return NextResponse.json(
        { error: 'Invalid search type' },
        { status: 400 }
      );
    }

    // Check if this exact search already exists recently (within last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: existingSearch } = await supabase
      .from('search_history')
      .select('id')
      .eq('user_id', userId)
      .eq('query', query)
      .eq('search_type', searchType)
      .gte('created_at', oneHourAgo)
      .limit(1);

    if (existingSearch && existingSearch.length > 0) {
      // Update the existing search instead of creating a new one
      const { data: updatedSearch, error: updateError } = await supabase
        .from('search_history')
        .update({
          filters,
          results_count: resultsCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSearch[0].id)
        .select()
        .single();

      if (updateError) {
        console.error('Update search history error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update search history' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        search: updatedSearch,
        action: 'updated'
      });
    }

    // Create new search history entry
    const { data: newSearch, error } = await supabase
      .from('search_history')
      .insert({
        user_id: userId,
        query,
        search_type: searchType,
        filters,
        results_count: resultsCount
      })
      .select()
      .single();

    if (error) {
      console.error('Insert search history error:', error);
      return NextResponse.json(
        { error: 'Failed to save search history' },
        { status: 500 }
      );
    }

    // Clean up old history entries (keep only last 1000 per user)
    const { data: oldEntries } = await supabase
      .from('search_history')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(1000, 1999);

    if (oldEntries && oldEntries.length > 0) {
      const idsToDelete = oldEntries.map(entry => entry.id);
      await supabase
        .from('search_history')
        .delete()
        .in('id', idsToDelete);
    }

    return NextResponse.json({
      search: newSearch,
      action: 'created'
    });
  } catch (error) {
    console.error('POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/search/history - Delete search history entries
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const searchId = searchParams.get('searchId');
    const deleteAll = searchParams.get('all') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (deleteAll) {
      // Delete all search history for user
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Delete all history error:', error);
        return NextResponse.json(
          { error: 'Failed to delete search history' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'All search history deleted successfully'
      });
    } else if (searchId) {
      // Delete specific search entry
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('id', searchId)
        .eq('user_id', userId); // Ensure user can only delete their own entries

      if (error) {
        console.error('Delete search error:', error);
        return NextResponse.json(
          { error: 'Failed to delete search entry' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Search entry deleted successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Either searchId or all=true parameter is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('DELETE API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}