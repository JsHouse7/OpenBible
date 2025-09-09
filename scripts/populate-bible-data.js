const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local file
function loadEnvVars() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    }
  }
}

loadEnvVars();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function populateBibleData() {
  console.log('Starting Bible data population...');
  
  const bibleJsonDir = path.join(__dirname, '..', 'public', 'bible-json');
  
  if (!fs.existsSync(bibleJsonDir)) {
    console.error('Bible JSON directory not found:', bibleJsonDir);
    return;
  }
  
  const books = fs.readdirSync(bibleJsonDir);
  let totalVerses = 0;
  
  for (const bookDir of books) {
    const bookPath = path.join(bibleJsonDir, bookDir);
    
    if (!fs.statSync(bookPath).isDirectory()) continue;
    
    console.log(`Processing book: ${bookDir}`);
    
    const chapters = fs.readdirSync(bookPath);
    
    for (const chapterFile of chapters) {
      if (!chapterFile.endsWith('.json')) continue;
      
      const chapterPath = path.join(bookPath, chapterFile);
      const chapterData = JSON.parse(fs.readFileSync(chapterPath, 'utf8'));
      
      const verses = [];
      
      for (const verse of chapterData.verses) {
        verses.push({
          book: chapterData.book_name || verse.book_name,
          chapter: chapterData.chapter,
          verse: verse.verse,
          text: verse.text,
          translation: 'KJV' // Default translation
        });
      }
      
      if (verses.length > 0) {
        console.log(`Inserting ${verses.length} verses from ${bookDir} chapter ${chapterData.chapter}`);
        
        const { error } = await supabase
          .from('bible_verses')
          .insert(verses);
        
        if (error) {
          console.error(`Error inserting verses for ${bookDir} ${chapterData.chapter}:`, error);
        } else {
          totalVerses += verses.length;
        }
      }
    }
  }
  
  console.log(`\nCompleted! Inserted ${totalVerses} verses total.`);
}

populateBibleData().catch(console.error);