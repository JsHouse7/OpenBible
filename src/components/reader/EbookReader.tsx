'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  BookMarked,
  Highlighter,
  List,
  Maximize,
  Minimize,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Slider } from '@/components/ui/slider'
import { readerThemeStyles } from '@/lib/readerPreferences'
import { useReaderPreferences } from '@/hooks/useReaderPreferences'
import { PaginatedView } from './PaginatedView'
import { ScrollView } from './ScrollView'
import { ReaderSettingsSheet } from './ReaderSettingsSheet'
import { TocDrawer } from './TocDrawer'
import { cn } from '@/lib/utils'
import type {
  EbookReaderProps,
  ReaderBookmark,
  ReaderChapter,
} from './readerTypes'

export function EbookReader({
  book,
  persistence,
  onClose,
  extraSettings,
  chapterLabel,
  onChapterChange,
  onProgressUpdate,
  onReachBookEnd,
  onReachBookStart,
  enableBookmarks = Boolean(persistence.addBookmark),
  enableHighlights = Boolean(persistence.addHighlight),
  initialChapterIndex = 0,
  nextChapterLabel = 'Next chapter',
  prevChapterLabel = 'Previous',
  disableNextChapter = false,
  disablePrevChapter = false,
}: EbookReaderProps) {
  const { prefs, updatePrefs, resetPrefs, loaded } = useReaderPreferences()
  const [currentChapter, setCurrentChapter] = useState(initialChapterIndex)
  const [chapterPage, setChapterPage] = useState(0)
  const [chapterTotalPages, setChapterTotalPages] = useState(1)
  const [chapterStartPage, setChapterStartPage] = useState(0)
  const [scrollAnchor, setScrollAnchor] = useState(0)
  const [showChrome, setShowChrome] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [tocOpen, setTocOpen] = useState(false)
  const [bookmarks, setBookmarks] = useState<ReaderBookmark[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [restored, setRestored] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const theme = readerThemeStyles[prefs.theme]
  const chapter = book.chapters[currentChapter]
  const chapterHtml = chapter?.html ?? ''

  const tocChapters: ReaderChapter[] = useMemo(() => {
    if (book.tocChapters?.length) {
      return book.tocChapters.map((t, i) => ({
        id: `toc-${i}`,
        title: t.title,
        html: '',
        wordCount: 0,
      }))
    }
    return book.chapters
  }, [book])

  const bookPercent = useMemo(() => {
    const totalWords = book.chapters.reduce((s, c) => s + c.wordCount, 0)
    if (totalWords === 0) return 0
    let wordsBefore = 0
    for (let i = 0; i < currentChapter; i++) {
      wordsBefore += book.chapters[i].wordCount
    }
    const chWords = chapter?.wordCount ?? 0
    const chapterProgress =
      chapterTotalPages > 0 ? (chapterPage + 1) / chapterTotalPages : 0
    return Math.min(
      100,
      ((wordsBefore + chapterProgress * chWords) / totalWords) * 100
    )
  }, [book, currentChapter, chapter, chapterPage, chapterTotalPages])

  useEffect(() => {
    if (!loaded || restored) return
    persistence.getProgress(book.id).then((p) => {
      if (p) {
        setCurrentChapter(Math.min(p.chapterIndex, book.chapters.length - 1))
        if (prefs.readingMode === 'paginated') {
          setChapterStartPage(p.positionAnchor)
        } else {
          setScrollAnchor(p.positionAnchor)
        }
      }
      setRestored(true)
    })
    persistence.getBookmarks?.(book.id).then((b) => setBookmarks(b ?? []))
  }, [book.id, book.chapters.length, loaded, restored, prefs.readingMode, persistence])

  const saveProgress = useCallback(
    (chapterIdx: number, pageOrAnchor: number, percent: number) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        persistence.saveProgress(book.id, {
          chapterIndex: chapterIdx,
          positionAnchor: pageOrAnchor,
          percent,
        })
      }, 800)
    },
    [book.id, persistence]
  )

  const progressAnchor =
    prefs.readingMode === 'paginated' ? chapterPage : scrollAnchor

  useEffect(() => {
    if (!restored) return
    saveProgress(currentChapter, progressAnchor, bookPercent)
    const bibleCh = chapter?.bibleChapter
    onChapterChange?.(currentChapter, bibleCh)
    onProgressUpdate?.({ bookPercent, chapterIndex: currentChapter })
  }, [
    currentChapter,
    progressAnchor,
    bookPercent,
    saveProgress,
    restored,
    onChapterChange,
    onProgressUpdate,
    chapter?.bibleChapter,
  ])

  const goToNextChapter = useCallback(() => {
    if (currentChapter >= book.chapters.length - 1) {
      onReachBookEnd?.()
      return
    }
    setChapterStartPage(0)
    setCurrentChapter((c) => c + 1)
  }, [currentChapter, book.chapters.length, onReachBookEnd])

  const goToPrevChapter = useCallback(() => {
    if (currentChapter <= 0) {
      onReachBookStart?.()
      return
    }
    setChapterStartPage(-1)
    setCurrentChapter((c) => c - 1)
  }, [currentChapter, onReachBookStart])

  const handleBookSlider = (values: number[]) => {
    const target = values[0]
    const totalWords = book.chapters.reduce((s, c) => s + c.wordCount, 0)

    if (book.chapters.length === 1 && totalWords > 0) {
      const fraction = target / 100
      const page = Math.round(fraction * Math.max(0, chapterTotalPages - 1))
      setChapterStartPage(page)
      setChapterPage(page)
      return
    }

    let acc = 0
    for (let i = 0; i < book.chapters.length; i++) {
      const chWords = book.chapters[i].wordCount
      const chEnd = ((acc + chWords) / totalWords) * 100
      if (target <= chEnd || i === book.chapters.length - 1) {
        setCurrentChapter(i)
        setChapterStartPage(0)
        setScrollAnchor(0)
        break
      }
      acc += chWords
    }
  }

  const handleTocSelect = (index: number) => {
    if (book.tocChapters?.length) {
      const entry = book.tocChapters[index]
      if (!entry) return
      const totalWords = book.chapters.reduce((s, c) => s + c.wordCount, 0)
      const percent =
        totalWords > 0 ? ((entry.wordOffset ?? 0) / totalWords) * 100 : 0
      handleBookSlider([percent])
      return
    }
    setCurrentChapter(index)
    setChapterStartPage(0)
    setScrollAnchor(0)
  }

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await rootRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const addBookmark = async () => {
    if (!persistence.addBookmark) return
    const excerpt = chapter?.plainText?.slice(0, 120) ?? ''
    const bm = await persistence.addBookmark(book.id, {
      chapterIndex: currentChapter,
      positionAnchor: progressAnchor,
      label: chapter?.title,
      excerpt,
    })
    setBookmarks((prev) => [bm, ...prev])
  }

  const handleHighlight = async () => {
    if (!persistence.addHighlight) return
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed) return
    const text = sel.toString().trim()
    if (!text) return
    await persistence.addHighlight(book.id, {
      chapterIndex: currentChapter,
      startAnchor: progressAnchor,
      endAnchor: progressAnchor + text.length,
      color: 'yellow',
      excerpt: text.slice(0, 200),
    })
    sel.removeAllRanges()
  }

  const footerChapterText =
    chapterLabel?.(currentChapter, book.chapters.length) ??
    `Ch. ${currentChapter + 1} / ${book.chapters.length}`

  if (!chapter) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>No content available.</p>
      </div>
    )
  }

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      <header
        className={cn(
          'flex items-center gap-2 px-3 py-2 border-b transition-all duration-300 safe-area-top',
          showChrome
            ? 'translate-y-0 opacity-100'
            : '-translate-y-full opacity-0 pointer-events-none absolute'
        )}
        style={{ backgroundColor: theme.chrome, borderColor: 'transparent' }}
      >
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{book.title}</p>
          <p className="text-xs opacity-70 truncate">
            {book.subtitle ?? chapter.title}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTocOpen(true)}
          aria-label="Table of contents"
        >
          <List className="h-5 w-5" />
        </Button>
        {enableBookmarks && (
          <Button variant="ghost" size="icon" onClick={addBookmark} aria-label="Bookmark">
            <BookMarked className="h-5 w-5" />
          </Button>
        )}
        {enableHighlights && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleHighlight}
            aria-label="Highlight selection"
          >
            <Highlighter className="h-5 w-5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={toggleFullscreen} aria-label="Fullscreen">
          {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)} aria-label="Settings">
          <Settings className="h-5 w-5" />
        </Button>
      </header>

      <main
        className="flex-1 relative overflow-hidden"
        onClick={() => setShowChrome((s) => !s)}
      >
        {!restored ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-current opacity-50" />
          </div>
        ) : prefs.readingMode === 'paginated' ? (
          <PaginatedView
            key={`${currentChapter}-${chapterStartPage}`}
            html={chapterHtml}
            prefs={prefs}
            initialPage={chapterStartPage}
            onPageChange={(page, total) => {
              setChapterPage(page)
              setChapterTotalPages(total)
            }}
            onReachChapterEnd={goToNextChapter}
            onReachChapterStart={goToPrevChapter}
          />
        ) : (
          <ScrollView
            html={chapterHtml}
            prefs={prefs}
            initialAnchor={scrollAnchor}
            onScrollProgress={(anchor) => setScrollAnchor(anchor)}
          />
        )}
      </main>

      <footer
        className={cn(
          'px-4 py-3 border-t transition-all duration-300 safe-area-bottom',
          showChrome
            ? 'translate-y-0 opacity-100'
            : 'translate-y-full opacity-0 pointer-events-none absolute bottom-0 left-0 right-0'
        )}
        style={{ backgroundColor: theme.chrome }}
      >
        <div className="flex items-center gap-3 mb-2 text-xs opacity-70">
          <span>{Math.round(bookPercent)}%</span>
          <span className="flex-1 text-center">{footerChapterText}</span>
        </div>
        <Slider
          value={[bookPercent]}
          min={0}
          max={100}
          step={0.5}
          onValueChange={handleBookSlider}
        />
        <div className="flex justify-between mt-2 gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={disablePrevChapter && currentChapter === 0}
            onClick={(e) => {
              e.stopPropagation()
              goToPrevChapter()
            }}
          >
            {prevChapterLabel}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={
              disableNextChapter && currentChapter >= book.chapters.length - 1
            }
            onClick={(e) => {
              e.stopPropagation()
              goToNextChapter()
            }}
          >
            {nextChapterLabel}
          </Button>
        </div>
      </footer>

      <ReaderSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        prefs={prefs}
        onUpdate={updatePrefs}
        onReset={resetPrefs}
        extraSettings={extraSettings}
      />

      <TocDrawer
        open={tocOpen}
        onOpenChange={setTocOpen}
        chapters={tocChapters}
        currentChapter={
          book.tocChapters?.length
            ? tocChapters.findIndex((_, i) => {
                const entry = book.tocChapters![i]
                const totalWords = book.chapters.reduce((s, c) => s + c.wordCount, 0)
                const wordsRead = (bookPercent / 100) * totalWords
                const next = book.tocChapters![i + 1]?.wordOffset ?? Infinity
                return wordsRead >= (entry.wordOffset ?? 0) && wordsRead < next
              })
            : currentChapter
        }
        bookmarks={bookmarks}
        showBookmarks={enableBookmarks}
        onSelectChapter={handleTocSelect}
        onSelectBookmark={(bm) => {
          setCurrentChapter(bm.chapterIndex)
          if (prefs.readingMode === 'paginated') {
            setChapterStartPage(bm.positionAnchor)
          } else {
            setScrollAnchor(bm.positionAnchor)
          }
        }}
      />
    </div>
  )
}
