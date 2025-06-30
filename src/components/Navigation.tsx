'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { BIBLE_BOOKS, getBooksByTestament } from '@/data/bibleBooks'
import { Menu, X, BookOpen, ChevronRight } from 'lucide-react'

interface NavigationProps {
  currentBook: string
  currentChapter: number
  onNavigate: (book: string, chapter: number) => void
}

export function Navigation({ currentBook, currentChapter, onNavigate }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTestament, setSelectedTestament] = useState<'old' | 'new'>('new')
  
  const oldTestamentBooks = getBooksByTestament('old')
  const newTestamentBooks = getBooksByTestament('new')
  const currentBookInfo = BIBLE_BOOKS.find(book => book.name === currentBook)
  
  const handleBookSelect = (bookName: string) => {
    onNavigate(bookName, 1)
    setIsOpen(false)
  }
  
  const handleChapterSelect = (chapter: number) => {
    onNavigate(currentBook, chapter)
    setIsOpen(false)
  }

  return (
    <>
      {/* Navigation Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-40 bg-white shadow-lg"
      >
        <Menu className="w-4 h-4" />
      </Button>

      {/* Navigation Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
          {/* Navigation Panel */}
          <div className="bg-white w-full max-w-sm h-full overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Bible Navigation
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Current Reading */}
            <div className="p-4 border-b bg-blue-50">
              <h3 className="font-medium text-blue-900">Currently Reading</h3>
              <p className="text-sm text-blue-700">{currentBook} {currentChapter}</p>
            </div>

            {/* Testament Toggle */}
            <div className="p-4 border-b">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setSelectedTestament('old')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    selectedTestament === 'old'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Old Testament
                </button>
                <button
                  onClick={() => setSelectedTestament('new')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    selectedTestament === 'new'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  New Testament
                </button>
              </div>
            </div>

            {/* Books List */}
            <div className="p-4">
              <h3 className="font-medium mb-3">
                {selectedTestament === 'old' ? 'Old Testament' : 'New Testament'} Books
              </h3>
              <div className="space-y-1">
                {(selectedTestament === 'old' ? oldTestamentBooks : newTestamentBooks).map((book) => (
                  <button
                    key={book.name}
                    onClick={() => handleBookSelect(book.name)}
                    className={`w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-between ${
                      book.name === currentBook ? 'bg-blue-100 text-blue-800' : ''
                    }`}
                  >
                    <div>
                      <div className="font-medium">{book.name}</div>
                      <div className="text-xs text-gray-500">{book.chapters} chapters</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* Chapters for Current Book */}
            {currentBookInfo && (
              <div className="p-4 border-t bg-gray-50">
                <h3 className="font-medium mb-3">{currentBook} Chapters</h3>
                <div className="grid grid-cols-6 gap-2">
                  {Array.from({ length: currentBookInfo.chapters }, (_, i) => i + 1).map((chapter) => (
                    <button
                      key={chapter}
                      onClick={() => handleChapterSelect(chapter)}
                      className={`p-2 text-sm rounded border hover:bg-blue-100 transition-colors ${
                        chapter === currentChapter
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      {chapter}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Close overlay when clicking outside */}
          <div 
            className="flex-1"
            onClick={() => setIsOpen(false)}
          />
        </div>
      )}
    </>
  )
} 