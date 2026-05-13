'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { BibleReader } from '@/components/BibleReader'
import { BookSelector } from '@/components/BookSelector'
import { ChapterSelector } from '@/components/ChapterSelector'
import { useAuth } from '@/components/AuthProvider'
import { useUserPreferences } from '@/components/UserPreferencesProvider'
import { progressService } from '@/lib/database'
import { parseBibleUrlSearchParams, buildBibleSearchParams } from '@/lib/bibleUrl'

function BibleLoadingFallback() {
  return (
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
  )
}

function BiblePageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [currentBook, setCurrentBook] = useState('')
  const [currentChapter, setCurrentChapter] = useState(0)
  const [focusVerse, setFocusVerse] = useState<number | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [showBookSelector, setShowBookSelector] = useState(false)
  const [showChapterSelector, setShowChapterSelector] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const { preferences } = useUserPreferences()

  const persistReadingProgress = useCallback(
    (book: string, chapter: number) => {
      if (!preferences.autoSave) return
      if (user) {
        progressService.updateProgress(user.id, book, chapter).catch((error) => console.error('Error updating reading progress:', error))
      } else {
        try {
          localStorage.setItem('openbible-last-position', JSON.stringify({ book, chapter }))
        } catch (error) {
          console.error('Error saving position to localStorage:', error)
        }
      }
    },
    [user, preferences.autoSave]
  )

  const replaceBibleUrl = useCallback(
    (book: string, chapter: number, verse?: number) => {
      const qs = buildBibleSearchParams(book, chapter, verse)
      router.replace(`${pathname}?${qs}`, { scroll: false })
    },
    [pathname, router]
  )

  const handleBookClick = () => {
    setShowBookSelector(true)
  }

  const handleChapterClick = () => {
    setShowChapterSelector(true)
  }

  const handleBookSelect = (book: string) => {
    setCurrentBook(book)
    setCurrentChapter(1)
    setFocusVerse(undefined)
    replaceBibleUrl(book, 1)

    persistReadingProgress(book, 1)
  }

  const handleChapterSelect = (chapter: number) => {
    setCurrentChapter(chapter)
    setFocusVerse(undefined)
    replaceBibleUrl(currentBook, chapter)

    persistReadingProgress(currentBook, chapter)
  }

  useEffect(() => {
    let cancelled = false

    const loadLastReadingPosition = async () => {
      const fromUrl = parseBibleUrlSearchParams(searchParams)
      if (fromUrl) {
        setCurrentBook(fromUrl.book)
        setCurrentChapter(fromUrl.chapter)
        setFocusVerse(fromUrl.verse)
        if (!cancelled) setIsLoading(false)
        return
      }

      // Avoid treating a signed-in user as a guest before Supabase restores the session:
      // that would default to John 3, replace the URL, and then the URL branch would skip DB progress forever.
      if (authLoading) {
        if (!cancelled) setIsLoading(true)
        return
      }

      if (!cancelled) setIsLoading(true)

      try {
        if (user) {
          const { data } = await progressService.getUserProgress(user.id)

          if (cancelled) return

          if (data && data.length > 0) {
            const lastRead = data[0]
            setCurrentBook(lastRead.book)
            setCurrentChapter(lastRead.chapter)
            setFocusVerse(undefined)
            replaceBibleUrl(lastRead.book, lastRead.chapter)
          } else {
            setCurrentBook('John')
            setCurrentChapter(3)
            setFocusVerse(undefined)
            replaceBibleUrl('John', 3)
          }
        } else {
          if (cancelled) return

          const savedPosition = localStorage.getItem('openbible-last-position')
          if (savedPosition) {
            const { book, chapter } = JSON.parse(savedPosition) as { book: string; chapter: number }
            setCurrentBook(book)
            setCurrentChapter(chapter)
            setFocusVerse(undefined)
            replaceBibleUrl(book, chapter)
          } else {
            setCurrentBook('John')
            setCurrentChapter(3)
            setFocusVerse(undefined)
            replaceBibleUrl('John', 3)
          }
        }
      } catch (error) {
        console.error('Error loading reading position:', error)
        if (!cancelled) {
          setCurrentBook('John')
          setCurrentChapter(3)
          setFocusVerse(undefined)
          replaceBibleUrl('John', 3)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadLastReadingPosition()

    return () => {
      cancelled = true
    }
  }, [user, authLoading, searchParams, replaceBibleUrl])

  const handleNavigate = (book: string, chapter: number) => {
    setCurrentBook(book)
    setCurrentChapter(chapter)
    setFocusVerse(undefined)
    replaceBibleUrl(book, chapter)

    persistReadingProgress(book, chapter)
  }

  const handleFocusVerseConsumed = useCallback(() => {
    setFocusVerse(undefined)
    if (currentBook && currentChapter > 0) {
      replaceBibleUrl(currentBook, currentChapter)
    }
  }, [currentBook, currentChapter, replaceBibleUrl])

  return (
    <>
      {isLoading ? (
        <BibleLoadingFallback />
      ) : (
        <BibleReader
          book={currentBook}
          chapter={currentChapter}
          focusVerse={focusVerse}
          onFocusVerseHandled={handleFocusVerseConsumed}
          onNavigate={handleNavigate}
          onBookClick={handleBookClick}
          onChapterClick={handleChapterClick}
        />
      )}

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

export default function BiblePage() {
  return (
    <Suspense fallback={<BibleLoadingFallback />}>
      <BiblePageInner />
    </Suspense>
  )
}
