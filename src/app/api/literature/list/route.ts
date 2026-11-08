import { NextResponse } from 'next/server'
import { summarizeListedWork } from '@/lib/literature/catalog'
import { createSupabaseAnonClient, missingPublicSupabaseResponse } from '@/lib/supabaseRouteAuth'

export async function GET() {
  try {
    const missing = missingPublicSupabaseResponse()
    if (missing) {
      return NextResponse.json(missing, { status: 503 })
    }

    const supabase = createSupabaseAnonClient()
    if (!supabase) {
      return NextResponse.json(missingPublicSupabaseResponse({ url: '', anonKey: '' }), { status: 503 })
    }

    const { data: works, error } = await supabase
      .from('works')
      .select('id, title, slug, description, content, year_published, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('API: Error fetching works list:', error)
      return NextResponse.json(
        { error: 'Failed to fetch works', code: 'LIBRARY_REQUEST_FAILED' },
        { status: 500 }
      )
    }

    const transformed = (works || []).map((work) => summarizeListedWork(work))
    return NextResponse.json({ works: transformed })
  } catch (error) {
    console.error('API: Error in /api/literature/list:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'LIBRARY_REQUEST_FAILED' },
      { status: 500 }
    )
  }
}
