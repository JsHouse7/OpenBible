'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/Button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUserPreferences } from '@/components/UserPreferencesProvider'
import { 
  BookOpen, 
  Clock, 
  Target, 
  TrendingUp, 
  Star, 
  Calendar,
  Users,
  Heart,
  Award,
  BookmarkIcon,
  Shield
} from 'lucide-react'

interface ReadingStats {
  totalVersesRead: number
  totalChaptersRead: number
  totalBooksRead: number
  currentStreak: number
  totalReadingTime: number
  notesCreated: number
  bookmarksCreated: number
  highlightsCreated: number
  favoriteBooks: string[]
  recentActivity: Array<{
    type: 'read' | 'note' | 'bookmark' | 'highlight'
    content: string
    timestamp: Date
    book: string
    chapter?: number
    verse?: number
  }>
}

interface DashboardProps {
  onNavigate?: (page: string) => void
}

const Dashboard = ({ onNavigate }: DashboardProps = {}) => {
  const { preferences } = useUserPreferences()
  const [stats, setStats] = useState<ReadingStats>({
    totalVersesRead: 1247,
    totalChaptersRead: 42,
    totalBooksRead: 8,
    currentStreak: 12,
    totalReadingTime: 1680, // minutes
    notesCreated: 56,
    bookmarksCreated: 23,
    highlightsCreated: 89,
    favoriteBooks: ['John', 'Psalms', 'Romans', 'Genesis'],
    recentActivity: [
      {
        type: 'read',
        content: 'Completed John Chapter 3',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        book: 'John',
        chapter: 3
      },
      {
        type: 'highlight',
        content: 'John 3:16 - For God so loved the world...',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        book: 'John',
        chapter: 3,
        verse: 16
      },
      {
        type: 'note',
        content: 'Deep thoughts on born again concept',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        book: 'John',
        chapter: 3
      },
      {
        type: 'bookmark',
        content: 'John 3:1-21 - Nicodemus encounter',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        book: 'John',
        chapter: 3
      }
    ]
  })

  const [currentGoal, setCurrentGoal] = useState({
    type: 'chapters',
    target: 50,
    current: 42,
    deadline: 'End of Month'
  })

  const formatReadingTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'read': return <BookOpen className="h-4 w-4" />
      case 'note': return <Star className="h-4 w-4" />
      case 'bookmark': return <BookmarkIcon className="h-4 w-4" />
      case 'highlight': return <Heart className="h-4 w-4" />
      default: return <BookOpen className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'read': return 'bg-blue-500 text-white'
      case 'note': return 'bg-yellow-500 text-white'
      case 'bookmark': return 'bg-green-500 text-white'
      case 'highlight': return 'bg-red-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back!</h1>
          <p className="text-muted-foreground">
            Continue your spiritual journey with OpenBible
          </p>
        </div>
        <Avatar className="h-12 w-12">
          <AvatarImage src="/api/placeholder/48/48" alt="User" />
          <AvatarFallback>OB</AvatarFallback>
        </Avatar>
      </div>

      {/* Quick Stats or Privacy Notice */}
      {preferences.analyticsVisible ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Current Streak
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.currentStreak} days</div>
              <p className="text-xs text-muted-foreground">
                Keep it going! 🔥
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Chapters Read
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalChaptersRead}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalBooksRead} books completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Reading Time
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatReadingTime(stats.totalReadingTime)}</div>
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
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.notesCreated + stats.highlightsCreated + stats.bookmarksCreated}</div>
              <p className="text-xs text-muted-foreground">
                Notes, highlights & bookmarks
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              Analytics Disabled
            </CardTitle>
            <CardDescription>
              Your reading statistics are currently private. Enable analytics in your profile to see detailed insights about your Bible study progress.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => onNavigate?.('profile')}
              className="w-full sm:w-auto"
            >
              Enable Analytics
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      {preferences.analyticsVisible && (
        <Tabs defaultValue="progress" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

        <TabsContent value="progress" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Reading Goal</CardTitle>
                <CardDescription>
                  {currentGoal.current} of {currentGoal.target} {currentGoal.type} ({currentGoal.deadline})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={(currentGoal.current / currentGoal.target) * 100} className="mb-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{Math.round((currentGoal.current / currentGoal.target) * 100)}% complete</span>
                  <span>{currentGoal.target - currentGoal.current} remaining</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reading Statistics</CardTitle>
                <CardDescription>Your Bible reading journey</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Verses Read:</span>
                  <Badge variant="secondary">{stats.totalVersesRead.toLocaleString()}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Notes Created:</span>
                  <Badge variant="secondary">{stats.notesCreated}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Highlights:</span>
                  <Badge variant="secondary">{stats.highlightsCreated}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Bookmarks:</span>
                  <Badge variant="secondary">{stats.bookmarksCreated}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Favorite Books</CardTitle>
              <CardDescription>Books you've engaged with most</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {stats.favoriteBooks.map((book, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  >
                    {book}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest Bible study activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border border-border bg-card">
                    <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.content}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>{activity.book}</span>
                        {activity.chapter && <span>Chapter {activity.chapter}</span>}
                        {activity.verse && <span>Verse {activity.verse}</span>}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reading Goals</CardTitle>
              <CardDescription>Set and track your spiritual growth goals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                <div className="flex items-center space-x-3">
                  <Award className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                  <div>
                    <h3 className="font-medium text-foreground">Read 50 Chapters This Month</h3>
                    <p className="text-sm text-muted-foreground">84% complete</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Active</Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card opacity-60">
                <div className="flex items-center space-x-3">
                  <Users className="h-8 w-8 text-green-500 dark:text-green-400" />
                  <div>
                    <h3 className="font-medium text-foreground">Join Reading Group</h3>
                    <p className="text-sm text-muted-foreground">Connect with other readers</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-muted-foreground/50 text-muted-foreground">Coming Soon</Badge>
              </div>

              <Button className="w-full">
                <Target className="mr-2 h-4 w-4" />
                Set New Goal
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Reading Patterns</CardTitle>
                <CardDescription>When you read most effectively</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Morning (6-12 PM)</span>
                    <Badge variant="secondary">45%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Evening (6-10 PM)</span>
                    <Badge variant="secondary">35%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Afternoon (12-6 PM)</span>
                    <Badge variant="secondary">20%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Metrics</CardTitle>
                <CardDescription>Your spiritual journey insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Consistency</span>
                      <span className="text-sm">92%</span>
                    </div>
                    <Progress value={92} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Engagement</span>
                      <span className="text-sm">78%</span>
                    </div>
                    <Progress value={78} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Reflection</span>
                      <span className="text-sm">65%</span>
                    </div>
                    <Progress value={65} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Jump back into your reading or explore new content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button 
              className="justify-start bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800" 
              variant="ghost"
              onClick={() => onNavigate?.('reader')}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Continue Reading John 3
            </Button>
            <Button className="justify-start bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800" variant="ghost">
              <Calendar className="mr-2 h-4 w-4" />
              View Reading Plan
            </Button>
            <Button className="justify-start bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800" variant="ghost">
              <Star className="mr-2 h-4 w-4" />
              Browse Literature
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard 