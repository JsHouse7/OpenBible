import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const book = searchParams.get('book');
    const version = searchParams.get('version') || 'KJV';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Validate limit to prevent excessive requests
    if (limit > 100) {
      return NextResponse.json(
        { error: 'Limit cannot exceed 100' },
        { status: 400 }
      );
    }

    // Call the search function created in the migration
    const { data: verses, error } = await supabase.rpc('search_verses', {
      search_query: query,
      book_filter: book,
      version_filter: version,
      limit_count: limit,
      offset_count: offset
    });

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json(
        { error: 'Failed to search verses' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let totalQuery = supabase
      .from('bible_verses')
      .select('*', { count: 'exact', head: true })
      .textSearch('search_vector', query);

    if (book) {
      totalQuery = totalQuery.eq('book', book);
    }
    if (version) {
      totalQuery = totalQuery.eq('version', version);
    }

    const { count: totalCount, error: countError } = await totalQuery;

    if (countError) {
      console.error('Count error:', countError);
    }

    // Update search analytics
    await supabase.rpc('update_search_analytics', {
      query_text: query,
      search_type_param: 'verse'
    });

    // Format response
    const response = {
      verses: verses || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
        hasNext: page * limit < (totalCount || 0),
        hasPrev: page > 1
      },
      query: {
        text: query,
        book,
        version
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, filters = {}, userId } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Save search to history if user is authenticated
    if (userId) {
      const { error: historyError } = await supabase
        .from('search_history')
        .insert({
          user_id: userId,
          query,
          search_type: 'verse',
          filters,
          results_count: 0 // Will be updated after search
        });

      if (historyError) {
        console.error('Failed to save search history:', historyError);
      }
    }

    // Perform the search using GET logic
    const searchUrl = new URL(request.url);
    searchUrl.searchParams.set('q', query);
    
    if (filters.book) searchUrl.searchParams.set('book', filters.book);
    if (filters.version) searchUrl.searchParams.set('version', filters.version);
    if (filters.page) searchUrl.searchParams.set('page', filters.page.toString());
    if (filters.limit) searchUrl.searchParams.set('limit', filters.limit.toString());

    const searchRequest = new NextRequest(searchUrl);
    return GET(searchRequest);
  } catch (error) {
    console.error('POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}