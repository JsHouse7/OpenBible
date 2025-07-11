import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return supabaseUrl !== 'https://placeholder.supabase.co' && 
         supabaseAnonKey !== 'placeholder-key' &&
         supabaseUrl.includes('supabase.co')
}

// Mock query builder for development
const createMockQueryBuilder = () => {
  const mockBuilder = {
    select: (columns?: string) => mockBuilder,
    insert: (data: any) => mockBuilder,
    update: (data: any) => mockBuilder,
    delete: () => mockBuilder,
    upsert: (data: any, options?: any) => mockBuilder,
    eq: (column: string, value: any) => mockBuilder,
    order: (column: string, options?: any) => mockBuilder,
    limit: (count: number) => mockBuilder,
    single: () => mockBuilder,
    textSearch: (column: string, query: string) => mockBuilder,
    then: (resolve: Function) => {
      // Return empty data for all queries in development
      return Promise.resolve({ data: [], error: null }).then(resolve)
    }
  }
  return mockBuilder
}

// Only create client if we have valid values, otherwise create a mock client
export const supabase = isSupabaseConfigured() 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: typeof window !== 'undefined', // Only persist in browser
        autoRefreshToken: typeof window !== 'undefined',
      }
    })
  : {
      // Mock client for development without Supabase
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signIn: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        signOut: () => Promise.resolve({ error: null })
      },
      from: (table: string) => createMockQueryBuilder()
    }

// Database types
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