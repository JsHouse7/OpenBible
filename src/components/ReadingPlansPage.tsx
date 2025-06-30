'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useAnimations } from '@/components/AnimationProvider'
import { cn } from '@/lib/utils'
import {
  Calendar,
  BookOpen,
  Clock,
  Users,
  Star,
  Play,
  Pause,
  CheckCircle,
  Target,
  TrendingUp,
  Award,
  Heart,
  Zap
} from 'lucide-react'

interface ReadingPlan {
  id: string
  title: string
  description: string
  duration: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  category: 'chronological' | 'thematic' | 'devotional' | 'study' | 'quick'
  totalDays: number
  estimatedTime: string
  currentDay?: number
  isActive?: boolean
  completed?: boolean
  participants?: number
  rating?: number
}

const ReadingPlansPage = () => {
  const { getTransitionClass } = useAnimations()
  const [selectedPlan, setSelectedPlan] = useState<ReadingPlan | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string>('all')

  const readingPlans: ReadingPlan[] = [
    {
      id: 'chronological-year',
      title: 'Chronological Bible in a Year',
      description: 'Read the Bible in chronological order, following the timeline of events as they happened.',
      duration: '365 days',
      difficulty: 'intermediate',
      category: 'chronological',
      totalDays: 365,
      estimatedTime: '15-20 min/day',
      currentDay: 45,
      isActive: true,
      participants: 12847,
      rating: 4.8
    },
    {
      id: 'new-testament-30',
      title: 'New Testament in 30 Days',
      description: 'Read through the entire New Testament in just one month.',
      duration: '30 days',
      difficulty: 'advanced',
      category: 'quick',
      totalDays: 30,
      estimatedTime: '45-60 min/day',
      participants: 8293,
      rating: 4.6
    },
    {
      id: 'psalms-proverbs',
      title: 'Wisdom Literature',
      description: 'Daily readings from Psalms, Proverbs, and Ecclesiastes for spiritual growth.',
      duration: '90 days',
      difficulty: 'beginner',
      category: 'devotional',
      totalDays: 90,
      estimatedTime: '10-15 min/day',
      participants: 15672,
      rating: 4.9
    },
    {
      id: 'gospel-deep-dive',
      title: 'Gospel Deep Dive',
      description: 'Intensive study of the four Gospels with commentary and reflection questions.',
      duration: '120 days',
      difficulty: 'advanced',
      category: 'study',
      totalDays: 120,
      estimatedTime: '30-45 min/day',
      participants: 5431,
      rating: 4.7
    },
    {
      id: 'love-grace-theme',
      title: 'Love & Grace Throughout Scripture',
      description: 'Thematic reading plan exploring God\'s love and grace from Genesis to Revelation.',
      duration: '60 days',
      difficulty: 'intermediate',
      category: 'thematic',
      totalDays: 60,
      estimatedTime: '20-25 min/day',
      participants: 9876,
      rating: 4.5
    },
    {
      id: 'busy-schedule',
      title: 'Bible for Busy People',
      description: 'Short daily readings perfect for those with limited time but wanting consistent growth.',
      duration: '365 days',
      difficulty: 'beginner',
      category: 'devotional',
      totalDays: 365,
      estimatedTime: '5-10 min/day',
      participants: 23451,
      rating: 4.4
    }
  ]

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
      case 'chronological': return '📅'
      case 'thematic': return '🎯'
      case 'devotional': return '🙏'
      case 'study': return '📚'
      case 'quick': return '⚡'
      default: return '📖'
    }
  }

  const filteredPlans = activeFilter === 'all' 
    ? readingPlans 
    : readingPlans.filter(plan => plan.category === activeFilter)

  const activePlans = readingPlans.filter(plan => plan.isActive)
  const completedPlans = readingPlans.filter(plan => plan.completed)

  const handleViewPlan = (plan: ReadingPlan) => {
    setSelectedPlan(plan)
    setIsDetailModalOpen(true)
  }

  const handleStartPlan = (planId: string) => {
    // Implementation for starting a reading plan
    console.log('Starting plan:', planId)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reading Plans</h1>
          <p className="text-muted-foreground">
            Structured Bible reading plans to guide your spiritual journey
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{activePlans.length} active</Badge>
          <Badge variant="outline">{completedPlans.length} completed</Badge>
        </div>
      </div>

      {/* Active Plans Overview */}
      {activePlans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Play className="mr-2 h-5 w-5 text-green-500" />
              Current Reading Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activePlans.map((plan) => (
                <div key={plan.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">{plan.title}</h3>
                    <Badge variant="outline">Day {plan.currentDay}/{plan.totalDays}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Progress</span>
                      <span>{Math.round(((plan.currentDay || 0) / plan.totalDays) * 100)}%</span>
                    </div>
                    <Progress value={((plan.currentDay || 0) / plan.totalDays) * 100} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">Browse Plans</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={activeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('all')}
            >
              All Plans
            </Button>
            <Button
              variant={activeFilter === 'devotional' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('devotional')}
            >
              🙏 Devotional
            </Button>
            <Button
              variant={activeFilter === 'chronological' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('chronological')}
            >
              📅 Chronological
            </Button>
            <Button
              variant={activeFilter === 'thematic' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('thematic')}
            >
              🎯 Thematic
            </Button>
            <Button
              variant={activeFilter === 'study' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('study')}
            >
              📚 Study
            </Button>
            <Button
              variant={activeFilter === 'quick' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('quick')}
            >
              ⚡ Quick
            </Button>
          </div>

          {/* Plans Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPlans.map((plan, index) => (
              <Card key={plan.id} className={cn(
                "group hover:shadow-md transition-all duration-200 cursor-pointer",
                getTransitionClass('default'),
                "animate-in fade-in-0 slide-in-from-bottom-2"
              )} style={{ animationDelay: `${index * 100}ms` }}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getCategoryIcon(plan.category)}</span>
                      <Badge variant="secondary" className={`${getDifficultyColor(plan.difficulty)} text-white text-xs`}>
                        {plan.difficulty}
                      </Badge>
                    </div>
                    {plan.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-muted-foreground">{plan.rating}</span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-lg">{plan.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {plan.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{plan.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{plan.estimatedTime}</span>
                      </div>
                    </div>
                    
                    {plan.participants && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{plan.participants.toLocaleString()} participants</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleStartPlan(plan.id)}
                      disabled={plan.isActive}
                    >
                      {plan.isActive ? (
                        <>
                          <Pause className="mr-1 h-3 w-3" />
                          Active
                        </>
                      ) : plan.completed ? (
                        <>
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Completed
                        </>
                      ) : (
                        <>
                          <Play className="mr-1 h-3 w-3" />
                          Start
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewPlan(plan)}
                    >
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="popular" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {readingPlans
              .sort((a, b) => (b.participants || 0) - (a.participants || 0))
              .slice(0, 6)
              .map((plan, index) => (
                <Card key={plan.id} className={cn(
                  "group hover:shadow-md transition-all duration-200",
                  "animate-in fade-in-0 slide-in-from-bottom-2"
                )} style={{ animationDelay: `${index * 100}ms` }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        Popular
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span className="text-xs">{plan.participants?.toLocaleString()}</span>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{plan.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleStartPlan(plan.id)}
                    >
                      <Play className="mr-1 h-3 w-3" />
                      Start Reading
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="recommended" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="mr-2 h-5 w-5 text-red-500" />
                Personalized Recommendations
              </CardTitle>
              <CardDescription>
                Based on your reading history and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Target className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                <p className="text-muted-foreground mb-4">
                  We're working on personalized reading plan recommendations based on your interests and reading patterns.
                </p>
                <p className="text-sm text-muted-foreground">
                  For now, check out our popular plans or browse by category to find what interests you!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Plan Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-lg">{selectedPlan && getCategoryIcon(selectedPlan.category)}</span>
              {selectedPlan?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedPlan?.duration} • {selectedPlan?.estimatedTime}
            </DialogDescription>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge variant="secondary" className={`${getDifficultyColor(selectedPlan.difficulty)} text-white`}>
                  {selectedPlan.difficulty}
                </Badge>
                <Badge variant="outline">{selectedPlan.category}</Badge>
                {selectedPlan.rating && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {selectedPlan.rating}
                  </Badge>
                )}
              </div>
              
              <p className="text-muted-foreground">{selectedPlan.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Duration:</span> {selectedPlan.duration}
                </div>
                <div>
                  <span className="font-medium">Daily Time:</span> {selectedPlan.estimatedTime}
                </div>
                <div>
                  <span className="font-medium">Difficulty:</span> {selectedPlan.difficulty}
                </div>
                {selectedPlan.participants && (
                  <div>
                    <span className="font-medium">Participants:</span> {selectedPlan.participants.toLocaleString()}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  className="flex-1"
                  onClick={() => handleStartPlan(selectedPlan.id)}
                  disabled={selectedPlan.isActive}
                >
                  {selectedPlan.isActive ? (
                    <>
                      <Pause className="mr-1 h-4 w-4" />
                      Currently Active
                    </>
                  ) : (
                    <>
                      <Play className="mr-1 h-4 w-4" />
                      Start This Plan
                    </>
                  )}
                </Button>
                <Button variant="outline">
                  <Heart className="mr-1 h-4 w-4" />
                  Save for Later
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ReadingPlansPage 