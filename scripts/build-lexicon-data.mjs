#!/usr/bin/env node

/**
 * Lexicon Data Build Script
 *
 * Builds the static lexicon assets for the word-study feature:
 *   1. public/bible-tagged-kjv/{Book}/{chapter}.json
 *      Strong's-tagged KJV chapters as token arrays.
 *      Source: github.com/kaiserlik/kjv (public domain KJV text with
 *      inline Strong's tags like "God[H430]" and <em> italics).
 *   2. public/lexicon/strongs-{H|G}{block}.json
 *      Strong's Hebrew/Greek dictionary sharded 100 entries per file.
 *      Primary source: github.com/openscriptures/strongs (CC-BY-SA JSON
 *      derived from the public-domain 1890 concordance), supplemented
 *      with part-of-speech / KJV usage counts from kaiserlik's lexicon.
 *
 * Sources are read from data-sources/ (downloaded automatically if missing).
 *
 * Usage: node scripts/build-lexicon-data.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const SOURCES_DIR = path.join(ROOT, 'data-sources')
const KJV_STRONGS_DIR = path.join(SOURCES_DIR, 'kjv-strongs')
const TAGGED_OUT_DIR = path.join(ROOT, 'public', 'bible-tagged-kjv')
const LEXICON_OUT_DIR = path.join(ROOT, 'public', 'lexicon')
// Reference KJV text for truncation repair / verification. public/bible-json
// is the complete 66-book KJV (with ¶ and <i> markup); bible-json-kjv lacks
// Song of Solomon, so it is only the fallback.
const REFERENCE_KJV_DIRS = [
  path.join(ROOT, 'public', 'bible-json'),
  path.join(ROOT, 'public', 'bible-json-kjv'),
]

const KAISERLIK_BASE = 'https://raw.githubusercontent.com/kaiserlik/kjv/master/'
const OPENSCRIPTURES_GREEK =
  'https://raw.githubusercontent.com/openscriptures/strongs/master/greek/strongs-greek-dictionary.js'
const OPENSCRIPTURES_HEBREW =
  'https://raw.githubusercontent.com/openscriptures/strongs/master/hebrew/strongs-hebrew-dictionary.js'

// Canonical book order; abbrev = kaiserlik filename, name = app book directory name
const BOOKS = [
  ['Gen', 'Genesis'], ['Exo', 'Exodus'], ['Lev', 'Leviticus'], ['Num', 'Numbers'],
  ['Deu', 'Deuteronomy'], ['Jos', 'Joshua'], ['Jdg', 'Judges'], ['Rth', 'Ruth'],
  ['1Sa', '1 Samuel'], ['2Sa', '2 Samuel'], ['1Ki', '1 Kings'], ['2Ki', '2 Kings'],
  ['1Ch', '1 Chronicles'], ['2Ch', '2 Chronicles'], ['Ezr', 'Ezra'], ['Neh', 'Nehemiah'],
  ['Est', 'Esther'], ['Job', 'Job'], ['Psa', 'Psalms'], ['Pro', 'Proverbs'],
  ['Ecc', 'Ecclesiastes'], ['Sng', 'Song of Solomon'], ['Isa', 'Isaiah'], ['Jer', 'Jeremiah'],
  ['Lam', 'Lamentations'], ['Eze', 'Ezekiel'], ['Dan', 'Daniel'], ['Hos', 'Hosea'],
  ['Joe', 'Joel'], ['Amo', 'Amos'], ['Oba', 'Obadiah'], ['Jon', 'Jonah'],
  ['Mic', 'Micah'], ['Nah', 'Nahum'], ['Hab', 'Habakkuk'], ['Zep', 'Zephaniah'],
  ['Hag', 'Haggai'], ['Zec', 'Zechariah'], ['Mal', 'Malachi'],
  ['Mat', 'Matthew'], ['Mar', 'Mark'], ['Luk', 'Luke'], ['Jhn', 'John'],
  ['Act', 'Acts'], ['Rom', 'Romans'], ['1Co', '1 Corinthians'], ['2Co', '2 Corinthians'],
  ['Gal', 'Galatians'], ['Eph', 'Ephesians'], ['Phl', 'Philippians'], ['Col', 'Colossians'],
  ['1Th', '1 Thessalonians'], ['2Th', '2 Thessalonians'], ['1Ti', '1 Timothy'], ['2Ti', '2 Timothy'],
  ['Tit', 'Titus'], ['Phm', 'Philemon'], ['Heb', 'Hebrews'], ['Jas', 'James'],
  ['1Pe', '1 Peter'], ['2Pe', '2 Peter'], ['1Jo', '1 John'], ['2Jo', '2 John'],
  ['3Jo', '3 John'], ['Jde', 'Jude'], ['Rev', 'Revelation'],
]

async function download(url, dest) {
  console.log(`  ⬇ downloading ${url}`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
}

async function ensureSources() {
  for (const [abbrev] of BOOKS) {
    const dest = path.join(KJV_STRONGS_DIR, `${abbrev}.json`)
    if (!fs.existsSync(dest) || fs.statSync(dest).size === 0) {
      await download(`${KAISERLIK_BASE}${abbrev}.json`, dest)
    }
  }
  const extras = [
    ['lexicon.json', `${KAISERLIK_BASE}lexicon.json`],
    ['strongs-greek-dictionary.js', OPENSCRIPTURES_GREEK],
    ['strongs-hebrew-dictionary.js', OPENSCRIPTURES_HEBREW],
  ]
  for (const [file, url] of extras) {
    const dest = path.join(SOURCES_DIR, file)
    if (!fs.existsSync(dest) || fs.statSync(dest).size === 0) {
      await download(url, dest)
    }
  }
}

/** Decode the handful of HTML entities that appear in the source data. */
function decodeEntities(text) {
  return text
    .replace(/&#(\d+);?/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

const TAG_RE = /\[([HG]\d+)\]/g
const EM_RE = /<em>([\s\S]*?)<\/em>/g
const PUNCT_ONLY_RE = /^[\s.,;:!?'")\]]+$/
const LEADING_PUNCT_RE = /^[.,;:!?')\]]/

/**
 * Tokenize a kaiserlik verse string into the app token model.
 *
 * Input:  'And the earth[H776] was[H1961] without form,[H8414] and darkness[H2822] <em>was</em> upon the face[H6440] ...'
 * Output: [{t:'And the earth', s:['H776']}, {t:'was', s:['H1961']}, ...,
 *          {t:'was', i:1}, {t:'upon the face', s:['H6440']}, ...]
 *
 * Rules:
 *  - A run of text followed by one-or-more [HG]\d+ tags forms a tagged segment.
 *  - <em>…</em> spans (KJV italics / translator-supplied words) are split out
 *    as their own tokens with i:1; the segment's Strong's tags attach to the
 *    last token of the segment.
 *  - Punctuation-only fragments merge into the previous token.
 */
function tokenizeVerse(raw) {
  const text = decodeEntities(raw)

  // Pass 1: split into (segmentText, tags[]) — tags attach to the text before them
  const segments = []
  let current = { text: '', tags: [] }
  let last = 0
  for (const m of text.matchAll(TAG_RE)) {
    const between = text.slice(last, m.index)
    if (between.trim() !== '' && current.tags.length > 0) {
      segments.push(current)
      current = { text: between, tags: [m[1]] }
    } else {
      current.text += between
      current.tags.push(m[1])
    }
    last = m.index + m[0].length
  }
  if (current.text.trim() !== '' || current.tags.length > 0) segments.push(current)
  const tail = text.slice(last)
  if (tail.trim() !== '') segments.push({ text: tail, tags: [] })

  // Pass 2: split each segment on <em> boundaries; tags go to the last piece
  const tokens = []
  for (const seg of segments) {
    const pieces = []
    let pos = 0
    for (const em of seg.text.matchAll(EM_RE)) {
      const before = seg.text.slice(pos, em.index)
      if (before.trim() !== '') pieces.push({ t: before })
      if (em[1].trim() !== '') pieces.push({ t: em[1], italic: true })
      pos = em.index + em[0].length
    }
    const after = seg.text.slice(pos)
    if (after.trim() !== '') pieces.push({ t: after })

    if (pieces.length === 0) {
      if (seg.tags.length > 0) {
        // Tags with no visible text (rare) — attach to previous token
        const prev = tokens[tokens.length - 1]
        if (prev) prev.s = [...(prev.s || []), ...seg.tags]
      }
      continue
    }

    pieces.forEach((piece, idx) => {
      const token = { t: normalizeSpace(piece.t) }
      if (token.t === '') return
      if (piece.italic) token.i = 1
      if (idx === pieces.length - 1 && seg.tags.length > 0) token.s = seg.tags
      // Merge punctuation-only fragments into the previous token
      if (!token.s && !token.i && PUNCT_ONLY_RE.test(token.t)) {
        const prev = tokens[tokens.length - 1]
        if (prev) {
          prev.t += token.t
          return
        }
      }
      tokens.push(token)
    })
  }

  return tokens
}

function normalizeSpace(s) {
  return s.replace(/\s+/g, ' ').trim()
}

/** Plain text reconstruction used for round-trip verification. */
function joinTokens(tokens) {
  let out = ''
  for (const tok of tokens) {
    if (out === '') {
      out = tok.t
    } else if (LEADING_PUNCT_RE.test(tok.t)) {
      out += tok.t
    } else {
      out += ' ' + tok.t
    }
  }
  return out
}

/** Normalize text for comparison: strip markup, collapse whitespace and space-before-punctuation. */
function normalizeForCompare(s) {
  return decodeEntities(s)
    .replace(/<\/?(em|i)>/g, ' ')
    .replace(/¶/g, ' ')
    .replace(TAG_RE, ' ')
    .replace(/\s+([.,;:!?')\]])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Case/typography-insensitive comparison key. Folds the reference text's
 * small-caps divine name (Gᴏᴅ, Lᴏʀᴅ) to ASCII and the enquire/inquire
 * spelling variation. Length-preserving so it can be used for slicing.
 */
function compareKey(s) {
  return s
    .replace(/[ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ]/g, (ch) => {
      const map = { ᴀ: 'a', ʙ: 'b', ᴄ: 'c', ᴅ: 'd', ᴇ: 'e', ꜰ: 'f', ɢ: 'g', ʜ: 'h', ɪ: 'i', ᴊ: 'j', ᴋ: 'k', ʟ: 'l', ᴍ: 'm', ɴ: 'n', ᴏ: 'o', ᴘ: 'p', ǫ: 'q', ʀ: 'r', ꜱ: 's', ᴛ: 't', ᴜ: 'u', ᴠ: 'v', ᴡ: 'w', x: 'x', ʏ: 'y', ᴢ: 'z' }
      return map[ch] || ch
    })
    .toLowerCase()
    .replace(/\binquir/g, 'enquir')
}

/**
 * The kaiserlik source truncates trailing untagged text on many verses
 * (e.g. Gen 1:9 ends at "appear:" and drops "and it was so."). When the
 * reference KJV text starts with the tagged text, append the missing
 * suffix as an untagged token. Returns true if tokens now match reference.
 */
function repairTruncation(tokens, refText) {
  const tagged = normalizeForCompare(joinTokens(tokens))
  const ref = normalizeForCompare(refText)
  if (compareKey(tagged) === compareKey(ref)) return true
  if (
    tagged.length > 0 &&
    compareKey(ref).startsWith(compareKey(tagged)) &&
    (ref[tagged.length] === ' ' || /[.,;:!?')\]]/.test(ref[tagged.length] || ''))
  ) {
    const suffix = ref.slice(tagged.length).trim()
    if (suffix !== '') {
      if (LEADING_PUNCT_RE.test(suffix)) {
        // e.g. ref ends with extra punctuation — merge into last token
        const punctEnd = suffix.match(/^[.,;:!?')\]]+/)[0]
        tokens[tokens.length - 1].t += punctEnd
        const rest = suffix.slice(punctEnd.length).trim()
        if (rest !== '') tokens.push({ t: rest })
      } else {
        tokens.push({ t: suffix })
      }
    }
    return compareKey(normalizeForCompare(joinTokens(tokens))) === compareKey(ref)
  }
  return false
}

/**
 * Extract verse references and English text from a kaiserlik book file.
 *
 * Several source files are not valid JSON (raw unescaped quotes inside the
 * Bulgarian translations, and Phm.json contains two concatenated objects), so
 * instead of JSON.parse we regex-extract just the `"Abr|ch|v": {"en": "..."` pairs
 * — the English strings themselves are well-formed JSON string literals.
 *
 * Returns Map<"chapter|verse", englishText> for the FIRST book in the file.
 */
const VERSE_EN_RE = /"([^"|]+)\|(\d+)\|(\d+)":\s*\{\s*"en":\s*"((?:[^"\\]|\\.)*)"/g

function extractBookVerses(filePath) {
  const src = fs.readFileSync(filePath, 'utf-8')
  const verses = new Map()
  let firstAbbrev = null
  for (const m of src.matchAll(VERSE_EN_RE)) {
    const [, abbrev, chapter, verse, rawEn] = m
    if (firstAbbrev === null) firstAbbrev = abbrev
    if (abbrev !== firstAbbrev) break // Phm.json also contains Philippians — stop at book boundary
    verses.set(`${chapter}|${verse}`, JSON.parse(`"${rawEn}"`))
  }
  return verses
}

function buildTaggedChapters() {
  console.log('\n📖 Building tagged KJV chapters...')
  let chapterCount = 0
  let verseCount = 0
  let roundTripFailures = 0
  let plainMismatches = 0
  let plainCompared = 0
  const usedStrongs = new Set()

  for (const [abbrev, bookName] of BOOKS) {
    const sourcePath = path.join(KJV_STRONGS_DIR, `${abbrev}.json`)
    const verseMap = extractBookVerses(sourcePath)
    const bookOutDir = path.join(TAGGED_OUT_DIR, bookName)
    fs.mkdirSync(bookOutDir, { recursive: true })

    // Group by chapter
    const chapters = new Map()
    for (const [key, en] of verseMap) {
      const [chapter, verse] = key.split('|').map(Number)
      if (!chapters.has(chapter)) chapters.set(chapter, [])
      chapters.get(chapter).push([verse, en])
    }

    const chapterNums = [...chapters.keys()].sort((a, b) => a - b)
    for (const chapterNum of chapterNums) {
      const verseEntries = chapters.get(chapterNum).sort((a, b) => a[0] - b[0])

      // Reference KJV text for this chapter (for truncation repair)
      const refVerses = new Map()
      for (const dir of REFERENCE_KJV_DIRS) {
        const refPath = path.join(dir, bookName, `${chapterNum}.json`)
        if (fs.existsSync(refPath)) {
          const ref = JSON.parse(fs.readFileSync(refPath, 'utf-8'))
          for (const v of ref.verses || []) refVerses.set(v.verse, v.text)
          break
        }
      }

      const verses = []
      for (const [verseNum, en] of verseEntries) {
        const tokens = tokenizeVerse(en)
        for (const tok of tokens) for (const s of tok.s || []) usedStrongs.add(s)

        // Round-trip check: token join must reproduce the source text (normalized)
        if (normalizeForCompare(joinTokens(tokens)) !== normalizeForCompare(en)) {
          roundTripFailures++
          if (roundTripFailures <= 5) {
            console.error(`  ✗ round-trip mismatch ${bookName} ${chapterNum}:${verseNum}`)
            console.error(`    src: ${normalizeForCompare(en)}`)
            console.error(`    out: ${normalizeForCompare(joinTokens(tokens))}`)
          }
        }
        // Repair source truncation against the reference KJV text
        const refText = refVerses.get(verseNum)
        if (refText !== undefined) {
          plainCompared++
          if (!repairTruncation(tokens, refText)) {
            plainMismatches++
            if (plainMismatches <= 5) {
              console.warn(`  ⚠ unrepairable diff ${bookName} ${chapterNum}:${verseNum}`)
              console.warn(`    tagged: ${normalizeForCompare(joinTokens(tokens)).slice(0, 120)}`)
              console.warn(`    ref   : ${normalizeForCompare(refText).slice(0, 120)}`)
            }
          }
        }

        verses.push({ verse: verseNum, tokens })
        verseCount++
      }

      fs.writeFileSync(
        path.join(bookOutDir, `${chapterNum}.json`),
        JSON.stringify({ book_name: bookName, chapter: chapterNum, verses })
      )
      chapterCount++
    }
  }

  console.log(`  ✓ ${chapterCount} chapters, ${verseCount} verses written to public/bible-tagged-kjv/`)
  console.log(`  ✓ ${usedStrongs.size} distinct Strong's numbers referenced`)
  if (roundTripFailures > 0) {
    console.error(`  ✗ ${roundTripFailures} round-trip failures — ABORTING`)
    process.exit(1)
  }
  console.log(
    `  ℹ reference comparison: ${plainMismatches}/${plainCompared} verses still differ from reference KJV after truncation repair`
  )
  return usedStrongs
}

function parseDictionaryJs(file) {
  const src = fs.readFileSync(path.join(SOURCES_DIR, file), 'utf-8')
  const match = src.match(/=\s*(\{[\s\S]*\})\s*;?\s*(module|$)/)
  if (!match) throw new Error(`Could not parse dictionary object from ${file}`)
  return JSON.parse(match[1])
}

/** Dedupe kaiserlik "love(86x), charity(28x), love(86x), ..." usage strings. */
function dedupeUsage(occurrences) {
  if (!occurrences) return undefined
  const seen = new Set()
  const parts = []
  for (const part of occurrences.split(/,\s*/)) {
    const key = part.trim()
    // keep only well-formed "word(12x)" fragments
    if (key && /^.+\(\d+x\)$/.test(key) && !seen.has(key)) {
      seen.add(key)
      parts.push(key)
    }
  }
  return parts.join(', ') || undefined
}

function buildDictionaryShards(usedStrongs) {
  console.log("\n📚 Building Strong's dictionary shards...")
  const greek = parseDictionaryJs('strongs-greek-dictionary.js')
  const hebrew = parseDictionaryJs('strongs-hebrew-dictionary.js')
  const kaiserlik = JSON.parse(
    fs.readFileSync(path.join(SOURCES_DIR, 'lexicon.json'), 'utf-8')
  )

  const shards = new Map() // shard filename -> { id: entry }
  let entryCount = 0

  for (const [dict, prefix] of [
    [hebrew, 'H'],
    [greek, 'G'],
  ]) {
    for (const [id, raw] of Object.entries(dict)) {
      const num = Number(id.slice(1))
      if (!Number.isFinite(num)) continue
      const extra = kaiserlik[id] || {}
      const entry = {
        id,
        lemma: raw.lemma || '',
        translit: raw.translit || raw.xlit || '',
      }
      if (raw.pron) entry.pron = raw.pron
      if (raw.derivation) entry.derivation = decodeEntities(raw.derivation.trim())
      if (raw.strongs_def) entry.strongs_def = decodeEntities(raw.strongs_def.trim())
      if (raw.kjv_def) entry.kjv_def = decodeEntities(raw.kjv_def.trim())
      if (extra.part_of_speech) entry.pos = extra.part_of_speech
      const usage = dedupeUsage(extra.occurrences)
      if (usage) entry.usage = decodeEntities(usage)

      const shardFile = `strongs-${prefix}${Math.floor(num / 100)}.json`
      if (!shards.has(shardFile)) shards.set(shardFile, {})
      shards.get(shardFile)[id] = entry
      entryCount++
    }
  }

  fs.mkdirSync(LEXICON_OUT_DIR, { recursive: true })
  for (const [file, entries] of shards) {
    fs.writeFileSync(path.join(LEXICON_OUT_DIR, file), JSON.stringify(entries))
  }
  console.log(`  ✓ ${entryCount} entries in ${shards.size} shards written to public/lexicon/`)

  // Verify every Strong's ID used by the tagged text exists in the dictionary
  const all = new Set([...Object.keys(hebrew), ...Object.keys(greek)])
  const orphans = [...usedStrongs].filter((s) => !all.has(s))
  if (orphans.length > 0) {
    console.warn(`  ⚠ ${orphans.length} Strong's IDs referenced in text but missing from dictionary:`)
    console.warn(`    ${orphans.slice(0, 20).join(', ')}${orphans.length > 20 ? ' …' : ''}`)
  } else {
    console.log("  ✓ all referenced Strong's IDs found in dictionary")
  }
}

async function main() {
  console.log('🏗 Building lexicon data...')
  await ensureSources()
  const usedStrongs = buildTaggedChapters()
  buildDictionaryShards(usedStrongs)
  console.log('\n✅ Done')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
