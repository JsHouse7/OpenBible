"use client"

import { useState } from "react"
import { Bookmark, MessageSquare, Highlighter, BookmarkCheck, Languages, Copy, X } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import { useAnimations } from "@/components/AnimationProvider"
import { formatVerseRangeLabel } from "@/lib/verseSelection"
import type { BibleVerse } from "@/data/completeBible"

export interface VerseStudyToolbarProps {
  verses: BibleVerse[]
  hasNote: boolean
  isHighlighted: boolean
  isBookmarked: boolean
  highlightAllowed: boolean
  onAddNote: () => void
  onToggleHighlight: (color?: string) => void
  onToggleBookmark: () => void
  onCopy: () => void
  /** Opens the original-language word study panel for this verse (lexicon feature). */
  onWordStudy?: () => void
  onDismiss: () => void
}

export function VerseStudyToolbar({
  verses,
  hasNote,
  isHighlighted,
  isBookmarked,
  highlightAllowed,
  onAddNote,
  onToggleHighlight,
  onToggleBookmark,
  onCopy,
  onWordStudy,
  onDismiss,
}: VerseStudyToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const { getTransitionClass, isAnimationEnabled } = useAnimations()
  const referenceLabel = formatVerseRangeLabel(verses)
  const multiVerse = verses.length > 1

  const highlightColors = [
    { name: "Yellow", value: "yellow", bg: "bg-yellow-200" },
    { name: "Blue", value: "blue", bg: "bg-blue-200" },
    { name: "Green", value: "green", bg: "bg-green-200" },
    { name: "Pink", value: "pink", bg: "bg-pink-200" },
    { name: "Purple", value: "purple", bg: "bg-purple-200" },
  ]

  const handleHighlightClick = () => {
    if (isHighlighted) {
      onToggleHighlight()
      setShowColorPicker(false)
    } else {
      setShowColorPicker(!showColorPicker)
    }
  }

  const handleColorSelect = (color: string) => {
    onToggleHighlight(color)
    setShowColorPicker(false)
  }

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-40 px-3",
        "bottom-[calc(max(5rem,calc(4.25rem+env(safe-area-inset-bottom,0px)))+4.25rem)]",
        "md:bottom-4 md:pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
      )}
      role="region"
      aria-label="Verse actions"
    >
      <div
        className={cn(
          "pointer-events-auto mx-auto flex max-w-3xl flex-col gap-2 rounded-2xl border border-border/60 bg-background/95 px-3 py-3 shadow-lg backdrop-blur-md dark:bg-background/90",
          isAnimationEnabled("modal") && "animate-in slide-in-from-bottom-2 fade-in-0 duration-300",
          getTransitionClass("default", "modal")
        )}
      >
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{referenceLabel}</p>
            {multiVerse && (
              <p className="text-xs text-muted-foreground">
                {verses.length} verses selected · tap more verses to add or remove
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 shrink-0 p-0"
            onClick={onDismiss}
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddNote}
            className={cn(
              "flex h-8 items-center gap-2 border border-blue-200/50 bg-blue-50 px-3 text-sm text-blue-700 dark:border-blue-800/30 dark:text-blue-300",
              isAnimationEnabled("button") && "hover:bg-blue-100 dark:hover:bg-blue-950/50",
              isAnimationEnabled("button") && "hover:scale-105 active:scale-95",
              getTransitionClass("fast", "button")
            )}
          >
            <MessageSquare className="h-4 w-4" />
            {hasNote ? "Edit Note" : "Add Note"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onCopy}
            className={cn(
              "flex h-8 items-center gap-2 border border-gray-200/50 bg-gray-50 px-3 text-sm text-gray-700 dark:border-gray-700/30 dark:bg-gray-900/40 dark:text-gray-300",
              isAnimationEnabled("button") && "hover:bg-gray-100 dark:hover:bg-gray-800/60",
              isAnimationEnabled("button") && "hover:scale-105 active:scale-95",
              getTransitionClass("fast", "button")
            )}
          >
            <Copy className="h-4 w-4" />
            Copy
          </Button>

          <div className="relative">
            {(highlightAllowed || isHighlighted) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleHighlightClick}
                className={cn(
                  "flex h-8 items-center gap-2 border border-yellow-200/50 px-3 text-sm dark:border-yellow-800/30",
                  isAnimationEnabled("button") && "hover:scale-105 active:scale-95",
                  getTransitionClass("fast", "button"),
                  isHighlighted
                    ? cn(
                        "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300",
                        isAnimationEnabled("button") && "hover:bg-yellow-200 dark:hover:bg-yellow-950/70"
                      )
                    : cn(
                        "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/20 dark:text-yellow-400",
                        isAnimationEnabled("button") && "hover:bg-yellow-100 dark:hover:bg-yellow-950/40"
                      )
                )}
              >
                <Highlighter className="h-4 w-4" />
                {isHighlighted ? "Remove Highlight" : "Highlight"}
              </Button>
            )}

            {highlightAllowed && showColorPicker && !isHighlighted && (
              <div
                className={cn(
                  "absolute bottom-full left-0 z-20 mb-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800",
                  isAnimationEnabled("modal") && "animate-in slide-in-from-bottom-2 fade-in-0 duration-200"
                )}
              >
                <div className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">Choose color:</div>
                <div className="flex gap-1">
                  {highlightColors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => handleColorSelect(color.value)}
                      className={cn(
                        "h-6 w-6 rounded-full border-2 border-white shadow-sm dark:border-gray-700",
                        color.bg,
                        isAnimationEnabled("button") && "hover:scale-110 active:scale-95",
                        getTransitionClass("fast", "button")
                      )}
                      title={color.name}
                      aria-label={`Highlight with ${color.name.toLowerCase()}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleBookmark}
            className={cn(
              "flex h-8 items-center gap-2 border border-green-200/50 px-3 text-sm dark:border-green-800/30",
              isAnimationEnabled("button") && "hover:scale-105 active:scale-95",
              getTransitionClass("fast", "button"),
              isBookmarked
                ? cn(
                    "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
                    isAnimationEnabled("button") && "hover:bg-green-200 dark:hover:bg-green-950/70"
                  )
                : cn(
                    "bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400",
                    isAnimationEnabled("button") && "hover:bg-green-100 dark:hover:bg-green-950/40"
                  )
            )}
          >
            {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            {isBookmarked ? "Remove Bookmark" : "Bookmark"}
          </Button>

          {onWordStudy && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onWordStudy}
              className={cn(
                "flex h-8 items-center gap-2 border border-purple-200/50 bg-purple-50 px-3 text-sm text-purple-700 dark:border-purple-800/30 dark:bg-purple-950/20 dark:text-purple-300",
                isAnimationEnabled("button") && "hover:bg-purple-100 dark:hover:bg-purple-950/50",
                isAnimationEnabled("button") && "hover:scale-105 active:scale-95",
                getTransitionClass("fast", "button")
              )}
            >
              <Languages className="h-4 w-4" />
              Word Study
            </Button>
          )}
        </div>

        {multiVerse && (
          <p className="text-xs text-muted-foreground">
            Desktop: Shift+click for a range, Ctrl/Cmd+click to toggle verses.
          </p>
        )}
      </div>
    </div>
  )
}
