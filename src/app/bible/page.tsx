'use client'

import { useState, useEffect } from 'react'
import { BibleReader } from '@/components/BibleReader'
import { BookSelector } from '@/components/BookSelector'
import { ChapterSelector } from '@/components/ChapterSelector'
import { useAuth } from '@/components/AuthProvider'
import { progressService } from '@/lib/database'

export default function BiblePage() {
  const [currentBook, setCurrentBook] = useState('John')
  const [currentChapter, setCurrentChapter] = useState(3)
  const [showBookSelector, setShowBookSelector] = useState(false)
  const [showChapterSelector, setShowChapterSelector] = useState(false)
  const { user } = useAuth()

  const handleBookClick = () => {
    setShowBookSelector(true)
  }

  const handleChapterClick = () => {
    setShowChapterSelector(true)
  }

  const handleBookSelect = (book: string) => {
    setCurrentBook(book)
    setCurrentChapter(1) // Reset to first chapter when changing books
    
    // Save reading progress
    if (user) {
      // If user is logged in, save to database
      progressService.updateProgress(user.id, book, 1)
        .catch(error => console.error('Error updating reading progress:', error))
    } else {
      // If not logged in, save to localStorage
      try {
        localStorage.setItem('openbible-last-position', JSON.stringify({ book, chapter: 1 }))
      } catch (error) {
        console.error('Error saving position to localStorage:', error)
      }
    }
  }

  const handleChapterSelect = (chapter: number) => {
    setCurrentChapter(chapter)
    
    // Save reading progress
    if (user) {
      // If user is logged in, save to database
      progressService.updateProgress(user.id, currentBook, chapter)
        .catch(error => console.error('Error updating reading progress:', error))
    } else {
      // If not logged in, save to localStorage
      try {
        localStorage.setItem('openbible-last-position', JSON.stringify({ book: currentBook, chapter }))
      } catch (error) {
        console.error('Error saving position to localStorage:', error)
      }
    }
  }

  // Load user's last reading position
  useEffect(() => {
    const loadLastReadingPosition = async () => {
      if (user) {
        // If user is logged in, load from database
        try {
          const { data } = await progressService.getUserProgress(user.id)
          
          if (data && data.length > 0) {
            // Get the most recent reading position
            const lastRead = data[0]
            setCurrentBook(lastRead.book)
            setCurrentChapter(lastRead.chapter)
          }
        } catch (error) {
          console.error('Error loading reading position:', error)
        }
      } else {
        // If not logged in, load from localStorage
        const savedPosition = localStorage.getItem('openbible-last-position')
        if (savedPosition) {
          try {
            const { book, chapter } = JSON.parse(savedPosition)
            setCurrentBook(book)
            setCurrentChapter(chapter)
          } catch (error) {
            console.error('Error parsing saved position:', error)
          }
        }
      }
    }
    
    loadLastReadingPosition()
  }, [user])

  const handleNavigate = (book: string, chapter: number) => {
    setCurrentBook(book)
    setCurrentChapter(chapter)
    
    // Save reading progress
    if (user) {
      // If user is logged in, save to database
      progressService.updateProgress(user.id, book, chapter)
        .catch(error => console.error('Error updating reading progress:', error))
    } else {
      // If not logged in, save to localStorage
      try {
        localStorage.setItem('openbible-last-position', JSON.stringify({ book, chapter }))
      } catch (error) {
        console.error('Error saving position to localStorage:', error)
      }
    }
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