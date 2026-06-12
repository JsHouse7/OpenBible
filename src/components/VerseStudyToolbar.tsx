"use client"

import { useState } from "react"
import { Bookmark, MessageSquare, Highlighter, BookmarkCheck, Languages, Copy } from "lucide-react"
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
  onDismiss?: () => void
  /** Wider layout when shown below a full chapter (continuous reading). */
  variant?: "default" | "chapter"
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
  variant = "default",
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
        "flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-3 dark:bg-muted/20",
        variant === "chapter" && "mt-4 shadow-sm",
        isAnimationEnabled("modal") && "animate-in slide-in-from-top-2 fade-in-0 duration-300",
        getTransitionClass("default", "modal")
      )}
    >
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
              "absolute left-0 top-full z-20 mt-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800",
              isAnimationEnabled("modal") && "animate-in slide-in-from-top-2 fade-in-0 duration-200"
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

      <span className="w-full text-xs text-muted-foreground sm:ml-auto sm:w-auto">
        {referenceLabel}
        {multiVerse && (
          <span className="ml-1 text-muted-foreground/80">({verses.length} verses)</span>
        )}
      </span>
      </div>
      {multiVerse && (
        <p className="text-xs text-muted-foreground">
          Tip: Shift+click for a range, Ctrl+click to add or remove verses.
        </p>
      )}
      {onDismiss && (
        <Button variant="outline" size="sm" className="self-end text-xs" onClick={onDismiss}>
          Done
        </Button>
      )}
    </div>
  )
}
