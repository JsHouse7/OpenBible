import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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