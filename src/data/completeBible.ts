// Complete Bible data system - loads all 66 books dynamically
// Adapted from KJV Bible JSON data

export interface BibleVerse {
  id: string
  book: string
  chapter: number
  verse: number
  text: string
  translation: string
}

export interface ChapterData {
  book_name: string
  chapter: number
  verses: Array<{
    book_name: string
    chapter: number
    verse: number
    text: string
    header?: string
    footer?: string
  }>
}

// Complete Bible book list with proper ordering
export const COMPLETE_BIBLE_BOOKS = [
  // Old Testament
  { name: 'Genesis', chapters: 50, testament: 'old' },
  { name: 'Exodus', chapters: 40, testament: 'old' },
  { name: 'Leviticus', chapters: 27, testament: 'old' },
  { name: 'Numbers', chapters: 36, testament: 'old' },
  { name: 'Deuteronomy', chapters: 34, testament: 'old' },
  { name: 'Joshua', chapters: 24, testament: 'old' },
  { name: 'Judges', chapters: 21, testament: 'old' },
  { name: 'Ruth', chapters: 4, testament: 'old' },
  { name: '1 Samuel', chapters: 31, testament: 'old' },
  { name: '2 Samuel', chapters: 24, testament: 'old' },
  { name: '1 Kings', chapters: 22, testament: 'old' },
  { name: '2 Kings', chapters: 25, testament: 'old' },
  { name: '1 Chronicles', chapters: 29, testament: 'old' },
  { name: '2 Chronicles', chapters: 36, testament: 'old' },
  { name: 'Ezra', chapters: 10, testament: 'old' },
  { name: 'Nehemiah', chapters: 13, testament: 'old' },
  { name: 'Esther', chapters: 10, testament: 'old' },
  { name: 'Job', chapters: 42, testament: 'old' },
  { name: 'Psalms', chapters: 150, testament: 'old' },
  { name: 'Proverbs', chapters: 31, testament: 'old' },
  { name: 'Ecclesiastes', chapters: 12, testament: 'old' },
  { name: 'Song of Solomon', chapters: 8, testament: 'old' },
  { name: 'Isaiah', chapters: 66, testament: 'old' },
  { name: 'Jeremiah', chapters: 52, testament: 'old' },
  { name: 'Lamentations', chapters: 5, testament: 'old' },
  { name: 'Ezekiel', chapters: 48, testament: 'old' },
  { name: 'Daniel', chapters: 12, testament: 'old' },
  { name: 'Hosea', chapters: 14, testament: 'old' },
  { name: 'Joel', chapters: 3, testament: 'old' },
  { name: 'Amos', chapters: 9, testament: 'old' },
  { name: 'Obadiah', chapters: 1, testament: 'old' },
  { name: 'Jonah', chapters: 4, testament: 'old' },
  { name: 'Micah', chapters: 7, testament: 'old' },
  { name: 'Nahum', chapters: 3, testament: 'old' },
  { name: 'Habakkuk', chapters: 3, testament: 'old' },
  { name: 'Zephaniah', chapters: 3, testament: 'old' },
  { name: 'Haggai', chapters: 2, testament: 'old' },
  { name: 'Zechariah', chapters: 14, testament: 'old' },
  { name: 'Malachi', chapters: 4, testament: 'old' },
  
  // New Testament  
  { name: 'Matthew', chapters: 28, testament: 'new' },
  { name: 'Mark', chapters: 16, testament: 'new' },
  { name: 'Luke', chapters: 24, testament: 'new' },
  { name: 'John', chapters: 21, testament: 'new' },
  { name: 'Acts', chapters: 28, testament: 'new' },
  { name: 'Romans', chapters: 16, testament: 'new' },
  { name: '1 Corinthians', chapters: 16, testament: 'new' },
  { name: '2 Corinthians', chapters: 13, testament: 'new' },
  { name: 'Galatians', chapters: 6, testament: 'new' },
  { name: 'Ephesians', chapters: 6, testament: 'new' },
  { name: 'Philippians', chapters: 4, testament: 'new' },
  { name: 'Colossians', chapters: 4, testament: 'new' },
  { name: '1 Thessalonians', chapters: 5, testament: 'new' },
  { name: '2 Thessalonians', chapters: 3, testament: 'new' },
  { name: '1 Timothy', chapters: 6, testament: 'new' },
  { name: '2 Timothy', chapters: 4, testament: 'new' },
  { name: 'Titus', chapters: 3, testament: 'new' },
  { name: 'Philemon', chapters: 1, testament: 'new' },
  { name: 'Hebrews', chapters: 13, testament: 'new' },
  { name: 'James', chapters: 5, testament: 'new' },
  { name: '1 Peter', chapters: 5, testament: 'new' },
  { name: '2 Peter', chapters: 3, testament: 'new' },
  { name: '1 John', chapters: 5, testament: 'new' },
  { name: '2 John', chapters: 1, testament: 'new' },
  { name: '3 John', chapters: 1, testament: 'new' },
  { name: 'Jude', chapters: 1, testament: 'new' },
  { name: 'Revelation', chapters: 22, testament: 'new' }
] as const

// Cache for loaded chapters
const chapterCache = new Map<string, BibleVerse[]>()

// Helper function to create cache key
const createCacheKey = (book: string, chapter: number): string => {
  return `${book}-${chapter}`
}

// Helper function to clean verse text (remove HTML tags and paragraph markers)
const cleanVerseText = (text: string): string => {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/¶\s*/g, '') // Remove paragraph markers
    .trim()
}

// Function to convert chapter data to our verse format
const convertChapterToVerses = (chapterData: ChapterData, translation: string = 'KJV'): BibleVerse[] => {
  return chapterData.verses.map(verse => ({
    id: `${verse.book_name.toLowerCase().replace(/\s+/g, '-')}-${verse.chapter}-${verse.verse}`,
    book: verse.book_name,
    chapter: verse.chapter,
    verse: verse.verse,
    text: cleanVerseText(verse.text),
    translation
  }))
}

// Load chapter data dynamically from JSON files
export const loadChapterData = async (book: string, chapter: number, translation: string = 'KJV'): Promise<BibleVerse[]> => {
  const cacheKey = `${translation}-${createCacheKey(book, chapter)}`
  
  // Check cache first
  if (chapterCache.has(cacheKey)) {
    return chapterCache.get(cacheKey)!
  }

  try {
    // Build the file path for the JSON data (public directory)
    // For WEB translation, use the bible-json-web directory
    const basePath = translation === 'WEB' ? '/bible-json-web' : '/bible-json'
    const filePath = `${basePath}/${book}/${chapter}.json`
    
    // Load the JSON file
    const response = await fetch(filePath)
    if (!response.ok) {
      throw new Error(`Failed to load ${book} ${chapter} (${translation}): ${response.status}`)
    }
    
    const chapterData: ChapterData = await response.json()
    const verses = convertChapterToVerses(chapterData, translation)
    
    // Cache the result
    chapterCache.set(cacheKey, verses)
    return verses

  } catch (error) {
    console.error(`Error loading ${book} ${chapter} (${translation}):`, error)
    
    // Fallback to placeholder data if file loading fails
    const placeholderVerses: BibleVerse[] = [
      {
        id: `${book.toLowerCase().replace(/\s+/g, '-')}-${chapter}-1`,
        book,
        chapter,
        verse: 1,
        text: `Loading ${book} chapter ${chapter} (${translation})... Please refresh if this persists.`,
        translation
      }
    ]
    
    return placeholderVerses
  }
}

// Get verses for a specific chapter (main function used by components)
export const getChapterVerses = async (book: string, chapter: number, translation: string = 'KJV'): Promise<BibleVerse[]> => {
  return loadChapterData(book, chapter, translation)
}

// Get a specific verse
export const getVerse = async (book: string, chapter: number, verse: number, translation: string = 'KJV'): Promise<BibleVerse | undefined> => {
  const verses = await loadChapterData(book, chapter, translation)
  return verses.find(v => v.verse === verse)
}

// Helper functions for navigation
export const getBooksByTestament = (testament: 'old' | 'new') => {
  return COMPLETE_BIBLE_BOOKS.filter(book => book.testament === testament)
}

// Search function (basic implementation)
export const searchVerses = async (query: string, limit: number = 20, translation: string = 'KJV'): Promise<BibleVerse[]> => {
  // For now, return sample search results
  // We'll implement full search when all data is loaded
  const searchResults: BibleVerse[] = []
  
  if (query.toLowerCase().includes('god')) {
    searchResults.push({
      id: 'john-3-16',
      book: 'John',
      chapter: 3,
      verse: 16,
      text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
      translation: 'KJV'
    })
  }
  
  return searchResults.slice(0, limit)
}

// Export the complete book list for compatibility
export { COMPLETE_BIBLE_BOOKS as BIBLE_BOOKS }