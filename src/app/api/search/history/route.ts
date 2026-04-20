import { NextRequest, NextResponse } from 'next/server'
import { getBearerUser } from '@/lib/supabaseRouteAuth'

function mapHistoryRow(row: {
  id: string
  query: string
  search_type: string
  results_count: number | null
  created_at: string
}) {
  return {
    id: row.id,
    query: row.query,
    searchType: row.search_type === 'reference' ? 'reference' : 'verse',
    resultsCount: row.results_count ?? 0,
    createdAt: row.created_at,
  }
}

/** GET — recent search history for the authenticated user (RLS). */
export async function GET(request: NextRequest) {
  try {
    const auth = await getBearerUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const searchType = searchParams.get('type')
    const offset = (page - 1) * limit

    let q = auth.supabase
      .from('search_history')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (searchType && ['verse', 'reference', 'keyword'].includes(searchType)) {
      q = q.eq('search_type', searchType)
    }

    const { data: rows, error, count } = await q

    if (error) {
      console.error('Search history error:', error)
      return NextResponse.json({ error: 'Failed to fetch search history' }, { status: 500 })
    }

    const searches = (rows || []).map(mapHistoryRow)
    const total = count ?? 0

    return NextResponse.json({
      searches,
      history: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error('GET /api/search/history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** POST — append a search history row for the authenticated user. */
export async function POST(request: NextRequest) {
  try {
    const auth = await getBearerUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const query = typeof body.query === 'string' ? body.query.trim() : ''
    const searchType = body.searchType as string
    const filters = body.filters && typeof body.filters === 'object' ? body.filters : {}
    const resultsCount =
      typeof body.resultsCount === 'number' && Number.isFinite(body.resultsCount)
        ? body.resultsCount
        : 0

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const validTypes = ['verse', 'reference', 'keyword']
    if (!validTypes.includes(searchType)) {
      return NextResponse.json({ error: 'Invalid search type' }, { status: 400 })
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: existing } = await auth.supabase
      .from('search_history')
      .select('id')
      .eq('query', query)
      .eq('search_type', searchType)
      .gte('created_at', oneHourAgo)
      .limit(1)
      .maybeSingle()

    if (existing?.id) {
      const { data: updated, error: updateError } = await auth.supabase
        .from('search_history')
        .update({
          filters,
          results_count: resultsCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError) {
        console.error('Update search history error:', updateError)
        return NextResponse.json({ error: 'Failed to update search history' }, { status: 500 })
      }

      return NextResponse.json({ search: updated, action: 'updated' })
    }

    const { data: created, error } = await auth.supabase
      .from('search_history')
      .insert({
        user_id: auth.user.id,
        query,
        search_type: searchType,
        filters,
        results_count: resultsCount,
      })
      .select()
      .single()

    if (error) {
      console.error('Insert search history error:', error)
      return NextResponse.json({ error: 'Failed to save search history' }, { status: 500 })
    }

    const { data: oldRows } = await auth.supabase
      .from('search_history')
      .select('id')
      .order('created_at', { ascending: false })
      .range(1000, 1999)

    if (oldRows?.length) {
      await auth.supabase.from('search_history').delete().in(
        'id',
        oldRows.map((r) => r.id)
      )
    }

    return NextResponse.json({ search: created, action: 'created' })
  } catch (error) {
    console.error('POST /api/search/history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** DELETE — clear all history for the authenticated user (?all=true). */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getBearerUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    if (searchParams.get('all') !== 'true') {
      return NextResponse.json(
        { error: 'Use ?all=true to clear all history, or DELETE /api/search/history/:id' },
        { status: 400 }
      )
    }

    const { error } = await auth.supabase
      .from('search_history')
      .delete()
      .eq('user_id', auth.user.id)

    if (error) {
      console.error('Delete all history error:', error)
      return NextResponse.json({ error: 'Failed to delete search history' }, { status: 500 })
    }

    return NextResponse.json({ message: 'All search history deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/search/history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
