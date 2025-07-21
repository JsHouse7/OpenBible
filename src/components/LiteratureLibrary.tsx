'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { LiteratureReader } from '@/components/LiteratureReader'
import { LiteratureAdmin } from '@/components/LiteratureAdmin'
import { useFonts } from '@/hooks/useFonts'
import { cn } from '@/lib/utils'
import { LiteratureService, LiteratureWorkSummary, LiteratureIndex } from '@/lib/literatureService'
import Link from 'next/link'
import { 
  Search,
  BookOpen, 
  Clock, 
  Star, 
  Download,
  Heart,
  Calendar,
  BookmarkIcon,
  Eye,
  Plus,
  Upload,
  Settings,
  BarChart3,
  Filter,
  Trash2
} from 'lucide-react'

interface Author {
  name: string
  works: LiteratureWorkSummary[]
  totalWorks: number
  period?: string
  nationality?: string
  category?: string
}

const LiteratureLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedWork, setSelectedWork] = useState<string | null>(null)
  const [showAdmin, setShowAdmin] = useState(false)

  const [works, setWorks] = useState<LiteratureWorkSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)
  const { getUITextClasses, getHeadingClasses } = useFonts()

  // Load literature works on component mount
  useEffect(() => {
    loadLiteratureWorks()
    loadStats()
  }, [])

  const loadLiteratureWorks = async () => {
    try {
      setLoading(true)
      console.log('Loading literature works...')
      const index = await LiteratureService.getLiteratureIndex()
      console.log('Received index:', index)
      console.log('Works array:', index.works)
      console.log('Number of works:', index.works.length)
      setWorks(index.works)
      setError(null)
    } catch (err) {
      setError('Failed to load literature works')
      console.error('Error loading literature works:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const collectionStats = await LiteratureService.getCollectionStats()
      setStats(collectionStats)
    } catch (err) {
      console.error('Error loading stats:', err)
    }
  }

  const handleWorkAdded = () => {
    loadLiteratureWorks()
    loadStats()
  }

  const handleDeleteWork = async (workId: string) => {
    if (confirm('Are you sure you want to delete this work?')) {
      try {
        await LiteratureService.deleteLiteratureWork(workId)
        await loadLiteratureWorks()
        await loadStats()
      } catch (err) {
        console.error('Error deleting work:', err)
        alert('Failed to delete work')
      }
    }
  }

  // Group works by author
  const groupedAuthors: Author[] = works.reduce((acc: Author[], work: LiteratureWorkSummary) => {
    const existingAuthor = acc.find((author: Author) => author.name === work.author)
    if (existingAuthor) {
      existingAuthor.works.push(work)
      existingAuthor.totalWorks++
    } else {
      acc.push({
        name: work.author,
        works: [work],
        totalWorks: 1
      })
    }
    return acc
  }, [])

  const allCategories = ['all', 'beginner', 'intermediate', 'advanced']

  const filteredWorks = works.filter((work: LiteratureWorkSummary) => {
    const matchesSearch = work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         work.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         work.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || work.difficulty === selectedCategory
    return matchesSearch && matchesCategory
  })

  console.log('All works:', works)
  console.log('Search term:', searchTerm)
  console.log('Selected category:', selectedCategory)
  console.log('Filtered works:', filteredWorks)

  const filteredAuthors = groupedAuthors.filter((author: Author) => 
    author.works.some((work: LiteratureWorkSummary) => filteredWorks.includes(work))
  ).map((author: Author) => ({
    ...author,
    works: author.works.filter((work: LiteratureWorkSummary) => filteredWorks.includes(work))
  }))

  console.log('Filtered authors:', filteredAuthors)
    console.log('Filtered authors detailed:', filteredAuthors.map(author => ({
      name: author.name,
      totalWorks: author.totalWorks,
      works: author.works.map(work => ({ id: work.id, title: work.title }))
    })))
  const formatReadingTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500'
      case 'intermediate': return 'bg-yellow-500'
      case 'advanced': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '🌱'
      case 'intermediate': return '📚'
      case 'advanced': return '🎓'
      default: return '📖'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className={cn("text-muted-foreground", getUITextClasses())}>Loading literature library...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className={cn("text-red-600", getUITextClasses())}>{error}</p>
              <Button onClick={loadLiteratureWorks} className={getUITextClasses()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn("text-3xl font-bold tracking-tight", getHeadingClasses())}>Literature Library</h1>
          <p className={cn("text-muted-foreground", getUITextClasses())}>
            Explore classic Christian literature and spiritual writings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={cn("px-3 py-1", getUITextClasses())}>
            {works.length} works available
          </Badge>
          <Link href="/literature/admin">
             <Button
               variant="outline"
               size="sm"
               className={getUITextClasses()}
             >
               <Settings className="h-4 w-4 mr-2" />
               Admin
             </Button>
           </Link>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", getHeadingClasses())}>
              <BarChart3 className="h-5 w-5" />
              Collection Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={cn("text-2xl font-bold", getHeadingClasses())}>{stats.totalWorks}</div>
                <div className={cn("text-sm text-muted-foreground", getUITextClasses())}>Total Works</div>
              </div>
              <div className="text-center">
                <div className={cn("text-2xl font-bold", getHeadingClasses())}>{stats.authorCount}</div>
                <div className={cn("text-sm text-muted-foreground", getUITextClasses())}>Authors</div>
              </div>
              <div className="text-center">
                <div className={cn("text-2xl font-bold", getHeadingClasses())}>{Math.round(stats.totalWords / 1000)}k</div>
                <div className={cn("text-sm text-muted-foreground", getUITextClasses())}>Total Words</div>
              </div>
              <div className="text-center">
                <div className={cn("text-2xl font-bold", getHeadingClasses())}>{formatReadingTime(stats.averageReadingTime)}</div>
                <div className={cn("text-sm text-muted-foreground", getUITextClasses())}>Avg. Reading Time</div>
              </div>
            </div>
            <div className="mt-4">
              <div className={cn("text-sm font-medium mb-2", getUITextClasses())}>Difficulty Distribution</div>
              <div className="flex gap-2">
                {Object.entries(stats.difficultyBreakdown).map(([difficulty, count]: [string, any]) => (
                  <Badge key={difficulty} variant="outline" className={cn("text-xs", getUITextClasses())}>
                    {getDifficultyIcon(difficulty)} {difficulty}: {count}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search authors, titles, or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                {allCategories.map((category: string) => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Difficulties' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authors and Works */}
      <div className="grid gap-6">
        {filteredAuthors.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className={cn("text-lg font-medium", getHeadingClasses())}>No works found</h3>
                  <p className={cn("text-muted-foreground", getUITextClasses())}>
                    Try adjusting your search terms or filters
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredAuthors.map((author: Author) => (
            <Card key={author.name}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-lg">
                        {author.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className={cn("text-xl", getHeadingClasses())}>{author.name}</CardTitle>
                      <CardDescription className={cn("mt-1", getUITextClasses())}>
                        {author.totalWorks} work{author.totalWorks !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {author.works.map((work: LiteratureWorkSummary) => (
                    <Card key={work.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 className={cn("font-medium text-sm leading-tight", getUITextClasses())}>{work.title}</h4>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteWork(work.id)
                                }}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className={cn("text-xs text-muted-foreground line-clamp-2", getUITextClasses())}>{work.description}</p>
                          <div className="flex items-center justify-between">
                            <div className={cn("flex items-center space-x-2 text-xs text-muted-foreground", getUITextClasses())}>
                              <Clock className="h-3 w-3" />
                              <span>{formatReadingTime(work.estimatedReadingTime)}</span>
                            </div>
                            <Badge 
                              variant="secondary" 
                              className={cn(`text-xs ${getDifficultyColor(work.difficulty)} text-white`, getUITextClasses())}
                            >
                              {work.difficulty}
                            </Badge>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button 
                              size="sm"
                              className={cn("flex-1 text-xs", getUITextClasses())}
                              onClick={() => setSelectedWork(work.id)}
                            >
                              <BookOpen className="mr-1 h-3 w-3" />
                              Read
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className={cn("text-xs", getUITextClasses())}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {/* Literature Reader Modal */}
      {selectedWork && (
        <LiteratureReader 
          workId={selectedWork} 
          onClose={() => setSelectedWork(null)} 
        />
      )}

      {/* Admin Modal */}
      {showAdmin && (
        <Dialog open={showAdmin} onOpenChange={setShowAdmin}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className={getHeadingClasses()}>Literature Administration</DialogTitle>
              <DialogDescription className={getUITextClasses()}>
                Add new literature works to the library
              </DialogDescription>
            </DialogHeader>
            <LiteratureAdmin onWorkAdded={handleWorkAdded} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default LiteratureLibrary