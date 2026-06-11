"use client"

import { useState } from "react"
import { BookmarkCheck, Highlighter, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAnimations } from "@/components/AnimationProvider"
import { useFonts } from "@/hooks/useFonts"
import { useUserPreferences } from "@/components/UserPreferencesProvider"
import { VerseStudyToolbar } from "@/components/VerseStudyToolbar"
import { TaggedVerseText } from "@/components/TaggedVerseText"
import type { BibleVerse } from "@/data/completeBible"
import type { TaggedToken } from "@/types/lexicon"

interface VerseComponentProps {
  verse: BibleVerse
  isSelected: boolean
  hasNote: boolean
  isHighlighted: boolean
  isBookmarked: boolean
  highlightColor?: string
  onSelect: (verse: BibleVerse) => void
  onAddNote: (verse: BibleVerse) => void
  onToggleHighlight: (color?: string) => void
  onToggleBookmark: (verse: BibleVerse) => void
  /** Flowing chapter text; study actions are shown by the parent below the chapter. */
  continuous?: boolean
  /** Called when the user activates a verse in continuous layout (e.g. to open the study toolbar). */
  onContinuousInteraction?: (verse: BibleVerse) => void
  /** Strong's-tagged tokens for this verse; enables clickable word study when provided with onWordSelect. */
  taggedTokens?: TaggedToken[]
  /** Called when the user activates a tagged word/phrase. */
  onWordSelect?: (strongsIds: string[], surface: string, verse: BibleVerse) => void
  /** Shows a "Word Study" action in the study toolbar (original-language panel). */
  onWordStudy?: (verse: BibleVerse) => void
}

function getInlineHighlightStyles(color: string) {
  const colorMap = {
    yellow: "bg-yellow-100/85 dark:bg-yellow-950/35",
    blue: "bg-blue-100/85 dark:bg-blue-950/35",
    green: "bg-green-100/85 dark:bg-green-950/35",
    pink: "bg-pink-100/85 dark:bg-pink-950/35",
    purple: "bg-purple-100/85 dark:bg-purple-950/35",
  }
  return colorMap[color as keyof typeof colorMap] ?? colorMap.yellow
}

export function VerseComponent({
  verse,
  isSelected,
  hasNote,
  isHighlighted,
  isBookmarked,
  highlightColor = "yellow",
  onSelect,
  onAddNote,
  onToggleHighlight,
  onToggleBookmark,
  continuous = false,
  onContinuousInteraction,
  taggedTokens,
  onWordSelect,
  onWordStudy,
}: VerseComponentProps) {
  const [showActions, setShowActions] = useState(false)
  const { getTransitionClass, isAnimationEnabled } = useAnimations()
  const { getBibleTextClasses, getUITextClasses } = useFonts()
  const { preferences } = useUserPreferences()
  const showVerseNumbers = preferences.verseNumbers
  const showFlowVerseNumbers =
    preferences.verseNumbers && !(preferences.flowHideVerseNumbers ?? false)
  const highlightAllowed = preferences.highlightEnabled

  const handleVerseClick = () => {
    if (continuous) {
      onSelect(verse)
      onContinuousInteraction?.(verse)
      return
    }
    if (isSelected) {
      setShowActions(!showActions)
    } else {
      onSelect(verse)
      setShowActions(true)
    }
  }

  // Word-level study rendering (Strong's-tagged text) when data + handler exist
  const verseText =
    taggedTokens && onWordSelect ? (
      <TaggedVerseText
        tokens={taggedTokens}
        onWordSelect={(strongsIds, surface) => onWordSelect(strongsIds, surface, verse)}
      />
    ) : (
      verse.text
    )

  const getHighlightStyles = (color: string) => {
    const colorMap = {
      yellow: "bg-yellow-50/80 dark:bg-yellow-950/20 border-yellow-200/60 dark:border-yellow-800/40",
      blue: "bg-blue-50/80 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-800/40",
      green: "bg-green-50/80 dark:bg-green-950/20 border-green-200/60 dark:border-green-800/40",
      pink: "bg-pink-50/80 dark:bg-pink-950/20 border-pink-200/60 dark:border-pink-800/40",
      purple: "bg-purple-50/80 dark:bg-purple-950/20 border-purple-200/60 dark:border-purple-800/40",
    }
    return colorMap[color as keyof typeof colorMap] || colorMap.yellow
  }

  if (continuous) {
    return (
      <span className="inline">
        <span
          data-bible-verse={verse.verse}
          data-testid={`bible-verse-${verse.verse}`}
          role="button"
          tabIndex={0}
          onClick={handleVerseClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              handleVerseClick()
            }
          }}
          className={cn(
            "inline cursor-pointer rounded-sm px-0.5 align-baseline transition-colors",
            getTransitionClass("default", "button"),
            isAnimationEnabled("button") && "hover:bg-muted/50 dark:hover:bg-muted/30",
            isSelected && "bg-blue-100/90 ring-1 ring-blue-300/60 dark:bg-blue-950/50 dark:ring-blue-700/50",
            isHighlighted && getInlineHighlightStyles(highlightColor)
          )}
          aria-label={`Verse ${verse.verse}: ${verse.text}`}
        >
          {showFlowVerseNumbers && (
            <sup
              className={cn(
                "mr-0.5 select-none text-[0.7em] font-semibold text-muted-foreground",
                getUITextClasses()
              )}
              aria-hidden={!showFlowVerseNumbers}
            >
              {verse.verse}
            </sup>
          )}
          {(hasNote || isHighlighted || isBookmarked) && (
            <span className="sr-only">
              {hasNote && "Has note. "}
              {isHighlighted && "Highlighted. "}
              {isBookmarked && "Bookmarked."}
            </span>
          )}
          <span className={cn("text-foreground", getBibleTextClasses())}>{verseText}</span>
        </span>{" "}
      </span>
    )
  }

  return (
    <div className="group">
      <div
        data-bible-verse={verse.verse}
        data-testid={`bible-verse-${verse.verse}`}
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-lg p-3",
          getTransitionClass("default", "button"),
          isAnimationEnabled("button") && "hover:bg-muted/40 focus-within:bg-muted/40",
          isAnimationEnabled("button") && "dark:hover:bg-muted/20 dark:focus-within:bg-muted/20",
          isAnimationEnabled("button") && "hover:scale-[1.01] hover:shadow-sm",
          isSelected && "scale-[1.01] border border-blue-200/60 bg-blue-50/80 shadow-sm dark:border-blue-800/40 dark:bg-blue-950/20",
          isHighlighted && `border ${getHighlightStyles(highlightColor)}`,
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
        <span
          className={cn(
            "mt-1 min-w-[24px] flex-shrink-0 font-medium text-muted-foreground",
            getUITextClasses(),
            !showVerseNumbers && "hidden"
          )}
          aria-hidden={!showVerseNumbers}
        >
          {verse.verse}
        </span>

        <div className="min-w-0 flex-1">
          <p className={cn("text-foreground", getBibleTextClasses())}>{verseText}</p>

          <div className="mt-1 flex items-center gap-1">
            {hasNote && <MessageSquare className="h-3 w-3 text-blue-500" aria-label="Has note" />}
            {isHighlighted && <Highlighter className="h-3 w-3 text-yellow-500" aria-label="Highlighted" />}
            {isBookmarked && <BookmarkCheck className="h-3 w-3 text-green-500" aria-label="Bookmarked" />}
          </div>
        </div>
      </div>

      {isSelected && showActions && (
        <VerseStudyToolbar
          verse={verse}
          hasNote={hasNote}
          isHighlighted={isHighlighted}
          isBookmarked={isBookmarked}
          highlightAllowed={highlightAllowed}
          onAddNote={() => {
            setShowActions(false)
            onAddNote(verse)
          }}
          onToggleHighlight={(color) => {
            onToggleHighlight(color)
            setShowActions(false)
          }}
          onToggleBookmark={() => {
            setShowActions(false)
            onToggleBookmark(verse)
          }}
          onWordStudy={
            onWordStudy
              ? () => {
                  setShowActions(false)
                  onWordStudy(verse)
                }
              : undefined
          }
        />
      )}
    </div>
  )
}
