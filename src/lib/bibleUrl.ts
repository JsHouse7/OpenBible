import { COMPLETE_BIBLE_BOOKS } from '@/data/completeBible'

/** Max verse number in any chapter (Psalm 119 has 176). */
const MAX_VERSE = 176

export type BibleUrlLocation = {
  book: string
  chapter: number
  verse?: number
}

export function parseBibleUrlSearchParams(searchParams: URLSearchParams): BibleUrlLocation | null {
  const bookRaw = searchParams.get('book')
  const chapterRaw = searchParams.get('chapter')

  if (!bookRaw || chapterRaw === null || chapterRaw === '') {
    return null
  }

  const book = decodeURIComponent(bookRaw.trim())
  const bookInfo = COMPLETE_BIBLE_BOOKS.find((b) => b.name === book)
  if (!bookInfo) {
    return null
  }

  const chapter = parseInt(chapterRaw, 10)
  if (!Number.isFinite(chapter) || chapter < 1 || chapter > bookInfo.chapters) {
    return null
  }

  const verseRaw = searchParams.get('verse')
  const result: BibleUrlLocation = { book, chapter }

  if (verseRaw !== null && verseRaw !== '') {
    const verse = parseInt(verseRaw, 10)
    if (Number.isFinite(verse) && verse >= 1 && verse <= MAX_VERSE) {
      result.verse = verse
    }
  }

  return result
}

export function buildBibleSearchParams(book: string, chapter: number, verse?: number): string {
  const params = new URLSearchParams()
  params.set('book', book)
  params.set('chapter', String(chapter))
  if (verse !== undefined && verse >= 1) {
    params.set('verse', String(verse))
  }
  return params.toString()
}
