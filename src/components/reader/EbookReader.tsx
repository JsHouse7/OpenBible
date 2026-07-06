'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { LiteratureWork } from '@/lib/literatureParser'
import { readerThemeStyles } from '@/lib/readerPreferences'
import { useReaderPreferences } from '@/hooks/useReaderPreferences'
import {
  literatureProgressService,
  LiteratureBookmark,
} from '@/lib/literatureProgressService'
import { PaginatedView } from './PaginatedView'
import { ScrollView } from './ScrollView'
import { ReaderSettingsSheet } from './ReaderSettingsSheet'
import { TocDrawer } from './TocDrawer'
import { cn } from '@/lib/utils'

interface EbookReaderProps {
  work: LiteratureWork
  onClose: () => void
}

export function EbookReader({ work, onClose }: EbookReaderProps) {
  const { prefs, updatePrefs, resetPrefs, loaded } = useReaderPreferences()
  const [currentChapter, setCurrentChapter] = useState(0)
  const [positionAnchor, setPositionAnchor] = useState(0)
  const [showChrome, setShowChrome] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [tocOpen, setTocOpen] = useState(false)
  const [bookmarks, setBookmarks] = useState<LiteratureBookmark[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [restored, setRestored] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const theme = readerThemeStyles[prefs.theme]
  const chapter = work.chapters[currentChapter]
  const chapterHtml = chapter?.content ?? ''

  const bookPercent = useMemo(() => {
    const totalWords = work.chapters.reduce((s, c) => s + c.wordCount, 0)
    if (totalWords === 0) return 0
    let wordsBefore = 0
    for (let i = 0; i < currentChapter; i++) {
      wordsBefore += work.chapters[i].wordCount
    }
    const chapterFrac =
      chapter?.wordCount ? positionAnchor / Math.max(chapter.wordCount, 1) : 0
    return Math.min(100, ((wordsBefore + chapterFrac * (chapter?.wordCount ?? 0)) / totalWords) * 100)
  }, [work, currentChapter, positionAnchor, chapter])

  useEffect(() => {
    if (!loaded || restored) return
    literatureProgressService.getProgress(work.id).then((p) => {
      if (p) {
        setCurrentChapter(Math.min(p.chapterIndex, work.chapters.length - 1))
        setPositionAnchor(p.positionAnchor)
      }
      setRestored(true)
    })
    literatureProgressService.getBookmarks(work.id).then(setBookmarks)
  }, [work.id, work.chapters.length, loaded, restored])

  const saveProgress = useCallback(
    (chapterIdx: number, anchor: number, percent: number) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        literatureProgressService.saveProgress({
          workId: work.id,
          chapterIndex: chapterIdx,
          positionAnchor: anchor,
          percent,
        })
      }, 800)
    },
    [work.id]
  )

  useEffect(() => {
    if (!restored) return
    saveProgress(currentChapter, positionAnchor, bookPercent)
  }, [currentChapter, positionAnchor, bookPercent, saveProgress, restored])

  const handleBookSlider = (values: number[]) => {
    const target = values[0]
    const totalWords = work.chapters.reduce((s, c) => s + c.wordCount, 0)
    let acc = 0
    for (let i = 0; i < work.chapters.length; i++) {
      const chWords = work.chapters[i].wordCount
      const chEnd = ((acc + chWords) / totalWords) * 100
      if (target <= chEnd || i === work.chapters.length - 1) {
        setCurrentChapter(i)
        setPositionAnchor(0)
        break
      }
      acc += chWords
    }
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
    const excerpt = chapter?.plainText?.slice(positionAnchor, positionAnchor + 120) ?? ''
    const bm = await literatureProgressService.addBookmark({
      workId: work.id,
      chapterIndex: currentChapter,
      positionAnchor,
      label: chapter?.title,
      excerpt,
    })
    setBookmarks((prev) => [bm, ...prev])
  }

  const handleHighlight = async () => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed) return
    const text = sel.toString().trim()
    if (!text) return
    await literatureProgressService.addHighlight({
      workId: work.id,
      chapterIndex: currentChapter,
      startAnchor: positionAnchor,
      endAnchor: positionAnchor + text.length,
      color: 'yellow',
      excerpt: text.slice(0, 200),
    })
    sel.removeAllRanges()
  }

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
          showChrome ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none absolute'
        )}
        style={{ backgroundColor: theme.chrome, borderColor: 'transparent' }}
      >
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{work.title}</p>
          <p className="text-xs opacity-70 truncate">{chapter.title}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setTocOpen(true)} aria-label="Table of contents">
          <List className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={addBookmark} aria-label="Bookmark">
          <BookMarked className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleHighlight} aria-label="Highlight selection">
          <Highlighter className="h-5 w-5" />
        </Button>
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
        {prefs.readingMode === 'paginated' ? (
          <PaginatedView
            html={chapterHtml}
            prefs={prefs}
            onPageChange={(page, _total, anchor) => setPositionAnchor(anchor)}
          />
        ) : (
          <ScrollView
            html={chapterHtml}
            prefs={prefs}
            initialAnchor={positionAnchor}
            onScrollProgress={(anchor) => setPositionAnchor(anchor)}
          />
        )}
      </main>

      <footer
        className={cn(
          'px-4 py-3 border-t transition-all duration-300 safe-area-bottom',
          showChrome ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none absolute bottom-0 left-0 right-0'
        )}
        style={{ backgroundColor: theme.chrome }}
      >
        <div className="flex items-center gap-3 mb-2 text-xs opacity-70">
          <span>{Math.round(bookPercent)}%</span>
          <span className="flex-1 text-center">
            Ch. {currentChapter + 1} / {work.chapters.length}
          </span>
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
            disabled={currentChapter === 0}
            onClick={(e) => {
              e.stopPropagation()
              setCurrentChapter((c) => Math.max(0, c - 1))
              setPositionAnchor(0)
            }}
          >
            Previous
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={currentChapter >= work.chapters.length - 1}
            onClick={(e) => {
              e.stopPropagation()
              setCurrentChapter((c) => Math.min(work.chapters.length - 1, c + 1))
              setPositionAnchor(0)
            }}
          >
            Next chapter
          </Button>
        </div>
      </footer>

      <ReaderSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        prefs={prefs}
        onUpdate={updatePrefs}
        onReset={resetPrefs}
      />

      <TocDrawer
        open={tocOpen}
        onOpenChange={setTocOpen}
        chapters={work.chapters}
        currentChapter={currentChapter}
        bookmarks={bookmarks}
        onSelectChapter={(i) => {
          setCurrentChapter(i)
          setPositionAnchor(0)
        }}
        onSelectBookmark={(bm) => {
          setCurrentChapter(bm.chapterIndex)
          setPositionAnchor(bm.positionAnchor)
        }}
      />
    </div>
  )
}
