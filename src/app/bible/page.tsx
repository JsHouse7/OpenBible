'use client'

import { useState } from 'react'
import { BibleReader } from '@/components/BibleReader'

export default function BiblePage() {
  const [currentBook, setCurrentBook] = useState('John')
  const [currentChapter, setCurrentChapter] = useState(3)

  return (
    <BibleReader 
      book={currentBook}
      chapter={currentChapter}
      onNavigate={() => {}}
      onBookClick={() => {}}
      onChapterClick={() => {}}
    />
  )
} 