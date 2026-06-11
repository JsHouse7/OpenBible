#!/usr/bin/env node

/**
 * Strong's Occurrence Import Script
 *
 * Populates the Supabase `strongs_occurrences` table (concordance index)
 * from the tagged chapter files in public/bible-tagged-kjv (built by
 * scripts/build-lexicon-data.mjs).
 *
 * Requires database/migrations/003_lexicon_concordance.sql to be applied.
 *
 * Usage: node scripts/import-strongs-occurrences.mjs
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const TAGGED_DIR = path.join(ROOT, 'public', 'bible-tagged-kjv')

const envPath = path.join(ROOT, '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const eq = line.indexOf('=')
    if (eq > 0) process.env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim()
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Canonical book order — must match scripts/build-lexicon-data.mjs BOOKS
const BOOK_ORDER = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
  '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
  'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
  'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah',
  'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians',
  '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians',
  '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
  '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation',
]

const LEADING_PUNCT_RE = /^[.,;:!?')\]]/
const TRIM_PUNCT_RE = /^[\s.,;:!?'"()\[\]]+|[\s.,;:!?'"()\[\]]+$/g

function joinTokens(tokens) {
  let out = ''
  for (const tok of tokens) {
    if (out === '') out = tok.t
    else if (LEADING_PUNCT_RE.test(tok.t)) out += tok.t
    else out += ' ' + tok.t
  }
  return out
}

async function main() {
  console.log('🏗 Importing Strong\'s occurrences into Supabase...')

  // Build all rows from the tagged chapter files
  const rows = []
  for (let bookIndex = 0; bookIndex < BOOK_ORDER.length; bookIndex++) {
    const book = BOOK_ORDER[bookIndex]
    const bookDir = path.join(TAGGED_DIR, book)
    if (!fs.existsSync(bookDir)) {
      console.warn(`  ⚠ missing tagged data for ${book}`)
      continue
    }
    for (const file of fs.readdirSync(bookDir)) {
      const { chapter, verses } = JSON.parse(fs.readFileSync(path.join(bookDir, file), 'utf-8'))
      for (const { verse, tokens } of verses) {
        const text = joinTokens(tokens)
        tokens.forEach((token, position) => {
          if (!token.s) return
          const surface = token.t.replace(TRIM_PUNCT_RE, '')
          for (const strongsId of token.s) {
            rows.push({
              strongs_id: strongsId,
              book,
              book_order: bookIndex + 1,
              chapter,
              verse,
              surface,
              position,
              text,
            })
          }
        })
      }
    }
  }
  console.log(`  ✓ ${rows.length} occurrence rows prepared`)

  // Clear existing data (idempotent re-import)
  console.log('  🧹 clearing existing rows...')
  const { error: deleteError } = await supabase
    .from('strongs_occurrences')
    .delete()
    .gte('id', 0)
  if (deleteError) {
    console.error('❌ Failed to clear table:', deleteError.message)
    process.exit(1)
  }

  // Batch insert
  const BATCH = 2000
  let inserted = 0
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const { error } = await supabase.from('strongs_occurrences').insert(batch)
    if (error) {
      console.error(`❌ Insert failed at row ${i}:`, error.message)
      process.exit(1)
    }
    inserted += batch.length
    if (inserted % 50000 < BATCH) {
      console.log(`  … ${inserted}/${rows.length}`)
    }
  }

  console.log(`✅ Imported ${inserted} occurrences`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
