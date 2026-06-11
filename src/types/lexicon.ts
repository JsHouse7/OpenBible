// Types for the lexicon / word-study feature

/**
 * A single token of a Strong's-tagged verse.
 * `t` is the English surface text (may be a multi-word phrase when one
 * original-language word maps to several English words), `s` holds one or
 * more Strong's IDs (e.g. ["G2316"]), and `i` marks translator-supplied
 * italics. Tokens without `s` are untagged.
 */
export interface TaggedToken {
  t: string
  s?: string[]
  i?: 1
}

export interface TaggedVerse {
  verse: number
  tokens: TaggedToken[]
}

export interface TaggedChapter {
  book_name: string
  chapter: number
  verses: TaggedVerse[]
}

export interface StrongsEntry {
  id: string // "G26" | "H430"
  lemma: string // original script (ἀγάπη / אֱלֹהִים)
  translit: string
  pron?: string
  derivation?: string
  strongs_def?: string
  kjv_def?: string
  pos?: string // part of speech
  usage?: string // KJV usage counts, e.g. "love(86x), charity(28x)"
  language: 'hebrew' | 'greek'
}

export interface OccurrenceResult {
  book: string
  chapter: number
  verse: number
  surface: string
  text: string
}

export interface SurfaceCount {
  surface: string
  count: number
}

export interface ConcordanceResponse {
  total: number
  surfaces: SurfaceCount[]
  results: OccurrenceResult[]
  page: number
  limit: number
}

/** The word currently selected for study. */
export interface WordSelection {
  strongsIds: string[]
  surface: string
  book: string
  chapter: number
  verse: number
}
