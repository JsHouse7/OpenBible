export const BIBLE_BOOK_POSITION_KEY = 'openbible-bible-book-position'

export interface BibleReaderDisplayOptions {
  showVerseNumbers: boolean
  seamless: boolean
}

export const defaultBibleReaderDisplayOptions: BibleReaderDisplayOptions = {
  showVerseNumbers: true,
  seamless: false,
}

export interface StoredBibleBookPosition {
  chapterIndex: number
  positionAnchor: number
  percent: number
}

export function readBibleBookPositions(): Record<string, StoredBibleBookPosition> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(BIBLE_BOOK_POSITION_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function writeBibleBookPosition(
  bookId: string,
  position: StoredBibleBookPosition
): void {
  if (typeof window === 'undefined') return
  const all = readBibleBookPositions()
  all[bookId] = position
  localStorage.setItem(BIBLE_BOOK_POSITION_KEY, JSON.stringify(all))
}

export function readBibleDisplayOptions(): BibleReaderDisplayOptions {
  if (typeof window === 'undefined') return defaultBibleReaderDisplayOptions
  try {
    const raw = localStorage.getItem('openbible-bible-reader-display')
    return raw
      ? { ...defaultBibleReaderDisplayOptions, ...JSON.parse(raw) }
      : defaultBibleReaderDisplayOptions
  } catch {
    return defaultBibleReaderDisplayOptions
  }
}

export function writeBibleDisplayOptions(opts: BibleReaderDisplayOptions): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('openbible-bible-reader-display', JSON.stringify(opts))
}
