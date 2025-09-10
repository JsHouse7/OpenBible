import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }
    const token = authHeader.substring(7)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'Work ID is required' }, { status: 400 })
    }

    const { error: workError } = await supabase
      .from('works')
      .delete()
      .eq('id', id)

    if (workError) throw workError

    return NextResponse.json({ message: 'Work deleted successfully' })
  } catch (error) {
    console.error('Error deleting work:', error)
    return NextResponse.json({ error: 'Failed to delete work' }, { status: 500 })
  }
}