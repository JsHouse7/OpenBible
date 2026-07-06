'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Search,
  BookOpen,
  Clock,
  Download,
  Settings,
  LayoutGrid,
  List,
  Plus,
  Trash2,
  ChevronDown,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/components/AuthProvider'
import { useFonts } from '@/hooks/useFonts'
import { cn } from '@/lib/utils'
import { LiteratureService, LiteratureWorkSummary } from '@/lib/literatureService'
import { literatureProgressService, LiteratureProgress } from '@/lib/literatureProgressService'
import { BookCover } from '@/components/literature/BookCover'

type ViewMode = 'grid' | 'list'
type SortKey = 'title' | 'author' | 'recent' | 'progress'

const LiteratureLibrary = () => {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortKey, setSortKey] = useState<SortKey>('recent')
  const [works, setWorks] = useState<LiteratureWorkSummary[]>([])
  const [progressMap, setProgressMap] = useState<Record<string, LiteratureProgress>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getUITextClasses, getHeadingClasses } = useFonts()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [index, allProgress] = await Promise.all([
        LiteratureService.getLiteratureIndex(),
        literatureProgressService.getAllProgress(),
      ])
      setWorks(index.works)
      const map: Record<string, LiteratureProgress> = {}
      allProgress.forEach((p) => {
        map[p.workId] = p
      })
      setProgressMap(map)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load library')
    } finally {
      setLoading(false)
    }
  }

  const canManage = (work: LiteratureWorkSummary) =>
    Boolean(user?.id && work.ownerUserId && work.ownerUserId === user.id)

  const q = searchTerm.toLowerCase()

  const filteredWorks = useMemo(() => {
    let list = works.filter((work) => {
      const matchesSearch =
        work.title.toLowerCase().includes(q) ||
        work.author.toLowerCase().includes(q) ||
        work.description.toLowerCase().includes(q)
      const matchesCategory =
        selectedCategory === 'all' || work.difficulty === selectedCategory
      return matchesSearch && matchesCategory
    })

    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'author':
          return a.author.localeCompare(b.author)
        case 'progress': {
          const pa = progressMap[a.id]?.percent ?? 0
          const pb = progressMap[b.id]?.percent ?? 0
          return pb - pa
        }
        case 'recent':
        default: {
          const da = progressMap[a.id]?.lastReadAt ?? a.dateAdded
          const db = progressMap[b.id]?.lastReadAt ?? b.dateAdded
          return new Date(db).getTime() - new Date(da).getTime()
        }
      }
    })

    return list
  }, [works, q, selectedCategory, sortKey, progressMap])

  const continueReading = useMemo(() => {
    return works
      .filter((w) => {
        const p = progressMap[w.id]
        return p && p.percent > 0 && p.percent < 99
      })
      .sort(
        (a, b) =>
          new Date(progressMap[b.id]?.lastReadAt ?? 0).getTime() -
          new Date(progressMap[a.id]?.lastReadAt ?? 0).getTime()
      )
      .slice(0, 6)
  }, [works, progressMap])

  const formatReadingTime = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const handleDelete = async (workId: string) => {
    if (!confirm('Delete this work?')) return
    try {
      await LiteratureService.deleteLiteratureWork(workId)
      await loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">Loading library...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center text-destructive">{error}</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className={cn('text-3xl font-bold', getHeadingClasses())}>Library</h1>
          <p className={cn('text-muted-foreground mt-1', getUITextClasses())}>
            Classic Christian literature — read like an ebook
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/literature/admin" className={buttonVariants({ variant: 'default' })}>
            <Plus className="h-4 w-4 mr-1" />
            Add book
          </Link>
          {user && (
            <Link href="/literature/admin" className={buttonVariants({ variant: 'outline' })}>
              <Settings className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {continueReading.length > 0 && (
        <section className="mb-10">
          <h2 className={cn('text-lg font-semibold mb-4', getHeadingClasses())}>
            Continue reading
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
            {continueReading.map((work) => (
              <Link
                key={work.id}
                href={`/literature/${work.id}`}
                className="snap-start shrink-0 group"
              >
                <BookCover
                  title={work.title}
                  author={work.author}
                  id={work.id}
                  progress={progressMap[work.id]?.percent}
                  size="md"
                />
                <p className="text-xs text-center mt-2 max-w-[8rem] line-clamp-2 group-hover:text-primary">
                  {Math.round(progressMap[work.id]?.percent ?? 0)}% read
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, author, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortKey} onValueChange={(v: SortKey) => setSortKey(v)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recently read</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="author">Author</SelectItem>
            <SelectItem value="progress">Progress</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex border rounded-lg overflow-hidden">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {filteredWorks.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium">No books found</p>
            <p className="text-muted-foreground mt-1 mb-4">
              {works.length === 0
                ? 'Import your first book to get started.'
                : 'Try adjusting your search or filters.'}
            </p>
            <Link href="/literature/admin" className={buttonVariants({})}>
              <Plus className="h-4 w-4 mr-1" />
              Add a book
            </Link>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {filteredWorks.map((work) => {
            const prog = progressMap[work.id]?.percent ?? 0
            return (
              <div key={work.id} className="group relative">
                <Link href={`/literature/${work.id}`}>
                  <BookCover
                    title={work.title}
                    author={work.author}
                    id={work.id}
                    progress={prog}
                    size="md"
                    className="mx-auto transition-transform group-hover:scale-[1.02]"
                  />
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-medium line-clamp-2 leading-tight">{work.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{work.author}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatReadingTime(work.estimatedReadingTime)}
                      {prog > 0 && (
                        <span className="text-primary">{Math.round(prog)}%</span>
                      )}
                    </div>
                  </div>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 bg-background/80"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => LiteratureService.downloadWorkAsPlainText(work.id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download TXT
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => LiteratureService.downloadWorkAsJson(work.id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download JSON
                    </DropdownMenuItem>
                    {canManage(work) && (
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(work.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredWorks.map((work) => {
            const prog = progressMap[work.id]?.percent ?? 0
            return (
              <Card key={work.id} className="hover:bg-muted/30 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <Link href={`/literature/${work.id}`} className="shrink-0">
                    <BookCover
                      title={work.title}
                      author={work.author}
                      id={work.id}
                      progress={prog}
                      size="sm"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/literature/${work.id}`}>
                      <h3 className="font-medium hover:text-primary">{work.title}</h3>
                    </Link>
                    <p className="text-sm text-muted-foreground">{work.author}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                      {work.description}
                    </p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge variant="outline">{work.difficulty}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatReadingTime(work.estimatedReadingTime)}
                      </span>
                      {prog > 0 && (
                        <Badge variant="secondary">{Math.round(prog)}% read</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => LiteratureService.downloadWorkAsPlainText(work.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {canManage(work) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(work.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default LiteratureLibrary
