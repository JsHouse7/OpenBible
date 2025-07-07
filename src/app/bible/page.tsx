'use client'

import { useState } from 'react'
import { BibleReader } from '@/components/BibleReader'
import { BookSelector } from '@/components/BookSelector'
import { ChapterSelector } from '@/components/ChapterSelector'

export default function BiblePage() {
  const [currentBook, setCurrentBook] = useState('John')
  const [currentChapter, setCurrentChapter] = useState(3)
  const [showBookSelector, setShowBookSelector] = useState(false)
  const [showChapterSelector, setShowChapterSelector] = useState(false)

  const handleBookClick = () => {
    setShowBookSelector(true)
  }

  const handleChapterClick = () => {
    setShowChapterSelector(true)
  }

  const handleBookSelect = (book: string) => {
    setCurrentBook(book)
    setCurrentChapter(1) // Reset to first chapter when changing books
  }

  const handleChapterSelect = (chapter: number) => {
    setCurrentChapter(chapter)
  }

  const handleNavigate = (book: string, chapter: number) => {
    setCurrentBook(book)
    setCurrentChapter(chapter)
  }

  return (
    <>
      <BibleReader 
        book={currentBook}
        chapter={currentChapter}
        onNavigate={handleNavigate}
        onBookClick={handleBookClick}
        onChapterClick={handleChapterClick}
      />

      {showBookSelector && (
        <BookSelector
          currentBook={currentBook}
          onBookSelect={handleBookSelect}
          onClose={() => setShowBookSelector(false)}
          onOpenChapterSelector={() => setShowChapterSelector(true)}
        />
      )}

      {showChapterSelector && (
        <ChapterSelector
          book={currentBook}
          currentChapter={currentChapter}
          onChapterSelect={handleChapterSelect}
          onClose={() => setShowChapterSelector(false)}
        />
      )}
    </>
  )
} 