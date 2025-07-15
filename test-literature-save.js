// Test script to verify literature saving functionality
const testWork = {
  id: 'test_work_' + Date.now(),
  title: 'Test Literature Work',
  author: 'Test Author',
  year: 2024,
  difficulty: 'intermediate',
  description: 'A test literature work to verify the save functionality',
  chapters: [
    {
      id: 1,
      title: 'Chapter 1: Introduction',
      content: 'This is the first chapter of our test work. It contains some sample content to verify that the parsing and saving functionality works correctly.',
      wordCount: 25,
      estimatedReadingTime: 1
    },
    {
      id: 2,
      title: 'Chapter 2: Development',
      content: 'This is the second chapter where we develop our ideas further. The content here is also sample text for testing purposes.',
      wordCount: 22,
      estimatedReadingTime: 1
    }
  ],
  metadata: {
    wordCount: 47,
    estimatedReadingTime: 2,
    language: 'en',
    genre: 'test'
  }
}

// Test the API endpoint
async function testSave() {
  try {
    const response = await fetch('http://localhost:3000/api/literature/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: `${testWork.id}.json`,
        content: JSON.stringify(testWork, null, 2)
      }),
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Save test successful:', result)
    } else {
      const error = await response.json()
      console.error('❌ Save test failed:', error)
    }
  } catch (error) {
    console.error('❌ Network error:', error)
  }
}

// Run the test if this script is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch')
  testSave()
} else {
  // Browser environment
  console.log('Test work object:', testWork)
  console.log('Run testSave() to test the API')
  window.testSave = testSave
  window.testWork = testWork
}