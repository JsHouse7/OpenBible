import type { ReactNode } from 'react'

export interface ReaderChapter {
  id: number | string
  title: string
  html: string
  wordCount: number
  plainText?: string
  /** When set, used to sync with classic Bible chapter progress */
  bibleChapter?: number
}

export interface ReaderTocEntry {
  title: string
  readerChapterIndex: number
  wordOffset?: number
}

export interface ReaderBook {
  id: string
  title: string
  subtitle?: string
  chapters: ReaderChapter[]
  /** Optional TOC for seamless single-chapter books (e.g. Bible book-flow) */
  tocChapters?: ReaderTocEntry[]
}

export interface ReaderProgress {
  chapterIndex: number
  positionAnchor: number
  percent: number
}

export interface ReaderBookmark {
  id: string
  chapterIndex: number
  positionAnchor: number
  label?: string
  excerpt?: string
}

export interface ReaderPersistence {
  getProgress: (bookId: string) => Promise<ReaderProgress | null>
  saveProgress: (bookId: string, progress: ReaderProgress) => Promise<void>
  getBookmarks?: (bookId: string) => Promise<ReaderBookmark[]>
  addBookmark?: (
    bookId: string,
    bookmark: Omit<ReaderBookmark, 'id'>
  ) => Promise<ReaderBookmark>
  addHighlight?: (
    bookId: string,
    highlight: {
      chapterIndex: number
      startAnchor: number
      endAnchor: number
      color: string
      excerpt: string
    }
  ) => Promise<void>
}

export interface EbookReaderProps {
  book: ReaderBook
  persistence: ReaderPersistence
  onClose: () => void
  extraSettings?: ReactNode
  /** Custom footer label between percent and nav buttons */
  chapterLabel?: (currentChapter: number, totalChapters: number) => string
  onChapterChange?: (chapterIndex: number, bibleChapter?: number) => void
  onProgressUpdate?: (info: { bookPercent: number; chapterIndex: number }) => void
  onReachBookEnd?: () => void
  onReachBookStart?: () => void
  enableBookmarks?: boolean
  enableHighlights?: boolean
  initialChapterIndex?: number
  nextChapterLabel?: string
  prevChapterLabel?: string
  disableNextChapter?: boolean
  disablePrevChapter?: boolean
}
