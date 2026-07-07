'use client'

import { useState, useEffect, useLayoutEffect, useRef, useCallback, type MouseEvent } from 'react'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/Button"
import { VerseComponent } from '@/components/VerseComponent'
import { VerseStudyToolbar } from '@/components/VerseStudyToolbar'
import { ScriptureHeader } from '@/components/ScriptureHeader'
import { NoteModal } from '@/components/NoteModal'
import { useAnimations } from '@/components/AnimationProvider'
import { useBibleVersion } from '@/components/BibleVersionProvider'
import { useAuth } from '@/components/AuthProvider'
import { useFonts } from '@/hooks/useFonts'
import { useUserPreferences } from '@/components/UserPreferencesProvider'
import { cn } from '@/lib/utils'
import { loadChapterData, COMPLETE_BIBLE_BOOKS } from '@/data/completeBible'
import { notesService, highlightsService, bookmarksService } from '@/lib/database'
import { BibleAttribution } from '@/components/BibleAttribution'
import { WordStudyPanel, type InterlinearVerse } from '@/components/WordStudyPanel'
import { loadTaggedChapter, isTaggedTranslation } from '@/lib/lexiconService'
import type { BibleVerse } from '@/data/completeBible'
import type { TaggedToken, WordSelection } from '@/types/lexicon'
import {
  formatVersesForCopy,
  isVerseInSelection,
  sortVersesByNumber,
  updateVerseSelection,
} from '@/lib/verseSelection'

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
  focusVerse?: number
  onFocusVerseHandled?: () => void
  onNavigate?: (book: string, chapter: number) => void
  onBookClick?: () => void
  onChapterClick?: () => void
}

export function BibleReader({
  book,
  chapter,
  focusVerse,
  onFocusVerseHandled,
  onNavigate,
  onBookClick,
  onChapterClick,
}: BibleReaderProps) {
  const [verses, setVerses] = useState<BibleVerse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getTransitionClass } = useAnimations()
  const { user } = useAuth()
  const { getBibleTextClasses } = useFonts()
  const { preferences: readerPrefs } = useUserPreferences()
  const readingMode = readerPrefs.readingMode || 'standard'
  const continuousReading = readerPrefs.continuousReading
  /** Stronger cues on small screens (md: restores calmer desktop). */
  const readingModeClass = cn(
    'mx-auto w-full',
    readingMode === 'focus' &&
      'max-w-4xl rounded-2xl bg-muted/25 px-5 py-6 sm:px-6 md:max-w-2xl md:bg-transparent md:px-4 md:py-6 md:rounded-none',
    readingMode === 'meditation' &&
      'max-w-4xl rounded-2xl bg-gradient-to-b from-muted/50 via-muted/25 to-transparent px-6 py-7 leading-[1.85] sm:px-8 md:max-w-xl md:bg-none md:from-transparent md:via-transparent md:to-transparent md:px-4 md:py-6 md:leading-normal md:rounded-none',
    readingMode === 'study' &&
      'max-w-4xl rounded-r-2xl bg-muted/15 py-5 pl-4 pr-3 md:border-l-2 md:border-primary/15 md:rounded-none md:bg-transparent md:py-6 md:pl-3 md:pr-4',
    (readingMode === 'standard' || !readingMode) && 'max-w-4xl px-4 py-6'
  )
  const [studyToolbarOpen, setStudyToolbarOpen] = useState(false)
  const [selectedVerses, setSelectedVerses] = useState<BibleVerse[]>([])
  const [selectionAnchor, setSelectionAnchor] = useState<BibleVerse | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [highlights, setHighlights] = useState<Set<string>>(new Set())
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())
  const [highlightColors, setHighlightColors] = useState<Map<string, string>>(new Map())
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [noteVerses, setNoteVerses] = useState<BibleVerse[]>([])
  const [taggedVerses, setTaggedVerses] = useState<Map<number, TaggedToken[]> | null>(null)
  const [wordSelection, setWordSelection] = useState<WordSelection | null>(null)
  const [interlinearVerse, setInterlinearVerse] = useState<InterlinearVerse | null>(null)
  const focusHandledKeyRef = useRef<string | null>(null)

  /** After next/previous chapter via header controls, scroll to top once props update (window is the scroll root). */
  const scrollReaderToTopAfterNavRef = useRef(false)

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

  useEffect(() => {
    focusHandledKeyRef.current = null
  }, [book, chapter, selectedVersion.abbreviation])

  // Load Strong's-tagged tokens for inline word study (tagged translations only)
  const lexiconInlineActive =
    readerPrefs.lexiconEnabled &&
    readerPrefs.lexiconInlineWords &&
    isTaggedTranslation(selectedVersion.abbreviation)

  useEffect(() => {
    if (!lexiconInlineActive) {
      setTaggedVerses(null)
      return
    }
    let cancelled = false
    loadTaggedChapter(book, chapter, selectedVersion.abbreviation).then((tagged) => {
      if (cancelled) return
      if (!tagged) {
        setTaggedVerses(null)
        return
      }
      setTaggedVerses(new Map(tagged.map((v) => [v.verse, v.tokens])))
    })
    return () => {
      cancelled = true
    }
  }, [book, chapter, lexiconInlineActive, selectedVersion.abbreviation])

  // Close the word-study panel when navigating
  useEffect(() => {
    setWordSelection(null)
    setInterlinearVerse(null)
  }, [book, chapter, selectedVersion.abbreviation])

  const handleWordSelect = useCallback(
    (strongsIds: string[], surface: string, verse: BibleVerse) => {
      setWordSelection({
        strongsIds,
        surface,
        book,
        chapter,
        verse: verse.verse,
        translation: selectedVersion.abbreviation,
      })
    },
    [book, chapter, selectedVersion.abbreviation]
  )

  // "Word Study" toolbar action: opens the tagged interlinear view for a
  // verse. Prefers the current translation's tagged data; falls back to the
  // Strong's-tagged KJV so every translation has original-language access.
  const handleVerseWordStudy = useCallback(
    async (verse: BibleVerse) => {
      const abbrev = selectedVersion.abbreviation
      let translation = abbrev
      let tokens: TaggedToken[] | null = null

      if (isTaggedTranslation(abbrev)) {
        const tagged = await loadTaggedChapter(book, chapter, abbrev)
        tokens = tagged?.find((v) => v.verse === verse.verse)?.tokens ?? null
      }
      if (!tokens || tokens.length === 0 || !tokens.some((t) => t.s && t.s.length > 0)) {
        const taggedKjv = await loadTaggedChapter(book, chapter, 'KJV')
        const kjvTokens = taggedKjv?.find((v) => v.verse === verse.verse)?.tokens ?? null
        if (kjvTokens && kjvTokens.length > 0) {
          translation = 'KJV'
          tokens = kjvTokens
        }
      }

      setWordSelection(null)
      setInterlinearVerse({
        book,
        chapter,
        verse: verse.verse,
        tokens,
        translation,
        isFallback: translation === 'KJV' && abbrev !== 'KJV',
      })
    },
    [book, chapter, selectedVersion.abbreviation]
  )

  const lexiconToolbarEnabled = readerPrefs.lexiconEnabled

  useEffect(() => {
    setStudyToolbarOpen(false)
    setSelectedVerses([])
    setSelectionAnchor(null)
  }, [book, chapter, continuousReading])

  useEffect(() => {
    if (focusVerse === undefined || loading || verses.length === 0) {
      return
    }

    const key = `${book}-${chapter}-${focusVerse}-${selectedVersion.abbreviation}`
    if (focusHandledKeyRef.current === key) {
      return
    }

    const hasVerse = verses.some((v) => v.verse === focusVerse)
    if (!hasVerse) {
      focusHandledKeyRef.current = key
      onFocusVerseHandled?.()
      return
    }

    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-bible-verse="${focusVerse}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const match = verses.find((v) => v.verse === focusVerse)
      if (match) {
        setSelectedVerses([match])
        setSelectionAnchor(match)
        setStudyToolbarOpen(true)
      }
      focusHandledKeyRef.current = key
      onFocusVerseHandled?.()
    })
  }, [book, chapter, focusVerse, loading, verses, selectedVersion.abbreviation, onFocusVerseHandled])

  useLayoutEffect(() => {
    if (!scrollReaderToTopAfterNavRef.current) return
    scrollReaderToTopAfterNavRef.current = false
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [book, chapter])

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
          const chapterNotes = notesData.filter((note: any) => 
            note.book === book && note.chapter === chapter
          ).map((note: any) => ({
            id: note.id,
            verseId: `${note.book}-${note.chapter}-${note.verse}`,
            text: note.note ?? note.content ?? '',
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
          
          highlightsData.forEach((highlight: any) => {
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
          const bookmarkSet = new Set<string>(
            bookmarksData.map((bookmark: any) => `${bookmark.book}-${bookmark.chapter}-${bookmark.verse}`)
          )
          setBookmarks(bookmarkSet)
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      }
    }

    loadUserData()
  }, [user, book, chapter])

  const handleVerseSelect = useCallback((verse: BibleVerse, event: MouseEvent) => {
    const shiftKey = event.shiftKey
    const multiSelectKey = event.metaKey || event.ctrlKey

    const { selection, anchor } = updateVerseSelection({
      verse,
      chapterVerses: verses,
      currentSelection: selectedVerses,
      selectionAnchor,
      shiftKey,
      multiSelectKey,
    })

    setSelectedVerses(selection)
    setSelectionAnchor(anchor)
    setStudyToolbarOpen(selection.length > 0)
  }, [selectedVerses, selectionAnchor, verses])

  const dismissStudyToolbar = useCallback(() => {
    setStudyToolbarOpen(false)
    setSelectedVerses([])
    setSelectionAnchor(null)
  }, [])

  const handleAddNote = useCallback(() => {
    if (selectedVerses.length === 0) return
    setNoteVerses(sortVersesByNumber(selectedVerses))
    setIsNoteModalOpen(true)
  }, [selectedVerses])

  const handleSaveNote = async (noteText: string) => {
    const primaryVerse = noteVerses[0]
    if (!primaryVerse || !user?.id) return

    try {
      const existingNote = notes.find((note) => note.verseId === primaryVerse.id)

      if (existingNote) {
        const { error } = await notesService.saveNote(
          user.id,
          book,
          chapter,
          primaryVerse.verse,
          noteText
        )

        if (error) {
          console.error('Error updating note:', error)
          return
        }

        const updatedNotes = notes.map((note) =>
          note.verseId === primaryVerse.id
            ? { ...note, text: noteText, timestamp: new Date().toISOString() }
            : note
        )
        setNotes(updatedNotes)
      } else {
        const { data, error } = await notesService.saveNote(
          user.id,
          book,
          chapter,
          primaryVerse.verse,
          noteText
        )

        if (error) {
          console.error('Error creating note:', error)
          return
        }

        const newNote: Note = {
          id: data?.[0]?.id || Date.now().toString(),
          verseId: primaryVerse.id,
          text: noteText,
          timestamp: new Date().toISOString(),
          book,
          chapter,
          verse: primaryVerse.verse,
        }

        setNotes([...notes, newNote])
      }
    } catch (error) {
      console.error('Error saving note:', error)
    }
  }

  const handleCopyVerses = useCallback(async () => {
    if (selectedVerses.length === 0) return

    try {
      await navigator.clipboard.writeText(
        formatVersesForCopy(selectedVerses, selectedVersion.abbreviation)
      )
      toast.success(
        selectedVerses.length === 1 ? 'Verse copied to clipboard!' : 'Verses copied to clipboard!'
      )
    } catch (error) {
      console.error('Error copying verses:', error)
      toast.error('Failed to copy verses')
    }
  }, [selectedVerses, selectedVersion.abbreviation])

  const handleToggleHighlight = async (color: string = 'yellow') => {
    if (!user?.id) {
      console.warn('User not authenticated, cannot save highlight')
      return
    }
    if (selectedVerses.length === 0) return

    const allHighlighted = selectedVerses.every((verse) => highlights.has(verse.id))

    try {
      const newHighlights = new Set(highlights)
      const newColors = new Map(highlightColors)

      for (const verse of selectedVerses) {
        const key = `${book}-${chapter}-${verse.verse}`

        if (allHighlighted) {
          const { error } = await highlightsService.removeHighlight(user.id, book, chapter, verse.verse)
          if (error) {
            console.error('Error removing highlight:', error)
            return
          }
          newHighlights.delete(verse.id)
          newColors.delete(key)
        } else if (!highlights.has(verse.id)) {
          const { error } = await highlightsService.addHighlight(user.id, book, chapter, verse.verse, color)
          if (error) {
            console.error('Error adding highlight:', error)
            return
          }
          newHighlights.add(verse.id)
          newColors.set(key, color)
        }
      }

      setHighlights(newHighlights)
      setHighlightColors(newColors)
    } catch (error) {
      console.error('Error toggling highlight:', error)
    }
  }

  const handleToggleBookmark = async () => {
    if (!user?.id) {
      console.warn('User not authenticated, cannot save bookmark')
      return
    }
    if (selectedVerses.length === 0) return

    const allBookmarked = selectedVerses.every((verse) => bookmarks.has(verse.id))

    try {
      const newBookmarks = new Set(bookmarks)

      for (const verse of selectedVerses) {
        if (allBookmarked) {
          const { error } = await bookmarksService.removeBookmark(user.id, book, chapter, verse.verse)
          if (error) {
            console.error('Error removing bookmark:', error)
            return
          }
          newBookmarks.delete(verse.id)
        } else if (!bookmarks.has(verse.id)) {
          const { error } = await bookmarksService.addBookmark(user.id, book, chapter, verse.verse)
          if (error) {
            console.error('Error adding bookmark:', error)
            return
          }
          newBookmarks.add(verse.id)
        }
      }

      setBookmarks(newBookmarks)
    } catch (error) {
      console.error('Error toggling bookmark:', error)
    }
  }

  const selectedHasNote =
    selectedVerses.length === 1 &&
    notes.some((note) => note.verseId === selectedVerses[0].id)
  const selectedAllHighlighted =
    selectedVerses.length > 0 && selectedVerses.every((verse) => highlights.has(verse.id))
  const selectedAllBookmarked =
    selectedVerses.length > 0 && selectedVerses.every((verse) => bookmarks.has(verse.id))
  const noteModalExistingNote =
    noteVerses.length === 1
      ? notes.find((note) => note.verseId === noteVerses[0].id)
      : undefined

  const studyToolbarVisible = selectedVerses.length > 0 && studyToolbarOpen

  const renderStudyToolbar = () => {
    if (!studyToolbarVisible) return null

    return (
      <VerseStudyToolbar
        verses={sortVersesByNumber(selectedVerses)}
        hasNote={selectedHasNote}
        isHighlighted={selectedAllHighlighted}
        isBookmarked={selectedAllBookmarked}
        highlightAllowed={readerPrefs.highlightEnabled}
        onAddNote={handleAddNote}
        onCopy={() => void handleCopyVerses()}
        onToggleHighlight={(color) => void handleToggleHighlight(color ?? 'yellow')}
        onToggleBookmark={() => void handleToggleBookmark()}
        onWordStudy={
          lexiconToolbarEnabled && selectedVerses.length === 1
            ? () => void handleVerseWordStudy(selectedVerses[0])
            : undefined
        }
        onDismiss={dismissStudyToolbar}
      />
    )
  }

  const getVerseRange = (verses: BibleVerse[]) => {
    if (verses.length === 0) return ""
    if (verses.length === 1) return `v${verses[0].verse}`
    return `v${verses[0].verse}-${verses[verses.length - 1].verse}`
  }

  // Navigation helpers
  const navigateChapter = (nextBook: string, nextChapter: number) => {
    if (!onNavigate) return
    scrollReaderToTopAfterNavRef.current = true
    onNavigate(nextBook, nextChapter)
  }

  const handlePreviousChapter = () => {
    if (chapter > 1) {
      navigateChapter(book, chapter - 1)
    } else {
      // Go to previous book's last chapter
      const currentBookIndex = COMPLETE_BIBLE_BOOKS.findIndex(b => b.name === book)
      if (currentBookIndex > 0) {
        const previousBook = COMPLETE_BIBLE_BOOKS[currentBookIndex - 1]
        navigateChapter(previousBook.name, previousBook.chapters)
      }
    }
  }

  const handleNextChapter = () => {
    const maxChapters = currentBookInfo?.chapters || 1
    if (chapter < maxChapters) {
      navigateChapter(book, chapter + 1)
    } else {
      // Go to next book's first chapter
      const currentBookIndex = COMPLETE_BIBLE_BOOKS.findIndex(b => b.name === book)
      if (currentBookIndex < COMPLETE_BIBLE_BOOKS.length - 1) {
        const nextBook = COMPLETE_BIBLE_BOOKS[currentBookIndex + 1]
        navigateChapter(nextBook.name, 1)
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
      
      <div
        className={cn(
          readingModeClass,
          'max-md:pb-32 md:pb-6',
          studyToolbarVisible && 'max-md:pb-56 md:pb-44'
        )}
      >
        {continuousReading ? (
          <>
            <p
              className={cn(
                'reading-container text-justify hyphens-auto sm:text-left sm:hyphens-none',
                getBibleTextClasses(),
                getTransitionClass('default', 'verse') && 'animate-in fade-in-0 slide-in-from-bottom-4 duration-500',
                'leading-[1.78] tracking-[0.01em] text-foreground md:leading-relaxed'
              )}
            >
              {verses.map((verse) => (
                <VerseComponent
                  key={verse.id}
                  verse={verse}
                  continuous
                  isSelected={isVerseInSelection(verse, selectedVerses)}
                  hasNote={notes.some((note) => note.verseId === verse.id)}
                  isHighlighted={highlights.has(verse.id)}
                  isBookmarked={bookmarks.has(verse.id)}
                  highlightColor={highlightColors.get(`${book}-${chapter}-${verse.verse}`) || 'yellow'}
                  onSelect={handleVerseSelect}
                  onContinuousInteraction={() => setStudyToolbarOpen(true)}
                  taggedTokens={taggedVerses?.get(verse.verse)}
                  onWordSelect={handleWordSelect}
                />
              ))}
            </p>
          </>
        ) : (
          <div
            className={cn(
              'reading-container space-y-1',
              getBibleTextClasses(),
              getTransitionClass('default', 'verse') && 'animate-in fade-in-0 slide-in-from-bottom-4 duration-500'
            )}
          >
            {verses.map((verse, index) => (
              <div
                key={verse.id}
                className={cn(getTransitionClass('default', 'verse') && 'animate-in fade-in-0 slide-in-from-left-4')}
                style={{
                  animationDelay: getTransitionClass('default', 'verse') ? `${index * 50}ms` : '0ms',
                  animationDuration: getTransitionClass('default', 'verse') ? '300ms' : '0ms',
                }}
              >
                <VerseComponent
                  verse={verse}
                  isSelected={isVerseInSelection(verse, selectedVerses)}
                  hasNote={notes.some((note) => note.verseId === verse.id)}
                  isHighlighted={highlights.has(verse.id)}
                  isBookmarked={bookmarks.has(verse.id)}
                  onSelect={handleVerseSelect}
                  highlightColor={highlightColors.get(`${book}-${chapter}-${verse.verse}`) || 'yellow'}
                  taggedTokens={taggedVerses?.get(verse.verse)}
                  onWordSelect={handleWordSelect}
                />
              </div>
            ))}
          </div>
        )}

        {verses.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No verses available for this chapter.</p>
          </div>
        )}
        
        {/* Attribution */}
        <BibleAttribution variant="footer" className="mt-8" />
      </div>

      {renderStudyToolbar()}

      {/* Word study panel (lexicon) */}
      <WordStudyPanel
        selection={wordSelection}
        interlinear={interlinearVerse}
        onWordSelect={(strongsIds, surface) => {
          if (interlinearVerse) {
            setWordSelection({
              strongsIds,
              surface,
              book: interlinearVerse.book,
              chapter: interlinearVerse.chapter,
              verse: interlinearVerse.verse,
              translation: interlinearVerse.translation,
            })
          }
        }}
        onBackToVerse={() => setWordSelection(null)}
        onClose={() => {
          setWordSelection(null)
          setInterlinearVerse(null)
        }}
      />

      {/* Note Modal */}
      <NoteModal
        verses={noteVerses}
        existingNote={noteModalExistingNote}
        isOpen={isNoteModalOpen}
        onClose={() => {
          setIsNoteModalOpen(false)
          setNoteVerses([])
        }}
        onSave={handleSaveNote}
      />

      <nav
        className="fixed left-0 right-0 z-[28] flex items-center justify-center border-t bg-background/95 px-4 py-2.5 shadow-[0_-8px_24px_rgba(0,0,0,0.07)] backdrop-blur-md supports-[backdrop-filter]:bg-background/85 md:hidden"
        style={{
          bottom: 'max(5rem, calc(4.25rem + env(safe-area-inset-bottom, 0px)))',
        }}
        aria-label="Chapter navigation"
      >
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-6">
          <Button
            variant="outline"
            size="lg"
            className="h-12 min-w-[3.25rem] shrink-0 px-0"
            onClick={handlePreviousChapter}
            disabled={!canGoPrevious}
            data-testid="bible-chapter-prev-mobile"
            aria-label="Previous chapter"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex min-w-0 items-center justify-center gap-1">
            <button
              type="button"
              onClick={onBookClick}
              className="truncate text-sm font-medium text-muted-foreground hover:text-blue-600"
              data-testid="bible-reference-book-mobile"
              aria-label={`Select book, currently ${book}`}
            >
              {book}
            </button>
            <button
              type="button"
              onClick={onChapterClick}
              className="shrink-0 text-sm font-medium text-muted-foreground hover:text-blue-600"
              data-testid="bible-reference-chapter-mobile"
              aria-label={`Select chapter, currently ${chapter}`}
            >
              {chapter}
            </button>
          </div>
          <Button
            variant="outline"
            size="lg"
            className="h-12 min-w-[3.25rem] shrink-0 px-0"
            onClick={handleNextChapter}
            disabled={!canGoNext}
            data-testid="bible-chapter-next-mobile"
            aria-label="Next chapter"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </nav>
    </>
  )
}