'use client'

import { useState, useEffect } from 'react'
import { BibleReader } from '@/components/BibleReader'
import { BookSelector } from '@/components/BookSelector'
import { ChapterSelector } from '@/components/ChapterSelector'
import { useAuth } from '@/components/AuthProvider'
import { progressService } from '@/lib/database'

export default function BiblePage() {
  const [currentBook, setCurrentBook] = useState('')
  const [currentChapter, setCurrentChapter] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
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
      setIsLoading(true)
      
      try {
        if (user) {
          // If user is logged in, load from database
          const { data } = await progressService.getUserProgress(user.id)
          
          if (data && data.length > 0) {
            // Get the most recent reading position
            const lastRead = data[0]
            setCurrentBook(lastRead.book)
            setCurrentChapter(lastRead.chapter)
          } else {
            // No saved position, set default
            setCurrentBook('John')
            setCurrentChapter(3)
          }
        } else {
          // If not logged in, load from localStorage
          const savedPosition = localStorage.getItem('openbible-last-position')
          if (savedPosition) {
            const { book, chapter } = JSON.parse(savedPosition)
            setCurrentBook(book)
            setCurrentChapter(chapter)
          } else {
            // No saved position, set default
            setCurrentBook('John')
            setCurrentChapter(3)
          }
        }
      } catch (error) {
        console.error('Error loading reading position:', error)
        // Set default values on error
        setCurrentBook('John')
        setCurrentChapter(3)
      } finally {
        setIsLoading(false)
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
      {isLoading ? (
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <div className="text-center animate-in fade-in-0 duration-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground text-lg">
                Loading your Bible...
              </p>
              <div className="flex justify-center gap-1 mt-4">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0ms]"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:150ms]"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:300ms]"></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <BibleReader 
          book={currentBook}
          chapter={currentChapter}
          onNavigate={handleNavigate}
          onBookClick={handleBookClick}
          onChapterClick={handleChapterClick}
        />
      )

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