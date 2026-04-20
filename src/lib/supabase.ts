import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? ''

export const isSupabaseConfigured = () =>
  Boolean(supabaseUrl && supabaseAnonKey)

const createMockQueryBuilder = () => {
  const mockBuilder = {
    select: (_columns?: string) => mockBuilder,
    insert: (_data: unknown) => mockBuilder,
    update: (_data: unknown) => mockBuilder,
    delete: () => mockBuilder,
    upsert: (_data: unknown, _options?: unknown) => mockBuilder,
    eq: (_column: string, _value: unknown) => mockBuilder,
    order: (_column: string, _options?: unknown) => mockBuilder,
    limit: (_count: number) => mockBuilder,
    single: () => mockBuilder,
    textSearch: (_column: string, _query: string) => mockBuilder,
    then: (resolve: (value: unknown) => void) =>
      Promise.resolve({ data: [], error: null }).then((value) => resolve(value)),
    catch: (_reject: (reason: unknown) => void) => Promise.resolve({ data: [], error: null }),
    finally: (_callback: () => void) => Promise.resolve({ data: [], error: null }),
  }
  Object.defineProperty(mockBuilder, Symbol.toStringTag, {
    value: 'Promise',
    configurable: true,
  })
  return mockBuilder
}

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: typeof window !== 'undefined',
        autoRefreshToken: typeof window !== 'undefined',
      },
    })
  : ({
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: () => {} } },
          unsubscribe: () => {},
        }),
        signInWithPassword: () =>
          Promise.resolve({
            data: { user: null, session: null },
            error: new Error('Supabase not configured'),
          }),
        signUp: () =>
          Promise.resolve({
            data: { user: null, session: null },
            error: new Error('Supabase not configured'),
          }),
        signOut: () => Promise.resolve({ error: null }),
        resetPasswordForEmail: () =>
          Promise.resolve({ error: new Error('Supabase not configured') }),
        updateUser: () =>
          Promise.resolve({ data: { user: null }, error: new Error('Supabase not configured') }),
      },
      from: () => createMockQueryBuilder(),
    } as unknown as ReturnType<typeof createClient>)

export interface Bible {
  id: string
  book: string
  chapter: number
  verse: number
  text: string
  translation: string
  created_at: string
}

export interface UserNote {
  id: string
  user_id: string
  book: string
  chapter: number
  verse: number
  note: string
  created_at: string
  updated_at: string
}

export interface Bookmark {
  id: string
  user_id: string
  book: string
  chapter: number
  verse: number
  title?: string
  created_at: string
}

export interface ReadingProgress {
  id: string
  user_id: string
  book: string
  chapter: number
  last_read_at: string
}
