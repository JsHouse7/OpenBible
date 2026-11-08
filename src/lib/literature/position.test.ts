import { describe, expect, it } from 'vitest'
import { decorateSlice, toggleBookmark } from './annotations'
import { clampAnchor, chooseFresherPosition, parsePositionRecord, readPositionMap } from './position'

describe('reading positions', () => {
  it('restores the old chapter index at the start of that chapter', () => {
    expect(parsePositionRecord({ currentChapter: 2 })).toEqual({
      chapterIndex: 2,
      charOffset: 0,
      atTitle: true,
    })
    expect(parsePositionRecord({ chapterIndex: 1 })).toEqual({
      chapterIndex: 1,
      charOffset: 0,
      atTitle: true,
    })
    expect(parsePositionRecord({ chapterIndex: 1, charOffset: 0 })).toEqual({
      chapterIndex: 1,
      charOffset: 0,
    })
    expect(parsePositionRecord({ chapterIndex: 1, charOffset: 48, chapterTitle: 'Grace' })).toMatchObject({
      chapterIndex: 1,
      charOffset: 48,
      chapterTitle: 'Grace',
    })
    expect(parsePositionRecord(null)).toBeNull()
    expect(parsePositionRecord({ chapterIndex: -1 })).toBeNull()
  })

  it('keeps the newer of the local and account copies', () => {
    const chosen = chooseFresherPosition(
      { chapterIndex: 1, charOffset: 10, updatedAt: '2026-11-01T00:00:00.000Z' },
      { chapterIndex: 4, charOffset: 2, updatedAt: '2026-11-08T00:00:00.000Z' }
    )
    expect(chosen?.chapterIndex).toBe(4)
  })

  it('reads a map of saved works, including a legacy chapter field', () => {
    const map = readPositionMap(JSON.stringify({
      'work-1': { currentChapter: 3, updatedAt: '2026-11-02T00:00:00.000Z' },
      'work-2': { chapterIndex: 0, charOffset: 12, updatedAt: '2026-11-03T00:00:00.000Z' },
    }))
    expect(map['work-1']).toMatchObject({ workId: 'work-1', chapterIndex: 3, charOffset: 0 })
    expect(map['work-2'].charOffset).toBe(12)
  })

  it('clamps a restored anchor to the work that was loaded', () => {
    expect(clampAnchor({ chapterIndex: 9, charOffset: 80 }, [20, 10])).toEqual({
      chapterIndex: 1,
      charOffset: 10,
    })
    expect(clampAnchor({ chapterIndex: 0, charOffset: -4 }, [20])).toEqual({
      chapterIndex: 0,
      charOffset: 0,
    })
  })
})

describe('annotations', () => {
  it('toggles a bookmark at the same anchor', () => {
    const once = toggleBookmark([], { workId: 'w', chapterIndex: 1, charOffset: 5 }, '2026-11-08T00:00:00.000Z')
    expect(once).toHaveLength(1)
    expect(toggleBookmark(once, { workId: 'w', chapterIndex: 1, charOffset: 5 }, '2026-11-08T00:00:00.000Z')).toEqual([])
  })

  it('splits a slice around a highlight without covering the neighboring letters', () => {
    const segments = decorateSlice(
      {
        text: 'abcdef',
        charOffset: 10,
        charEnd: 16,
        chapterIndex: 0,
        source: 'content',
        kind: 'paragraph',
      },
      [
        {
          id: 'h1',
          workId: 'w',
          kind: 'highlight',
          chapterIndex: 0,
          charOffset: 12,
          charEnd: 14,
          color: 'wheat',
          createdAt: '2026-11-08T00:00:00.000Z',
        },
      ]
    )
    expect(segments.map((segment) => segment.text)).toEqual(['ab', 'cd', 'ef'])
    expect(segments[1].annotationId).toBe('h1')
    expect(segments[0].annotationId).toBeUndefined()
  })

  it('does not paint a content highlight across a chapter title', () => {
    const segments = decorateSlice(
      {
        text: 'Title',
        charOffset: 0,
        charEnd: 0,
        chapterIndex: 0,
        source: 'title',
        kind: 'heading',
      },
      [
        {
          id: 'h1',
          workId: 'w',
          kind: 'highlight',
          chapterIndex: 0,
          charOffset: 0,
          charEnd: 4,
          createdAt: '2026-11-08T00:00:00.000Z',
        },
      ]
    )
    expect(segments).toEqual([{ text: 'Title' }])
  })
})
