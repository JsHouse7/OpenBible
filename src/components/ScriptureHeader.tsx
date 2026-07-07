"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, SlidersHorizontal, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { BibleVersionSelector } from "./BibleVersionSelector"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useFonts } from "@/hooks/useFonts"
import { useUserPreferences } from "@/components/UserPreferencesProvider"
import { cn } from "@/lib/utils"

interface ScriptureHeaderProps {
  book: string
  chapter: number
  translation?: string
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
  translation = "KJV",
  verseRange,
  onBookClick,
  onChapterClick,
  onPreviousChapter,
  onNextChapter,
  canGoPrevious,
  canGoNext,
}: ScriptureHeaderProps) {
  const { getUITextClasses } = useFonts()
  const { preferences, updatePreferences } = useUserPreferences()
  const [readerOptionsOpen, setReaderOptionsOpen] = useState(false)

  useEffect(() => {
    setReaderOptionsOpen(false)
  }, [book, chapter])

  const flowSummary = preferences.continuousReading ? "Flow" : "Verses"
  const numbersInFlowSummary =
    preferences.continuousReading && preferences.verseNumbers
      ? preferences.flowHideVerseNumbers
        ? "Numbers hidden"
        : "Numbers shown"
      : preferences.continuousReading && !preferences.verseNumbers
        ? "Numbers off (Settings)"
        : null
  const wordStudySummary = preferences.lexiconEnabled ? "Word study on" : "Word study off"

  return (
    <div
      className="sticky top-14 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:top-16"
      data-testid="bible-scripture-header"
    >
      <div className="max-w-4xl mx-auto px-4 py-2 md:py-3">
        <div className="flex flex-col gap-2 md:gap-3">
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
            <div className="hidden min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3 md:flex md:flex-initial">
              <Button
                variant="outline"
                size="sm"
                onClick={onPreviousChapter}
                disabled={!canGoPrevious}
                className="h-8 shrink-0 px-2 sm:px-3"
                data-testid="bible-chapter-prev"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                <button
                  type="button"
                  onClick={onBookClick}
                  className={cn(
                    "truncate text-left text-base font-semibold text-foreground hover:text-blue-600 sm:text-lg",
                    getUITextClasses()
                  )}
                >
                  {book}
                </button>
                <button
                  type="button"
                  onClick={onChapterClick}
                  className={cn(
                    "text-base font-semibold text-foreground hover:text-blue-600 sm:text-lg",
                    getUITextClasses()
                  )}
                >
                  {chapter}
                </button>
                {verseRange && (
                  <span className={cn("text-xs font-normal text-muted-foreground sm:text-sm", getUITextClasses())}>
                    ({verseRange})
                  </span>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={onNextChapter}
                disabled={!canGoNext}
                className="h-8 shrink-0 px-2 sm:px-3"
                data-testid="bible-chapter-next"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-center gap-2 md:hidden">
              <div className="flex min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-center">
                <button
                  type="button"
                  onClick={onBookClick}
                  className={cn(
                    "truncate text-base font-semibold text-foreground hover:text-blue-600",
                    getUITextClasses()
                  )}
                >
                  {book}
                </button>
                <button
                  type="button"
                  onClick={onChapterClick}
                  className={cn("text-base font-semibold text-foreground hover:text-blue-600", getUITextClasses())}
                >
                  {chapter}
                </button>
                {verseRange && (
                  <span className={cn("text-xs font-normal text-muted-foreground", getUITextClasses())}>
                    ({verseRange})
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
              <Link
                href={`/bible/book?book=${encodeURIComponent(book)}&translation=${encodeURIComponent(translation)}&chapter=${chapter}`}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                title="Book view (ReadEra-style)"
                aria-label="Open book view"
                data-testid="bible-book-view"
              >
                <BookOpen className="h-5 w-5" />
              </Link>
              <BibleVersionSelector />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 md:hidden"
                onClick={() => setReaderOptionsOpen((o) => !o)}
                aria-expanded={readerOptionsOpen}
                aria-controls="bible-reader-options-panel"
                id="bible-reader-options-trigger"
                aria-label={`Reader options: ${[flowSummary, numbersInFlowSummary, wordStudySummary].filter(Boolean).join(", ") || "layout and flow"}`}
              >
                <SlidersHorizontal
                  className={cn(
                    "h-5 w-5 text-muted-foreground transition-colors",
                    readerOptionsOpen && "text-foreground"
                  )}
                />
              </Button>
            </div>
          </div>

          <div
            id="bible-reader-options-panel"
            role="region"
            aria-labelledby="bible-reader-options-trigger"
            className={cn(
              "flex flex-col gap-3 border-t border-border/50 pt-3 max-md:mt-0",
              readerOptionsOpen ? "block" : "max-md:hidden",
              "md:block"
            )}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <Label htmlFor="continuous-reading" className="text-xs font-medium text-foreground sm:text-sm">
                  Reading flow
                </Label>
                <p className="text-[11px] leading-snug text-muted-foreground sm:text-xs">
                  <span className="hidden sm:inline">
                    Flow: one paragraph for uninterrupted reading. Verses: one block per verse for study tools.
                  </span>
                  <span className="sm:hidden">Flow = one paragraph. Verses = one block per verse.</span>
                </p>
              </div>
              <div className="flex shrink-0 items-center justify-end gap-2 sm:justify-start">
                <span className="text-xs text-muted-foreground">Verses</span>
                <Switch
                  id="continuous-reading"
                  checked={preferences.continuousReading}
                  onCheckedChange={(checked) => updatePreferences({ continuousReading: checked })}
                  aria-label="Toggle continuous chapter reading"
                />
                <span className="text-xs text-muted-foreground">Flow</span>
              </div>
            </div>

            {preferences.continuousReading && (
              <div className="flex flex-col gap-2 border-t border-border/40 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <Label htmlFor="flow-verse-numbers" className="text-xs font-medium text-foreground sm:text-sm">
                    Numbers in flow
                  </Label>
                  <p className="text-[11px] leading-snug text-muted-foreground sm:text-xs">
                    {preferences.verseNumbers ? (
                      <>
                        <span className="hidden sm:inline">Hide superscripts for uninterrupted reading.</span>
                        <span className="sm:hidden">Superscripts on or off in flow.</span>
                      </>
                    ) : (
                      <span>Turn on verse numbers in Settings to show them here.</span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center justify-end gap-2 sm:justify-start">
                  <span className="text-xs text-muted-foreground">Hide</span>
                  <Switch
                    id="flow-verse-numbers"
                    checked={!preferences.flowHideVerseNumbers}
                    disabled={!preferences.verseNumbers}
                    onCheckedChange={(show) => updatePreferences({ flowHideVerseNumbers: !show })}
                    aria-label="Show verse numbers in flow reading mode"
                  />
                  <span className="text-xs text-muted-foreground">Show</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 border-t border-border/40 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <Label htmlFor="lexicon-enabled" className="text-xs font-medium text-foreground sm:text-sm">
                  Word study
                </Label>
                <p className="text-[11px] leading-snug text-muted-foreground sm:text-xs">
                  <span className="hidden sm:inline">
                    Tap words for Hebrew/Greek definitions (KJV, NKJV, ESV, NIV, YLT) or use the verse toolbar on any translation.
                  </span>
                  <span className="sm:hidden">Tap words or use the verse toolbar.</span>
                </p>
              </div>
              <div className="flex shrink-0 items-center justify-end gap-2 sm:justify-start">
                <span className="text-xs text-muted-foreground">Off</span>
                <Switch
                  id="lexicon-enabled"
                  checked={preferences.lexiconEnabled}
                  onCheckedChange={(checked) => updatePreferences({ lexiconEnabled: checked })}
                  aria-label="Toggle word study and lexicon"
                />
                <span className="text-xs text-muted-foreground">On</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
