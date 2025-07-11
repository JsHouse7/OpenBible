import { supabase } from './supabase'

// Bible Content Services
export const bibleService = {
  // Get available translations
  async getAvailableTranslations() {
    const { data, error } = await supabase
      .from('bible_verses')
      .select('translation')
      .order('translation')

    if (error) {
      console.error('Error fetching translations:', error)
      return { data: null, error }
    }

    // Remove duplicates
    const uniqueTranslations = [...new Set(data?.map(item => item.translation) || [])]
    return { data: uniqueTranslations, error: null }
  },

  // Get chapter content
  async getChapter(book: string, chapter: number, translation = 'KJV') {
    const { data, error } = await supabase
      .from('bible_verses')
      .select('*')
      .eq('book', book)
      .eq('chapter', chapter)
      .eq('translation', translation)
      .order('verse', { ascending: true })

    if (error) {
      console.error('Error fetching chapter:', error)
      return { data: null, error }
    }

    return { data, error: null }
  },

  // Get verse by reference
  async getVerse(book: string, chapter: number, verse: number, translation = 'KJV') {
    const { data, error } = await supabase
      .from('bible_verses')
      .select('*')
      .eq('book', book)
      .eq('chapter', chapter)
      .eq('verse', verse)
      .eq('translation', translation)
      .single()

    if (error) {
      console.error('Error fetching verse:', error)
      return { data: null, error }
    }

    return { data, error: null }
  },

  // Search verses by text
  async searchVerses(query: string, translation = 'KJV', limit = 50) {
    const { data, error } = await supabase
      .from('bible_verses')
      .select('*')
      .eq('translation', translation)
      .textSearch('text', query)
      .limit(limit)

    if (error) {
      console.error('Error searching verses:', error)
      return { data: null, error }
    }

    return { data, error: null }
  },

  // Get available books
  async getBooks(translation = 'KJV') {
    const { data, error } = await supabase
      .from('bible_verses')
      .select('book')
      .eq('translation', translation)
      .order('book')

    if (error) {
      console.error('Error fetching books:', error)
      return { data: null, error }
    }

    // Remove duplicates
    const uniqueBooks = [...new Set(data?.map(item => item.book) || [])]
    return { data: uniqueBooks, error: null }
  },

  // Get chapter count for a book
  async getChapterCount(book: string, translation = 'KJV') {
    const { data, error } = await supabase
      .from('bible_verses')
      .select('chapter')
      .eq('book', book)
      .eq('translation', translation)

    if (error) {
      console.error('Error fetching chapter count:', error)
      return { data: null, error }
    }

    const maxChapter = Math.max(...(data?.map(item => item.chapter) || [0]))
    return { data: maxChapter, error: null }
  }
}

// User Notes Services
export const notesService = {
  // Get user's notes
  async getUserNotes(userId: string) {
    const { data, error } = await supabase
      .from('user_notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notes:', error)
      return { data: null, error }
    }

    return { data, error: null }
  },

  // Get note for specific verse
  async getVerseNote(userId: string, book: string, chapter: number, verse: number) {
    const { data, error } = await supabase
      .from('user_notes')
      .select('*')
      .eq('user_id', userId)
      .eq('book', book)
      .eq('chapter', chapter)
      .eq('verse', verse)
      .single()

    if (error && error.code !== 'PGRST116') { // Not found error
      console.error('Error fetching verse note:', error)
      return { data: null, error }
    }

    return { data, error: null }
  },

  // Create or update note
  async saveNote(userId: string, book: string, chapter: number, verse: number, note: string) {
    const { data, error } = await supabase
      .from('user_notes')
      .upsert({
        user_id: userId,
        book,
        chapter,
        verse,
        note,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,book,chapter,verse'
      })
      .select()

    if (error) {
      console.error('Error saving note:', error)
      return { data: null, error }
    }

    return { data, error: null }
  },

  // Delete note
  async deleteNote(userId: string, book: string, chapter: number, verse: number) {
    const { error } = await supabase
      .from('user_notes')
      .delete()
      .eq('user_id', userId)
      .eq('book', book)
      .eq('chapter', chapter)
      .eq('verse', verse)

    if (error) {
      console.error('Error deleting note:', error)
      return { error }
    }

    return { error: null }
  }
}

// Bookmarks Services
export const bookmarksService = {
  // Get user's bookmarks
  async getUserBookmarks(userId: string) {
    const { data, error } = await supabase
      .from('user_bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bookmarks:', error)
      return { data: null, error }
    }

    return { data, error: null }
  },

  // Add bookmark
  async addBookmark(userId: string, book: string, chapter: number, verse: number, title?: string) {
    const { data, error } = await supabase
      .from('user_bookmarks')
      .insert({
        user_id: userId,
        book,
        chapter,
        verse,
        title
      })
      .select()

    if (error) {
      console.error('Error adding bookmark:', error)
      return { data: null, error }
    }

    return { data, error: null }
  },

  // Remove bookmark
  async removeBookmark(userId: string, book: string, chapter: number, verse: number) {
    const { error } = await supabase
      .from('user_bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('book', book)
      .eq('chapter', chapter)
      .eq('verse', verse)

    if (error) {
      console.error('Error removing bookmark:', error)
      return { error }
    }

    return { error: null }
  },

  // Check if verse is bookmarked
  async isBookmarked(userId: string, book: string, chapter: number, verse: number) {
    const { data, error } = await supabase
      .from('user_bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('book', book)
      .eq('chapter', chapter)
      .eq('verse', verse)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking bookmark:', error)
      return { data: false, error }
    }

    return { data: !!data, error: null }
  }
}

// Reading Progress Services
export const progressService = {
  // Get user's reading progress
  async getUserProgress(userId: string) {
    const { data, error } = await supabase
      .from('reading_progress')
      .select('*')
      .eq('user_id', userId)
      .order('last_read_at', { ascending: false })

    if (error) {
      console.error('Error fetching progress:', error)
      return { data: null, error }
    }

    return { data, error: null }
  },

  // Update reading progress
  async updateProgress(userId: string, book: string, chapter: number) {
    const { data, error } = await supabase
      .from('reading_progress')
      .upsert({
        user_id: userId,
        book,
        chapter,
        last_read_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,book'
      })
      .select()

    if (error) {
      console.error('Error updating progress:', error)
      return { data: null, error }
    }

    return { data, error: null }
  },

  // Get progress for specific book
  async getBookProgress(userId: string, book: string) {
    const { data, error } = await supabase
      .from('reading_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('book', book)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching book progress:', error)
      return { data: null, error }
    }

    return { data, error: null }
  }
}

// Highlights Services
export const highlightsService = {
  // Get user's highlights
  async getUserHighlights(userId: string) {
    const { data, error } = await supabase
      .from('user_highlights')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching highlights:', error)
      return { data: null, error }
    }

    return { data, error: null }
  },

  // Add highlight
  async addHighlight(userId: string, book: string, chapter: number, verse: number, color = 'yellow') {
    const { data, error } = await supabase
      .from('user_highlights')
      .insert({
        user_id: userId,
        book,
        chapter,
        verse,
        color
      })
      .select()

    if (error) {
      console.error('Error adding highlight:', error)
      return { data: null, error }
    }

    return { data, error: null }
  },

  // Remove highlight
  async removeHighlight(userId: string, book: string, chapter: number, verse: number) {
    const { error } = await supabase
      .from('user_highlights')
      .delete()
      .eq('user_id', userId)
      .eq('book', book)
      .eq('chapter', chapter)
      .eq('verse', verse)

    if (error) {
      console.error('Error removing highlight:', error)
      return { error }
    }

    return { error: null }
  },

  // Get highlight for verse
  async getVerseHighlight(userId: string, book: string, chapter: number, verse: number) {
    const { data, error } = await supabase
      .from('user_highlights')
      .select('*')
      .eq('user_id', userId)
      .eq('book', book)
      .eq('chapter', chapter)
      .eq('verse', verse)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching highlight:', error)
      return { data: null, error }
    }

    return { data, error: null }
  }
}

// Analytics Services (for user stats)
export const analyticsService = {
  // Get user reading statistics
  async getUserStats(userId: string) {
    try {
      const [notesResult, bookmarksResult, highlightsResult, progressResult] = await Promise.all([
        notesService.getUserNotes(userId),
        bookmarksService.getUserBookmarks(userId),
        highlightsService.getUserHighlights(userId),
        progressService.getUserProgress(userId)
      ])

      const stats = {
        totalNotes: notesResult.data?.length || 0,
        totalBookmarks: bookmarksResult.data?.length || 0,
        totalHighlights: highlightsResult.data?.length || 0,
        booksRead: progressResult.data?.length || 0,
        lastRead: progressResult.data?.[0]?.last_read_at || null,
        currentStreak: 0, // Calculate based on reading dates
        totalReadingTime: 0 // Implement if tracking reading time
      }

      return { data: stats, error: null }
    } catch (error) {
      console.error('Error fetching user stats:', error)
      return { data: null, error }
    }
  }
}