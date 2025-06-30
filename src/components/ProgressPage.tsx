'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAnimations } from '@/components/AnimationProvider'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  Calendar,
  Target,
  TrendingUp,
  Award,
  Star,
  Clock,
  Check,
  Trophy,
  Flame,
  ChevronRight,
  BarChart3,
  Users,
  Heart,
  MessageSquare,
  Bookmark
} from 'lucide-react'

interface ReadingProgress {
  booksRead: number
  chaptersRead: number
  versesRead: number
  totalReadingTime: number
  currentStreak: number
  longestStreak: number
  notesCreated: number
  highlightsCreated: number
  bookmarksCreated: number
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlockedDate?: string
  progress?: number
  maxProgress?: number
}

interface ReadingGoal {
  id: string
  title: string
  description: string
  target: number
  current: number
  unit: string
  deadline: string
  completed: boolean
}

const ProgressPage = () => {
  const { getTransitionClass } = useAnimations()
  const [progress, setProgress] = useState<ReadingProgress>({
    booksRead: 8,
    chaptersRead: 42,
    versesRead: 1247,
    totalReadingTime: 1680, // minutes
    currentStreak: 12,
    longestStreak: 23,
    notesCreated: 56,
    highlightsCreated: 89,
    bookmarksCreated: 23
  })

  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: 'first-chapter',
      title: 'First Steps',
      description: 'Read your first chapter',
      icon: '📖',
      unlocked: true,
      unlockedDate: '2024-01-15'
    },
    {
      id: 'first-book',
      title: 'Book Worm',
      description: 'Complete your first book',
      icon: '📚',
      unlocked: true,
      unlockedDate: '2024-01-28'
    },
    {
      id: 'streak-7',
      title: 'Weekly Warrior',
      description: 'Maintain a 7-day reading streak',
      icon: '🔥',
      unlocked: true,
      unlockedDate: '2024-02-03'
    },
    {
      id: 'notes-10',
      title: 'Note Taker',
      description: 'Create 10 study notes',
      icon: '📝',
      unlocked: true,
      unlockedDate: '2024-02-10'
    },
    {
      id: 'five-books',
      title: 'Scholar',
      description: 'Read 5 complete books',
      icon: '🎓',
      unlocked: true,
      unlockedDate: '2024-02-20'
    },
    {
      id: 'streak-30',
      title: 'Faithful Reader',
      description: 'Maintain a 30-day reading streak',
      icon: '⭐',
      unlocked: false,
      progress: 12,
      maxProgress: 30
    },
    {
      id: 'ten-books',
      title: 'Bible Student',
      description: 'Read 10 complete books',
      icon: '📖',
      unlocked: false,
      progress: 8,
      maxProgress: 10
    },
    {
      id: 'notes-50',
      title: 'Deep Thinker',
      description: 'Create 50 study notes',
      icon: '🧠',
      unlocked: false,
      progress: 56,
      maxProgress: 50
    }
  ])

  const [goals, setGoals] = useState<ReadingGoal[]>([
    {
      id: 'monthly-chapters',
      title: 'Monthly Reading Goal',
      description: 'Read 50 chapters this month',
      target: 50,
      current: 42,
      unit: 'chapters',
      deadline: 'End of Month',
      completed: false
    },
    {
      id: 'yearly-books',
      title: 'Annual Challenge',
      description: 'Read 12 books this year',
      target: 12,
      current: 8,
      unit: 'books',
      deadline: 'End of Year',
      completed: false
    },
    {
      id: 'daily-reading',
      title: 'Daily Devotion',
      description: 'Read every day for 30 days',
      target: 30,
      current: 12,
      unit: 'days',
      deadline: 'Ongoing',
      completed: false
    }
  ])

  const formatReadingTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const unlockedAchievements = achievements.filter(a => a.unlocked)
  const totalAchievements = achievements.length

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reading Progress</h1>
          <p className="text-muted-foreground">
            Track your spiritual journey and achievements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{unlockedAchievements.length}/{totalAchievements} achievements</Badge>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Streak
            </CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress.currentStreak} days</div>
            <p className="text-xs text-muted-foreground">
              Best: {progress.longestStreak} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Books Completed
            </CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress.booksRead}</div>
            <p className="text-xs text-muted-foreground">
              {progress.chaptersRead} chapters read
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reading Time
            </CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatReadingTime(progress.totalReadingTime)}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Engagement
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress.notesCreated + progress.highlightsCreated + progress.bookmarksCreated}
            </div>
            <p className="text-xs text-muted-foreground">
              Notes, highlights & bookmarks
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="goals" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="mr-2 h-5 w-5" />
                Current Goals
              </CardTitle>
              <CardDescription>
                Track your reading objectives and milestones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {goals.map((goal, index) => (
                <div key={goal.id} className={cn(
                  "p-4 border rounded-lg space-y-3",
                  "animate-in fade-in-0 slide-in-from-bottom-2",
                  getTransitionClass('default')
                )} style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{goal.title}</h3>
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    </div>
                    <Badge variant={goal.completed ? "default" : "secondary"}>
                      {goal.completed ? "Completed" : goal.deadline}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{goal.current} / {goal.target} {goal.unit}</span>
                      <span>{Math.round((goal.current / goal.target) * 100)}%</span>
                    </div>
                    <Progress value={(goal.current / goal.target) * 100} className="h-2" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="mr-2 h-5 w-5" />
                Achievements
              </CardTitle>
              <CardDescription>
                Unlock rewards as you grow in your Bible study journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {achievements.map((achievement, index) => (
                  <div key={achievement.id} className={cn(
                    "p-4 border rounded-lg flex items-start space-x-3",
                    achievement.unlocked ? "bg-muted/30" : "opacity-60",
                    "animate-in fade-in-0 slide-in-from-bottom-2",
                    getTransitionClass('default')
                  )} style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{achievement.title}</h3>
                        {achievement.unlocked && (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      
                      {achievement.unlocked && achievement.unlockedDate && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Unlocked on {new Date(achievement.unlockedDate).toLocaleDateString()}
                        </p>
                      )}
                      
                      {!achievement.unlocked && achievement.progress !== undefined && achievement.maxProgress && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{achievement.progress} / {achievement.maxProgress}</span>
                            <span>{Math.round((achievement.progress / achievement.maxProgress) * 100)}%</span>
                          </div>
                          <Progress value={(achievement.progress / achievement.maxProgress) * 100} className="h-1" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Reading Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Verses Read</span>
                  <span className="font-bold">{progress.versesRead.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Chapters Read</span>
                  <span className="font-bold">{progress.chaptersRead}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Books Completed</span>
                  <span className="font-bold">{progress.booksRead}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Reading Time</span>
                  <span className="font-bold">{formatReadingTime(progress.totalReadingTime)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Longest Streak</span>
                  <span className="font-bold">{progress.longestStreak} days</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="mr-2 h-5 w-5" />
                  Engagement Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <MessageSquare className="mr-2 h-4 w-4 text-blue-500" />
                    <span className="text-sm">Notes Created</span>
                  </div>
                  <span className="font-bold">{progress.notesCreated}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Star className="mr-2 h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Highlights Made</span>
                  </div>
                  <span className="font-bold">{progress.highlightsCreated}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Bookmark className="mr-2 h-4 w-4 text-green-500" />
                    <span className="text-sm">Bookmarks Saved</span>
                  </div>
                  <span className="font-bold">{progress.bookmarksCreated}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Trophy className="mr-2 h-4 w-4 text-purple-500" />
                    <span className="text-sm">Achievements Unlocked</span>
                  </div>
                  <span className="font-bold">{unlockedAchievements.length}/{totalAchievements}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Bible Completion Progress</CardTitle>
              <CardDescription>
                Your progress through the entire Bible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Old Testament</span>
                  <span>6/39 books (15%)</span>
                </div>
                <Progress value={15} className="h-2" />
                
                <div className="flex justify-between text-sm">
                  <span>New Testament</span>
                  <span>2/27 books (7%)</span>
                </div>
                <Progress value={7} className="h-2" />
                
                <div className="flex justify-between text-sm font-medium">
                  <span>Overall Progress</span>
                  <span>8/66 books (12%)</span>
                </div>
                <Progress value={12} className="h-3" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ProgressPage 