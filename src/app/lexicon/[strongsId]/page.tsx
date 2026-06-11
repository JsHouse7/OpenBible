'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, ExternalLink, Languages, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getStrongsEntry, searchOccurrences, isValidStrongsId } from '@/lib/lexiconService'
import { strongsLexiconUrl, englishmansConcordanceUrl } from '@/lib/biblehub'
import { buildBibleSearchParams } from '@/lib/bibleUrl'
import { COMPLETE_BIBLE_BOOKS } from '@/data/completeBible'
import { cn } from '@/lib/utils'
import type { StrongsEntry, ConcordanceResponse } from '@/types/lexicon'

const PAGE_SIZE = 25
const ALL = '__all__'

export default function StrongsLexiconPage() {
  const params = useParams<{ strongsId: string }>()
  const router = useRouter()
  const strongsId = (params.strongsId || '').toUpperCase()
  const valid = isValidStrongsId(strongsId)

  const [entry, setEntry] = useState<StrongsEntry | null>(null)
  const [entryLoading, setEntryLoading] = useState(true)
  const [concordance, setConcordance] = useState<ConcordanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [bookFilter, setBookFilter] = useState<string>(ALL)
  const [surfaceFilter, setSurfaceFilter] = useState<string>(ALL)

  useEffect(() => {
    if (!valid) {
      setEntryLoading(false)
      return
    }
    let cancelled = false
    setEntryLoading(true)
    getStrongsEntry(strongsId).then((result) => {
      if (!cancelled) {
        setEntry(result)
        setEntryLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [strongsId, valid])

  useEffect(() => {
    if (!valid) return
    let cancelled = false
    setLoading(true)
    searchOccurrences(strongsId, {
      page,
      limit: PAGE_SIZE,
      book: bookFilter === ALL ? undefined : bookFilter,
      surface: surfaceFilter === ALL ? undefined : surfaceFilter,
    }).then((result) => {
      if (!cancelled) {
        setConcordance(result)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [strongsId, valid, page, bookFilter, surfaceFilter])

  const totalPages = useMemo(
    () => (concordance ? Math.max(1, Math.ceil(concordance.total / PAGE_SIZE)) : 1),
    [concordance]
  )

  if (!valid) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-lg font-semibold">Invalid Strong&apos;s number</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Expected a reference like G26 (Greek) or H430 (Hebrew).
        </p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/bible')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to the Bible
        </Button>
      </div>
    )
  }

  const lexiconUrl = strongsLexiconUrl(strongsId)
  const concordanceUrl = englishmansConcordanceUrl(strongsId)

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-3">
            <Languages className="h-5 w-5 text-primary" aria-hidden />
            {entryLoading ? (
              <span className="text-muted-foreground">Loading {strongsId}…</span>
            ) : entry ? (
              <>
                <span
                  className={cn('text-3xl', entry.language === 'hebrew' ? 'font-serif' : 'font-serif italic')}
                  lang={entry.language === 'hebrew' ? 'he' : 'el'}
                  dir={entry.language === 'hebrew' ? 'rtl' : 'ltr'}
                >
                  {entry.lemma}
                </span>
                <span className="text-lg italic text-muted-foreground">{entry.translit}</span>
              </>
            ) : (
              <span>{strongsId}</span>
            )}
            <Badge variant="secondary">{strongsId}</Badge>
            <Badge variant="outline" className="capitalize">
              {strongsId.startsWith('H') ? 'hebrew' : 'greek'}
            </Badge>
          </CardTitle>
          {entry?.pron && <CardDescription>Pronounced: {entry.pron}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-3">
          {entry?.pos && <p className="text-sm text-muted-foreground">{entry.pos}</p>}
          {entry?.strongs_def && (
            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Strong&apos;s Definition
              </h4>
              <p className="text-sm leading-relaxed">{entry.strongs_def}</p>
            </div>
          )}
          {entry?.derivation && (
            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Derivation
              </h4>
              <p className="text-sm leading-relaxed">{entry.derivation}</p>
            </div>
          )}
          {(entry?.usage || entry?.kjv_def) && (
            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Translated in the KJV as
              </h4>
              <p className="text-sm leading-relaxed">{entry.usage || entry.kjv_def}</p>
            </div>
          )}

          <Separator />

          <div className="flex flex-wrap gap-4">
            {lexiconUrl && (
              <a
                href={lexiconUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden /> BibleHub Lexicon
              </a>
            )}
            {concordanceUrl && (
              <a
                href={concordanceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden /> Englishman&apos;s Concordance
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-primary" aria-hidden />
            Occurrences
            {concordance && (
              <span className="text-sm font-normal text-muted-foreground">
                {concordance.total} verses (KJV)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Select
              value={bookFilter}
              onValueChange={(value) => {
                setBookFilter(value)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All books" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All books</SelectItem>
                {COMPLETE_BIBLE_BOOKS.map((b) => (
                  <SelectItem key={b.name} value={b.name}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {concordance && concordance.surfaces.length > 1 && (
              <Select
                value={surfaceFilter}
                onValueChange={(value) => {
                  setSurfaceFilter(value)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="All renderings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All renderings</SelectItem>
                  {concordance.surfaces.map((s) => (
                    <SelectItem key={s.surface} value={s.surface}>
                      {s.surface} ({s.count}×)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {loading && (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Searching occurrences…
            </div>
          )}

          {!loading && !concordance && (
            <p className="py-4 text-sm text-muted-foreground">
              Occurrence search is unavailable. The concordance database may not be set up yet.
            </p>
          )}

          {!loading && concordance && concordance.results.length === 0 && (
            <p className="py-4 text-sm text-muted-foreground">No occurrences found.</p>
          )}

          {!loading && concordance && concordance.results.length > 0 && (
            <div className="space-y-2">
              {concordance.results.map((occ, index) => (
                <button
                  key={`${occ.book}-${occ.chapter}-${occ.verse}-${index}`}
                  type="button"
                  onClick={() =>
                    router.push(`/bible?${buildBibleSearchParams(occ.book, occ.chapter, occ.verse)}`)
                  }
                  className="block w-full rounded-md border border-transparent bg-muted/40 p-3 text-left text-sm transition-colors hover:border-border hover:bg-muted"
                >
                  <span className="font-medium text-primary">
                    {occ.book} {occ.chapter}:{occ.verse}
                  </span>{' '}
                  <span className="text-xs text-muted-foreground">as &ldquo;{occ.surface}&rdquo;</span>
                  <p className="mt-1 text-muted-foreground">{occ.text}</p>
                </button>
              ))}

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
