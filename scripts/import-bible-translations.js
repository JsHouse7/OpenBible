const fs = require('fs');
const path = require('path');
const https = require('https');

// Available translations from the repository
const TRANSLATIONS = [
  'AKJV', 'ASV', 'BRG', 'EHV', 'ESV', 'ESVUK', 'GNV', 'GW', 'ISV', 'JUB', 'KJ21', 'KJV', 
  'LEB', 'MEV', 'NASB', 'NASB1995', 'NET', 'NIV', 'NIVUK', 'NKJV', 'NLT', 'NLV', 'NOG', 
  'NRSV', 'NRSVUE', 'WEB', 'YLT'
];

// Additional book name mappings for special cases
const BOOK_MAPPING = {
  'Psalms': 'Psalm'
};

// All Bible books in order
const BIBLE_BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
  '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
  'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
  'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah',
  'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians',
  '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians',
  '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
  '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
];

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error(`Invalid JSON: ${error.message}`));
        }
      });
    }).on('error', reject);
  });
}

function convertToOurFormat(githubData, bookName) {
  const result = {
    book_name: bookName,
    chapter: 1,
    verses: []
  };
  
  // The GitHub format has book -> chapter -> verse structure
  const bookData = githubData[bookName];
  if (!bookData) {
    throw new Error(`Book ${bookName} not found in data`);
  }
  
  // Get the first (and usually only) chapter
  const chapterNum = Object.keys(bookData)[0];
  const chapterData = bookData[chapterNum];
  
  result.chapter = parseInt(chapterNum);
  
  // Convert verses
  Object.entries(chapterData).forEach(([verseNum, verseText]) => {
    result.verses.push({
      book_name: bookName,
      chapter: parseInt(chapterNum),
      verse: parseInt(verseNum),
      text: verseText,
      header: '',
      footer: ''
    });
  });
  
  return result;
}

function getGithubBookName(bookName) {
  return BOOK_MAPPING[bookName] || bookName;
}

async function downloadTranslation(translation) {
  console.log(`Downloading ${translation} translation...`);
  
  const translationDir = path.join(__dirname, '..', 'public', `bible-json-${translation.toLowerCase()}`);
  
  // Create translation directory
  if (!fs.existsSync(translationDir)) {
    fs.mkdirSync(translationDir, { recursive: true });
  }
  
  for (const bookName of BIBLE_BOOKS) {
    const githubBookName = getGithubBookName(bookName);
    const url = `https://raw.githubusercontent.com/jadenzaleski/BibleTranslations/master/${translation}/${translation}_books/${encodeURIComponent(githubBookName)}.json`;
    
    try {
      console.log(`  Downloading ${bookName}...`);
      const githubData = await downloadFile(url);
      
      // Create book directory
      const bookDir = path.join(translationDir, bookName);
      if (!fs.existsSync(bookDir)) {
        fs.mkdirSync(bookDir, { recursive: true });
      }
      
      // Convert and save each chapter
      const bookData = githubData[githubBookName] || githubData[bookName];
      if (!bookData) {
        console.warn(`    Warning: No data found for ${bookName} in ${translation}`);
        continue;
      }
      
      Object.entries(bookData).forEach(([chapterNum, chapterData]) => {
        const convertedData = {
          book_name: bookName,
          chapter: parseInt(chapterNum),
          verses: []
        };
        
        Object.entries(chapterData).forEach(([verseNum, verseText]) => {
          convertedData.verses.push({
            book_name: bookName,
            chapter: parseInt(chapterNum),
            verse: parseInt(verseNum),
            text: verseText,
            header: '',
            footer: ''
          });
        });
        
        const chapterFile = path.join(bookDir, `${chapterNum}.json`);
        fs.writeFileSync(chapterFile, JSON.stringify(convertedData, null, 2));
      });
      
      console.log(`    ✓ ${bookName} completed`);
      
    } catch (error) {
      console.error(`    ✗ Failed to download ${bookName}: ${error.message}`);
    }
    
    // Add small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`✓ ${translation} translation completed\n`);
}

async function main() {
  console.log('Starting Bible translations import...\n');
  
  // Download popular translations first
  const priorityTranslations = ['KJV', 'ESV', 'NIV', 'WEB', 'NASB', 'NKJV', 'NLT', 'ASV'];
  
  for (const translation of priorityTranslations) {
    await downloadTranslation(translation);
  }
  
  console.log('Priority translations completed!');
  console.log('\nTo download additional translations, run:');
  console.log('node scripts/import-bible-translations.js [TRANSLATION_CODE]');
  console.log('\nAvailable translations:', TRANSLATIONS.join(', '));
}

// Allow running specific translation from command line
if (process.argv[2]) {
  const translation = process.argv[2].toUpperCase();
  if (TRANSLATIONS.includes(translation)) {
    downloadTranslation(translation).then(() => {
      console.log(`${translation} download completed!`);
    }).catch(console.error);
  } else {
    console.error(`Unknown translation: ${translation}`);
    console.log('Available translations:', TRANSLATIONS.join(', '));
  }
} else {
  main().catch(console.error);
}