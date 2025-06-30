// Re-export the complete Bible books data and utilities
import { BIBLE_BOOKS as COMPLETE_BIBLE_BOOKS } from './completeBible'
export { BIBLE_BOOKS, getBooksByTestament } from './completeBible'

export type BookName = typeof COMPLETE_BIBLE_BOOKS[number]['name']
export type Testament = 'old' | 'new'

// Additional utility function for backward compatibility
export const getBook = (name: string) => {
  return COMPLETE_BIBLE_BOOKS.find(book => book.name === name)
} 