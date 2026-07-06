import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/lib/literatureApiAuth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedSupabase(request)
  if (auth instanceof NextResponse) return auth
  const { supabase, user } = auth

  const workId = request.nextUrl.searchParams.get('workId')

  if (workId) {
    const { data, error } = await supabase
      .from('literature_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('work_id', workId)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      progress: data
        ? {
            workId: data.work_id,
            chapterIndex: data.chapter_index,
            positionAnchor: data.position_anchor,
            percent: data.percent,
            lastReadAt: data.last_read_at,
          }
        : null,
    })
  }

  const { data, error } = await supabase
    .from('literature_progress')
    .select('*')
    .eq('user_id', user.id)
    .order('last_read_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    progress: (data ?? []).map((row) => ({
      workId: row.work_id,
      chapterIndex: row.chapter_index,
      positionAnchor: row.position_anchor,
      percent: row.percent,
      lastReadAt: row.last_read_at,
    })),
  })
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedSupabase(request)
  if (auth instanceof NextResponse) return auth
  const { supabase, user } = auth

  const body = await request.json()
  const { workId, chapterIndex, positionAnchor, percent } = body

  if (!workId) {
    return NextResponse.json({ error: 'workId required' }, { status: 400 })
  }

  const { error } = await supabase.from('literature_progress').upsert(
    {
      user_id: user.id,
      work_id: workId,
      chapter_index: chapterIndex ?? 0,
      position_anchor: positionAnchor ?? 0,
      percent: percent ?? 0,
      last_read_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,work_id' }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
