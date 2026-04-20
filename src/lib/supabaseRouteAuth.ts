import { createClient, type User } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

export function getSupabaseProjectUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return url?.trim() ? url : null
}

export function getSupabaseAnonKey(): string | null {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return key?.trim() ? key : null
}

/** Supabase client scoped to the caller's JWT (RLS applies as that user). */
export function createSupabaseUserClient(accessToken: string) {
  const url = getSupabaseProjectUrl()
  const anonKey = getSupabaseAnonKey()
  if (!url || !anonKey) return null
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })
}

export async function getBearerUser(
  request: NextRequest
): Promise<{ user: User; accessToken: string; supabase: NonNullable<ReturnType<typeof createSupabaseUserClient>> } | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const accessToken = authHeader.slice(7).trim()
  if (!accessToken) return null
  const supabase = createSupabaseUserClient(accessToken)
  if (!supabase) return null
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return null
  return { user, accessToken, supabase }
}
