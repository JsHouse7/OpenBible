"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { BibleVersionSelector } from "./BibleVersionSelector"

interface ScriptureHeaderProps {
  book: string
  chapter: number
  verseRange?: string
  onBookClick: () => void
  onChapterClick: () => void
  onPreviousChapter: () => void
  onNextChapter: () => void
  canGoPrevious: boolean
  canGoNext: boolean
}

export function ScriptureHeader({ 
  book, 
  chapter, 
  verseRange, 
  onBookClick, 
  onChapterClick,
  onPreviousChapter,
  onNextChapter,
  canGoPrevious,
  canGoNext
}: ScriptureHeaderProps) {
  return (
    <div className="sticky top-16 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onPreviousChapter}
              disabled={!canGoPrevious}
              className="h-8 px-3"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2">
              <button
                onClick={onBookClick}
                className="text-lg font-semibold text-foreground hover:text-blue-600 transition-colors"
              >
                {book}
              </button>
              <button
                onClick={onChapterClick}
                className="text-lg font-semibold text-foreground hover:text-blue-600 transition-colors"
              >
                {chapter}
              </button>
              {verseRange && (
                <span className="text-sm text-muted-foreground font-normal ml-1">
                  ({verseRange})
                </span>
              )}
            </div>
            
            <BibleVersionSelector />
            
            <Button
              variant="outline"
              size="sm"
              onClick={onNextChapter}
              disabled={!canGoNext}
              className="h-8 px-3"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 