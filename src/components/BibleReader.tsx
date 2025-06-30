'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { VerseComponent } from '@/components/VerseComponent'
import { ScriptureHeader } from '@/components/ScriptureHeader'
import { NoteModal } from '@/components/NoteModal'
import { useAnimations } from '@/components/AnimationProvider'
import { cn } from '@/lib/utils'
import { loadChapterData, COMPLETE_BIBLE_BOOKS } from '@/data/completeBible'
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
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [highlights, setHighlights] = useState<Set<string>>(new Set())
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [noteVerse, setNoteVerse] = useState<BibleVerse | null>(null)

  // Get current book info
  const currentBookInfo = COMPLETE_BIBLE_BOOKS.find(b => b.name === book)
  
  // Load verses for current book and chapter
  useEffect(() => {
    const loadVerses = async () => {
      try {
        setLoading(true)
        setError(null)
        const verses = await loadChapterData(book, chapter)
        setVerses(verses)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chapter')
        setVerses([])
      } finally {
        setLoading(false)
      }
    }

    loadVerses()
  }, [book, chapter])

  // Load saved data from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem("openbible-notes")
    const savedHighlights = localStorage.getItem("openbible-highlights")
    const savedBookmarks = localStorage.getItem("openbible-bookmarks")

    if (savedNotes) setNotes(JSON.parse(savedNotes))
    if (savedHighlights) setHighlights(new Set(JSON.parse(savedHighlights)))
    if (savedBookmarks) setBookmarks(new Set(JSON.parse(savedBookmarks)))
  }, [])

  const handleVerseSelect = (verse: BibleVerse) => {
    setSelectedVerse(verse)
  }

  const handleAddNote = (verse: BibleVerse) => {
    setNoteVerse(verse)
    setIsNoteModalOpen(true)
  }

  const handleSaveNote = (noteText: string) => {
    if (!noteVerse) return

    const existingNote = notes.find(note => note.verseId === noteVerse.id)
    
    if (existingNote) {
      // Update existing note
      const updatedNotes = notes.map(note => 
        note.verseId === noteVerse.id 
          ? { ...note, text: noteText, timestamp: new Date().toISOString() }
          : note
      )
      setNotes(updatedNotes)
      localStorage.setItem("openbible-notes", JSON.stringify(updatedNotes))
    } else {
      // Create new note
      const newNote: Note = {
        id: Date.now().toString(),
        verseId: noteVerse.id,
        text: noteText,
        timestamp: new Date().toISOString(),
        book,
        chapter,
        verse: noteVerse.verse,
      }

      const updatedNotes = [...notes, newNote]
      setNotes(updatedNotes)
      localStorage.setItem("openbible-notes", JSON.stringify(updatedNotes))
    }
  }

  const handleToggleHighlight = (verse: BibleVerse) => {
    const newHighlights = new Set(highlights)
    if (highlights.has(verse.id)) {
      newHighlights.delete(verse.id)
    } else {
      newHighlights.add(verse.id)
    }
    setHighlights(newHighlights)
    localStorage.setItem("openbible-highlights", JSON.stringify([...newHighlights]))
  }

  const handleToggleBookmark = (verse: BibleVerse) => {
    const newBookmarks = new Set(bookmarks)
    if (bookmarks.has(verse.id)) {
      newBookmarks.delete(verse.id)
    } else {
      newBookmarks.add(verse.id)
    }
    setBookmarks(newBookmarks)
    localStorage.setItem("openbible-bookmarks", JSON.stringify([...newBookmarks]))
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center">
          <div className={cn("text-center", "animate-in fade-in-0 duration-500")}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className={cn("text-muted-foreground text-lg", getTransitionClass('default'))}>
              Loading {book} {chapter}...
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
        <div className={cn("space-y-1", getTransitionClass('default', 'verse') && "animate-in fade-in-0 slide-in-from-bottom-4 duration-500")}>
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
                onToggleHighlight={handleToggleHighlight}
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