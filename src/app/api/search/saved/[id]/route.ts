import { NextRequest, NextResponse } from 'next/server'
import { getBearerUser } from '@/lib/supabaseRouteAuth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getBearerUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = params.id
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await auth.supabase.from('saved_searches').delete().eq('id', id)

    if (error) {
      console.error('Delete saved search error:', error)
      return NextResponse.json({ error: 'Failed to delete saved search' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Saved search removed' })
  } catch (error) {
    console.error('DELETE /api/search/saved/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
