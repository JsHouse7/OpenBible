"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, BookOpen, ExternalLink, Languages, Loader2 } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/Button"
import { Separator } from "@/components/ui/separator"
import { useIsMobile } from "@/hooks/use-mobile"
import { useUserPreferences } from "@/components/UserPreferencesProvider"
import { getStrongsEntry, searchOccurrences } from "@/lib/lexiconService"
import { strongsLexiconUrl, englishmansConcordanceUrl, interlinearUrl } from "@/lib/biblehub"
import { buildBibleSearchParams } from "@/lib/bibleUrl"
import { cn } from "@/lib/utils"
import { TaggedVerseText } from "@/components/TaggedVerseText"
import type { StrongsEntry, ConcordanceResponse, WordSelection, TaggedToken } from "@/types/lexicon"

/** Tagged KJV verse shown for word-by-word study (used for untagged translations). */
export interface InterlinearVerse {
  book: string
  chapter: number
  verse: number
  tokens: TaggedToken[] | null
}

interface WordStudyPanelProps {
  selection: WordSelection | null
  /** When set, the panel shows the tagged KJV verse with clickable words. */
  interlinear?: InterlinearVerse | null
  /** Word activation inside the interlinear verse view. */
  onWordSelect?: (strongsIds: string[], surface: string) => void
  /** Clears only the word selection (returning to the interlinear view if open). */
  onBackToVerse?: () => void
  onClose: () => void
}

const INLINE_OCCURRENCES = 8

export function WordStudyPanel({
  selection,
  interlinear = null,
  onWordSelect,
  onBackToVerse,
  onClose,
}: WordStudyPanelProps) {
  const isMobile = useIsMobile()
  const router = useRouter()
  const { preferences } = useUserPreferences()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [entry, setEntry] = useState<StrongsEntry | null>(null)
  const [entryLoading, setEntryLoading] = useState(false)
  const [concordance, setConcordance] = useState<ConcordanceResponse | null>(null)
  const [concordanceLoading, setConcordanceLoading] = useState(false)

  // Reset active Strong's ID when a new word is selected
  useEffect(() => {
    setActiveId(selection ? selection.strongsIds[0] : null)
  }, [selection])

  // Load the dictionary entry for the active Strong's ID
  useEffect(() => {
    if (!activeId) {
      setEntry(null)
      return
    }
    let cancelled = false
    setEntryLoading(true)
    getStrongsEntry(activeId).then((result) => {
      if (!cancelled) {
        setEntry(result)
        setEntryLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [activeId])

  // Load concordance occurrences for the active Strong's ID
  useEffect(() => {
    if (!activeId) {
      setConcordance(null)
      return
    }
    let cancelled = false
    setConcordanceLoading(true)
    searchOccurrences(activeId, { limit: INLINE_OCCURRENCES }).then((result) => {
      if (!cancelled) {
        setConcordance(result)
        setConcordanceLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [activeId])

  const showVerseView = !selection && interlinear !== null
  if (!selection && !interlinear) return null

  const ref = selection ?? interlinear!
  const verseRef = `${ref.book} ${ref.chapter}:${ref.verse}`
  const lexiconUrl = activeId ? strongsLexiconUrl(activeId) : null
  const concordanceUrl = activeId ? englishmansConcordanceUrl(activeId) : null
  const interlinearLink = interlinearUrl(ref.book, ref.chapter, ref.verse)

  const navigateToVerse = (book: string, chapter: number, verse: number) => {
    onClose()
    router.push(`/bible?${buildBibleSearchParams(book, chapter, verse)}`)
  }

  // Interlinear verse view: tagged KJV text with clickable words
  if (showVerseView) {
    return (
      <Sheet open onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={cn(
            "overflow-y-auto",
            isMobile ? "max-h-[80vh] rounded-t-2xl" : "w-full sm:max-w-md"
          )}
        >
          <SheetHeader className="text-left">
            <SheetTitle className="flex flex-wrap items-center gap-2">
              <Languages className="h-5 w-5 text-primary" aria-hidden />
              <span>Word Study — {verseRef}</span>
            </SheetTitle>
            <SheetDescription>
              Tap a word to see its original Hebrew/Greek entry. Original-language data is shown
              from the Strong&apos;s-tagged KJV text.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            {interlinear!.tokens && interlinear!.tokens.length > 0 ? (
              <p className="rounded-lg border bg-muted/30 p-4 text-base leading-relaxed">
                <TaggedVerseText
                  tokens={interlinear!.tokens}
                  onWordSelect={(ids, surface) => onWordSelect?.(ids, surface)}
                />
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No tagged original-language data is available for this verse.
              </p>
            )}

            {interlinearLink && (
              <a
                href={interlinearLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                Full interlinear for {verseRef} on BibleHub
              </a>
            )}
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  if (!selection) return null

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "overflow-y-auto",
          isMobile ? "max-h-[80vh] rounded-t-2xl" : "w-full sm:max-w-md"
        )}
      >
        <SheetHeader className="text-left">
          {interlinear && onBackToVerse && (
            <button
              type="button"
              onClick={onBackToVerse}
              className="mb-1 inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to verse
            </button>
          )}
          <SheetTitle className="flex flex-wrap items-center gap-2">
            <Languages className="h-5 w-5 text-primary" aria-hidden />
            <span>&ldquo;{selection.surface}&rdquo;</span>
          </SheetTitle>
          <SheetDescription>{verseRef} (KJV)</SheetDescription>
        </SheetHeader>

        {selection.strongsIds.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Strong's numbers">
            {selection.strongsIds.map((id) => (
              <Button
                key={id}
                role="tab"
                aria-selected={id === activeId}
                variant={id === activeId ? "default" : "outline"}
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => setActiveId(id)}
              >
                {id}
              </Button>
            ))}
          </div>
        )}

        <div className="mt-4 space-y-4">
          {entryLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading lexicon entry…
            </div>
          )}

          {!entryLoading && !entry && activeId && (
            <p className="text-sm text-muted-foreground">
              No lexicon entry found for {activeId}.
            </p>
          )}

          {!entryLoading && entry && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span
                  className={cn(
                    "text-3xl",
                    entry.language === "hebrew" ? "font-serif" : "font-serif italic"
                  )}
                  lang={entry.language === "hebrew" ? "he" : "el"}
                  dir={entry.language === "hebrew" ? "rtl" : "ltr"}
                >
                  {entry.lemma}
                </span>
                {preferences.lexiconShowTransliteration && (
                  <span className="text-base italic text-muted-foreground">{entry.translit}</span>
                )}
                <Badge variant="secondary">{entry.id}</Badge>
                <Badge variant="outline" className="capitalize">
                  {entry.language}
                </Badge>
              </div>

              {preferences.lexiconShowTransliteration && entry.pron && (
                <p className="text-sm text-muted-foreground">Pronounced: {entry.pron}</p>
              )}
              {entry.pos && <p className="text-sm text-muted-foreground">{entry.pos}</p>}

              {entry.strongs_def && (
                <div>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Strong&apos;s Definition
                  </h4>
                  <p className="text-sm leading-relaxed">{entry.strongs_def}</p>
                </div>
              )}

              {entry.derivation && (
                <div>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Derivation
                  </h4>
                  <p className="text-sm leading-relaxed">{entry.derivation}</p>
                </div>
              )}

              {(entry.usage || entry.kjv_def) && (
                <div>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Translated in the KJV as
                  </h4>
                  <p className="text-sm leading-relaxed">{entry.usage || entry.kjv_def}</p>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Concordance: other verses using this original word */}
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" aria-hidden />
              Occurrences
              {concordance && <span className="normal-case">({concordance.total} verses)</span>}
            </h4>

            {concordanceLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Searching occurrences…
              </div>
            )}

            {!concordanceLoading && !concordance && (
              <p className="text-sm text-muted-foreground">
                Occurrence search is unavailable right now.
              </p>
            )}

            {!concordanceLoading && concordance && (
              <div className="space-y-2">
                {concordance.results.map((occ) => (
                  <button
                    key={`${occ.book}-${occ.chapter}-${occ.verse}`}
                    type="button"
                    onClick={() => navigateToVerse(occ.book, occ.chapter, occ.verse)}
                    className="block w-full rounded-md border border-transparent bg-muted/40 p-2 text-left text-sm transition-colors hover:border-border hover:bg-muted"
                  >
                    <span className="font-medium text-primary">
                      {occ.book} {occ.chapter}:{occ.verse}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {occ.text.length > 120 ? `${occ.text.slice(0, 120)}…` : occ.text}
                    </span>
                  </button>
                ))}
                {activeId && concordance.total > concordance.results.length && (
                  <Link
                    href={`/lexicon/${activeId}`}
                    onClick={onClose}
                    className="inline-block text-sm font-medium text-primary hover:underline"
                  >
                    View all {concordance.total} occurrences →
                  </Link>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* BibleHub deep-study links */}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Deeper Study on BibleHub
            </h4>
            <div className="flex flex-col gap-1.5">
              {lexiconUrl && (
                <a
                  href={lexiconUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  Lexicon entry for {activeId}
                </a>
              )}
              {concordanceUrl && (
                <a
                  href={concordanceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  Englishman&apos;s Concordance
                </a>
              )}
              {interlinearLink && (
                <a
                  href={interlinearLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  Interlinear for {verseRef}
                </a>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
