'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()

  // Initialize page based on URL pathname
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname
      console.log('🛣️ Initial pathname:', path)
      
      // Map URL paths to page states
      const pathToPage: Record<string, string> = {
        '/dashboard': 'dashboard',
        '/bible': 'bible',
        '/notes': 'notes',
        '/bookmarks': 'bookmarks',
        '/highlights': 'highlights',
        '/reading-plans': 'plans',
        '/progress': 'progress',
        '/literature': 'literature',
        '/profile': 'profile',
        '/settings': 'settings'
      }

      const initialPage = pathToPage[path] || 'dashboard'
      console.log('🎯 Setting initial page to:', initialPage)
      setCurrentPage(initialPage)
    }
  }, [])

  // Debug logging
  useEffect(() => {
    console.log('📱 HomePage mounted');
    console.log('🔧 Current page state:', currentPage);
    console.log('📖 Current book:', currentBook, 'Chapter:', currentChapter);
    console.log('📱 Is mobile:', isMobile);
    
    // Check if we're on the correct path
    if (typeof window !== 'undefined') {
      console.log('🌍 Window location:', window.location.href);
      console.log('🛣️ Pathname:', window.location.pathname);
      console.log('🔍 Search params:', window.location.search);
    }
  }, [currentPage, currentBook, currentChapter, isMobile])

  const handleNavigation = (page: string) => {
    console.log('🧭 Navigating to:', page);
    setCurrentPage(page)
    
    // Update URL without page reload
    const pageToPath: Record<string, string> = {
      'dashboard': '/dashboard',
      'bible': '/bible',
      'reader': '/bible',
      'notes': '/notes',
      'bookmarks': '/bookmarks',
      'highlights': '/highlights',
      'plans': '/reading-plans',
      'progress': '/progress',
      'literature': '/literature',
      'profile': '/profile',
      'settings': '/settings'
    }
    
    const newPath = pageToPath[page] || '/dashboard'
    console.log('📍 Updating URL to:', newPath)
    window.history.pushState({}, '', newPath)
  }

  const handleBookChange = (book: string) => {
    console.log('📚 Book changed to:', book);
    setCurrentBook(book)
    setCurrentPage('reader')
    window.history.pushState({}, '', '/bible')
  }

  const handleChapterChange = (chapter: number) => {
    console.log('📄 Chapter changed to:', chapter);
    setCurrentChapter(chapter)
    setCurrentPage('reader')
    window.history.pushState({}, '', '/bible')
  }

  const renderPage = () => {
    console.log('🎬 Rendering page:', currentPage);
    
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
        console.log('⚠️ Unknown page, defaulting to dashboard:', currentPage);
        return (
          <Dashboard 
            onNavigate={handleNavigation}
          />
        )
    }
  }

  console.log('🖼️ About to render HomePage with navigation');

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
