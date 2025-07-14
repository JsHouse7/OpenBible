'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, BookOpen, Bookmark, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useAnimations } from '@/components/AnimationProvider'
import { useFonts } from '@/hooks/useFonts'
import { cn } from '@/lib/utils'

interface LiteratureWork {
  id: string
  title: string
  author: string
  description: string
  year: number
  pages: number
  readingTime: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  content: LiteratureChapter[]
}

interface LiteratureChapter {
  id: string
  title: string
  content: string
  pageStart: number
  pageEnd: number
}

interface LiteratureReaderProps {
  workId: string
  onClose: () => void
}

// Load literature works from JSON files
const getLiteratureWork = async (workId: string): Promise<LiteratureWork | null> => {
  try {
    let jsonPath = ''
    let metadata = {}
    
    switch (workId) {
      case 'bondage-of-will':
        jsonPath = '/literature/bondage_of_the_will.json'
        metadata = {
          id: 'bondage-of-will',
          description: 'Luther\'s response to Erasmus on free will, defending the doctrine of predestination and divine sovereignty in salvation.',
          pages: 320,
          readingTime: 480,
          difficulty: 'advanced' as const,
          tags: ['reformation', 'predestination', 'free will', 'salvation', 'theology']
        }
        break
      case 'pilgrims-progress':
        jsonPath = '/literature/pilgrims_progress.json'
        metadata = {
          id: 'pilgrims-progress',
          description: 'A Christian allegory following Christian\'s journey from the City of Destruction to the Celestial City, depicting the spiritual life.',
          pages: 320,
          readingTime: 480,
          difficulty: 'intermediate' as const,
          tags: ['allegory', 'spiritual journey', 'salvation', 'christian life', 'pilgrimage']
        }
        break
      case 'imitation-of-christ':
        jsonPath = '/literature/imitation_of_christ.json'
        metadata = {
          id: 'imitation-of-christ',
          description: 'A devotional book emphasizing the interior life and spiritual union with Jesus Christ through practical spiritual guidance.',
          pages: 240,
          readingTime: 360,
          difficulty: 'intermediate' as const,
          tags: ['devotional', 'mysticism', 'spiritual discipline', 'imitation', 'contemplation']
        }
        break
      case 'institutes-christian-religion':
        jsonPath = '/literature/institutes.json'
        metadata = {
          id: 'institutes-christian-religion',
          description: 'Calvin\'s masterwork of systematic theology, covering the knowledge of God, redemption in Christ, and the Christian life.',
          pages: 1521,
          readingTime: 2280,
          difficulty: 'advanced' as const,
          tags: ['systematic theology', 'reformation', 'doctrine', 'sovereignty of God', 'predestination']
        }
        break
      default:
        return null
    }
    
    const response = await fetch(jsonPath)
    if (!response.ok) {
      throw new Error(`Failed to load ${jsonPath}`)
    }
    
    const data = await response.json()
    
    // Transform the data to match our interface
    const content: LiteratureChapter[] = data.chapters?.map((chapter: any, index: number) => ({
      id: `chapter-${index + 1}`,
      title: chapter.title,
      content: chapter.content,
      pageStart: index * 10 + 1,
      pageEnd: (index + 1) * 10
    })) || []
    
    return {
      ...metadata,
      title: data.title,
      author: data.author,
      year: data.year || 1500,
      content
    } as LiteratureWork
    
  } catch (error) {
    console.error('Error loading literature work:', error)
    return null
  }
}

export function LiteratureReader({ workId, onClose }: LiteratureReaderProps) {
  const [work, setWork] = useState<LiteratureWork | null>(null)
  const [currentChapter, setCurrentChapter] = useState(0)
  const [readingProgress, setReadingProgress] = useState(0)
  const { getTransitionClass } = useAnimations()
  const { getBibleTextClasses, getUITextClasses, getHeadingClasses } = useFonts()

  useEffect(() => {
    const loadWork = async () => {
      const literatureWork = await getLiteratureWork(workId)
      setWork(literatureWork)
    }
    loadWork()
  }, [workId])

  useEffect(() => {
    if (work && work.content.length > 0) {
      const progress = ((currentChapter + 1) / work.content.length) * 100
      setReadingProgress(progress)
    }
  }, [currentChapter, work])

  const handlePreviousChapter = () => {
    if (currentChapter > 0) {
      setCurrentChapter(currentChapter - 1)
    }
  }

  const handleNextChapter = () => {
    if (work && currentChapter < work.content.length - 1) {
      setCurrentChapter(currentChapter + 1)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500'
      case 'intermediate': return 'bg-yellow-500'
      case 'advanced': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const formatReadingTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  if (!work) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-6 text-center">
            <p className={cn("text-lg", getUITextClasses())}>Work not found</p>
            <Button onClick={onClose} className="mt-4">
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentContent = work.content[currentChapter]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className={cn("text-xl", getHeadingClasses())}>
                {work.title}
              </CardTitle>
              <p className={cn("text-sm text-muted-foreground mt-1", getUITextClasses())}>
                by {work.author} • {work.year}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge 
                variant="secondary" 
                className={`text-xs ${getDifficultyColor(work.difficulty)} text-white`}
              >
                {work.difficulty}
              </Badge>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span className={getUITextClasses()}>Progress</span>
              <span className={getUITextClasses()}>{Math.round(readingProgress)}%</span>
            </div>
            <Progress value={readingProgress} className="h-2" />
          </div>
          
          {/* Chapter Navigation */}
          <div className="flex items-center justify-between mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePreviousChapter}
              disabled={currentChapter === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <div className="text-center">
              <p className={cn("text-sm font-medium", getUITextClasses())}>
                {currentContent?.title}
              </p>
              <p className={cn("text-xs text-muted-foreground", getUITextClasses())}>
                Chapter {currentChapter + 1} of {work.content.length}
              </p>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNextChapter}
              disabled={currentChapter === work.content.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
          <div className={cn(
            "prose prose-lg max-w-none",
            "prose-headings:font-bold prose-headings:text-foreground",
            "prose-p:text-foreground prose-p:leading-relaxed",
            "prose-strong:text-foreground",
            getBibleTextClasses(),
            getTransitionClass('default')
          )}>
            {currentContent?.content.split('\n').map((paragraph, index) => {
              if (paragraph.trim() === '') return null
              
              // Handle scripture references (text in quotes)
              if (paragraph.includes('"') && paragraph.includes('—')) {
                const parts = paragraph.split('—')
                return (
                  <div key={index} className="mb-6 p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
                    <p className="text-lg italic mb-2">{parts[0].trim()}</p>
                    {parts[1] && (
                      <p className="text-sm text-muted-foreground font-medium">
                        — {parts[1].trim()}
                      </p>
                    )}
                  </div>
                )
              }
              
              return (
                <p key={index} className="mb-4 text-justify leading-relaxed">
                  {paragraph}
                </p>
              )
            })}
          </div>
        </CardContent>
        
        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span className={getUITextClasses()}>
                Pages {currentContent?.pageStart}-{currentContent?.pageEnd}
              </span>
              <span className={getUITextClasses()}>
                {formatReadingTime(Math.round(work.readingTime / work.content.length))} read time
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Bookmark className="h-4 w-4 mr-1" />
                Bookmark
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default LiteratureReader