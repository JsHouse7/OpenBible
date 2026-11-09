import type { SpreadMode } from '@/lib/readerPreferences'

export interface OverallPageChapter {
  wordCount: number
  /** Fallback size when wordCount is missing (e.g. html length). */
  contentLength?: number
}

export interface OverallPageProgress {
  /** 1-based first page of the current spread (or single page). */
  currentStart: number
  /** 1-based last page of the current spread (same as start in single-page mode). */
  currentEnd: number
  /** Estimated or measured total pages in the book. */
  total: number
  /** True when at least one chapter's page count is still an estimate. */
  usesEstimate: boolean
}

export function readerLayoutSignature(input: {
  fontSize: number
  fontFamily: string
  lineHeight: number
  margins: number
  textAlign: string
  spread: SpreadMode
  viewportWidth: number
  viewportHeight: number
}): string {
  const vw = Math.round(input.viewportWidth)
  const vh = Math.round(input.viewportHeight)
  return [
    input.fontSize,
    input.fontFamily,
    input.lineHeight,
    input.margins,
    input.textAlign,
    input.spread,
    vw,
    vh,
  ].join('|')
}

/** Words (or content units) that fit on one CSS column-page in the current chapter. */
export function wordsPerColumnPage(wordCount: number, measuredPages: number): number {
  const pages = Math.max(1, measuredPages)
  const words = Math.max(0, wordCount)
  if (words <= 0) return 300
  return words / pages
}

function chapterMass(chapter: OverallPageChapter): number {
  if (chapter.wordCount > 0) return chapter.wordCount
  if (chapter.contentLength && chapter.contentLength > 0) return Math.max(1, Math.round(chapter.contentLength / 5))
  return 0
}

/**
 * Estimate column-pages for an unmeasured chapter.
 * Rounds to a multiple of `columns` so spread totals stay book-like.
 */
export function estimateChapterPages(
  chapter: OverallPageChapter,
  wpp: number,
  columns: 1 | 2 = 1
): number {
  const mass = chapterMass(chapter)
  if (mass <= 0) return columns
  const raw = Math.max(columns, Math.round(mass / Math.max(1, wpp)))
  if (columns === 1) return raw
  return Math.max(columns, Math.round(raw / columns) * columns)
}

export function resolveChapterPageCount(
  chapter: OverallPageChapter,
  measured: number | undefined,
  wpp: number,
  columns: 1 | 2
): { pages: number; estimated: boolean } {
  if (measured != null && measured > 0) {
    return { pages: measured, estimated: false }
  }
  return { pages: estimateChapterPages(chapter, wpp, columns), estimated: true }
}

/**
 * Overall book page position from measured chapter pages + estimates for the rest.
 * `chapterPage` is the 0-based PaginatedView index (spread origin for two columns).
 */
export function computeOverallPageProgress(input: {
  chapters: OverallPageChapter[]
  currentChapter: number
  chapterPage: number
  chapterTotalPages: number
  columns: 1 | 2
  measuredPages: Readonly<Record<number, number>>
}): OverallPageProgress {
  const {
    chapters,
    currentChapter,
    chapterPage,
    chapterTotalPages,
    columns,
    measuredPages,
  } = input

  const safeChapter = Math.min(Math.max(0, currentChapter), Math.max(0, chapters.length - 1))
  const currentMeasured = Math.max(1, chapterTotalPages)
  const currentMass = chapterMass(chapters[safeChapter] ?? { wordCount: 0 })
  const wpp = wordsPerColumnPage(currentMass, currentMeasured)

  let pagesBefore = 0
  let usesEstimate = false

  for (let i = 0; i < safeChapter; i++) {
    const resolved = resolveChapterPageCount(chapters[i], measuredPages[i], wpp, columns)
    pagesBefore += resolved.pages
    if (resolved.estimated) usesEstimate = true
  }

  // Prefer the live measurement for the open chapter.
  const currentPages = currentMeasured
  if (measuredPages[safeChapter] == null) {
    // Still counting this chapter as measured via the live total.
  }

  let pagesAfter = 0
  for (let i = safeChapter + 1; i < chapters.length; i++) {
    const resolved = resolveChapterPageCount(chapters[i], measuredPages[i], wpp, columns)
    pagesAfter += resolved.pages
    if (resolved.estimated) usesEstimate = true
  }

  const total = Math.max(1, pagesBefore + currentPages + pagesAfter)
  const origin = Math.min(
    chapterPage - (chapterPage % columns),
    Math.max(0, currentPages - 1)
  )
  const span = Math.min(columns, currentPages - origin)
  const currentStart = pagesBefore + origin + 1
  const currentEnd = pagesBefore + origin + Math.max(1, span)

  return {
    currentStart: Math.min(currentStart, total),
    currentEnd: Math.min(Math.max(currentEnd, currentStart), total),
    total,
    usesEstimate,
  }
}

export function formatOverallPageLabel(
  progress: OverallPageProgress,
  options?: { compact?: boolean }
): string {
  const compact = options?.compact ?? false
  const start = progress.currentStart.toLocaleString('en-US')
  const end = progress.currentEnd.toLocaleString('en-US')
  const total = progress.total.toLocaleString('en-US')
  const isSpread = progress.currentEnd > progress.currentStart

  if (compact) {
    return isSpread ? `${start}–${end} / ${total}` : `${start} / ${total}`
  }
  if (isSpread) {
    return `Pages ${start}–${end} of ${total}`
  }
  return `Page ${start} of ${total}`
}
