'use client'

import { useState, useEffect } from 'react'
import { useUserPreferences } from '@/components/UserPreferencesProvider'
import EnhancedNavigation from '@/components/EnhancedNavigation'
import Dashboard from '@/components/Dashboard'
import { BibleReader } from '@/components/BibleReader'
import { BookSelector } from '@/components/BookSelector'
import { ChapterSelector } from '@/components/ChapterSelector'
import LiteratureLibrary from '@/components/LiteratureLibrary'
import NotesPage from '@/components/NotesPage'
import BookmarksPage from '@/components/BookmarksPage'
// import HighlightsPage from '@/components/HighlightsPage'
// import ProgressPage from '@/components/ProgressPage'
// import ReadingPlansPage from '@/components/ReadingPlansPage'
import Settings from '@/components/Settings'
import ProfilePage from '@/components/ProfilePage'
import { MobileBottomNav } from '@/components/MobileBottomNav'

export default function OpenBibleApp() {
  const { getHomePage } = useUserPreferences()
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [selectedBook, setSelectedBook] = useState('John')
  const [selectedChapter, setSelectedChapter] = useState(3)
  const [showBookSelector, setShowBookSelector] = useState(false)
  const [showChapterSelector, setShowChapterSelector] = useState(false)

  // Set initial page based on user preference
  useEffect(() => {
    const homePage = getHomePage()
    setCurrentPage(homePage)
  }, [getHomePage])

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />
      
      case 'reader':
        return (
          <div className="bg-background">
            {/* Book Selector Modal */}
            {showBookSelector && (
              <BookSelector
                currentBook={selectedBook}
                onBookSelect={(book) => {
                  setSelectedBook(book)
                  setSelectedChapter(1) // Reset to first chapter when changing books
                }}
                onClose={() => setShowBookSelector(false)}
                onOpenChapterSelector={() => setShowChapterSelector(true)}
              />
            )}

            {/* Chapter Selector Modal */}
            {showChapterSelector && (
              <ChapterSelector
                book={selectedBook}
                currentChapter={selectedChapter}
                onChapterSelect={setSelectedChapter}
                onClose={() => setShowChapterSelector(false)}
              />
            )}

            {/* Bible Reader Component */}
            <BibleReader 
              book={selectedBook}
              chapter={selectedChapter}
              onNavigate={(book, chapter) => {
                setSelectedBook(book)
                setSelectedChapter(chapter)
              }}
              onBookClick={() => setShowBookSelector(true)}
              onChapterClick={() => setShowChapterSelector(true)}
            />
          </div>
        )
      
      case 'literature':
        return <LiteratureLibrary />
      
      case 'notes':
        return <NotesPage />
      
      case 'bookmarks':
        return <BookmarksPage />
      
      case 'highlights':
        return <div className="p-4">Highlights Page Coming Soon</div>
      
      case 'progress':
        return <div className="p-4">Progress Page Coming Soon</div>
      
      case 'plans':
        return <div className="p-4">Reading Plans Page Coming Soon</div>
      
      case 'settings':
        return <Settings />
      
      case 'profile':
        return <ProfilePage />
      
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Navigation */}
      <EnhancedNavigation 
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
      
      <main className="flex-1">
        {renderCurrentPage()}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
      
      {/* Footer - only show if not in reader mode */}
      {currentPage !== 'reader' && (
        <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  © 2024 OpenBible. Built for spiritual growth.
                </span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>Bible: KJV</span>
                <span>•</span>
                <span>Literature: Public Domain</span>
                <span>•</span>
                <span className="text-blue-600 hover:text-blue-700 cursor-pointer">
                  Report Issue
                </span>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
