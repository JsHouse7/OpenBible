import { describe, expect, it } from 'vitest'
import { blocksFromWork } from './blocks'
import {
  chapterPageStats,
  classifyDrag,
  createWidthMeasure,
  findPageIndex,
  paginateBlocks,
  resolvePageTurn,
  resolveReadingLayout,
  stepAnchor,
  visiblePages,
} from './paginate'

function longParagraph(index: number) {
  return Array.from({ length: 36 }, (_, sentence) => {
    return `Sentence ${index}-${sentence} walks across the measure with enough ordinary words to wrap onto another line.`
  }).join(' ')
}

const longWork = {
  chapters: [
    {
      title: 'The long road',
      content: [
        Array.from({ length: 8 }, (_, index) => longParagraph(index)).join('\n\n'),
        'He said "Be still, and know that I am God." — Psalm 46:10',
        '[1] A footnote kept with the passage rather than dropped.',
        'https://example.com/psalm-46',
        'CHAPTER ASIDE The river',
        longParagraph(20),
      ].join('\n\n'),
    },
    {
      title: 'The next gate',
      content: [
        'The second chapter opens on its own page after the first chapter is finished.',
        'The following paragraph is still the second chapter, so a page turn must not skip it.',
        longParagraph(30),
      ].join('\n\n'),
    },
    {
      title: 'An empty room',
      content: ' \n\n ',
    },
  ],
}

const measure = createWidthMeasure({
  contentWidth: 320,
  fontSize: 18,
  lineHeight: 1.6,
  charWidth: 9,
})

function contentText(chapterIndex: number) {
  return longWork.chapters[chapterIndex].content
}

function pagesOf(work = longWork, pageContentHeight = 460, nextMeasure = measure) {
  return paginateBlocks(blocksFromWork(work), {
    pageContentHeight,
    measure: nextMeasure,
  })
}

function joinedContent(pages: ReturnType<typeof pagesOf>, chapterIndex: number) {
  return pages
    .flatMap((page) => page.slices)
    .filter((slice) => slice.chapterIndex === chapterIndex && slice.source === 'content')
    .map((slice) => slice.text)
    .join('')
}

describe('viewport pagination', () => {
  const pages = pagesOf()

  it('splits a long chapter into real pages without losing or repeating text', () => {
    expect(pages.length).toBeGreaterThan(4)
    for (let chapterIndex = 0; chapterIndex < longWork.chapters.length; chapterIndex += 1) {
      const meaningful = contentText(chapterIndex).replace(/\s+/g, '')
      expect(joinedContent(pages, chapterIndex).replace(/\s+/g, '')).toBe(meaningful)
    }

    const contentSlices = pages
      .flatMap((page) => page.slices)
      .filter((slice) => slice.source === 'content' && slice.chapterIndex === 0)
    let cursor = contentSlices[0]?.charOffset ?? 0
    for (const slice of contentSlices) {
      expect(slice.charOffset).toBe(cursor)
      expect(slice.charEnd).toBeGreaterThan(slice.charOffset)
      expect(slice.text).toBe(contentText(0).slice(slice.charOffset, slice.charEnd))
      cursor = slice.charEnd
    }
  })

  it('keeps each page inside the viewport unless one slice cannot be split', () => {
    for (const page of pages) {
      const used = page.slices.reduce((sum, slice) => sum + slice.height, 0)
      const unsplittable = page.slices.length === 1 && page.slices[0].height > 460
      if (!unsplittable) expect(used).toBeLessThanOrEqual(460)
    }
  })

  it('joins hard-wrapped lines into one paragraph and keeps the blank-line break', () => {
    const blocks = blocksFromWork({
      chapters: [{ title: 'Note', content: 'one two\nthree four\n\nfive six' }],
    })
    const content = blocks.filter((block) => block.source === 'content')
    expect(content).toHaveLength(2)
    expect(content[0].text).toContain('one two\nthree four')
    expect(content[1].text.trim()).toBe('five six')
  })

  it('keeps scripture, footnotes, links, and headings in the text', () => {
    const slices = pages.flatMap((page) => page.slices)
    expect(slices.some((slice) => slice.kind === 'scripture' && slice.text.includes('Psalm 46:10'))).toBe(true)
    expect(slices.some((slice) => slice.kind === 'footnote' && slice.text.includes('footnote'))).toBe(true)
    expect(slices.some((slice) => slice.kind === 'link' && slice.text.includes('https://example.com/psalm-46'))).toBe(true)
    expect(slices.some((slice) => slice.kind === 'heading' && slice.text.includes('The river'))).toBe(true)
    expect(slices.filter((slice) => slice.source === 'title' && slice.text === 'An empty room')).toHaveLength(1)
  })

  it('moves one page at a time and restores the same text when stepping back', () => {
    const forward: string[] = []
    let anchor = pages[0].startAnchor
    while (anchor) {
      const page = pages[findPageIndex(pages, anchor)]
      forward.push(page.slices.map((slice) => slice.text).join('\n'))
      const next = stepAnchor(pages, anchor, 1, 'single')
      if (!next) break
      expect(findPageIndex(pages, next)).toBe(page.index + 1)
      anchor = next
    }
    expect(forward).toEqual(pages.map((page) => page.slices.map((slice) => slice.text).join('\n')))
    expect(stepAnchor(pages, pages[0].startAnchor, -1, 'single')).toBeNull()
    expect(stepAnchor(pages, pages[pages.length - 1].startAnchor, 1, 'single')).toBeNull()

    const backward: string[] = []
    anchor = pages[pages.length - 1].startAnchor
    while (anchor) {
      const page = pages[findPageIndex(pages, anchor)]
      backward.push(page.slices.map((slice) => slice.text).join('\n'))
      const previous = stepAnchor(pages, anchor, -1, 'single')
      if (!previous) break
      anchor = previous
    }
    expect(backward.reverse()).toEqual(forward)
  })

  it('advances a spread by the next pair without skipping a page', () => {
    expect(pages.length).toBeGreaterThan(5)
    const seen: number[] = []
    let anchor = pages[0].startAnchor
    while (anchor) {
      const visible = visiblePages(pages, anchor, 'spread')
      seen.push(...visible.map((page) => page.index))
      const next = stepAnchor(pages, anchor, 1, 'spread')
      if (!next) break
      anchor = next
    }
    expect(seen).toEqual(pages.map((page) => page.index))

    const onRightPage = pages[1].startAnchor
    expect(findPageIndex(pages, stepAnchor(pages, onRightPage, 1, 'spread')!)).toBe(2)
    expect(stepAnchor(pages, onRightPage, -1, 'spread')).toBeNull()

    const later = pages[3].startAnchor
    expect(findPageIndex(pages, stepAnchor(pages, later, 1, 'spread')!)).toBe(4)
    expect(findPageIndex(pages, stepAnchor(pages, later, -1, 'spread')!)).toBe(0)
  })

  it('enters the next chapter only after the previous chapter text is finished', () => {
    const firstChapterPages = pages.filter((page) =>
      page.slices.some((slice) => slice.chapterIndex === 0 && slice.source === 'content')
    )
    const lastFirst = firstChapterPages[firstChapterPages.length - 1]
    const next = stepAnchor(pages, lastFirst.startAnchor, 1, 'single')
    if (next) {
      const destination = pages[findPageIndex(pages, next)]
      const hasSecond = destination.slices.some((slice) => slice.chapterIndex === 1)
      const stillFirst = destination.slices.some((slice) => slice.chapterIndex === 0 && slice.source === 'content')
      expect(hasSecond || stillFirst).toBe(true)
      expect(destination.slices.some((slice) => slice.chapterIndex > 1)).toBe(false)
    }
    const secondText = joinedContent(pages, 1)
    expect(secondText).toContain('second chapter opens')
    expect(secondText).toContain('must not skip it')
  })

  it('keeps the same characters on screen after the measure changes', () => {
    const anchor = pages[3].startAnchor
    const larger = createWidthMeasure({
      contentWidth: 280,
      fontSize: 22,
      lineHeight: 1.85,
      charWidth: 11,
    })
    const resized = pagesOf(longWork, 440, larger)
    const page = resized[findPageIndex(resized, anchor)]
    const ownsAnchor = page.slices.some((slice) => {
      if (slice.chapterIndex !== anchor.chapterIndex) return false
      if (slice.source === 'title') return anchor.charOffset <= 0
      return slice.charOffset <= anchor.charOffset && anchor.charOffset < slice.charEnd
    })
    const gapBeforeNext = page.slices.some((slice) => {
      return slice.chapterIndex === anchor.chapterIndex && slice.source === 'content' && slice.charOffset <= anchor.charOffset
    })
    expect(ownsAnchor || gapBeforeNext).toBe(true)
    expect(joinedContent(resized, anchor.chapterIndex).replace(/\s+/g, '')).toBe(
      contentText(anchor.chapterIndex).replace(/\s+/g, '')
    )
  })

  it('resolves an offset at the end of a chapter to that chapter’s last page', () => {
    const end = contentText(0).length
    const index = findPageIndex(pages, { chapterIndex: 0, charOffset: end })
    expect(pages[index].slices.some((slice) => slice.chapterIndex === 0)).toBe(true)
    expect(pages[index].slices.some((slice) => slice.chapterIndex > 1)).toBe(false)
  })

  it('does not loop on a page shorter than one slice', () => {
    const tiny = pagesOf(longWork, 10, () => 50)
    expect(tiny.length).toBeGreaterThan(1)
    expect(joinedContent(tiny, 0).replace(/\s+/g, '')).toBe(contentText(0).replace(/\s+/g, ''))
  })

  it('moves a heading onto the next page when the following line can travel with it', () => {
    const blocks = blocksFromWork({
      chapters: [
        {
          title: 'Stay',
          content: 'STAY on this page with the opening paragraph.\n\nHEADING The next part\n\nNEXT paragraph continues the thought.',
        },
      ],
    })
    const packed = paginateBlocks(blocks, {
      pageContentHeight: 300,
      measure: (text, kind) => {
        if (kind === 'heading' && text.includes('next part')) return 50
        if (text.startsWith('STAY')) return 220
        if (text.startsWith('NEXT')) return 80
        if (kind === 'heading') return 30
        return 40
      },
    })
    expect(packed[0].slices.map((slice) => slice.text).join(' ')).toContain('STAY')
    expect(packed[0].slices.some((slice) => slice.text.includes('next part'))).toBe(false)
    expect(packed[1].slices.some((slice) => slice.text.includes('next part'))).toBe(true)
    expect(packed[1].slices.some((slice) => slice.text.startsWith('NEXT'))).toBe(true)
  })

  it('reports overall page counts', () => {
    const stats = chapterPageStats(pages, 0)
    expect(stats.overall).toBe(1)
    expect(stats.total).toBe(pages.length)
    expect(stats.chapterIndex).toBe(0)
  })
})

describe('gesture and layout', () => {
  it('lets vertical movement and selections pass, and cancels a short drag', () => {
    expect(classifyDrag({ dx: 8, dy: 48, width: 400, selecting: false, phase: 'end' })).toBe('ignore')
    expect(classifyDrag({ dx: -140, dy: 10, width: 400, selecting: true, phase: 'end' })).toBe('ignore')
    expect(classifyDrag({ dx: -30, dy: 4, width: 400, selecting: false, phase: 'end' })).toBe('cancel')
    expect(classifyDrag({ dx: -140, dy: 8, width: 400, selecting: false, phase: 'end' })).toBe('commit-next')
    expect(classifyDrag({ dx: 140, dy: 8, width: 400, selecting: false, phase: 'end' })).toBe('commit-prev')
    expect(classifyDrag({ dx: -28, dy: 4, width: 400, selecting: false, phase: 'move' })).toBe('pending')
    expect(classifyDrag({ dx: 4, dy: 2, width: 400, selecting: false, phase: 'move' })).toBe('ignore')
  })

  it('drops paper and slide motion when the system asks for reduced motion', () => {
    expect(resolvePageTurn('paper', true)).toBe('none')
    expect(resolvePageTurn('slide', true)).toBe('none')
    expect(resolvePageTurn('paper', false)).toBe('paper')
    expect(resolvePageTurn('none', false)).toBe('none')
  })

  it('uses a spread only when two columns still fit at the chosen font size', () => {
    expect(resolveReadingLayout('scroll', 1280, 18)).toBe('scroll')
    expect(resolveReadingLayout('single', 1280, 18)).toBe('single')
    expect(resolveReadingLayout('spread', 390, 18)).toBe('single')
    expect(resolveReadingLayout('spread', 800, 18)).toBe('spread')
    expect(resolveReadingLayout('spread', 1024, 32)).toBe('single')
  })
})
