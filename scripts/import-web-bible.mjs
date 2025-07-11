#!/usr/bin/env node

/**
 * World English Bible (WEB) Import Script
 * Downloads and imports the World English Bible (WEB) translation
 * from GitHub and formats it for the OpenBible app
 * 
 * Usage: node scripts/import-web-bible.mjs
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import https from 'https'

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

// GitHub repository for WEB Bible JSON
const WEB_REPO_BASE_URL = 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/'
const WEB_FILENAME = 'en_web.json' // World English Bible

// Path to save downloaded Bible JSON
const downloadPath = path.join(__dirname, '..', 'temp')
const webBiblePath = path.join(downloadPath, WEB_FILENAME)

// Path to save formatted Bible JSON files
const outputPath = path.join(__dirname, '..', 'public', 'bible-json-web')

// Ensure directories exist
if (!fs.existsSync(downloadPath)) {
  fs.mkdirSync(downloadPath, { recursive: true })
}

if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true })
}

/**
 * Download a file from a URL
 */
async function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Downloading ${url}...`)
    
    const file = fs.createWriteStream(outputPath)
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}`))
        return
      }
      
      response.pipe(file)
      
      file.on('finish', () => {
        file.close()
        console.log(`✅ Downloaded to ${outputPath}`)
        resolve(outputPath)
      })
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {})
      reject(err)
    })
  })
}

/**
 * Process the downloaded Bible JSON and convert to our format
 */
async function processBibleData(filePath) {
  try {
    console.log('📖 Processing Bible data...')
    
    const data = fs.readFileSync(filePath, 'utf8')
    const bibleData = JSON.parse(data)
    
    console.log(`📚 Found ${bibleData.length} books`)
    
    // Process each book
    for (const book of bibleData) {
      const bookName = book.name
      const bookPath = path.join(outputPath, bookName)
      
      // Create directory for book
      if (!fs.existsSync(bookPath)) {
        fs.mkdirSync(bookPath, { recursive: true })
      }
      
      console.log(`📖 Processing ${bookName}...`)
      
      // Process each chapter
      for (let chapterIndex = 0; chapterIndex < book.chapters.length; chapterIndex++) {
        const chapterNumber = chapterIndex + 1
        const verses = book.chapters[chapterIndex]
        
        // Create chapter data in our format
        const chapterData = {
          book_name: bookName,
          chapter: chapterNumber,
          verses: verses.map((text, verseIndex) => ({
            book_name: bookName,
            chapter: chapterNumber,
            verse: verseIndex + 1,
            text: text,
            header: "",
            footer: ""
          }))
        }
        
        // Save chapter data
        const chapterPath = path.join(bookPath, `${chapterNumber}.json`)
        fs.writeFileSync(chapterPath, JSON.stringify(chapterData, null, 2))
        
        console.log(`   ✅ Saved chapter ${chapterNumber} with ${verses.length} verses`)
      }
    }
    
    console.log('🎉 Bible data processing completed!')
    return true
  } catch (error) {
    console.error('❌ Error processing Bible data:', error)
    return false
  }
}

/**
 * Insert Bible verses into Supabase
 */
async function insertBibleVerses(verses, translation = 'WEB') {
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

/**
 * Migrate processed Bible data to Supabase
 */
async function migrateBibleData() {
  console.log('🚀 Starting Bible data migration to Supabase...')
  
  let totalVerses = 0
  let totalBooks = 0
  let totalChapters = 0

  try {
    // Get all Bible books
    const books = fs.readdirSync(outputPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
    
    console.log(`📚 Found ${books.length} books to migrate`)

    for (const bookName of books) {
      console.log(`\n📖 Processing ${bookName}...`)
      totalBooks++

      // Get all chapters for this book
      const bookPath = path.join(outputPath, bookName)
      const chapters = fs.readdirSync(bookPath)
        .filter(file => file.endsWith('.json'))
        .map(file => parseInt(file.replace('.json', '')))
        .sort((a, b) => a - b)
      
      console.log(`   📄 Found ${chapters.length} chapters`)

      for (const chapterNumber of chapters) {
        console.log(`   📃 Processing chapter ${chapterNumber}...`)
        totalChapters++

        // Load chapter data
        const chapterPath = path.join(bookPath, `${chapterNumber}.json`)
        const chapterData = JSON.parse(fs.readFileSync(chapterPath, 'utf8'))
        
        if (!chapterData || !chapterData.verses) {
          console.log(`   ⚠️  No verses found in chapter ${chapterNumber}`)
          continue
        }

        // Transform verses for database insertion
        const verses = chapterData.verses.map(verse => ({
          book: bookName,
          chapter: chapterNumber,
          verse: verse.verse,
          text: verse.text,
          translation: 'WEB' // World English Bible translation
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

/**
 * Test database connection
 */
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

/**
 * Main function
 */
async function main() {
  console.log('📖 World English Bible (WEB) Import Tool')
  console.log('======================================\n')

  // Test database connection
  const connected = await testConnection()
  if (!connected) {
    console.error('\n❌ Cannot proceed without database connection')
    console.error('Please check your Supabase configuration and try again.')
    process.exit(1)
  }

  try {
    // Download WEB Bible JSON
    await downloadFile(`${WEB_REPO_BASE_URL}${WEB_FILENAME}`, webBiblePath)
    
    // Process the downloaded data
    const processed = await processBibleData(webBiblePath)
    if (!processed) {
      console.error('\n❌ Failed to process Bible data')
      process.exit(1)
    }
    
    // Migrate to Supabase
    await migrateBibleData()
    
    // Clean up
    console.log('\n🧹 Cleaning up temporary files...')
    if (fs.existsSync(webBiblePath)) {
      fs.unlinkSync(webBiblePath)
      console.log(`✅ Removed ${webBiblePath}`)
    }
    
    console.log('\n✨ All done! The World English Bible (WEB) has been imported.')
    console.log('You can now select it in the Bible version selector.')
    
  } catch (error) {
    console.error('\n❌ Import failed:', error)
    process.exit(1)
  }
}

// Run the import
main().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})