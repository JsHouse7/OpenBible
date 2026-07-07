'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/components/AuthProvider'
import { progressService } from '@/lib/database'
import {
  buildBibleReaderBook,
  bibleChapterFromBookPercent,
  bookPercentForBibleChapter,
  getAdjacentBibleBook,
  getBibleBookChapterCount,
} from '@/lib/bibleBookContent'
import {
  readBibleBookPositions,
  readBibleDisplayOptions,
  writeBibleBookPosition,
  writeBibleDisplayOptions,
  type BibleReaderDisplayOptions,
} from '@/lib/bibleBookPersistence'
import type { ReaderBook, ReaderPersistence } from '@/components/reader/readerTypes'
import { EbookReader } from './EbookReader'

interface BibleBookReaderProps {
  bookName: string
  translation: string
  initialBibleChapter?: number
}

export function BibleBookReader({
  bookName,
  translation,
  initialBibleChapter = 1,
}: BibleBookReaderProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [readerBook, setReaderBook] = useState<ReaderBook | null>(null)
  const [loadProgress, setLoadProgress] = useState({ loaded: 0, total: 1 })
  const [loadError, setLoadError] = useState<string | null>(null)
  const [displayOpts, setDisplayOpts] = useState<BibleReaderDisplayOptions>(() =>
    readBibleDisplayOptions()
  )
  const lastBibleChapter = useRef(initialBibleChapter)
  const [activeBibleChapter, setActiveBibleChapter] = useState(initialBibleChapter)
  const bookId = `${translation}:${bookName}`

  const loadBook = useCallback(async () => {
    setLoadError(null)
    setReaderBook(null)
    try {
      const book = await buildBibleReaderBook(
        bookName,
        translation,
        displayOpts,
        setLoadProgress
      )
      setReaderBook(book)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load book')
    }
  }, [bookName, translation, displayOpts])

  useEffect(() => {
    loadBook()
  }, [loadBook])

  const persistence = useMemo<ReaderPersistence>(
    () => ({
      getProgress: async (id) => {
        const stored = readBibleBookPositions()[id]
        if (stored) return stored
        const percent = bookPercentForBibleChapter(
          readerBook ?? {
            id,
            title: bookName,
            chapters: [],
          },
          initialBibleChapter
        )
        if (readerBook && readerBook.chapters.length > 1) {
          const idx = readerBook.chapters.findIndex(
            (c) => c.bibleChapter === initialBibleChapter
          )
          return {
            chapterIndex: Math.max(0, idx),
            positionAnchor: 0,
            percent,
          }
        }
        return { chapterIndex: 0, positionAnchor: 0, percent }
      },
      saveProgress: async (id, progress) => {
        writeBibleBookPosition(id, progress)
      },
    }),
    [bookName, initialBibleChapter, readerBook]
  )

  const syncClassicProgress = useCallback(
    (bibleChapter: number) => {
      lastBibleChapter.current = bibleChapter
      if (user) {
        progressService
          .updateProgress(user.id, bookName, bibleChapter)
          .catch(console.error)
      } else {
        try {
          localStorage.setItem(
            'openbible-last-position',
            JSON.stringify({ book: bookName, chapter: bibleChapter })
          )
        } catch {
          /* ignore */
        }
      }
    },
    [user, bookName]
  )

  const handleProgressUpdate = useCallback(
    ({ bookPercent }: { bookPercent: number }) => {
      if (!readerBook) return
      const bc = bibleChapterFromBookPercent(readerBook, bookPercent)
      setActiveBibleChapter(bc)
      syncClassicProgress(bc)
    },
    [readerBook, syncClassicProgress]
  )

  const navigateToBook = (name: string, chapter = 1) => {
    router.push(
      `/bible/book?book=${encodeURIComponent(name)}&translation=${encodeURIComponent(translation)}&chapter=${chapter}`
    )
  }

  const handleClose = () => {
    router.push(
      `/bible?book=${encodeURIComponent(bookName)}&chapter=${lastBibleChapter.current}`
    )
  }

  const extraSettings = (
    <div className="space-y-4 pt-2">
      <Separator />
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label>Verse numbers</Label>
          <p className="text-xs text-muted-foreground">Show superscript verse numbers</p>
        </div>
        <Switch
          checked={displayOpts.showVerseNumbers}
          onCheckedChange={(checked) => {
            const next = { ...displayOpts, showVerseNumbers: checked }
            setDisplayOpts(next)
            writeBibleDisplayOptions(next)
          }}
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label>Seamless book flow</Label>
          <p className="text-xs text-muted-foreground">
            Read the whole book without chapter breaks
          </p>
        </div>
        <Switch
          checked={displayOpts.seamless}
          onCheckedChange={(checked) => {
            const next = { ...displayOpts, seamless: checked }
            setDisplayOpts(next)
            writeBibleDisplayOptions(next)
          }}
        />
      </div>
    </div>
  )

  if (loadError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-6 text-center">
        <div>
          <p className="text-destructive mb-4">{loadError}</p>
          <button type="button" onClick={handleClose} className="underline text-sm">
            Back to Bible reader
          </button>
        </div>
      </div>
    )
  }

  if (!readerBook) {
    const pct =
      loadProgress.total > 0
        ? Math.round((loadProgress.loaded / loadProgress.total) * 100)
        : 0
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#f4ecd8] p-6">
        <p className="text-sm mb-4 opacity-70">
          Loading {bookName} ({translation})…
        </p>
        <Progress value={pct} className="w-full max-w-xs h-2" />
        <p className="text-xs mt-2 opacity-50">
          {loadProgress.loaded} / {loadProgress.total} chapters
        </p>
      </div>
    )
  }

  const prevBook = getAdjacentBibleBook(bookName, 'prev')
  const nextBook = getAdjacentBibleBook(bookName, 'next')

  const chapterLabel = (_current: number, total: number) => {
    if (readerBook.tocChapters?.length) {
      return `Ch. ${activeBibleChapter} · ${bookName}`
    }
    return `Ch. ${activeBibleChapter} / ${total}`
  }

  return (
    <EbookReader
      key={`${bookId}-${displayOpts.seamless}-${displayOpts.showVerseNumbers}`}
      book={readerBook}
      persistence={persistence}
      onClose={handleClose}
      extraSettings={extraSettings}
      enableBookmarks={false}
      enableHighlights={false}
      onProgressUpdate={handleProgressUpdate}
      chapterLabel={chapterLabel}
      onReachBookEnd={() => {
        if (nextBook) navigateToBook(nextBook, 1)
      }}
      onReachBookStart={() => {
        if (prevBook) {
          navigateToBook(prevBook, getBibleBookChapterCount(prevBook))
        }
      }}
      nextChapterLabel={nextBook ? `Next: ${nextBook}` : 'Next chapter'}
      prevChapterLabel={prevBook ? `Prev: ${prevBook}` : 'Previous'}
      disableNextChapter={!nextBook}
      disablePrevChapter={!prevBook}
    />
  )
}
