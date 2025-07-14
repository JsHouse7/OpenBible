const fs = require('fs');
const path = require('path');

function parseInstitutes() {
  const vol1Path = path.join(__dirname, '..', 'public', 'literature', 'institutes_vol1.txt');
  const vol2Path = path.join(__dirname, '..', 'public', 'literature', 'institutes_vol2.txt');
  const outputPath = path.join(__dirname, '..', 'public', 'literature', 'institutes.json');

  const textVol1 = fs.readFileSync(vol1Path, 'utf-8');
  const textVol2 = fs.readFileSync(vol2Path, 'utf-8');
  const fullText = textVol1 + '\n' + textVol2;
  const lines = fullText.split('\n');

  const work = {
    title: "Institutes of the Christian Religion",
    books: []
  };

  let currentBook = null;
  let currentChapter = null;
  let chapterContent = [];
  let inContent = false;

  for (let line of lines) {
    line = line.trim();
    if (line === '') continue;

    if (line.startsWith('BOOK ') || line.startsWith('Book ')) {
      if (currentBook) {
        if (currentChapter) {
          currentBook.chapters.push({ title: currentChapter, content: chapterContent.join('\n') });
        }
        work.books.push(currentBook);
      }
      currentBook = { title: line, chapters: [] };
      currentChapter = null;
      chapterContent = [];
      continue;
    }

    if (line.startsWith('CHAPTER ') || line.startsWith('Chapter ')) {
      if (currentChapter) {
        currentBook.chapters.push({ title: currentChapter, content: chapterContent.join('\n') });
      }
      currentChapter = line;
      chapterContent = [];
      inContent = true;
      continue;
    }

    if (inContent && currentChapter) {
      chapterContent.push(line);
    }
  }

  if (currentBook && currentChapter) {
    currentBook.chapters.push({ title: currentChapter, content: chapterContent.join('\n') });
    work.books.push(currentBook);
  }

  fs.writeFileSync(outputPath, JSON.stringify(work, null, 2));
  console.log('Parsing complete. JSON file created.');
}

parseInstitutes();