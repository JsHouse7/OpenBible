'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, BookOpen, Bookmark, Download, X, Menu, Settings, Type, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAnimations } from '@/components/AnimationProvider'
import { useFonts } from '@/hooks/useFonts'
import { cn } from '@/lib/utils'
import { LiteratureService, LiteratureWork } from '@/lib/literatureService'

// Using LiteratureWork and LiteratureChapter from literatureService

interface LiteratureReaderProps {
  workId: string
  onClose: () => void
}



export function LiteratureReader({ workId, onClose }: LiteratureReaderProps) {
  const [work, setWork] = useState<LiteratureWork | null>(null)
  const [currentChapter, setCurrentChapter] = useState(0)
  const [readingProgress, setReadingProgress] = useState(0)
  const [fontSize, setFontSize] = useState(16)
  const [lineHeight, setLineHeight] = useState(1.6)
  const [fontFamily, setFontFamily] = useState('serif')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { getTransitionClass } = useAnimations()
  const { getBibleTextClasses, getUITextClasses, getHeadingClasses } = useFonts()

  useEffect(() => {
    const loadWork = async () => {
      try {
        const literatureWork = await LiteratureService.getLiteratureWork(workId)
        setWork(literatureWork)
      } catch (error) {
        console.error('Error loading literature work:', error)
        setWork(null)
      }
    }
    loadWork()
  }, [workId])

  useEffect(() => {
    if (work && work.chapters.length > 0) {
      const progress = ((currentChapter + 1) / work.chapters.length) * 100
      setReadingProgress(progress)
    }
  }, [currentChapter, work])

  const handlePreviousChapter = () => {
    if (currentChapter > 0) {
      setCurrentChapter(currentChapter - 1)
    }
  }

  const handleNextChapter = () => {
    if (work && currentChapter < work.chapters.length - 1) {
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
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className={cn("text-lg", getUITextClasses())}>Loading literature work...</p>
              <Button onClick={onClose} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentContent = work.chapters[currentChapter]

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const fontFamilyOptions = {
    serif: 'font-serif',
    sans: 'font-sans',
    mono: 'font-mono'
  }

  return (
    <div className={cn(
      "fixed inset-0 z-50 transition-all duration-300",
      isFullscreen ? "bg-background" : "bg-black/50 flex items-center justify-center p-2 sm:p-4",
      isDarkMode && "dark"
    )}>
      <Card className={cn(
        "w-full overflow-hidden transition-all duration-300",
        isFullscreen 
          ? "h-full max-w-none rounded-none" 
          : "max-w-5xl max-h-[95vh] sm:max-h-[90vh] rounded-lg"
      )}>
        {/* Header */}
        <CardHeader className={cn(
          "border-b transition-all duration-300",
          isFullscreen ? "px-4 py-3" : "px-4 sm:px-6 py-4"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className={cn(
                "text-lg sm:text-xl truncate", 
                getHeadingClasses()
              )}>
                {work.title}
              </CardTitle>
              <p className={cn(
                "text-xs sm:text-sm text-muted-foreground mt-1 truncate", 
                getUITextClasses()
              )}>
                by {work.author} • {work.year}
              </p>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 ml-2">
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs px-2 py-1 text-white",
                  getDifficultyColor(work.difficulty)
                )}
              >
                {work.difficulty}
              </Badge>
              
              {/* Settings Popover */}
              <Popover open={showSettings} onOpenChange={setShowSettings}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Settings className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Reading Settings</h4>
                    
                    {/* Font Size */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Font Size: {fontSize}px</label>
                      <Slider
                        value={[fontSize]}
                        onValueChange={(value) => setFontSize(value[0])}
                        max={24}
                        min={12}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    
                    {/* Line Height */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Line Height: {lineHeight}</label>
                      <Slider
                        value={[lineHeight]}
                        onValueChange={(value) => setLineHeight(value[0])}
                        max={2.5}
                        min={1.2}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                    
                    {/* Font Family */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Font Family</label>
                      <Select value={fontFamily} onValueChange={setFontFamily}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="serif">Serif</SelectItem>
                          <SelectItem value="sans">Sans Serif</SelectItem>
                          <SelectItem value="mono">Monospace</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Dark Mode Toggle */}
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium">Dark Mode</label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="h-8 w-8 p-0"
                      >
                        {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    {/* Fullscreen Toggle */}
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium">Fullscreen</label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleFullscreen}
                        className="h-8 w-8 p-0"
                      >
                        <BookOpen className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3 sm:mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span className={getUITextClasses()}>Progress</span>
              <span className={getUITextClasses()}>{Math.round(readingProgress)}%</span>
            </div>
            <Progress value={readingProgress} className="h-1.5 sm:h-2" />
          </div>
          
          {/* Chapter Navigation */}
          <div className="flex items-center justify-between mt-3 sm:mt-4 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePreviousChapter}
              disabled={currentChapter === 0}
              className="flex-shrink-0 px-2 sm:px-3"
            >
              <ChevronLeft className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            
            <div className="text-center min-w-0 flex-1 px-2">
              <p className={cn(
                "text-xs sm:text-sm font-medium truncate", 
                getUITextClasses()
              )}>
                {currentContent?.title}
              </p>
              <p className={cn(
                "text-xs text-muted-foreground", 
                getUITextClasses()
              )}>
                Chapter {currentChapter + 1} of {work.chapters.length}
              </p>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNextChapter}
              disabled={currentChapter === work.chapters.length - 1}
              className="flex-shrink-0 px-2 sm:px-3"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4 sm:ml-1" />
            </Button>
          </div>
        </CardHeader>
        
        {/* Content */}
        <CardContent className={cn(
          "overflow-y-auto transition-all duration-300",
          isFullscreen 
            ? "p-4 sm:p-8 max-h-[calc(100vh-200px)]" 
            : "p-4 sm:p-6 max-h-[50vh] sm:max-h-[60vh]"
        )}>
          <div 
            className={cn(
              "max-w-none transition-all duration-300",
              fontFamilyOptions[fontFamily as keyof typeof fontFamilyOptions],
              "prose-headings:font-bold prose-headings:text-foreground",
              "prose-p:text-foreground",
              "prose-strong:text-foreground",
              getBibleTextClasses(),
              getTransitionClass('default')
            )}
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: lineHeight
            }}
          >
            {currentContent?.content.split('\n').map((paragraph: string, index: number) => {
              if (paragraph.trim() === '') return null
              
              // Handle scripture references (text in quotes)
              if (paragraph.includes('"') && paragraph.includes('—')) {
                const parts = paragraph.split('—')
                return (
                  <div key={index} className="mb-4 sm:mb-6 p-3 sm:p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
                    <p className="text-base sm:text-lg italic mb-2" style={{ fontSize: `${fontSize + 2}px` }}>
                      {parts[0].trim()}
                    </p>
                    {parts[1] && (
                      <p className="text-sm text-muted-foreground font-medium">
                        — {parts[1].trim()}
                      </p>
                    )}
                  </div>
                )
              }
              
              return (
                <p 
                  key={index} 
                  className="mb-3 sm:mb-4 text-justify"
                  style={{ 
                    lineHeight: lineHeight,
                    fontSize: `${fontSize}px`
                  }}
                >
                  {paragraph}
                </p>
              )
            })}
          </div>
        </CardContent>
        
        {/* Footer */}
        <div className={cn(
          "border-t transition-all duration-300",
          isFullscreen ? "p-3" : "p-3 sm:p-4"
        )}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-muted-foreground min-w-0">
              <span className={cn("truncate", getUITextClasses())}>
                Chapter {currentChapter + 1} of {work.chapters.length}
              </span>
              <span className={cn("hidden sm:inline", getUITextClasses())}>
                {formatReadingTime(Math.round((work.metadata?.estimatedReadingTime || 0) / work.chapters.length))} read time
              </span>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3">
                <Bookmark className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Bookmark</span>
              </Button>
              <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3">
                <Download className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Download</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default LiteratureReader