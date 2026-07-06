import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient, User } from '@supabase/supabase-js'

export async function getAuthenticatedSupabase(
  request: NextRequest
): Promise<{ supabase: SupabaseClient; user: User } | NextResponse> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
  }

  const token = authHeader.substring(7)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return { supabase, user }
}
