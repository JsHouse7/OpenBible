'use client'

import { useState } from 'react'
import Dashboard from '@/components/Dashboard'
import { BibleReader } from '@/components/BibleReader'
import NotesPage from '@/components/NotesPage'
import BookmarksPage from '@/components/BookmarksPage'
import ReadingPlansPage from '@/components/ReadingPlansPage'
import ProgressPage from '@/components/ProgressPage'
import LiteratureLibrary from '@/components/LiteratureLibrary'
import Settings from '@/components/Settings'
import ProfilePage from '@/components/ProfilePage'
import EnhancedNavigation from '@/components/EnhancedNavigation'
import { useIsMobile } from '@/hooks/use-mobile'

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [currentBook, setCurrentBook] = useState('John')
  const [currentChapter, setCurrentChapter] = useState(3)
  const isMobile = useIsMobile()

  const handleNavigation = (page: string) => {
    setCurrentPage(page)
  }

  const handleBookChange = (book: string) => {
    setCurrentBook(book)
    setCurrentPage('reader')
  }

  const handleChapterChange = (chapter: number) => {
    setCurrentChapter(chapter)
    setCurrentPage('reader')
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard 
            onNavigate={handleNavigation}
          />
        )
      case 'reader':
      case 'bible':
        return (
          <BibleReader 
            book={currentBook}
            chapter={currentChapter}
            onNavigate={handleNavigation}
            onBookClick={() => {}}
            onChapterClick={() => {}}
          />
        )
      case 'notes':
        return <NotesPage />
      case 'bookmarks':
        return <BookmarksPage />
      case 'plans':
        return <ReadingPlansPage />
      case 'progress':
        return <ProgressPage />
      case 'literature':
        return <LiteratureLibrary />
      case 'settings':
        return <Settings />
      case 'profile':
        return <ProfilePage />
      default:
        return (
          <Dashboard 
            onNavigate={handleNavigation}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Navigation */}
      <EnhancedNavigation 
        currentPage={currentPage} 
        onPageChange={handleNavigation}
      />
      
      {/* Main Content */}
      <div className={`${isMobile ? 'pt-16 pb-20' : 'pt-16'} transition-all duration-300`}>
        <main className="min-h-screen">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
