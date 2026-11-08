import type { LiteratureTextSource } from './types'

export interface LiteratureAnnotation {
  id: string
  workId: string
  kind: 'highlight' | 'note' | 'bookmark'
  chapterIndex: number
  charOffset: number
  charEnd: number
  color?: string
  note?: string
  createdAt: string
  atTitle?: boolean
}

export interface TextSegment {
  text: string
  annotationId?: string
  color?: string
  note?: string
}

export const LITERATURE_ANNOTATIONS_KEY = 'openbible-literature-annotations'

export function toggleBookmark(
  list: LiteratureAnnotation[],
  anchor: { workId: string; chapterIndex: number; charOffset: number },
  now: string
): LiteratureAnnotation[] {
  const matches = (item: LiteratureAnnotation) =>
    item.kind === 'bookmark' &&
    item.workId === anchor.workId &&
    item.chapterIndex === anchor.chapterIndex &&
    item.charOffset === anchor.charOffset
  if (list.some(matches)) return list.filter((item) => !matches(item))
  return [
    ...list,
    {
      id: `bookmark-${anchor.workId}-${anchor.chapterIndex}-${anchor.charOffset}`,
      workId: anchor.workId,
      kind: 'bookmark',
      chapterIndex: anchor.chapterIndex,
      charOffset: anchor.charOffset,
      charEnd: anchor.charOffset,
      createdAt: now,
    },
  ]
}

export function decorateSlice(
  slice: {
    text: string
    charOffset: number
    charEnd: number
    chapterIndex: number
    source: LiteratureTextSource
    kind: string
  },
  annotations: LiteratureAnnotation[]
): TextSegment[] {
  if (slice.source === 'title') return [{ text: slice.text }]
  const relevant = annotations
    .filter((item) => item.kind !== 'bookmark' && item.chapterIndex === slice.chapterIndex && item.charEnd > item.charOffset)
    .map((item) => ({
      item,
      start: Math.max(item.charOffset, slice.charOffset),
      end: Math.min(item.charEnd, slice.charEnd),
    }))
    .filter((item) => item.end > item.start)
    .sort((a, b) => a.start - b.start || a.end - b.end)

  if (relevant.length === 0) return [{ text: slice.text }]

  const segments: TextSegment[] = []
  let cursor = slice.charOffset
  for (const range of relevant) {
    if (range.start > cursor) {
      segments.push({ text: slice.text.slice(cursor - slice.charOffset, range.start - slice.charOffset) })
    }
    const start = Math.max(range.start, cursor)
    if (range.end > start) {
      segments.push({
        text: slice.text.slice(start - slice.charOffset, range.end - slice.charOffset),
        annotationId: range.item.id,
        color: range.item.color,
        note: range.item.note,
      })
      cursor = range.end
    }
  }
  if (cursor < slice.charEnd) {
    segments.push({ text: slice.text.slice(cursor - slice.charOffset) })
  }
  return segments.filter((segment) => segment.text.length > 0)
}

export function readAnnotations(raw: string | null): LiteratureAnnotation[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is LiteratureAnnotation => {
      if (!item || typeof item !== 'object') return false
      const record = item as LiteratureAnnotation
      return typeof record.id === 'string' && typeof record.workId === 'string' && typeof record.chapterIndex === 'number'
    })
  } catch {
    return []
  }
}

export function readLocalAnnotations(): LiteratureAnnotation[] {
  if (typeof window === 'undefined') return []
  try {
    return readAnnotations(window.localStorage.getItem(LITERATURE_ANNOTATIONS_KEY))
  } catch {
    return []
  }
}

export function writeLocalAnnotations(annotations: LiteratureAnnotation[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LITERATURE_ANNOTATIONS_KEY, JSON.stringify(annotations))
  } catch {
    // Ignore quota failures; the page still shows the selection.
  }
}
