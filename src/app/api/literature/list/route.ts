import { NextResponse } from 'next/server'
import { summarizeListedWork, type ListedWorkRow } from '@/lib/literature/catalog'
import { createSupabaseAnonClient, missingPublicSupabaseResponse } from '@/lib/supabaseRouteAuth'

/** GET responses must not be cached or the library can stay empty after new uploads. */
export const dynamic = 'force-dynamic'
export const revalidate = 0

const NO_STORE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
}

export async function GET() {
  try {
    const missing = missingPublicSupabaseResponse()
    if (missing) {
      return NextResponse.json(missing, { status: 503, headers: NO_STORE })
    }

    const supabase = createSupabaseAnonClient()
    if (!supabase) {
      return NextResponse.json(
        missingPublicSupabaseResponse({ url: '', anonKey: '' }),
        { status: 503, headers: NO_STORE }
      )
    }

    const withEmbed = await supabase
      .from('works')
      .select(
        'id, title, slug, description, content, year_published, created_at, author_id, owner_user_id, authors ( name )'
      )
      .order('created_at', { ascending: false })

    let works = withEmbed.data as ListedWorkRow[] | null
    let listError = withEmbed.error

    if (listError) {
      console.warn('API: literature/list embed authors failed, retrying without join:', listError.message)
      const plain = await supabase
        .from('works')
        .select(
          'id, title, slug, description, content, year_published, created_at, author_id, owner_user_id'
        )
        .order('created_at', { ascending: false })
      works = plain.data as ListedWorkRow[] | null
      listError = plain.error
    }

    if (listError) {
      console.error('API: Error fetching works list:', listError)
      return NextResponse.json(
        { error: 'Failed to fetch works', code: 'LIBRARY_REQUEST_FAILED' },
        { status: 500, headers: NO_STORE }
      )
    }

    const transformed = (works || []).map((work) => summarizeListedWork(work))
    return NextResponse.json({ works: transformed }, { headers: NO_STORE })
  } catch (error) {
    console.error('API: Error in /api/literature/list:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'LIBRARY_REQUEST_FAILED' },
      { status: 500, headers: NO_STORE }
    )
  }
}
