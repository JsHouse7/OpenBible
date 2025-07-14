const fs = require('fs');
const path = require('path');

function parsePilgrimsProgress() {
  const inputPath = path.join(__dirname, '..', 'public', 'literature', 'pilgrims_progress.txt');
  const outputPath = path.join(__dirname, '..', 'public', 'literature', 'pilgrims_progress.json');

  const text = fs.readFileSync(inputPath, 'utf-8');
  const lines = text.split('\n');

  const work = {
    title: "The Pilgrim's Progress",
    chapters: []
  };

  let currentChapter = null;
  let chapterContent = [];
  let inApology = true;
  let sectionNumber = 1;

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('*** START OF THE PROJECT GUTENBERG EBOOK')) continue;
    if (line.startsWith('Notes:')) continue;
    if (line === '') continue;

    if (inApology && line.includes('THE PILGRIM\'S PROGRESS')) {
      inApology = false;
      if (currentChapter) {
        work.chapters.push({ title: currentChapter, content: chapterContent.join('\n') });
      }
      currentChapter = 'Author\'s Apology';
      chapterContent = [];
      continue;
    }

    if (line.match(/\{\d+\}/)) {
      if (currentChapter) {
        work.chapters.push({ title: currentChapter, content: chapterContent.join('\n') });
      }
      currentChapter = `Section ${sectionNumber}`;
      sectionNumber++;
      chapterContent = [line];
      continue;
    }

    if (currentChapter) {
      chapterContent.push(line);
    }
  }

  if (currentChapter) {
    work.chapters.push({ title: currentChapter, content: chapterContent.join('\n') });
  }

  fs.writeFileSync(outputPath, JSON.stringify(work, null, 2));
  console.log('Parsing complete. JSON file created.');
}

parsePilgrimsProgress();