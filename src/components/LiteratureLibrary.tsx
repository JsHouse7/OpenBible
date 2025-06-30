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

  const authors: Author[] = [
    {
      id: 'cs-lewis',
      name: 'C.S. Lewis',
      bio: 'British writer, lay theologian, and Christian apologist known for The Chronicles of Narnia and Mere Christianity.',
      period: '1898-1963',
      nationality: 'British',
      category: 'apologist',
      works: [
        {
          id: 'mere-christianity',
          title: 'Mere Christianity',
          description: 'A theological book that arose from a series of BBC radio talks broadcast during WWII.',
          year: 1952,
          pages: 227,
          readingTime: 340,
          difficulty: 'intermediate',
          tags: ['apologetics', 'theology', 'faith', 'reason'],
          progress: 75,
          isBookmarked: true,
          rating: 5
        },
        {
          id: 'screwtape-letters',
          title: 'The Screwtape Letters',
          description: 'A satirical novel about temptation told through letters from a senior demon to his nephew.',
          year: 1942,
          pages: 175,
          readingTime: 260,
          difficulty: 'beginner',
          tags: ['spiritual warfare', 'temptation', 'christian life'],
          progress: 0,
          isBookmarked: false,
          rating: 5
        }
      ]
    },
    {
      id: 'augustine',
      name: 'Augustine of Hippo',
      bio: 'Early Christian theologian and philosopher whose writings influenced Western Christianity and philosophy.',
      period: '354-430 AD',
      nationality: 'Roman Africa',
      category: 'theologian',
      works: [
        {
          id: 'confessions',
          title: 'Confessions',
          description: 'An autobiographical work consisting of 13 books about sin, conversion, and divine grace.',
          year: 400,
          pages: 416,
          readingTime: 625,
          difficulty: 'advanced',
          tags: ['autobiography', 'conversion', 'grace', 'sin'],
          progress: 25,
          isBookmarked: true,
          rating: 5
        }
      ]
    },
    {
      id: 'john-bunyan',
      name: 'John Bunyan',
      bio: 'English writer and Puritan preacher best known for his Christian allegory The Pilgrim\'s Progress.',
      period: '1628-1688',
      nationality: 'English',
      category: 'puritan',
      works: [
        {
          id: 'pilgrims-progress',
          title: 'The Pilgrim\'s Progress',
          description: 'A Christian allegory about a man\'s spiritual journey from the City of Destruction to the Celestial City.',
          year: 1678,
          pages: 320,
          readingTime: 480,
          difficulty: 'intermediate',
          tags: ['allegory', 'spiritual journey', 'salvation', 'christian life'],
          progress: 100,
          isBookmarked: true,
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
          <h1 className="text-3xl font-bold tracking-tight">Literature Library</h1>
          <p className="text-muted-foreground">
            Explore classic Christian literature and spiritual writings
          </p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
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
                    <CardTitle className="text-xl">{author.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {author.period} • {author.nationality}
                    </CardDescription>
                    <Badge variant="outline" className="mt-2">
                      {getCategoryIcon(author.category)} {author.category}
                    </Badge>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-3">{author.bio}</p>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="works">
                  <AccordionTrigger>
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
                                    <h4 className="font-medium text-sm leading-tight">{work.title}</h4>
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
                                  <p className="text-xs text-muted-foreground line-clamp-2">{work.description}</p>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                      <Clock className="h-3 w-3" />
                                      <span>{formatReadingTime(work.readingTime)}</span>
                                    </div>
                                    <Badge 
                                      variant="secondary" 
                                      className={`text-xs ${getDifficultyColor(work.difficulty)} text-white`}
                                    >
                                      {work.difficulty}
                                    </Badge>
                                  </div>
                                  {work.progress !== undefined && work.progress > 0 && (
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-xs">
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
                              <DialogTitle>{work.title}</DialogTitle>
                              <DialogDescription>
                                By {author.name} • {work.year} • {work.pages} pages
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p className="text-sm">{work.description}</p>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium">Reading Time:</span> {formatReadingTime(work.readingTime)}
                                </div>
                                <div>
                                  <span className="font-medium">Difficulty:</span> {work.difficulty}
                                </div>
                              </div>
                              <div>
                                <span className="font-medium text-sm">Topics:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {work.tags.map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-2 pt-4">
                                <Button className="flex-1">
                                  <BookOpen className="mr-2 h-4 w-4" />
                                  Start Reading
                                </Button>
                                <Button variant="outline">
                                  <BookmarkIcon className="mr-2 h-4 w-4" />
                                  Bookmark
                                </Button>
                                <Button variant="outline">
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
    </div>
  )
}

export default LiteratureLibrary 