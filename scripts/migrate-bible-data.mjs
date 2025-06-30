#!/usr/bin/env node

/**
 * Bible Data Migration Script
 * Migrates Bible data from JSON files to Supabase database
 * 
 * Usage: node scripts/migrate-bible-data.js
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration!')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Path to Bible JSON files
const bibleDataPath = path.join(__dirname, '..', 'public', 'bible-json')

async function getAllBibleBooks() {
  try {
    const books = fs.readdirSync(bibleDataPath, { withFileTypes: true })
    return books.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name)
  } catch (error) {
    console.error('❌ Error reading bible data directory:', error)
    return []
  }
}

async function getChaptersForBook(bookName) {
  try {
    const bookPath = path.join(bibleDataPath, bookName)
    const chapters = fs.readdirSync(bookPath)
    return chapters
      .filter(file => file.endsWith('.json'))
      .map(file => parseInt(file.replace('.json', '')))
      .sort((a, b) => a - b)
  } catch (error) {
    console.error(`❌ Error reading chapters for ${bookName}:`, error)
    return []
  }
}

async function loadChapterData(bookName, chapterNumber) {
  try {
    const chapterPath = path.join(bibleDataPath, bookName, `${chapterNumber}.json`)
    const data = fs.readFileSync(chapterPath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error(`❌ Error loading ${bookName} chapter ${chapterNumber}:`, error)
    return null
  }
}

async function insertBibleVerses(verses, translation = 'KJV') {
  try {
    const { data, error } = await supabase
      .from('bible_verses')
      .upsert(verses, {
        onConflict: 'book,chapter,verse,translation'
      })

    if (error) {
      console.error('❌ Error inserting verses:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('❌ Database error:', error)
    return false
  }
}

async function migrateBibleData() {
  console.log('🚀 Starting Bible data migration...')
  console.log(`📖 Reading from: ${bibleDataPath}`)
  
  let totalVerses = 0
  let totalBooks = 0
  let totalChapters = 0

  try {
    // Get all Bible books
    const books = await getAllBibleBooks()
    console.log(`📚 Found ${books.length} books to migrate`)

    for (const bookName of books) {
      console.log(`\n📖 Processing ${bookName}...`)
      totalBooks++

      // Get all chapters for this book
      const chapters = await getChaptersForBook(bookName)
      console.log(`   📄 Found ${chapters.length} chapters`)

      for (const chapterNumber of chapters) {
        console.log(`   📃 Processing chapter ${chapterNumber}...`)
        totalChapters++

        // Load chapter data
        const chapterData = await loadChapterData(bookName, chapterNumber)
        
        if (!chapterData || !chapterData.verses) {
          console.log(`   ⚠️  No verses found in chapter ${chapterNumber}`)
          continue
        }

        // Transform verses for database insertion
        const verses = chapterData.verses.map(verse => ({
          book: bookName,
          chapter: chapterNumber,
          verse: verse.verse || verse.number,
          text: verse.text,
          translation: 'KJV' // Default translation
        }))

        // Insert verses in batches
        const batchSize = 100
        for (let i = 0; i < verses.length; i += batchSize) {
          const batch = verses.slice(i, i + batchSize)
          const success = await insertBibleVerses(batch)
          
          if (success) {
            totalVerses += batch.length
            console.log(`   ✅ Inserted ${batch.length} verses (${totalVerses} total)`)
          } else {
            console.log(`   ❌ Failed to insert batch starting at verse ${batch[0].verse}`)
          }
        }
      }
    }

    console.log('\n🎉 Migration completed successfully!')
    console.log(`📊 Summary:`)
    console.log(`   📚 Books migrated: ${totalBooks}`)
    console.log(`   📄 Chapters migrated: ${totalChapters}`)
    console.log(`   📝 Verses migrated: ${totalVerses}`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

async function testConnection() {
  console.log('🔌 Testing database connection...')
  
  try {
    const { count, error } = await supabase
      .from('bible_verses')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('❌ Database connection failed:', error)
      return false
    }

    console.log('✅ Database connection successful!')
    console.log(`📊 Current verses in database: ${count || 0}`)
    return true
  } catch (error) {
    console.error('❌ Connection test failed:', error)
    return false
  }
}

async function main() {
  console.log('📖 OpenBible Data Migration Tool')
  console.log('================================\n')

  // Test database connection
  const connected = await testConnection()
  if (!connected) {
    console.error('\n❌ Cannot proceed without database connection')
    console.error('Please check your Supabase configuration and try again.')
    process.exit(1)
  }

  // Confirm migration
  console.log('\n⚠️  This will migrate all Bible data from JSON files to your Supabase database.')
  console.log('⚠️  Existing verses will be updated if they already exist.')
  
  // In a real script, you might want to add user confirmation here
  // For now, we'll proceed automatically
  
  await migrateBibleData()
}

// Run the migration
main().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
}) 