import type { ContentAnchor, StoredLiteraturePosition } from './types'

export const LITERATURE_POSITIONS_KEY = 'openbible-literature-positions'

export function parsePositionRecord(value: unknown): Omit<StoredLiteraturePosition, 'workId'> | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  let chapterIndex: number | null = null
  if (typeof record.chapterIndex === 'number' && Number.isFinite(record.chapterIndex)) chapterIndex = record.chapterIndex
  else if (typeof record.currentChapter === 'number' && Number.isFinite(record.currentChapter)) chapterIndex = record.currentChapter
  else if (typeof record.chapter === 'number' && Number.isFinite(record.chapter)) chapterIndex = record.chapter
  if (chapterIndex === null || chapterIndex < 0) return null

  const hasExplicitOffset = typeof record.charOffset === 'number' && Number.isFinite(record.charOffset) && record.charOffset >= 0
  const charOffset = hasExplicitOffset ? record.charOffset as number : 0
  const parsed: Omit<StoredLiteraturePosition, 'workId'> = { chapterIndex, charOffset }
  if (!hasExplicitOffset || record.atTitle === true) parsed.atTitle = true
  if (typeof record.updatedAt === 'string') parsed.updatedAt = record.updatedAt
  if (typeof record.chapterTitle === 'string' && record.chapterTitle.trim()) parsed.chapterTitle = record.chapterTitle
  return parsed
}

export function chooseFresherPosition<T extends { updatedAt?: string }>(a: T | null, b: T | null): T | null {
  if (!a) return b
  if (!b) return a
  const aTime = Date.parse(a.updatedAt ?? '')
  const bTime = Date.parse(b.updatedAt ?? '')
  if (Number.isNaN(aTime)) return b
  if (Number.isNaN(bTime)) return a
  return bTime >= aTime ? b : a
}

export function readPositionMap(raw: string | null): Record<string, StoredLiteraturePosition> {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    const map: Record<string, StoredLiteraturePosition> = {}
    for (const [workId, value] of Object.entries(parsed)) {
      const position = parsePositionRecord(value)
      if (!position) continue
      map[workId] = { workId, ...position }
    }
    return map
  } catch {
    return {}
  }
}

export function clampAnchor(anchor: ContentAnchor, chapterLengths: number[]): ContentAnchor {
  if (chapterLengths.length === 0) return { chapterIndex: 0, charOffset: 0 }
  const chapterIndex = Math.min(Math.max(Math.floor(anchor.chapterIndex), 0), chapterLengths.length - 1)
  const maxOffset = Math.max(chapterLengths[chapterIndex] ?? 0, 0)
  const charOffset = Math.min(Math.max(anchor.charOffset, 0), maxOffset)
  return anchor.atTitle ? { chapterIndex, charOffset, atTitle: true } : { chapterIndex, charOffset }
}

export function readLocalPosition(workId: string): StoredLiteraturePosition | null {
  if (typeof window === 'undefined') return null
  try {
    return readPositionMap(window.localStorage.getItem(LITERATURE_POSITIONS_KEY))[workId] ?? null
  } catch {
    return null
  }
}

export function readAllLocalPositions(): Record<string, StoredLiteraturePosition> {
  if (typeof window === 'undefined') return {}
  try {
    return readPositionMap(window.localStorage.getItem(LITERATURE_POSITIONS_KEY))
  } catch {
    return {}
  }
}

export function writeLocalPosition(position: StoredLiteraturePosition): void {
  if (typeof window === 'undefined') return
  try {
    const map = readPositionMap(window.localStorage.getItem(LITERATURE_POSITIONS_KEY))
    map[position.workId] = position
    window.localStorage.setItem(LITERATURE_POSITIONS_KEY, JSON.stringify(map))
  } catch {
    // A private browsing quota failure should not interrupt reading.
  }
}
