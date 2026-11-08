'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Clock, Search, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/components/AuthProvider'
import { LiteratureReader } from '@/components/LiteratureReader'
import type { ReaderWork } from '@/components/literature/LiteratureReaderView'
import { LiteratureLibraryError, libraryViewState } from '@/lib/literature/catalog'
import { chooseFresherPosition, parsePositionRecord, readAllLocalPositions } from '@/lib/literature/position'
import type { StoredLiteraturePosition } from '@/lib/literature/types'
import { LiteratureService, type LiteratureWorkSummary } from '@/lib/literatureService'
import { userPreferencesService } from '@/lib/userPreferencesService'
import './literature/reader.css'

type SortKey = 'title' | 'author' | 'year' | 'readingTime' | 'added'

const LiteratureLibrary = ({
  previewWorks,
  previewBanner,
  resolvePreviewWork,
}: {
  previewWorks?: LiteratureWorkSummary[]
  previewBanner?: string
  resolvePreviewWork?: (id: string) => ReaderWork | null
}) => {
  const { user } = useAuth()
  const [works, setWorks] = useState<LiteratureWorkSummary[]>(previewWorks ?? [])
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>(previewWorks ? 'ready' : 'loading')
  const [errorCode, setErrorCode] = useState<string | undefined>()
  const [searchTerm, setSearchTerm] = useState('')
  const [difficulty, setDifficulty] = useState('all')
  const [author, setAuthor] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('title')
  const [selectedWork, setSelectedWork] = useState<string | null>(null)
  const [previewWork, setPreviewWork] = useState<ReaderWork | null>(null)
  const [positions, setPositions] = useState<Record<string, StoredLiteraturePosition>>({})
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (previewWorks) return
    loadLiteratureWorks()
  }, [previewWorks])

  useEffect(() => {
    const local = readAllLocalPositions()
    setPositions(local)
    let cancelled = false
    userPreferencesService.getPreferences()
      .then((preferences) => {
        if (cancelled) return
        const remote = preferences.literatureReadingPositions
        if (!remote || typeof remote !== 'object') return
        const merged = { ...local }
        for (const [workId, value] of Object.entries(remote)) {
          const parsed = parsePositionRecord(value)
          if (!parsed) continue
          const stored = { workId, ...parsed }
          merged[workId] = chooseFresherPosition(merged[workId] ?? null, stored) ?? stored
        }
        setPositions(merged)
      })
      .catch(() => {
        // A signed-out 401 is not a catalog failure.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const loadLiteratureWorks = async () => {
    try {
      setStatus('loading')
      setErrorCode(undefined)
      const index = await LiteratureService.getLiteratureIndex()
      setWorks(index.works)
      setStatus('ready')
    } catch (error) {
      setWorks([])
      setStatus('error')
      setErrorCode(error instanceof LiteratureLibraryError ? error.code : 'LIBRARY_REQUEST_FAILED')
    }
  }

  const authors = useMemo(
    () => [...new Set(works.map((work) => work.author))].sort((a, b) => a.localeCompare(b)),
    [works]
  )

  const filteredWorks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    const next = works.filter((work) => {
      const matchesQuery = !query || [work.title, work.author, work.description].join(' ').toLowerCase().includes(query)
      const matchesDifficulty = difficulty === 'all' || work.difficulty === difficulty
      const matchesAuthor = author === 'all' || work.author === author
      return matchesQuery && matchesDifficulty && matchesAuthor
    })
    next.sort((a, b) => compareWorks(a, b, sortKey))
    return next
  }, [author, difficulty, searchTerm, sortKey, works])

  const view = libraryViewState({ status, code: errorCode, works, filtered: filteredWorks })
  const continueReading = filteredWorks
    .map((work) => ({ work, position: positions[work.id] }))
    .filter((item): item is { work: LiteratureWorkSummary; position: StoredLiteraturePosition } => Boolean(item.position))
    .sort((a, b) => Date.parse(b.position.updatedAt || '') - Date.parse(a.position.updatedAt || ''))

  const openWork = (workId: string) => {
    setPreviewWork(resolvePreviewWork?.(workId) ?? null)
    setSelectedWork(workId)
  }

  const handleDeleteWork = async (workId: string) => {
    if (!user) return
    if (!window.confirm('Delete this work from the library?')) return
    try {
      await LiteratureService.deleteLiteratureWork(workId)
      await loadLiteratureWorks()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'The work could not be deleted.')
    }
  }

  return (
    <div className="literature-room min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="flex flex-col gap-6 border-b border-[#e2d5c3] pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#8a5a3a]">Christian letters</p>
            <h1 className="mt-2 font-playfair text-5xl text-[#241910]">Library</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#5e5348]">
              {status === 'ready'
                ? `${works.length} ${works.length === 1 ? 'work' : 'works'} on the shelf.`
                : 'Books, sermons, and devotional writing.'}
            </p>
          </div>
          <Link href="/literature/admin" className="text-sm text-[#6d432b] underline-offset-4 hover:underline">
            <Settings className="mr-1 inline h-4 w-4" />
            Catalog tools
          </Link>
        </header>

        {previewBanner && (
          <p className="mt-6 rounded-md border border-[#e2c7a4] bg-[#fff8ee] px-4 py-3 text-sm text-[#6d432b]">
            {previewBanner}
          </p>
        )}

        {continueReading.length > 0 && view.kind === 'list' && (
          <section className="mt-8">
            <h2 className="font-playfair text-2xl text-[#241910]">Continue reading</h2>
            <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
              {continueReading.map(({ work, position }) => (
                <button key={work.id} type="button" onClick={() => openWork(work.id)} className="w-64 shrink-0 rounded-md border border-[#e4d7c6] bg-[#fffdf8] p-4 text-left">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#8a5a3a]">{position.chapterTitle || `Chapter ${position.chapterIndex + 1}`}</p>
                  <p className="mt-2 font-playfair text-xl leading-tight text-[#241910]">{work.title}</p>
                  <p className="mt-2 text-sm text-[#5e5348]">{work.author}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="mt-8 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-[#8a7768]" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search title, author, or description"
              className="min-h-11 border-[#e4d7c6] bg-[#fffdf8] pl-10"
              aria-label="Search the library"
            />
          </div>
          <select aria-label="Difficulty" className="min-h-11 rounded-md border border-[#e4d7c6] bg-[#fffdf8] px-3 text-sm" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
            <option value="all">All difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <select aria-label="Author" className="min-h-11 rounded-md border border-[#e4d7c6] bg-[#fffdf8] px-3 text-sm" value={author} onChange={(event) => setAuthor(event.target.value)}>
            <option value="all">All authors</option>
            {authors.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <select aria-label="Sort" className="min-h-11 rounded-md border border-[#e4d7c6] bg-[#fffdf8] px-3 text-sm" value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
            <option value="title">Title</option>
            <option value="author">Author</option>
            <option value="year">Year</option>
            <option value="readingTime">Reading time</option>
            <option value="added">Recently added</option>
          </select>
        </div>

        {actionError && <p className="mt-4 text-sm text-[#8a3b24]">{actionError}</p>}

        <div className="mt-8">
          {view.kind === 'loading' && <LoadingShelf />}
          {view.kind === 'error' && (
            <div className="rounded-md border border-[#e7c7b8] bg-[#fff8f4] px-6 py-10 text-center">
              <h2 className="font-playfair text-3xl text-[#241910]">The shelf did not load</h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#5e5348]">{view.message}</p>
              <Button className="mt-6" onClick={loadLiteratureWorks}>Try again</Button>
            </div>
          )}
          {view.kind === 'empty-catalog' && (
            <div className="px-6 py-16 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-[#8a5a3a]" />
              <h2 className="mt-4 font-playfair text-3xl">No works are in the catalog yet</h2>
            </div>
          )}
          {view.kind === 'empty-filters' && (
            <div className="px-6 py-16 text-center">
              <h2 className="font-playfair text-3xl">Nothing matches these filters</h2>
              <Button className="mt-6" variant="outline" onClick={() => {
                setSearchTerm('')
                setDifficulty('all')
                setAuthor('all')
              }}>Clear filters</Button>
            </div>
          )}
          {view.kind === 'list' && (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filteredWorks.map((work) => (
                <article key={work.id} className="flex flex-col">
                  <button type="button" onClick={() => openWork(work.id)} className="text-left">
                    <Cover title={work.title} author={work.author} year={work.year} />
                    <h2 className="mt-4 font-playfair text-2xl leading-tight text-[#241910]">{work.title}</h2>
                  </button>
                  <p className="mt-1 text-sm text-[#5e5348]">{work.author}{work.year ? ` · ${work.year}` : ''}</p>
                  {work.description && <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#3f372f]">{work.description}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#8a5a3a]">
                    {work.textStatus === 'incomplete' && <span>Incomplete text</span>}
                    {work.wordCount > 0 && (
                      <span className="inline-flex items-center gap-1 normal-case tracking-normal text-[#5e5348]">
                        <Clock className="h-3.5 w-3.5" />
                        {formatReadingTime(work.estimatedReadingTime)}
                      </span>
                    )}
                    <span>{work.difficulty}</span>
                    {user && (
                      <button type="button" className="min-h-11 normal-case tracking-normal text-[#8a3b24]" onClick={() => handleDeleteWork(work.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedWork && (
        <LiteratureReader
          workId={selectedWork}
          initialWork={previewWork}
          previewLabel={previewBanner ? 'Local fixture preview. This is not a catalog work.' : undefined}
          onClose={() => {
            setSelectedWork(null)
            setPreviewWork(null)
            setPositions(readAllLocalPositions())
          }}
        />
      )}
    </div>
  )
}

function Cover({ title, author, year }: { title: string; author: string; year?: number }) {
  return (
    <div className="literature-cover flex aspect-[3/4] flex-col justify-between rounded-sm p-5" style={{ backgroundColor: coverColor(title) }}>
      <p className="font-playfair text-2xl leading-tight text-[#f8f1e6]">{title}</p>
      <div>
        <div className="mb-3 h-px w-10 bg-[#f8f1e6]/70" />
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#f8f1e6]/85">{author}</p>
        {year ? <p className="mt-1 text-xs text-[#f8f1e6]/75">{year}</p> : null}
      </div>
    </div>
  )
}

function LoadingShelf() {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-[3/4] rounded-sm bg-[#e7dccb]" />
          <div className="mt-4 h-6 w-3/4 rounded bg-[#e7dccb]" />
          <div className="mt-2 h-4 w-1/2 rounded bg-[#efe4d4]" />
        </div>
      ))}
    </div>
  )
}

function coverColor(title: string) {
  let hash = 0
  for (const char of title) hash = (hash * 33 + char.charCodeAt(0)) >>> 0
  const hue = 16 + (hash % 32)
  const lightness = 28 + (hash % 8)
  return `hsl(${hue} 32% ${lightness}%)`
}

function compareWorks(a: LiteratureWorkSummary, b: LiteratureWorkSummary, sortKey: SortKey) {
  if (sortKey === 'author') return a.author.localeCompare(b.author) || a.title.localeCompare(b.title)
  if (sortKey === 'year') return (a.year ?? 9999) - (b.year ?? 9999) || a.title.localeCompare(b.title)
  if (sortKey === 'readingTime') return a.estimatedReadingTime - b.estimatedReadingTime
  if (sortKey === 'added') return (b.dateAdded || '').localeCompare(a.dateAdded || '')
  return a.title.localeCompare(b.title)
}

function formatReadingTime(minutes: number) {
  if (!minutes) return 'Short text'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

export default LiteratureLibrary
