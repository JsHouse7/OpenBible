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

export function publicSupabaseConfigError(env?: {
  url?: string | null
  anonKey?: string | null
}): string | null {
  const url = (env ? env.url : process.env.NEXT_PUBLIC_SUPABASE_URL)?.trim() ?? ''
  const anonKey = (env ? env.anonKey : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim() ?? ''
  if (!url && !anonKey) {
    return 'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are not set'
  }
  if (!url) return 'NEXT_PUBLIC_SUPABASE_URL is not set'
  if (!anonKey) return 'NEXT_PUBLIC_SUPABASE_ANON_KEY is not set'
  return null
}

export function missingPublicSupabaseResponse(env?: {
  url?: string | null
  anonKey?: string | null
}): { error: string; code: 'SUPABASE_NOT_CONFIGURED'; detail: string } | null {
  const detail = publicSupabaseConfigError(env)
  if (!detail) return null
  return {
    error: 'Literature library is not configured',
    code: 'SUPABASE_NOT_CONFIGURED',
    detail,
  }
}

/** Public catalog client. RLS still applies; this never uses the service-role key. */
export function createSupabaseAnonClient() {
  const url = getSupabaseProjectUrl()
  const anonKey = getSupabaseAnonKey()
  if (!url || !anonKey) return null
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
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
