'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { VerseComponent } from '@/components/VerseComponent'
import { ScriptureHeader } from '@/components/ScriptureHeader'
import { NoteModal } from '@/components/NoteModal'
import { useAnimations } from '@/components/AnimationProvider'
import { useBibleVersion } from '@/components/BibleVersionProvider'
import { useAuth } from '@/components/AuthProvider'
import { useFonts } from '@/hooks/useFonts'
import { cn } from '@/lib/utils'
import { loadChapterData, COMPLETE_BIBLE_BOOKS } from '@/data/completeBible'
import { notesService, highlightsService, bookmarksService } from '@/lib/database'
import type { BibleVerse } from '@/data/completeBible'

interface Note {
  id: string
  verseId: string
  text: string
  timestamp: string
  book: string
  chapter: number
  verse: number
}

interface BibleReaderProps {
  book: string
  chapter: number
  onNavigate?: (book: string, chapter: number) => void
  onBookClick?: () => void
  onChapterClick?: () => void
}

export function BibleReader({ book, chapter, onNavigate, onBookClick, onChapterClick }: BibleReaderProps) {
  const [verses, setVerses] = useState<BibleVerse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getTransitionClass } = useAnimations()
  const { user } = useAuth()
  const { getBibleTextClasses } = useFonts()
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [highlights, setHighlights] = useState<Set<string>>(new Set())
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())
  const [highlightColors, setHighlightColors] = useState<Map<string, string>>(new Map())
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [noteVerse, setNoteVerse] = useState<BibleVerse | null>(null)

  // Get current book info
  const currentBookInfo = COMPLETE_BIBLE_BOOKS.find(b => b.name === book)
  const { selectedVersion, isLoading: isTranslationLoading } = useBibleVersion()
  
  // Load verses for current book and chapter
  useEffect(() => {
    const loadVerses = async () => {
      try {
        setLoading(true)
        setError(null)
        const verses = await loadChapterData(book, chapter, selectedVersion.abbreviation)
        setVerses(verses)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chapter')
        setVerses([])
      } finally {
        setLoading(false)
      }
    }

    loadVerses()
  }, [book, chapter, selectedVersion.abbreviation])

  // Load user data from database
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) {
        // Clear data if user is not authenticated
        setNotes([])
        setHighlights(new Set())
        setBookmarks(new Set())
        setHighlightColors(new Map())
        return
      }

      try {
        // Load notes for current chapter
        const { data: notesData } = await notesService.getUserNotes(user.id)
        if (notesData) {
          const chapterNotes = notesData.filter(note => 
            note.book === book && note.chapter === chapter
          ).map(note => ({
            id: note.id,
            verseId: `${note.book}-${note.chapter}-${note.verse}`,
            text: note.content,
            timestamp: note.created_at,
            book: note.book,
            chapter: note.chapter,
            verse: note.verse
          }))
          setNotes(chapterNotes)
        }

        // Load highlights
        const { data: highlightsData } = await highlightsService.getUserHighlights(user.id)
        if (highlightsData) {
          const highlightSet = new Set<string>()
          const colorMap = new Map<string, string>()
          
          highlightsData.forEach(highlight => {
            const key = `${highlight.book}-${highlight.chapter}-${highlight.verse}`
            highlightSet.add(key)
            colorMap.set(key, highlight.color)
          })
          
          setHighlights(highlightSet)
          setHighlightColors(colorMap)
        }

        // Load bookmarks
        const { data: bookmarksData } = await bookmarksService.getUserBookmarks(user.id)
        if (bookmarksData) {
          const bookmarkSet = new Set(
            bookmarksData.map(bookmark => `${bookmark.book}-${bookmark.chapter}-${bookmark.verse}`)
          )
          setBookmarks(bookmarkSet)
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      }
    }

    loadUserData()
  }, [user, book, chapter])

  const handleVerseSelect = (verse: BibleVerse) => {
    setSelectedVerse(verse)
  }

  const handleAddNote = (verse: BibleVerse) => {
    setNoteVerse(verse)
    setIsNoteModalOpen(true)
  }

  const handleSaveNote = async (noteText: string) => {
    if (!noteVerse || !user?.id) return

    try {
      const existingNote = notes.find(note => note.verseId === noteVerse.id)
      
      if (existingNote) {
        // Update existing note
        const { error } = await notesService.saveNote(
          user.id,
          book,
          chapter,
          noteVerse.verse,
          noteText
        )
        
        if (error) {
          console.error('Error updating note:', error)
          return
        }
        
        const updatedNotes = notes.map(note => 
          note.verseId === noteVerse.id 
            ? { ...note, text: noteText, timestamp: new Date().toISOString() }
            : note
        )
        setNotes(updatedNotes)
      } else {
        // Create new note
        const { data, error } = await notesService.saveNote(
          user.id,
          book,
          chapter,
          noteVerse.verse,
          noteText
        )
        
        if (error) {
          console.error('Error creating note:', error)
          return
        }
        
        const newNote: Note = {
          id: data?.[0]?.id || Date.now().toString(),
          verseId: noteVerse.id,
          text: noteText,
          timestamp: new Date().toISOString(),
          book,
          chapter,
          verse: noteVerse.verse,
        }

        const updatedNotes = [...notes, newNote]
        setNotes(updatedNotes)
      }
    } catch (error) {
      console.error('Error saving note:', error)
    }
  }

  const handleToggleHighlight = async (verse: BibleVerse, color: string = 'yellow') => {
    if (!user?.id) {
      console.warn('User not authenticated, cannot save highlight')
      return
    }

    const key = `${book}-${chapter}-${verse.verse}`
    const isHighlighted = highlights.has(verse.id)
    
    try {
      if (isHighlighted) {
        // Remove highlight
        const { error } = await highlightsService.removeHighlight(user.id, book, chapter, verse.verse)
        if (error) {
          console.error('Error removing highlight:', error)
          return
        }
        
        const newHighlights = new Set(highlights)
        const newColors = new Map(highlightColors)
        newHighlights.delete(verse.id)
        newColors.delete(key)
        setHighlights(newHighlights)
        setHighlightColors(newColors)
      } else {
        // Add highlight
        const { error } = await highlightsService.addHighlight(user.id, book, chapter, verse.verse, color)
        if (error) {
          console.error('Error adding highlight:', error)
          return
        }
        
        const newHighlights = new Set(highlights)
        const newColors = new Map(highlightColors)
        newHighlights.add(verse.id)
        newColors.set(key, color)
        setHighlights(newHighlights)
        setHighlightColors(newColors)
      }
    } catch (error) {
      console.error('Error toggling highlight:', error)
    }
  }

  const handleToggleBookmark = async (verse: BibleVerse) => {
    if (!user?.id) {
      console.warn('User not authenticated, cannot save bookmark')
      return
    }

    const key = `${book}-${chapter}-${verse.verse}`
    const isBookmarked = bookmarks.has(verse.id)
    
    try {
      if (isBookmarked) {
        // Remove bookmark
        const { error } = await bookmarksService.removeBookmark(user.id, book, chapter, verse.verse)
        if (error) {
          console.error('Error removing bookmark:', error)
          return
        }
        
        const newBookmarks = new Set(bookmarks)
        newBookmarks.delete(verse.id)
        setBookmarks(newBookmarks)
      } else {
        // Add bookmark
        const { error } = await bookmarksService.addBookmark(user.id, book, chapter, verse.verse)
        if (error) {
          console.error('Error adding bookmark:', error)
          return
        }
        
        const newBookmarks = new Set(bookmarks)
        newBookmarks.add(verse.id)
        setBookmarks(newBookmarks)
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
    }
  }

  const getVerseRange = (verses: BibleVerse[]) => {
    if (verses.length === 0) return ""
    if (verses.length === 1) return `v${verses[0].verse}`
    return `v${verses[0].verse}-${verses[verses.length - 1].verse}`
  }

  // Navigation helpers
  const handlePreviousChapter = () => {
    if (chapter > 1) {
      onNavigate?.(book, chapter - 1)
    } else {
      // Go to previous book's last chapter
      const currentBookIndex = COMPLETE_BIBLE_BOOKS.findIndex(b => b.name === book)
      if (currentBookIndex > 0) {
        const previousBook = COMPLETE_BIBLE_BOOKS[currentBookIndex - 1]
        onNavigate?.(previousBook.name, previousBook.chapters)
      }
    }
  }

  const handleNextChapter = () => {
    const maxChapters = currentBookInfo?.chapters || 1
    if (chapter < maxChapters) {
      onNavigate?.(book, chapter + 1)
    } else {
      // Go to next book's first chapter
      const currentBookIndex = COMPLETE_BIBLE_BOOKS.findIndex(b => b.name === book)
      if (currentBookIndex < COMPLETE_BIBLE_BOOKS.length - 1) {
        const nextBook = COMPLETE_BIBLE_BOOKS[currentBookIndex + 1]
        onNavigate?.(nextBook.name, 1)
      }
    }
  }

  // Check if navigation is possible
  const canGoPrevious = chapter > 1 || COMPLETE_BIBLE_BOOKS.findIndex(b => b.name === book) > 0
  const canGoNext = (currentBookInfo && chapter < currentBookInfo.chapters) || 
                   COMPLETE_BIBLE_BOOKS.findIndex(b => b.name === book) < COMPLETE_BIBLE_BOOKS.length - 1

  if (isTranslationLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center">
          <div className={cn("text-center", "animate-in fade-in-0 duration-500")}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className={cn("text-muted-foreground text-lg", getTransitionClass('default'))}>
              Loading Bible translations...
            </p>
            <div className="flex justify-center gap-1 mt-4">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0ms]"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:150ms]"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:300ms]"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center">
          <div className={cn("text-center", "animate-in fade-in-0 duration-500")}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className={cn("text-muted-foreground text-lg", getTransitionClass('default'))}>
              Loading {book} {chapter} ({selectedVersion.abbreviation})...
            </p>
            <div className="flex justify-center gap-1 mt-4">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0ms]"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:150ms]"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:300ms]"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center text-red-600 dark:text-red-400">
          <p className="text-lg font-semibold mb-2">Error loading chapter</p>
          <p className="text-sm">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <ScriptureHeader 
        book={book} 
        chapter={chapter} 
        verseRange={getVerseRange(verses)}
        onBookClick={onBookClick || (() => {})}
        onChapterClick={onChapterClick || (() => {})}
        onPreviousChapter={handlePreviousChapter}
        onNextChapter={handleNextChapter}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
      />
      
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Verses */}
        <div className={cn("space-y-1 reading-container", getBibleTextClasses(), getTransitionClass('default', 'verse') && "animate-in fade-in-0 slide-in-from-bottom-4 duration-500")}>
          {verses.map((verse, index) => (
            <div 
              key={verse.id} 
              className={cn(
                getTransitionClass('default', 'verse') && "animate-in fade-in-0 slide-in-from-left-4"
              )}
              style={{ 
                animationDelay: getTransitionClass('default', 'verse') ? `${index * 50}ms` : '0ms', 
                animationDuration: getTransitionClass('default', 'verse') ? '300ms' : '0ms' 
              }}
            >
              <VerseComponent
                verse={verse}
                isSelected={selectedVerse?.id === verse.id}
                hasNote={notes.some((note) => note.verseId === verse.id)}
                isHighlighted={highlights.has(verse.id)}
                isBookmarked={bookmarks.has(verse.id)}
                onSelect={handleVerseSelect}
                onAddNote={handleAddNote}
                onToggleHighlight={(color) => handleToggleHighlight(verse, color)}
                highlightColor={highlightColors.get(`${book}-${chapter}-${verse.verse}`) || 'yellow'}
                onToggleBookmark={handleToggleBookmark}
              />
            </div>
          ))}
        </div>

        {verses.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No verses available for this chapter.</p>
          </div>
        )}
      </div>

      {/* Note Modal */}
      <NoteModal
        verse={noteVerse}
        existingNote={notes.find(note => note.verseId === noteVerse?.id)}
        isOpen={isNoteModalOpen}
        onClose={() => {
          setIsNoteModalOpen(false)
          setNoteVerse(null)
        }}
        onSave={handleSaveNote}
      />
    </>
  )
}