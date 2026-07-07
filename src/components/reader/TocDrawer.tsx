'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { ReaderBookmark, ReaderChapter } from '@/components/reader/readerTypes'
import { cn } from '@/lib/utils'
import { BookMarked, List } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface TocDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chapters: ReaderChapter[]
  currentChapter: number
  chapterProgress?: number[]
  bookmarks?: ReaderBookmark[]
  showBookmarks?: boolean
  onSelectChapter: (index: number) => void
  onSelectBookmark?: (bookmark: ReaderBookmark) => void
}

export function TocDrawer({
  open,
  onOpenChange,
  chapters,
  currentChapter,
  chapterProgress = [],
  bookmarks = [],
  showBookmarks = true,
  onSelectChapter,
  onSelectBookmark,
}: TocDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[min(100vw,360px)]">
        <SheetHeader>
          <SheetTitle>Contents</SheetTitle>
        </SheetHeader>

        {showBookmarks && bookmarks.length > 0 ? (
          <Tabs defaultValue="toc" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="toc" className="gap-1">
                <List className="h-4 w-4" />
                Chapters
              </TabsTrigger>
              <TabsTrigger value="bookmarks" className="gap-1">
                <BookMarked className="h-4 w-4" />
                Bookmarks
              </TabsTrigger>
            </TabsList>

            <TabsContent value="toc" className="mt-4 max-h-[70vh] overflow-y-auto">
              <ChapterList
                chapters={chapters}
                currentChapter={currentChapter}
                chapterProgress={chapterProgress}
                onSelectChapter={(i) => {
                  onSelectChapter(i)
                  onOpenChange(false)
                }}
              />
            </TabsContent>

            <TabsContent value="bookmarks" className="mt-4 max-h-[70vh] overflow-y-auto">
              <BookmarkList
                bookmarks={bookmarks}
                onSelectBookmark={(bm) => {
                  onSelectBookmark?.(bm)
                  onOpenChange(false)
                }}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="mt-4 max-h-[70vh] overflow-y-auto">
            <ChapterList
              chapters={chapters}
              currentChapter={currentChapter}
              chapterProgress={chapterProgress}
              onSelectChapter={(i) => {
                onSelectChapter(i)
                onOpenChange(false)
              }}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function ChapterList({
  chapters,
  currentChapter,
  chapterProgress,
  onSelectChapter,
}: {
  chapters: ReaderChapter[]
  currentChapter: number
  chapterProgress: number[]
  onSelectChapter: (index: number) => void
}) {
  return (
    <ul className="space-y-1">
      {chapters.map((ch, i) => {
        const prog = chapterProgress[i] ?? 0
        return (
          <li key={String(ch.id)}>
            <button
              type="button"
              onClick={() => onSelectChapter(i)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                i === currentChapter
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-muted'
              )}
            >
              <div className="flex justify-between gap-2">
                <span className="line-clamp-2">{ch.title}</span>
                {prog > 0 && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {Math.round(prog)}%
                  </span>
                )}
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function BookmarkList({
  bookmarks,
  onSelectBookmark,
}: {
  bookmarks: ReaderBookmark[]
  onSelectBookmark: (bm: ReaderBookmark) => void
}) {
  if (bookmarks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No bookmarks yet.
      </p>
    )
  }
  return (
    <ul className="space-y-2">
      {bookmarks.map((bm) => (
        <li key={bm.id}>
          <button
            type="button"
            onClick={() => onSelectBookmark(bm)}
            className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted"
          >
            <div className="font-medium line-clamp-1">
              {bm.label || `Chapter ${bm.chapterIndex + 1}`}
            </div>
            {bm.excerpt && (
              <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {bm.excerpt}
              </div>
            )}
          </button>
        </li>
      ))}
    </ul>
  )
}
