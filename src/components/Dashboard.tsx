'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/Button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUserPreferences } from '@/components/UserPreferencesProvider'
import { useAuth } from '@/components/AuthProvider'
import { analyticsService, progressService } from '@/lib/database'
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
  Shield,
  Loader2
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
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<ReadingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastReadPosition, setLastReadPosition] = useState<{book: string, chapter: number} | null>(null)

  const [currentGoal, setCurrentGoal] = useState({
    type: 'chapters',
    target: 50,
    current: 0,
    deadline: 'End of Month'
  })

  // Fetch real user statistics and reading progress
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        // Fetch user stats and reading progress in parallel
        const [statsResult, progressResult] = await Promise.all([
          analyticsService.getUserStats(user.id),
          progressService.getUserProgress(user.id)
        ])
        
        if (statsResult.error) {
          console.error('Error fetching user stats:', statsResult.error)
          setError('Failed to load your statistics')
          return
        }

        // Get last read position
        if (progressResult.data && progressResult.data.length > 0) {
          const lastRead = progressResult.data[0] // Most recent reading
          setLastReadPosition({
            book: lastRead.book,
            chapter: lastRead.chapter
          })
        }

        // Transform database stats to component format
        const transformedStats: ReadingStats = {
          totalVersesRead: 0, // TODO: Implement verse tracking
          totalChaptersRead: progressResult.data?.length || 0,
          totalBooksRead: statsResult.data?.booksRead || 0,
          currentStreak: statsResult.data?.currentStreak || 0,
          totalReadingTime: statsResult.data?.totalReadingTime || 0,
          notesCreated: statsResult.data?.totalNotes || 0,
          bookmarksCreated: statsResult.data?.totalBookmarks || 0,
          highlightsCreated: statsResult.data?.totalHighlights || 0,
          favoriteBooks: [], // TODO: Calculate from reading progress
          recentActivity: [] // TODO: Implement activity tracking
        }

        setStats(transformedStats)
        setCurrentGoal(prev => ({
          ...prev,
          current: transformedStats.totalChaptersRead
        }))

      } catch (error) {
        console.error('Error fetching user data:', error)
        setError('Failed to load your statistics')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchUserData()
    }
  }, [user, authLoading])

  const formatReadingTime = (minutes: number) => {
    if (minutes === 0) return '0h 0m'
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

  const getUserDisplayName = () => {
    if (!user) return 'Guest'
    return user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  }

  const getUserInitials = () => {
    const name = getUserDisplayName()
    if (name === 'Guest') return 'G'
    return name.split(' ').map((word: string) => word[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleNavigation = (path: string) => {
    if (onNavigate) {
      onNavigate(path)
    } else {
      router.push(path)
    }
  }

  const getContinueReadingText = () => {
    if (lastReadPosition) {
      return `Continue Reading ${lastReadPosition.book} ${lastReadPosition.chapter}`
    }
    return 'Start Reading'
  }

  const getContinueReadingPath = () => {
    if (lastReadPosition) {
      return `/bible?book=${encodeURIComponent(lastReadPosition.book)}&chapter=${lastReadPosition.chapter}`
    }
    return '/bible'
  }

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  // Show login prompt for unauthenticated users
  if (!user) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Welcome to OpenBible</h2>
            <p className="text-muted-foreground mb-6">Sign in to track your reading progress and personalize your experience</p>
            <Button onClick={() => window.location.href = '/auth'}>
              Sign In
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {getUserDisplayName()}!
          </h1>
          <p className="text-muted-foreground">
            Continue your spiritual journey with OpenBible
          </p>
        </div>
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.user_metadata?.avatar_url} />
          <AvatarFallback>{getUserInitials()}</AvatarFallback>
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
              <div className="text-2xl font-bold">{stats?.currentStreak || 0} days</div>
              <p className="text-xs text-muted-foreground">
                {stats?.currentStreak ? 'Keep it going! 🔥' : 'Start your reading journey!'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Books Read
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalBooksRead || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.totalChaptersRead || 0} chapters
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
              <div className="text-2xl font-bold">{formatReadingTime(stats?.totalReadingTime || 0)}</div>
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
              <div className="text-2xl font-bold">
                {(stats?.notesCreated || 0) + (stats?.highlightsCreated || 0) + (stats?.bookmarksCreated || 0)}
              </div>
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
                  <Badge variant="secondary">{stats?.totalVersesRead.toLocaleString() || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Notes Created:</span>
                  <Badge variant="secondary">{stats?.notesCreated || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Highlights:</span>
                  <Badge variant="secondary">{stats?.highlightsCreated || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Bookmarks:</span>
                  <Badge variant="secondary">{stats?.bookmarksCreated || 0}</Badge>
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
                {stats?.favoriteBooks.map((book, index) => (
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
                {stats?.recentActivity.map((activity, index) => (
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
              onClick={() => handleNavigation(getContinueReadingPath())}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              {getContinueReadingText()}
            </Button>
            <Button 
              className="justify-start bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800" 
              variant="ghost"
              onClick={() => handleNavigation('/reading-plans')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              View Reading Plan
            </Button>
            <Button 
              className="justify-start bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800" 
              variant="ghost"
              onClick={() => handleNavigation('/literature')}
            >
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