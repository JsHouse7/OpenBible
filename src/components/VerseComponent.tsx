"use client"

import { useState } from "react"
import { Bookmark, MessageSquare, Highlighter, BookmarkCheck } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import { useAnimations } from "@/components/AnimationProvider"
import type { BibleVerse } from "@/data/completeBible"

interface Note {
  id: string
  verseId: string
  text: string
  timestamp: string
  book: string
  chapter: number
  verse: number
}

interface VerseComponentProps {
  verse: BibleVerse
  isSelected: boolean
  hasNote: boolean
  isHighlighted: boolean
  isBookmarked: boolean
  onSelect: (verse: BibleVerse) => void
  onAddNote: (verse: BibleVerse) => void
  onToggleHighlight: (verse: BibleVerse) => void
  onToggleBookmark: (verse: BibleVerse) => void
}

export function VerseComponent({
  verse,
  isSelected,
  hasNote,
  isHighlighted,
  isBookmarked,
  onSelect,
  onAddNote,
  onToggleHighlight,
  onToggleBookmark,
}: VerseComponentProps) {
  const [showActions, setShowActions] = useState(false)
  const { getTransitionClass, isAnimationEnabled } = useAnimations()

  const handleVerseClick = () => {
    if (isSelected) {
      setShowActions(!showActions)
    } else {
      onSelect(verse)
      setShowActions(true)
    }
  }

  const handleActionClick = (action: () => void) => {
    action()
    setShowActions(false)
    onSelect(verse) // Keep verse selected after action
  }

  return (
    <div className="group">
      <div
        className={cn(
          "flex items-start gap-3 p-3 rounded-lg cursor-pointer",
          getTransitionClass('default', 'button'),
          isAnimationEnabled('button') && "hover:bg-muted/40 focus-within:bg-muted/40",
          isAnimationEnabled('button') && "dark:hover:bg-muted/20 dark:focus-within:bg-muted/20",
          isAnimationEnabled('button') && "hover:scale-[1.01] hover:shadow-sm",
          isSelected && "bg-blue-50/80 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 shadow-sm scale-[1.01]",
          isHighlighted && "bg-yellow-50/80 dark:bg-yellow-950/20 border border-yellow-200/60 dark:border-yellow-800/40",
          !isSelected && !isHighlighted && "border border-transparent"
        )}
        onClick={handleVerseClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleVerseClick()
          }
        }}
        aria-label={`Verse ${verse.verse}: ${verse.text}`}
      >
        <span className="flex-shrink-0 text-sm font-medium text-muted-foreground mt-1 min-w-[24px]">
          {verse.verse}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-foreground leading-relaxed font-serif text-base sm:text-lg">
            {verse.text}
          </p>

          <div className="flex items-center gap-1 mt-1">
            {hasNote && <MessageSquare className="h-3 w-3 text-blue-500" aria-label="Has note" />}
            {isHighlighted && <Highlighter className="h-3 w-3 text-yellow-500" aria-label="Highlighted" />}
            {isBookmarked && <BookmarkCheck className="h-3 w-3 text-green-500" aria-label="Bookmarked" />}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {isSelected && showActions && (
        <div 
          className={cn(
            "flex items-center gap-2 px-3 py-3 mt-2 bg-muted/30 dark:bg-muted/20 rounded-lg",
            isAnimationEnabled('modal') && "animate-in slide-in-from-top-2 fade-in-0 duration-300",
            getTransitionClass('default', 'modal')
          )}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleActionClick(() => onAddNote(verse))}
            className={cn(
              "flex items-center gap-2 text-sm h-8 px-3 bg-blue-50 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/30",
              isAnimationEnabled('button') && "hover:bg-blue-100 dark:hover:bg-blue-950/50",
              isAnimationEnabled('button') && "hover:scale-105 active:scale-95",
              getTransitionClass('fast', 'button')
            )}
          >
            <MessageSquare className="h-4 w-4" />
            {hasNote ? "Edit Note" : "Add Note"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleActionClick(() => onToggleHighlight(verse))}
            className={cn(
              "flex items-center gap-2 text-sm h-8 px-3 border border-yellow-200/50 dark:border-yellow-800/30",
              isAnimationEnabled('button') && "hover:scale-105 active:scale-95",
              getTransitionClass('fast', 'button'),
              isHighlighted 
                ? cn("bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-300",
                     isAnimationEnabled('button') && "hover:bg-yellow-200 dark:hover:bg-yellow-950/70")
                : cn("bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400",
                     isAnimationEnabled('button') && "hover:bg-yellow-100 dark:hover:bg-yellow-950/40")
            )}
          >
            <Highlighter className="h-4 w-4" />
            {isHighlighted ? "Remove Highlight" : "Highlight"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleActionClick(() => onToggleBookmark(verse))}
            className={cn(
              "flex items-center gap-2 text-sm h-8 px-3 border border-green-200/50 dark:border-green-800/30",
              isAnimationEnabled('button') && "hover:scale-105 active:scale-95",
              getTransitionClass('fast', 'button'),
              isBookmarked 
                ? cn("bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300",
                     isAnimationEnabled('button') && "hover:bg-green-200 dark:hover:bg-green-950/70")
                : cn("bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400",
                     isAnimationEnabled('button') && "hover:bg-green-100 dark:hover:bg-green-950/40")
            )}
          >
            {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            {isBookmarked ? "Remove Bookmark" : "Bookmark"}
          </Button>
        </div>
      )}
    </div>
  )
} 