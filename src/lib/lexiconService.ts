// Lexicon data service: loads Strong's-tagged KJV chapters and Strong's
// dictionary entries from the static JSON assets built by
// scripts/build-lexicon-data.mjs (public/bible-tagged-kjv and public/lexicon).

import type {
  TaggedChapter,
  TaggedVerse,
  StrongsEntry,
  ConcordanceResponse,
} from '@/types/lexicon'

const taggedChapterCache = new Map<string, TaggedVerse[] | null>()
const shardCache = new Map<string, Record<string, Omit<StrongsEntry, 'language'>> | null>()

const STRONGS_ID_RE = /^[HG]\d{1,4}$/

export function isValidStrongsId(id: string): boolean {
  return STRONGS_ID_RE.test(id)
}

export function strongsLanguage(id: string): 'hebrew' | 'greek' {
  return id.startsWith('H') ? 'hebrew' : 'greek'
}

/**
 * Load the Strong's-tagged KJV verses for a chapter.
 * Returns null when no tagged data is available (missing file / fetch error).
 */
export async function loadTaggedChapter(
  book: string,
  chapter: number
): Promise<TaggedVerse[] | null> {
  const cacheKey = `${book}-${chapter}`
  if (taggedChapterCache.has(cacheKey)) {
    return taggedChapterCache.get(cacheKey)!
  }

  try {
    const response = await fetch(`/bible-tagged-kjv/${encodeURIComponent(book)}/${chapter}.json`)
    if (!response.ok) {
      taggedChapterCache.set(cacheKey, null)
      return null
    }
    const data: TaggedChapter = await response.json()
    taggedChapterCache.set(cacheKey, data.verses)
    return data.verses
  } catch {
    taggedChapterCache.set(cacheKey, null)
    return null
  }
}

/** Shard filename for a Strong's ID, e.g. G26 -> strongs-G0.json (entries G0–G99). */
export function shardFileForStrongsId(id: string): string {
  const block = Math.floor(Number(id.slice(1)) / 100)
  return `strongs-${id[0]}${block}.json`
}

/**
 * Look up a Strong's dictionary entry. Fetches and caches the 100-entry
 * shard containing the ID. Returns null if the ID is invalid or missing.
 */
export async function getStrongsEntry(id: string): Promise<StrongsEntry | null> {
  if (!isValidStrongsId(id)) return null

  const shardFile = shardFileForStrongsId(id)
  let shard = shardCache.get(shardFile) ?? null
  if (!shardCache.has(shardFile)) {
    try {
      const response = await fetch(`/lexicon/${shardFile}`)
      shard = response.ok ? await response.json() : null
    } catch {
      shard = null
    }
    shardCache.set(shardFile, shard)
  }

  const entry = shard?.[id]
  if (!entry) return null
  return { ...entry, language: strongsLanguage(id) }
}

/**
 * Search all KJV occurrences of a Strong's number (concordance).
 * Backed by /api/lexicon/occurrences (Supabase index).
 */
export async function searchOccurrences(
  strongsId: string,
  opts: { page?: number; limit?: number; book?: string; surface?: string } = {}
): Promise<ConcordanceResponse | null> {
  if (!isValidStrongsId(strongsId)) return null

  const params = new URLSearchParams({ strongs: strongsId })
  if (opts.page) params.set('page', String(opts.page))
  if (opts.limit) params.set('limit', String(opts.limit))
  if (opts.book) params.set('book', opts.book)
  if (opts.surface) params.set('surface', opts.surface)

  try {
    const response = await fetch(`/api/lexicon/occurrences?${params.toString()}`)
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}
