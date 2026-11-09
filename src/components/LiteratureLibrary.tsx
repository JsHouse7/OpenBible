'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Clock, Download, LayoutGrid, List, Plus, Search, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BookCover } from '@/components/literature/BookCover'
import { useAuth } from '@/components/AuthProvider'
import { LiteratureLibraryError, libraryViewState } from '@/lib/literature/catalog'
import { LiteratureService, type LiteratureWorkSummary } from '@/lib/literatureService'
import { literatureProgressService, type LiteratureProgress } from '@/lib/literatureProgressService'

type ViewMode = 'grid' | 'list'
type SortKey = 'recent' | 'title' | 'author' | 'progress'

export default function LiteratureLibrary() {
  const { user } = useAuth()
  const [works, setWorks] = useState<LiteratureWorkSummary[]>([])
  const [progressMap, setProgressMap] = useState<Record<string, LiteratureProgress>>({})
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading')
  const [errorCode, setErrorCode] = useState<string | undefined>()
  const [searchTerm, setSearchTerm] = useState('')
  const [difficulty, setDifficulty] = useState('all')
  const [author, setAuthor] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('title')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setStatus('loading')
      setErrorCode(undefined)
      const [index, allProgress] = await Promise.all([
        LiteratureService.getLiteratureIndex(),
        literatureProgressService.getAllProgress(),
      ])
      setWorks(index.works)
      const map: Record<string, LiteratureProgress> = {}
      allProgress.forEach((progress) => {
        map[progress.workId] = progress
      })
      setProgressMap(map)
      setStatus('ready')
    } catch (error) {
      setWorks([])
      setStatus('error')
      setErrorCode(error instanceof LiteratureLibraryError ? error.code : 'LIBRARY_REQUEST_FAILED')
    }
  }

  const authors = useMemo(
    () => [...new Set(works.map((work) => work.author).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [works]
  )

  const filteredWorks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    const list = works.filter((work) => {
      const matchesQuery = !query || [work.title, work.author, work.description].join(' ').toLowerCase().includes(query)
      const matchesDifficulty = difficulty === 'all' || work.difficulty === difficulty
      const matchesAuthor = author === 'all' || work.author === author
      return matchesQuery && matchesDifficulty && matchesAuthor
    })
    return [...list].sort((a, b) => compareWorks(a, b, sortKey, progressMap))
  }, [author, difficulty, progressMap, searchTerm, sortKey, works])

  const view = libraryViewState({ status, code: errorCode, works, filtered: filteredWorks })

  const continueReading = useMemo(() => {
    return works
      .filter((work) => {
        const progress = progressMap[work.id]
        return progress && progress.percent > 0 && progress.percent < 99
      })
      .sort((a, b) =>
        new Date(progressMap[b.id]?.lastReadAt ?? 0).getTime() -
        new Date(progressMap[a.id]?.lastReadAt ?? 0).getTime()
      )
      .slice(0, 8)
  }, [progressMap, works])

  const canManage = (work: LiteratureWorkSummary) =>
    Boolean(user?.id && work.ownerUserId && work.ownerUserId === user.id)

  const handleDelete = async (workId: string) => {
    if (!window.confirm('Delete this work?')) return
    try {
      await LiteratureService.deleteLiteratureWork(workId)
      await loadData()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'The work could not be deleted.')
    }
  }

  return (
    <div className="min-h-screen bg-[#f3eee6]">
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
          <Link href="/literature/admin" className={buttonVariants({ variant: 'default' })}>
            <Plus className="mr-1 h-4 w-4" />
            Add book
          </Link>
        </header>

        {view.kind === 'list' && continueReading.length > 0 && (
          <section className="mt-8">
            <h2 className="font-playfair text-2xl text-[#241910]">Continue reading</h2>
            <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
              {continueReading.map((work) => (
                <Link key={work.id} href={`/literature/${work.id}`} className="w-40 shrink-0">
                  <BookCover
                    title={work.title}
                    author={work.author}
                    id={work.id}
                    progress={progressMap[work.id]?.percent}
                    size="md"
                    className="w-full"
                  />
                  <p className="mt-2 text-sm text-[#5e5348]">{Math.round(progressMap[work.id]?.percent ?? 0)}% read</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-8 flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-[#8a7768]" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search title, author, or description"
              aria-label="Search the library"
              className="min-h-11 border-[#e4d7c6] bg-[#fffdf8] pl-10"
            />
          </div>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="min-h-11 w-full bg-[#fffdf8] lg:w-44" aria-label="Difficulty">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All difficulties</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
          <Select value={author} onValueChange={setAuthor}>
            <SelectTrigger className="min-h-11 w-full bg-[#fffdf8] lg:w-52" aria-label="Author">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All authors</SelectItem>
              {authors.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortKey} onValueChange={(value: SortKey) => setSortKey(value)}>
            <SelectTrigger className="min-h-11 w-full bg-[#fffdf8] lg:w-44" aria-label="Sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="author">Author</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
              <SelectItem value="recent">Recently read</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex overflow-hidden rounded-md border border-[#e4d7c6] bg-[#fffdf8]">
            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="min-h-11 min-w-11" aria-label="Grid" onClick={() => setViewMode('grid')}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="min-h-11 min-w-11" aria-label="List" onClick={() => setViewMode('list')}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {actionError && <p className="mt-4 text-sm text-[#8a3b24]">{actionError}</p>}

        <div className="mt-8">
          {view.kind === 'loading' && (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="mx-auto h-52 w-36 rounded-sm bg-[#e7dccb]" />
                  <div className="mx-auto mt-3 h-4 w-28 rounded bg-[#e7dccb]" />
                </div>
              ))}
            </div>
          )}

          {view.kind === 'error' && (
            <div className="rounded-md border border-[#e7c7b8] bg-[#fff8f4] px-6 py-12 text-center">
              <h2 className="font-playfair text-3xl text-[#241910]">The shelf did not load</h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#5e5348]">{view.message}</p>
              <Button className="mt-6" onClick={loadData}>Try again</Button>
            </div>
          )}

          {view.kind === 'empty-catalog' && (
            <div className="px-6 py-16 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-[#8a5a3a]" />
              <h2 className="mt-4 font-playfair text-3xl">No works are in the catalog yet</h2>
              <Link href="/literature/admin" className={`${buttonVariants({})} mt-6`}>
                <Plus className="mr-1 h-4 w-4" />
                Import a book
              </Link>
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

          {view.kind === 'list' && viewMode === 'grid' && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {filteredWorks.map((work) => {
                const progress = progressMap[work.id]?.percent ?? 0
                return (
                  <article key={work.id} className="group">
                    <Link href={`/literature/${work.id}`} className="block">
                      <BookCover title={work.title} author={work.author} id={work.id} progress={progress} className="mx-auto w-full max-w-[11rem]" />
                      <h2 className="mt-3 font-playfair text-xl leading-tight text-[#241910]">{work.title}</h2>
                    </Link>
                    <p className="mt-1 text-sm text-[#5e5348]">{work.author}{work.year ? ` · ${work.year}` : ''}</p>
                    {work.description && <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#3f372f]">{work.description}</p>}
                    <WorkMeta work={work} progress={progress} canDelete={canManage(work)} onDelete={() => handleDelete(work.id)} />
                  </article>
                )
              })}
            </div>
          )}

          {view.kind === 'list' && viewMode === 'list' && (
            <div className="space-y-3">
              {filteredWorks.map((work) => {
                const progress = progressMap[work.id]?.percent ?? 0
                return (
                  <Card key={work.id}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <Link href={`/literature/${work.id}`} className="shrink-0">
                        <BookCover title={work.title} author={work.author} id={work.id} progress={progress} size="sm" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/literature/${work.id}`}>
                          <h2 className="font-playfair text-2xl text-[#241910]">{work.title}</h2>
                        </Link>
                        <p className="text-sm text-[#5e5348]">{work.author}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-[#3f372f]">{work.description}</p>
                        <WorkMeta work={work} progress={progress} canDelete={canManage(work)} onDelete={() => handleDelete(work.id)} />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function WorkMeta({
  work,
  progress,
  canDelete,
  onDelete,
}: {
  work: LiteratureWorkSummary
  progress: number
  canDelete: boolean
  onDelete: () => void
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.12em] text-[#8a5a3a]">
      {work.textStatus === 'incomplete' && <span>Incomplete text</span>}
      {work.wordCount > 0 && (
        <span className="inline-flex items-center gap-1 normal-case tracking-normal text-[#5e5348]">
          <Clock className="h-3.5 w-3.5" />
          {formatReadingTime(work.estimatedReadingTime)}
        </span>
      )}
      <Badge variant="outline">{work.difficulty}</Badge>
      {progress > 0 && <span className="normal-case tracking-normal">{Math.round(progress)}% read</span>}
      <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => LiteratureService.downloadWorkAsPlainText(work.id)}>
        <Download className="h-3.5 w-3.5" />
        <span className="sr-only">Download</span>
      </Button>
      {canDelete && (
        <Button variant="ghost" size="sm" className="h-8 px-2 text-[#8a3b24]" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
          <span className="sr-only">Delete</span>
        </Button>
      )}
    </div>
  )
}

function compareWorks(
  a: LiteratureWorkSummary,
  b: LiteratureWorkSummary,
  sortKey: SortKey,
  progressMap: Record<string, LiteratureProgress>
) {
  if (sortKey === 'author') return a.author.localeCompare(b.author) || a.title.localeCompare(b.title)
  if (sortKey === 'progress') return (progressMap[b.id]?.percent ?? 0) - (progressMap[a.id]?.percent ?? 0)
  if (sortKey === 'recent') {
    const aTime = progressMap[a.id]?.lastReadAt ?? a.dateAdded
    const bTime = progressMap[b.id]?.lastReadAt ?? b.dateAdded
    return new Date(bTime).getTime() - new Date(aTime).getTime()
  }
  return a.title.localeCompare(b.title)
}

function formatReadingTime(minutes: number) {
  if (!minutes) return 'Short text'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}
