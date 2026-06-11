// BibleHub deep-link URL builders for the word-study feature.
// All functions are pure and unit-testable.

/**
 * BibleHub book slugs keyed by the app's book names (the directory names
 * used under public/bible-json-*). Explicit map — do not derive
 * algorithmically (note "songs" for Song of Solomon).
 */
export const BIBLEHUB_BOOK_SLUGS: Record<string, string> = {
  Genesis: 'genesis',
  Exodus: 'exodus',
  Leviticus: 'leviticus',
  Numbers: 'numbers',
  Deuteronomy: 'deuteronomy',
  Joshua: 'joshua',
  Judges: 'judges',
  Ruth: 'ruth',
  '1 Samuel': '1_samuel',
  '2 Samuel': '2_samuel',
  '1 Kings': '1_kings',
  '2 Kings': '2_kings',
  '1 Chronicles': '1_chronicles',
  '2 Chronicles': '2_chronicles',
  Ezra: 'ezra',
  Nehemiah: 'nehemiah',
  Esther: 'esther',
  Job: 'job',
  Psalms: 'psalms',
  Proverbs: 'proverbs',
  Ecclesiastes: 'ecclesiastes',
  'Song of Solomon': 'songs',
  Isaiah: 'isaiah',
  Jeremiah: 'jeremiah',
  Lamentations: 'lamentations',
  Ezekiel: 'ezekiel',
  Daniel: 'daniel',
  Hosea: 'hosea',
  Joel: 'joel',
  Amos: 'amos',
  Obadiah: 'obadiah',
  Jonah: 'jonah',
  Micah: 'micah',
  Nahum: 'nahum',
  Habakkuk: 'habakkuk',
  Zephaniah: 'zephaniah',
  Haggai: 'haggai',
  Zechariah: 'zechariah',
  Malachi: 'malachi',
  Matthew: 'matthew',
  Mark: 'mark',
  Luke: 'luke',
  John: 'john',
  Acts: 'acts',
  Romans: 'romans',
  '1 Corinthians': '1_corinthians',
  '2 Corinthians': '2_corinthians',
  Galatians: 'galatians',
  Ephesians: 'ephesians',
  Philippians: 'philippians',
  Colossians: 'colossians',
  '1 Thessalonians': '1_thessalonians',
  '2 Thessalonians': '2_thessalonians',
  '1 Timothy': '1_timothy',
  '2 Timothy': '2_timothy',
  Titus: 'titus',
  Philemon: 'philemon',
  Hebrews: 'hebrews',
  James: 'james',
  '1 Peter': '1_peter',
  '2 Peter': '2_peter',
  '1 John': '1_john',
  '2 John': '2_john',
  '3 John': '3_john',
  Jude: 'jude',
  Revelation: 'revelation',
}

const BASE = 'https://biblehub.com'

function strongsParts(id: string): { lang: 'hebrew' | 'greek'; num: number } | null {
  const match = id.match(/^([HG])(\d{1,4})$/)
  if (!match) return null
  return { lang: match[1] === 'H' ? 'hebrew' : 'greek', num: Number(match[2]) }
}

/** Strong's lexicon entry page, e.g. G26 -> https://biblehub.com/greek/26.htm */
export function strongsLexiconUrl(id: string): string | null {
  const parts = strongsParts(id)
  if (!parts) return null
  return `${BASE}/${parts.lang}/${parts.num}.htm`
}

/** Englishman's Concordance page, e.g. G26 -> https://biblehub.com/greek/strongs_26.htm */
export function englishmansConcordanceUrl(id: string): string | null {
  const parts = strongsParts(id)
  if (!parts) return null
  return `${BASE}/${parts.lang}/strongs_${parts.num}.htm`
}

/** Interlinear page for a verse, e.g. https://biblehub.com/interlinear/john/3-16.htm */
export function interlinearUrl(book: string, chapter: number, verse: number): string | null {
  const slug = BIBLEHUB_BOOK_SLUGS[book]
  if (!slug) return null
  return `${BASE}/interlinear/${slug}/${chapter}-${verse}.htm`
}

/** Lexicon page for a verse, e.g. https://biblehub.com/lexicon/john/3-16.htm */
export function lexiconPageUrl(book: string, chapter: number, verse: number): string | null {
  const slug = BIBLEHUB_BOOK_SLUGS[book]
  if (!slug) return null
  return `${BASE}/lexicon/${slug}/${chapter}-${verse}.htm`
}
