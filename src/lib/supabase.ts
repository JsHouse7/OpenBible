import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ikbjaqdnsvxmjckihtih.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrYmphcWRuc3Z4bWpja2lodGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMjcyMzQsImV4cCI6MjA2NjgwMzIzNH0.EUbUcsH7XRUrTR6KR7qYbxKwLzIS3A2aR2g4YOcdFCk'

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  // Check if we have valid Supabase URL and key
  return supabaseUrl && 
         supabaseAnonKey && 
         supabaseUrl.includes('supabase.co') &&
         supabaseAnonKey.startsWith('eyJ') // JWT tokens start with 'eyJ'
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
      return Promise.resolve({ data: [], error: null }).then((value) => resolve(value))
    },
    // Make it thenable to satisfy TypeScript
    catch: (reject: Function) => Promise.resolve({ data: [], error: null }),
    finally: (callback: Function) => Promise.resolve({ data: [], error: null })
  }
  
  // Make the builder a proper thenable
  Object.defineProperty(mockBuilder, Symbol.toStringTag, {
    value: 'Promise',
    configurable: true
  })
  
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
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: (callback: Function) => {
          // Return a mock subscription
          return {
            data: { subscription: { unsubscribe: () => {} } },
            unsubscribe: () => {}
          }
        },
        signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
        signUp: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
        signOut: () => Promise.resolve({ error: null }),
        resetPasswordForEmail: () => Promise.resolve({ error: new Error('Supabase not configured') }),
        updateUser: () => Promise.resolve({ data: { user: null }, error: new Error('Supabase not configured') })
      },
      from: (table: string) => createMockQueryBuilder()
    } as any

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