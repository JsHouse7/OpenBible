#!/usr/bin/env node

/**
 * Translation Alignment Script
 *
 * Generates Strong's-tagged chapter files for translations that have no
 * source-tagged text, by aligning each verse's words against the
 * Strong's-tagged KJV (public/bible-tagged-kjv, built by
 * scripts/build-lexicon-data.mjs).
 *
 * For every verse the aligner matches target-translation words to tagged KJV
 * words using, in order of preference:
 *   1. exact normalized surface match (order-preserving LCS)
 *   2. stem match (light English stemmer, order-preserving LCS)
 *   3. lexicon gloss match (kjv_def / usage words of the Strong's IDs
 *      present in the verse)
 *
 * Only confident matches receive tags; everything else stays plain text, so
 * tagging is intentionally partial for freer translations. Verses whose
 * coverage falls below a minimum threshold are emitted fully untagged.
 *
 * Output: public/bible-tagged-{translation}/{Book}/{chapter}.json
 * (same token model as the tagged KJV: { t, s?, i? })
 *
 * Usage: node scripts/align-translation.mjs [NKJV ESV NIV YLT]
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const PUBLIC_DIR = path.join(ROOT, 'public')
const TAGGED_KJV_DIR = path.join(PUBLIC_DIR, 'bible-tagged-kjv')
const LEXICON_DIR = path.join(PUBLIC_DIR, 'lexicon')

const DEFAULT_TRANSLATIONS = ['NKJV', 'ESV', 'NIV', 'YLT']

/** Minimum fraction of content words that must be tagged to keep a verse's tags. */
const MIN_VERSE_COVERAGE = 0.2

// Words too common/ambiguous to align on their own. Matching these would
// produce many false tags (KJV phrases like "the earth[H776]" contain them).
const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'but', 'by', 'did', 'do',
  'doth', 'dost', 'for', 'from', 'had', 'has', 'hast', 'hath', 'have', 'he',
  'her', 'him', 'his', 'i', 'in', 'into', 'is', 'it', 'its', 'may', 'me', 'my',
  'not', 'o', 'of', 'on', 'or', 'our', 'shall', 'she', 'so', 'that', 'the',
  'thee', 'their', 'them', 'they', 'thou', 'thy', 'to', 'unto', 'upon', 'us',
  'was', 'we', 'were', 'which', 'who', 'whom', 'will', 'with', 'ye', 'you',
  'your', 'yea', 'also', 'even', 'let', 'this', 'these', 'those', 'then',
  'there', 'when', 'what', 'if', 'no', 'nor', 'now', 'out', 'up', 'all', 'am',
  'should', 'would', 'could', 'might', 'must', 'can', 'cannot', 'being',
  'ought', 'because', 'therefore', 'while', 'where', 'how', 'why', 'whoever',
  'whosoever', 'any', 'every', 'each', 'one', 'ones', 'other', 'own', 'such',
])

/** Lowercase and strip surrounding punctuation / possessives. */
function normalizeWord(word) {
  return word
    .toLowerCase()
    .replace(/[’']s$/, '')
    .replace(/^[^a-z]+|[^a-z]+$/g, '')
}

/**
 * Light stemmer for KJV-era and modern English inflections
 * (believeth/believes/believe, loved/loving/love, etc.).
 */
function stem(word) {
  let w = word
  if (w.length > 5 && w.endsWith('ieth')) return w.slice(0, -4) + 'y'
  if (w.length > 5 && w.endsWith('ies')) return w.slice(0, -3) + 'y'
  if (w.length > 5 && w.endsWith('ied')) return w.slice(0, -3) + 'y'
  for (const suffix of ['eth', 'est', 'ing', 'ed', 'es', 's']) {
    if (w.length > suffix.length + 2 && w.endsWith(suffix)) {
      w = w.slice(0, -suffix.length)
      // undo consonant doubling: "sitting" -> "sitt" -> "sit"
      if (w.length > 3 && w[w.length - 1] === w[w.length - 2]) w = w.slice(0, -1)
      return w
    }
  }
  return w
}

/** Fuzzy stem equality: exact, or long-prefix relationship. */
function stemsMatch(a, b) {
  if (a === b) return true
  if (a.length >= 5 && b.length >= 5) {
    const [short, long] = a.length <= b.length ? [a, b] : [b, a]
    if (long.startsWith(short) && long.length - short.length <= 3) return true
  }
  return false
}

// ---------------------------------------------------------------------------
// Lexicon glosses
// ---------------------------------------------------------------------------

const shardCache = new Map()
function loadShard(file) {
  if (!shardCache.has(file)) {
    const p = path.join(LEXICON_DIR, file)
    shardCache.set(file, fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : {})
  }
  return shardCache.get(file)
}

const glossCache = new Map()
/** Set of stemmed gloss words for a Strong's ID, from kjv_def + usage. */
function glossStems(strongsId) {
  if (glossCache.has(strongsId)) return glossCache.get(strongsId)
  const block = Math.floor(Number(strongsId.slice(1)) / 100)
  const entry = loadShard(`strongs-${strongsId[0]}${block}.json`)[strongsId]
  const stems = new Set()
  if (entry) {
    const text = `${entry.kjv_def || ''} ${entry.usage || ''}`
    for (const m of text.matchAll(/[a-z]{3,}/gi)) {
      const norm = normalizeWord(m[0])
      if (norm.length >= 3 && !STOPWORDS.has(norm)) stems.add(stem(norm))
    }
  }
  glossCache.set(strongsId, stems)
  return stems
}

// ---------------------------------------------------------------------------
// Alignment
// ---------------------------------------------------------------------------

/**
 * Content words of the tagged KJV verse, in order, each carrying the
 * Strong's IDs of the token it came from. Multi-word token surfaces are
 * split so each content word is a candidate.
 */
function kjvContentWords(tokens) {
  const words = []
  tokens.forEach((token, tokenIdx) => {
    if (!token.s || token.s.length === 0) return
    for (const raw of token.t.split(/\s+/)) {
      const norm = normalizeWord(raw)
      if (norm === '' || STOPWORDS.has(norm)) continue
      words.push({ norm, stem: stem(norm), ids: token.s, tokenIdx })
    }
  })
  return words
}

/** Split verse text into display words (whitespace-separated, punctuation kept). */
function splitTargetWords(text) {
  return text
    .replace(/<\/?[a-z]+>/gi, ' ')
    .replace(/¶/g, ' ')
    .split(/\s+/)
    .filter((w) => w !== '')
}

/**
 * Order-preserving longest-common-subsequence match between KJV content
 * words and target content words using `eq` for equality. Marks used
 * entries so each KJV word tags at most one target word per pass.
 */
function lcsMatch(kjvWords, targetWords, eq) {
  const n = kjvWords.length
  const m = targetWords.length
  // dp[i][j] = LCS length of kjvWords[i:] vs targetWords[j:]
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (!kjvWords[i].used && !targetWords[j].matched && eq(kjvWords[i], targetWords[j])) {
        dp[i][j] = dp[i + 1][j + 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1])
      }
    }
  }
  // Recover the matching pairs
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (!kjvWords[i].used && !targetWords[j].matched && eq(kjvWords[i], targetWords[j]) && dp[i][j] === dp[i + 1][j + 1] + 1) {
      targetWords[j].matched = kjvWords[i]
      kjvWords[i].used = true
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++
    } else {
      j++
    }
  }
}

/**
 * Align one verse. Returns { tokens, contentCount, taggedCount }.
 */
function alignVerse(targetText, kjvTokens) {
  const rawWords = splitTargetWords(targetText)
  const targetWords = rawWords.map((raw) => {
    const norm = normalizeWord(raw)
    const isContent = norm !== '' && !STOPWORDS.has(norm)
    return { raw, norm, stem: isContent ? stem(norm) : '', isContent, matched: null }
  })
  const contentTargets = targetWords.filter((w) => w.isContent)

  const kjvWords = kjvContentWords(kjvTokens || [])

  if (kjvWords.length > 0 && contentTargets.length > 0) {
    // Pass 1: exact normalized surface match, order-preserving
    lcsMatch(kjvWords, contentTargets, (k, t) => k.norm === t.norm)
    // Pass 2: stem match, order-preserving
    lcsMatch(kjvWords, contentTargets, (k, t) => stemsMatch(k.stem, t.stem))

    // Pass 3: gloss match for remaining target words against unused verse IDs
    const unusedIds = []
    const seen = new Set()
    for (const k of kjvWords) {
      if (k.used) continue
      for (const id of k.ids) {
        const key = `${id}|${k.tokenIdx}`
        if (!seen.has(key)) {
          seen.add(key)
          unusedIds.push({ id, kjvWord: k })
        }
      }
    }
    for (const t of contentTargets) {
      if (t.matched || t.norm.length < 3) continue
      const hit = unusedIds.find(
        (u) => !u.kjvWord.used && glossStems(u.id).has(t.stem)
      )
      if (hit) {
        t.matched = hit.kjvWord
        hit.kjvWord.used = true
      }
    }
  }

  const taggedCount = contentTargets.filter((w) => w.matched).length
  const coverage = contentTargets.length > 0 ? taggedCount / contentTargets.length : 0
  const keepTags = coverage >= MIN_VERSE_COVERAGE

  // Build tokens: tagged words stand alone; consecutive plain words merge.
  const tokens = []
  for (const w of targetWords) {
    if (keepTags && w.matched) {
      tokens.push({ t: w.raw, s: [...w.matched.ids] })
    } else {
      const prev = tokens[tokens.length - 1]
      if (prev && !prev.s) {
        prev.t += ' ' + w.raw
      } else {
        tokens.push({ t: w.raw })
      }
    }
  }

  return {
    tokens,
    contentCount: contentTargets.length,
    taggedCount: keepTags ? taggedCount : 0,
    dropped: !keepTags && taggedCount > 0,
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function listChapters(bookDir) {
  return fs
    .readdirSync(bookDir)
    .filter((f) => /^\d+\.json$/.test(f))
    .map((f) => Number(f.replace('.json', '')))
    .sort((a, b) => a - b)
}

function alignTranslation(abbrev) {
  const dirName = abbrev.toLowerCase()
  const sourceDir = path.join(PUBLIC_DIR, `bible-json-${dirName}`)
  const outDir = path.join(PUBLIC_DIR, `bible-tagged-${dirName}`)
  if (!fs.existsSync(sourceDir)) {
    console.error(`  ✗ missing source dir ${sourceDir} — skipping ${abbrev}`)
    return
  }

  let verseCount = 0
  let taggedVerseCount = 0
  let contentTotal = 0
  let taggedTotal = 0
  let droppedVerses = 0
  let missingKjvVerses = 0

  const books = fs
    .readdirSync(TAGGED_KJV_DIR)
    .filter((d) => fs.statSync(path.join(TAGGED_KJV_DIR, d)).isDirectory())

  for (const book of books) {
    const sourceBookDir = path.join(sourceDir, book)
    if (!fs.existsSync(sourceBookDir)) {
      console.warn(`  ⚠ ${abbrev}: no source text for ${book}`)
      continue
    }
    const outBookDir = path.join(outDir, book)
    fs.mkdirSync(outBookDir, { recursive: true })

    for (const chapterNum of listChapters(sourceBookDir)) {
      const source = JSON.parse(
        fs.readFileSync(path.join(sourceBookDir, `${chapterNum}.json`), 'utf-8')
      )
      const kjvPath = path.join(TAGGED_KJV_DIR, book, `${chapterNum}.json`)
      const kjvVerses = new Map()
      if (fs.existsSync(kjvPath)) {
        const kjv = JSON.parse(fs.readFileSync(kjvPath, 'utf-8'))
        for (const v of kjv.verses) kjvVerses.set(v.verse, v.tokens)
      }

      const verses = []
      for (const v of source.verses || []) {
        const text = (v.text || '').trim()
        if (text === '') continue
        const kjvTokens = kjvVerses.get(v.verse)
        if (!kjvTokens) missingKjvVerses++
        const result = alignVerse(text, kjvTokens)
        verses.push({ verse: v.verse, tokens: result.tokens })
        verseCount++
        contentTotal += result.contentCount
        taggedTotal += result.taggedCount
        if (result.taggedCount > 0) taggedVerseCount++
        if (result.dropped) droppedVerses++
      }

      fs.writeFileSync(
        path.join(outBookDir, `${chapterNum}.json`),
        JSON.stringify({ book_name: book, chapter: chapterNum, verses })
      )
    }
  }

  const versePct = verseCount > 0 ? ((taggedVerseCount / verseCount) * 100).toFixed(1) : '0'
  const wordPct = contentTotal > 0 ? ((taggedTotal / contentTotal) * 100).toFixed(1) : '0'
  console.log(
    `  ✓ ${abbrev}: ${verseCount} verses → ${taggedVerseCount} tagged (${versePct}%), ` +
      `content-word coverage ${wordPct}%` +
      (droppedVerses > 0 ? `, ${droppedVerses} verses below coverage threshold` : '') +
      (missingKjvVerses > 0 ? `, ${missingKjvVerses} verses without KJV counterpart` : '')
  )
}

function main() {
  const translations = process.argv.slice(2).length > 0 ? process.argv.slice(2) : DEFAULT_TRANSLATIONS
  console.log(`🔗 Aligning translations to tagged KJV: ${translations.join(', ')}`)
  if (!fs.existsSync(TAGGED_KJV_DIR)) {
    console.error('✗ public/bible-tagged-kjv not found — run `npm run build:lexicon` first')
    process.exit(1)
  }
  for (const abbrev of translations) {
    alignTranslation(abbrev.toUpperCase())
  }
  console.log('\n✅ Done')
}

main()
