import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/lib/literatureApiAuth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedSupabase(request)
  if (auth instanceof NextResponse) return auth
  const { supabase, user } = auth

  const workId = request.nextUrl.searchParams.get('workId')
  if (!workId) {
    return NextResponse.json({ error: 'workId required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('literature_bookmarks')
    .select('*')
    .eq('user_id', user.id)
    .eq('work_id', workId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    bookmarks: (data ?? []).map((row) => ({
      id: row.id,
      workId: row.work_id,
      chapterIndex: row.chapter_index,
      positionAnchor: row.position_anchor,
      label: row.label,
      excerpt: row.excerpt,
      createdAt: row.created_at,
    })),
  })
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedSupabase(request)
  if (auth instanceof NextResponse) return auth
  const { supabase, user } = auth

  const body = await request.json()

  const { data, error } = await supabase
    .from('literature_bookmarks')
    .insert({
      user_id: user.id,
      work_id: body.workId,
      chapter_index: body.chapterIndex ?? 0,
      position_anchor: body.positionAnchor ?? 0,
      label: body.label,
      excerpt: body.excerpt,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    bookmark: {
      id: data.id,
      workId: data.work_id,
      chapterIndex: data.chapter_index,
      positionAnchor: data.position_anchor,
      label: data.label,
      excerpt: data.excerpt,
      createdAt: data.created_at,
    },
  })
}

export async function DELETE(request: NextRequest) {
  const auth = await getAuthenticatedSupabase(request)
  if (auth instanceof NextResponse) return auth
  const { supabase, user } = auth

  const { id } = await request.json()
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('literature_bookmarks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
