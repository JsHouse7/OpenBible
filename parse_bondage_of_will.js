const fs = require('fs');
const path = require('path');

// Read the text file
const filePath = path.join(__dirname, 'public', 'literature', 'bondage_of_the_will.txt');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');

// Find the start of the main work (after preface)
let startIndex = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === 'PART I.' || lines[i].includes('PART  I.')) {
        startIndex = i;
        break;
    }
}

if (startIndex === -1) {
    console.log('Could not find start of main work');
    process.exit(1);
}

// Find the end of the main work (before Project Gutenberg footer)
let endIndex = lines.length;
for (let i = startIndex; i < lines.length; i++) {
    if (lines[i].includes('*** END OF THE PROJECT GUTENBERG') || 
        lines[i].includes('End of the Project Gutenberg') ||
        lines[i].includes('Project Gutenberg') && lines[i].includes('END')) {
        endIndex = i;
        break;
    }
}

const workLines = lines.slice(startIndex, endIndex);

const chapters = [];
let currentChapter = null;
let currentContent = [];
let partTitle = '';
let sectionTitle = '';

for (let i = 0; i < workLines.length; i++) {
    const line = workLines[i].trim();
    
    // Check for PART markers
    if (line.match(/^PART\s+[IVX]+\.?$/)) {
        // Save previous chapter if exists
        if (currentChapter) {
            currentChapter.content = currentContent.join('\n').trim();
            chapters.push(currentChapter);
        }
        
        partTitle = line;
        sectionTitle = '';
        currentChapter = null;
        currentContent = [];
        continue;
    }
    
    // Check for SECTION markers
    if (line.match(/^SECTION\s+[IVX]+\.?$/)) {
        // Save previous chapter if exists
        if (currentChapter) {
            currentChapter.content = currentContent.join('\n').trim();
            chapters.push(currentChapter);
        }
        
        sectionTitle = line;
        currentChapter = null;
        currentContent = [];
        continue;
    }
    
    // Check for section titles (lines that appear after SECTION markers)
    if ((partTitle || sectionTitle) && !currentChapter && line && !line.match(/^\s*$/)) {
        // This might be a section title
        let title = '';
        if (partTitle && sectionTitle) {
            title = `${partTitle} - ${sectionTitle}: ${line}`;
        } else if (partTitle) {
            title = `${partTitle}: ${line}`;
        } else {
            title = line;
        }
        
        currentChapter = {
            title: title,
            content: ''
        };
        currentContent = [];
        continue;
    }
    
    // Skip empty lines at the beginning of content
    if (currentContent.length === 0 && line === '') {
        continue;
    }
    
    // Add content to current chapter
    if (currentChapter) {
        currentContent.push(workLines[i]); // Keep original formatting
    }
}

// Add the last chapter
if (currentChapter) {
    currentChapter.content = currentContent.join('\n').trim();
    chapters.push(currentChapter);
}

// If we have very few chapters, try a simpler approach
if (chapters.length < 5) {
    console.log('Too few chapters found, trying simpler parsing...');
    
    // Reset and try a different approach
    const simpleChapters = [];
    let currentSimpleChapter = null;
    let currentSimpleContent = [];
    
    for (let i = 0; i < workLines.length; i++) {
        const line = workLines[i].trim();
        
        // Look for major section headers
        if (line.includes('ERASMUS\'S PREFACE REVIEWED') ||
            line.includes('ARGUMENTS FOR FREEWILL') ||
            line.includes('SCRIPTURE TEXTS EXAMINED') ||
            line.match(/^[A-Z\s]{10,}$/) && line.length < 50) {
            
            // Save previous chapter
            if (currentSimpleChapter) {
                currentSimpleChapter.content = currentSimpleContent.join('\n').trim();
                simpleChapters.push(currentSimpleChapter);
            }
            
            currentSimpleChapter = {
                title: line,
                content: ''
            };
            currentSimpleContent = [];
            continue;
        }
        
        // Add content
        if (currentSimpleChapter) {
            currentSimpleContent.push(workLines[i]);
        }
    }
    
    // Add last chapter
    if (currentSimpleChapter) {
        currentSimpleChapter.content = currentSimpleContent.join('\n').trim();
        simpleChapters.push(currentSimpleChapter);
    }
    
    if (simpleChapters.length > chapters.length) {
        chapters.length = 0;
        chapters.push(...simpleChapters);
    }
}

// Create the JSON structure
const jsonData = {
    title: "The Bondage of the Will",
    author: "Martin Luther",
    year: 1525,
    chapters: chapters
};

// Write to JSON file
const outputPath = path.join(__dirname, 'public', 'literature', 'bondage_of_the_will.json');
fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));

console.log(`Successfully parsed ${chapters.length} chapters from The Bondage of the Will`);
console.log('Chapters:');
chapters.forEach((chapter, index) => {
    console.log(`${index + 1}. ${chapter.title}`);
});