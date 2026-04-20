import { NextRequest, NextResponse } from 'next/server'
import { getBearerUser } from '@/lib/supabaseRouteAuth'

function mapSavedRow(row: {
  id: string
  title: string
  query: string
  search_type: string
  filters: unknown
  created_at: string
  updated_at: string
}) {
  return {
    id: row.id,
    name: row.title,
    query: row.query,
    searchType: row.search_type === 'reference' ? 'reference' : 'verse',
    filters: row.filters && typeof row.filters === 'object' ? row.filters : {},
    createdAt: row.created_at,
    lastUsed: row.updated_at,
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getBearerUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await auth.supabase
      .from('saved_searches')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Saved searches list error:', error)
      return NextResponse.json({ error: 'Failed to fetch saved searches' }, { status: 500 })
    }

    return NextResponse.json({
      searches: (data || []).map(mapSavedRow),
    })
  } catch (error) {
    console.error('GET /api/search/saved:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getBearerUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const title = typeof body.name === 'string' ? body.name.trim() : typeof body.title === 'string' ? body.title.trim() : ''
    const query = typeof body.query === 'string' ? body.query.trim() : ''
    const searchType = body.searchType as string
    const filters = body.filters && typeof body.filters === 'object' ? body.filters : {}
    const description = typeof body.description === 'string' ? body.description : null

    if (!title || !query) {
      return NextResponse.json({ error: 'Title and query are required' }, { status: 400 })
    }

    const validTypes = ['verse', 'reference', 'keyword']
    if (!validTypes.includes(searchType)) {
      return NextResponse.json({ error: 'Invalid search type' }, { status: 400 })
    }

    const { data, error } = await auth.supabase
      .from('saved_searches')
      .insert({
        user_id: auth.user.id,
        title,
        query,
        search_type: searchType,
        filters,
        description,
        is_public: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Insert saved search error:', error)
      return NextResponse.json({ error: 'Failed to save search' }, { status: 500 })
    }

    return NextResponse.json({ search: mapSavedRow(data) })
  } catch (error) {
    console.error('POST /api/search/saved:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
