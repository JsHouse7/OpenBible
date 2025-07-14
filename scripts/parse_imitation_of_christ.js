const fs = require('fs');
const path = require('path');

function parseImitationOfChrist() {
  const inputPath = path.join(__dirname, '..', 'public', 'literature', 'imitation_of_christ.txt');
  const outputPath = path.join(__dirname, '..', 'public', 'literature', 'imitation_of_christ.json');

  const text = fs.readFileSync(inputPath, 'utf-8');
  const lines = text.split('\n');

  const work = {
    title: "The Imitation of Christ",
    books: []
  };

  let currentBook = null;
  let currentChapter = null;
  let chapterContent = [];
  let inContent = false;

  for (let line of lines) {
    line = line.trim();
    if (line === '') continue;

    if (line.startsWith('THE FIRST BOOK') || line.startsWith('THE SECOND BOOK') || line.startsWith('THE THIRD BOOK') || line.startsWith('THE FOURTH BOOK')) {
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

    if (line.startsWith('CHAPTER ')) {
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

parseImitationOfChrist();