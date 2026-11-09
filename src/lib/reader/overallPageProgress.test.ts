import { describe, expect, it } from 'vitest'
import {
  computeOverallPageProgress,
  estimateChapterPages,
  formatOverallPageLabel,
  wordsPerColumnPage,
} from './overallPageProgress'

describe('overall page progress', () => {
  it('derives words-per-page from the open chapter', () => {
    expect(wordsPerColumnPage(1000, 10)).toBe(100)
    expect(wordsPerColumnPage(0, 10)).toBe(300)
  })

  it('estimates unmeasured chapters from words-per-page', () => {
    expect(estimateChapterPages({ wordCount: 1000 }, 100, 1)).toBe(10)
    expect(estimateChapterPages({ wordCount: 1000 }, 100, 2)).toBe(10)
    expect(estimateChapterPages({ wordCount: 50 }, 100, 2)).toBe(2)
  })

  it('places the current page after earlier chapters and stays monotonic within a chapter', () => {
    const chapters = [
      { wordCount: 1000 },
      { wordCount: 500 },
      { wordCount: 1500 },
    ]
    const measuredPages = { 0: 10 }

    const early = computeOverallPageProgress({
      chapters,
      currentChapter: 1,
      chapterPage: 0,
      chapterTotalPages: 5,
      columns: 1,
      measuredPages,
    })
    expect(early.currentStart).toBe(11)
    expect(early.currentEnd).toBe(11)
    expect(early.total).toBe(10 + 5 + 15) // ch2 estimated 1500/100

    const later = computeOverallPageProgress({
      chapters,
      currentChapter: 1,
      chapterPage: 3,
      chapterTotalPages: 5,
      columns: 1,
      measuredPages,
    })
    expect(later.currentStart).toBe(14)
    expect(later.total).toBe(early.total)
    expect(later.currentStart).toBeGreaterThan(early.currentStart)
  })

  it('labels a two-page spread like a physical book', () => {
    const progress = computeOverallPageProgress({
      chapters: [{ wordCount: 400 }, { wordCount: 400 }],
      currentChapter: 0,
      chapterPage: 2,
      chapterTotalPages: 6,
      columns: 2,
      measuredPages: {},
    })
    expect(progress.currentStart).toBe(3)
    expect(progress.currentEnd).toBe(4)
    expect(formatOverallPageLabel(progress)).toBe('Pages 3–4 of 12')
    expect(formatOverallPageLabel(progress, { compact: true })).toBe('3–4 / 12')
  })

  it('formats a single page calmly', () => {
    expect(
      formatOverallPageLabel({
        currentStart: 142,
        currentEnd: 142,
        total: 1310,
        usesEstimate: true,
      })
    ).toBe('Page 142 of 1,310')
    expect(
      formatOverallPageLabel(
        { currentStart: 142, currentEnd: 142, total: 1310, usesEstimate: true },
        { compact: true }
      )
    ).toBe('142 / 1,310')
  })
})
