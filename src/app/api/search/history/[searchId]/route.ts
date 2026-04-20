import { NextRequest, NextResponse } from 'next/server'
import { getBearerUser } from '@/lib/supabaseRouteAuth'

/** DELETE — remove one history row (must belong to the caller via RLS). */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { searchId: string } }
) {
  try {
    const auth = await getBearerUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchId = params.searchId
    if (!searchId) {
      return NextResponse.json({ error: 'Search ID is required' }, { status: 400 })
    }

    const { error } = await auth.supabase.from('search_history').delete().eq('id', searchId)

    if (error) {
      console.error('Delete search error:', error)
      return NextResponse.json({ error: 'Failed to delete search entry' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Search entry deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/search/history/[searchId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
