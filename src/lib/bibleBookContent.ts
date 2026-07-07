import {
  COMPLETE_BIBLE_BOOKS,
  loadChapterData,
  type BibleVerse,
} from '@/data/completeBible'
import type { ReaderBook, ReaderChapter, ReaderTocEntry } from '@/components/reader/readerTypes'
import { escapeHtml } from '@/lib/literatureContentUtils'

export interface BibleBookContentOptions {
  showVerseNumbers: boolean
  seamless: boolean
}

export interface BuildBibleBookProgress {
  loaded: number
  total: number
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function versesToParagraphHtml(verses: BibleVerse[], showVerseNumbers: boolean): string {
  const parts: string[] = []
  let buffer: string[] = []

  const flush = () => {
    if (buffer.length === 0) return
    parts.push(`<p>${buffer.join(' ')}</p>`)
    buffer = []
  }

  for (const v of verses) {
    const num = showVerseNumbers
      ? `<sup class="verse-num text-[0.65em] opacity-60 mr-0.5">${v.verse}</sup>`
      : ''
    buffer.push(`${num}${escapeHtml(v.text)}`)
    if (v.verse % 4 === 0) flush()
  }
  flush()
  return parts.join('\n')
}

function chapterVersesToHtml(
  verses: BibleVerse[],
  showVerseNumbers: boolean,
  showHeading: boolean,
  chapterNum: number
): { html: string; wordCount: number } {
  const heading = showHeading
    ? `<h2 class="bible-chapter-heading text-lg font-semibold mb-4 mt-2">Chapter ${chapterNum}</h2>\n`
    : ''
  const body = versesToParagraphHtml(verses, showVerseNumbers)
  const plain = verses.map((v) => v.text).join(' ')
  return {
    html: heading + body,
    wordCount: countWords(plain),
  }
}

export function getAdjacentBibleBook(
  bookName: string,
  direction: 'next' | 'prev'
): string | null {
  const idx = COMPLETE_BIBLE_BOOKS.findIndex((b) => b.name === bookName)
  if (idx < 0) return null
  const target = direction === 'next' ? idx + 1 : idx - 1
  if (target < 0 || target >= COMPLETE_BIBLE_BOOKS.length) return null
  return COMPLETE_BIBLE_BOOKS[target].name
}

export function getBibleBookChapterCount(bookName: string): number {
  return COMPLETE_BIBLE_BOOKS.find((b) => b.name === bookName)?.chapters ?? 1
}

export async function buildBibleReaderBook(
  bookName: string,
  translation: string,
  options: BibleBookContentOptions,
  onProgress?: (p: BuildBibleBookProgress) => void
): Promise<ReaderBook> {
  const meta = COMPLETE_BIBLE_BOOKS.find((b) => b.name === bookName)
  if (!meta) {
    throw new Error(`Unknown Bible book: ${bookName}`)
  }

  const total = meta.chapters
  const bookId = `${translation}:${bookName}`

  if (options.seamless) {
    let combinedHtml = ''
    let totalWords = 0
    const tocChapters: ReaderTocEntry[] = []

    for (let ch = 1; ch <= total; ch++) {
      onProgress?.({ loaded: ch - 1, total })
      const verses = await loadChapterData(bookName, ch, translation)
      const { html, wordCount } = chapterVersesToHtml(
        verses,
        options.showVerseNumbers,
        false,
        ch
      )
      tocChapters.push({
        title: `Chapter ${ch}`,
        readerChapterIndex: 0,
        wordOffset: totalWords,
      })
      combinedHtml += html
      totalWords += wordCount
      onProgress?.({ loaded: ch, total })
    }

    const single: ReaderChapter = {
      id: 1,
      title: bookName,
      html: combinedHtml,
      wordCount: totalWords,
      bibleChapter: 1,
    }

    return {
      id: bookId,
      title: bookName,
      subtitle: translation,
      chapters: [single],
      tocChapters,
    }
  }

  const chapters: ReaderChapter[] = []
  for (let ch = 1; ch <= total; ch++) {
    onProgress?.({ loaded: ch - 1, total })
    const verses = await loadChapterData(bookName, ch, translation)
    const { html, wordCount } = chapterVersesToHtml(
      verses,
      options.showVerseNumbers,
      true,
      ch
    )
    chapters.push({
      id: ch,
      title: `Chapter ${ch}`,
      html,
      wordCount,
      bibleChapter: ch,
    })
    onProgress?.({ loaded: ch, total })
  }

  return {
    id: bookId,
    title: bookName,
    subtitle: translation,
    chapters,
  }
}

export function bibleChapterFromBookPercent(
  book: ReaderBook,
  bookPercent: number
): number {
  const totalWords = book.chapters.reduce((s, c) => s + c.wordCount, 0)
  if (totalWords === 0) return 1
  const wordsRead = (bookPercent / 100) * totalWords

  if (book.chapters.length > 1) {
    let acc = 0
    for (const ch of book.chapters) {
      acc += ch.wordCount
      if (wordsRead < acc) {
        return ch.bibleChapter ?? 1
      }
    }
    return book.chapters[book.chapters.length - 1]?.bibleChapter ?? 1
  }

  if (!book.tocChapters?.length) return 1

  for (let i = book.tocChapters.length - 1; i >= 0; i--) {
    const offset = book.tocChapters[i].wordOffset ?? 0
    if (wordsRead >= offset) {
      const m = book.tocChapters[i].title.match(/(\d+)/)
      return m ? parseInt(m[1], 10) : i + 1
    }
  }
  return 1
}

export function bookPercentForBibleChapter(
  book: ReaderBook,
  bibleChapter: number
): number {
  const totalWords = book.chapters.reduce((s, c) => s + c.wordCount, 0)
  if (totalWords === 0) return 0

  if (book.chapters.length > 1) {
    let wordsBefore = 0
    for (const ch of book.chapters) {
      if (ch.bibleChapter === bibleChapter) {
        return (wordsBefore / totalWords) * 100
      }
      wordsBefore += ch.wordCount
    }
    return 0
  }

  const entry = book.tocChapters?.find((t) =>
    t.title.includes(String(bibleChapter))
  )
  if (entry?.wordOffset != null) {
    return (entry.wordOffset / totalWords) * 100
  }
  return 0
}
