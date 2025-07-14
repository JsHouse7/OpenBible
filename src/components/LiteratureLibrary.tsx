'use client'

import { useState } from 'react'
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
import { useFonts } from '@/hooks/useFonts'
import { cn } from '@/lib/utils'
import { 
  Search,
  BookOpen, 
  Clock, 
  Star, 
  Download,
  Heart,
  Calendar,
  BookmarkIcon,
  Eye
} from 'lucide-react'

interface Author {
  id: string
  name: string
  bio: string
  period: string
  nationality: string
  category: 'theologian' | 'mystic' | 'reformer' | 'apologist' | 'puritan' | 'modern'
  works: Work[]
}

interface Work {
  id: string
  title: string
  description: string
  year: number
  pages: number
  readingTime: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  progress?: number
  isBookmarked?: boolean
  rating?: number
}

const LiteratureLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedWork, setSelectedWork] = useState<string | null>(null)
  const { getUITextClasses, getHeadingClasses } = useFonts()

  const authors: Author[] = [
    {
      id: 'ch-spurgeon',
      name: 'Charles Haddon Spurgeon',
      bio: 'British Particular Baptist preacher known as the "Prince of Preachers" for his powerful sermons and theological writings.',
      period: '1834-1892',
      nationality: 'British',
      category: 'puritan',
      works: [
        {
          id: 'morning-evening',
          title: 'Morning and Evening',
          description: 'Daily devotional readings for morning and evening, offering spiritual nourishment and biblical meditation for every day of the year.',
          year: 1869,
          pages: 732,
          readingTime: 1095,
          difficulty: 'beginner',
          tags: ['devotional', 'daily reading', 'meditation', 'spiritual growth'],
          progress: 0,
          isBookmarked: false,
          rating: 5
        }
      ]
    },
    {
      id: 'martin-luther',
      name: 'Martin Luther',
      bio: 'German theologian and reformer whose writings sparked the Protestant Reformation and transformed Christianity.',
      period: '1483-1546',
      nationality: 'German',
      category: 'reformer',
      works: [
        {
          id: 'bondage-of-will',
          title: 'The Bondage of the Will',
          description: 'Luther\'s response to Erasmus on free will, defending the doctrine of predestination and divine sovereignty in salvation.',
          year: 1525,
          pages: 320,
          readingTime: 480,
          difficulty: 'advanced',
          tags: ['reformation', 'predestination', 'free will', 'salvation', 'theology'],
          progress: 0,
          isBookmarked: true,
          rating: 5
        }
      ]
    },
    {
      id: 'john-bunyan',
      name: 'John Bunyan',
      bio: 'English writer and Puritan preacher, author of the most famous Christian allegory in the English language.',
      period: '1628-1688',
      nationality: 'English',
      category: 'puritan',
      works: [
        {
          id: 'pilgrims-progress',
          title: 'The Pilgrim\'s Progress',
          description: 'A Christian allegory following Christian\'s journey from the City of Destruction to the Celestial City, depicting the spiritual life.',
          year: 1678,
          pages: 320,
          readingTime: 480,
          difficulty: 'intermediate',
          tags: ['allegory', 'spiritual journey', 'salvation', 'christian life', 'pilgrimage'],
          progress: 0,
          isBookmarked: false,
          rating: 5
        }
      ]
    },
    {
      id: 'thomas-kempis',
      name: 'Thomas à Kempis',
      bio: 'German-Dutch Catholic monk and mystic, author of one of the most influential works of Christian devotional literature.',
      period: '1380-1471',
      nationality: 'German-Dutch',
      category: 'mystic',
      works: [
        {
          id: 'imitation-of-christ',
          title: 'The Imitation of Christ',
          description: 'A devotional book emphasizing the interior life and spiritual union with Jesus Christ through practical spiritual guidance.',
          year: 1418,
          pages: 240,
          readingTime: 360,
          difficulty: 'intermediate',
          tags: ['devotional', 'mysticism', 'spiritual discipline', 'imitation', 'contemplation'],
          progress: 0,
          isBookmarked: true,
          rating: 5
        }
      ]
    },
    {
      id: 'john-calvin',
      name: 'John Calvin',
      bio: 'French theologian and reformer whose systematic theology profoundly influenced Protestant Christianity worldwide.',
      period: '1509-1564',
      nationality: 'French',
      category: 'reformer',
      works: [
        {
          id: 'institutes-christian-religion',
          title: 'Institutes of the Christian Religion',
          description: 'Calvin\'s masterwork of systematic theology, covering the knowledge of God, redemption in Christ, and the Christian life.',
          year: 1536,
          pages: 1521,
          readingTime: 2280,
          difficulty: 'advanced',
          tags: ['systematic theology', 'reformation', 'doctrine', 'sovereignty of God', 'predestination'],
          progress: 0,
          isBookmarked: false,
          rating: 5
        }
      ]
    }
  ]

  const allCategories = ['all', 'theologian', 'mystic', 'reformer', 'apologist', 'puritan', 'modern']

  const filteredAuthors = authors.filter(author => {
    const matchesSearch = author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         author.works.some(work => 
                           work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           work.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
                         )
    const matchesCategory = selectedCategory === 'all' || author.category === selectedCategory
    return matchesSearch && matchesCategory
  })

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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'theologian': return '📚'
      case 'mystic': return '🕊️'
      case 'reformer': return '⚡'
      case 'apologist': return '🛡️'
      case 'puritan': return '✝️'
      case 'modern': return '🌟'
      default: return '📖'
    }
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
        <Badge variant="secondary" className={cn("px-3 py-1", getUITextClasses())}>
          {authors.reduce((acc, author) => acc + author.works.length, 0)} works available
        </Badge>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search authors, titles, or topics..."
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
                {allCategories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authors List */}
      <div className="grid gap-6">
        {filteredAuthors.map((author) => (
          <Card key={author.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">
                      {author.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className={cn("text-xl", getHeadingClasses())}>{author.name}</CardTitle>
                    <CardDescription className={cn("mt-1", getUITextClasses())}>
                      {author.period} • {author.nationality}
                    </CardDescription>
                    <Badge variant="outline" className={cn("mt-2", getUITextClasses())}>
                      {getCategoryIcon(author.category)} {author.category}
                    </Badge>
                  </div>
                </div>
              </div>
              <p className={cn("text-sm text-muted-foreground mt-3", getUITextClasses())}>{author.bio}</p>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="works">
                  <AccordionTrigger className={getUITextClasses()}>
                    Works ({author.works.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      {author.works.map((work) => (
                        <Dialog key={work.id}>
                          <DialogTrigger asChild>
                            <Card className="cursor-pointer hover:shadow-md transition-shadow">
                              <CardContent className="pt-4">
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between">
                                      <h4 className={cn("font-medium text-sm leading-tight", getUITextClasses())}>{work.title}</h4>
                                    <div className="flex items-center space-x-1">
                                      {work.isBookmarked && (
                                        <BookmarkIcon className="h-4 w-4 text-blue-500" />
                                      )}
                                      {work.rating && (
                                        <div className="flex">
                                          {Array.from({ length: work.rating }).map((_, i) => (
                                            <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <p className={cn("text-xs text-muted-foreground line-clamp-2", getUITextClasses())}>{work.description}</p>
                                  <div className="flex items-center justify-between">
                                    <div className={cn("flex items-center space-x-2 text-xs text-muted-foreground", getUITextClasses())}>
                                      <Clock className="h-3 w-3" />
                                      <span>{formatReadingTime(work.readingTime)}</span>
                                    </div>
                                    <Badge 
                                      variant="secondary" 
                                      className={cn(`text-xs ${getDifficultyColor(work.difficulty)} text-white`, getUITextClasses())}
                                    >
                                      {work.difficulty}
                                    </Badge>
                                  </div>
                                  {work.progress !== undefined && work.progress > 0 && (
                                    <div className="space-y-1">
                                      <div className={cn("flex justify-between text-xs", getUITextClasses())}>
                                        <span>Progress</span>
                                        <span>{work.progress}%</span>
                                      </div>
                                      <Progress value={work.progress} className="h-1" />
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className={getHeadingClasses()}>{work.title}</DialogTitle>
                              <DialogDescription className={getUITextClasses()}>
                                By {author.name} • {work.year} • {work.pages} pages
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p className={cn("text-sm", getUITextClasses())}>{work.description}</p>
                              <div className={cn("grid grid-cols-2 gap-4 text-sm", getUITextClasses())}>
                                <div>
                                  <span className="font-medium">Reading Time:</span> {formatReadingTime(work.readingTime)}
                                </div>
                                <div>
                                  <span className="font-medium">Difficulty:</span> {work.difficulty}
                                </div>
                              </div>
                              <div>
                                <span className={cn("font-medium text-sm", getUITextClasses())}>Topics:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {work.tags.map((tag, index) => (
                                    <Badge key={index} variant="outline" className={cn("text-xs", getUITextClasses())}>
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-2 pt-4">
                                <Button 
                                  className={cn("flex-1", getUITextClasses())}
                                  onClick={() => setSelectedWork(work.id)}
                                >
                                  <BookOpen className="mr-2 h-4 w-4" />
                                  Start Reading
                                </Button>
                                <Button variant="outline" className={getUITextClasses()}>
                                  <BookmarkIcon className="mr-2 h-4 w-4" />
                                  Bookmark
                                </Button>
                                <Button variant="outline" className={getUITextClasses()}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        ))}

      </div>
      
      {/* Literature Reader Modal */}
      {selectedWork && (
        <LiteratureReader 
          workId={selectedWork} 
          onClose={() => setSelectedWork(null)} 
        />
      )}
    </div>
  )
}

export default LiteratureLibrary