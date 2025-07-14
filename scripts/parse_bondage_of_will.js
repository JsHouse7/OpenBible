const fs = require('fs');
const path = require('path');

function parseBondageOfWill() {
  const inputPath = path.join(__dirname, '..', 'public', 'literature', 'bondage_of_the_will.txt');
  const outputPath = path.join(__dirname, '..', 'public', 'literature', 'bondage_of_the_will.json');

  const text = fs.readFileSync(inputPath, 'utf-8');
  const lines = text.split('\n');

  const work = {
    title: "The Bondage of the Will",
    author: "Martin Luther",
    year: 1525,
    chapters: []
  };

  let currentChapter = null;
  let chapterContent = [];
  let inContent = false;
  let skipHeader = true;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Skip the initial formatting and header content until we reach the actual text
    if (skipHeader) {
      if (line.includes('PREFACE') || line.includes('TO THE VENERABLE MISTER')) {
        skipHeader = false;
        if (line.includes('PREFACE')) {
          currentChapter = 'Preface';
          chapterContent = [];
          inContent = true;
          continue;
        }
      }
      continue;
    }

    // Skip empty lines
    if (line === '') {
      if (inContent) {
        chapterContent.push('');
      }
      continue;
    }

    // Detect chapter/section breaks
    if (line.match(/^[A-Z\s]{10,}$/) && line.length > 10) {
      // Save previous chapter
      if (currentChapter && chapterContent.length > 0) {
        work.chapters.push({
          title: currentChapter,
          content: chapterContent.join('\n').trim()
        });
      }
      
      // Start new chapter
      currentChapter = line;
      chapterContent = [];
      inContent = true;
      continue;
    }

    // Detect section headers (shorter all-caps lines)
    if (line.match(/^[A-Z\s]{5,20}$/) && line.length < 50 && !line.includes('MARTIN LUTHER')) {
      if (currentChapter && chapterContent.length > 0) {
        work.chapters.push({
          title: currentChapter,
          content: chapterContent.join('\n').trim()
        });
      }
      
      currentChapter = line;
      chapterContent = [];
      inContent = true;
      continue;
    }

    // Add content to current chapter
    if (inContent && currentChapter) {
      // Skip obvious formatting artifacts
      if (line.match(/^[\^\*\-\.\s%\\><"']+$/)) {
        continue;
      }
      
      // Skip page numbers and headers
      if (line.match(/^\d+$/) || line.match(/^[ivxlc]+$/i)) {
        continue;
      }
      
      chapterContent.push(line);
    }
  }

  // Add the last chapter
  if (currentChapter && chapterContent.length > 0) {
    work.chapters.push({
      title: currentChapter,
      content: chapterContent.join('\n').trim()
    });
  }

  // Clean up chapters - remove very short ones that are likely formatting artifacts
  work.chapters = work.chapters.filter(chapter => 
    chapter.content.length > 100 && 
    !chapter.title.match(/^[\^\*\-\.\s%\\><"']+$/)
  );

  fs.writeFileSync(outputPath, JSON.stringify(work, null, 2));
  console.log(`Parsing complete. Created ${work.chapters.length} chapters.`);
  console.log('Chapters:', work.chapters.map(c => c.title));
}

parseBondageOfWill();