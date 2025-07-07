'use client'

import { useState, useEffect } from 'react'
import { useUserPreferences } from './UserPreferencesProvider'
import { useAuth } from './AuthProvider'
import { analyticsService } from '@/lib/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  User,
  Mail,
  Calendar,
  BookOpen,
  Star,
  Bookmark,
  TrendingUp,
  Award,
  Edit3,
  Save,
  X,
  Camera,
  Bell,
  Shield,
  Globe,
  Clock,
  BarChart3,
  Home,
  Library,
  FileText,
  Loader2
} from 'lucide-react'

const ProfilePage = () => {
  const { user, updateProfile, loading: authLoading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { preferences, updatePreferences } = useUserPreferences()
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    bio: '',
    joinDate: '',
    location: '',
    denomination: ''
  })

  const [readingStats, setReadingStats] = useState({
    totalBooks: 0,
    totalChapters: 0,
    totalVerses: 0,
    readingStreak: 0,
    favoriteBook: '',
    totalNotes: 0,
    totalBookmarks: 0,
    totalHighlights: 0
  })

  const achievements = [
    { title: 'First Steps', description: 'Complete your first chapter', earned: readingStats.totalChapters > 0 },
    { title: 'Dedicated Reader', description: 'Read for 7 consecutive days', earned: readingStats.readingStreak >= 7 },
    { title: 'Scripture Scholar', description: 'Complete 10 books', earned: readingStats.totalBooks >= 10 },
    { title: 'Note Taker', description: 'Create 50 notes', earned: readingStats.totalNotes >= 50 },
    { title: 'Wisdom Seeker', description: 'Complete Proverbs', earned: false }, // TODO: Check specific book completion
    { title: 'Prayer Warrior', description: 'Complete 100 chapters', earned: readingStats.totalChapters >= 100 }
  ]

  // Fetch user data and stats
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Set profile data from auth user
        setProfileData({
          name: user.user_metadata?.full_name || '',
          email: user.email || '',
          bio: user.user_metadata?.bio || '',
          joinDate: user.created_at || '',
          location: user.user_metadata?.location || '',
          denomination: user.user_metadata?.denomination || ''
        })

        // Fetch user statistics
        const { data: userStats, error: statsError } = await analyticsService.getUserStats(user.id)
        
        if (statsError) {
          console.error('Error fetching user stats:', statsError)
          // Don't show error for stats, just use defaults
        } else if (userStats) {
          setReadingStats({
            totalBooks: userStats.booksRead || 0,
            totalChapters: userStats.booksRead || 0, // Using books as proxy for chapters
            totalVerses: 0, // TODO: Implement verse tracking
            readingStreak: userStats.currentStreak || 0,
            favoriteBook: 'Psalms', // TODO: Calculate from reading data
            totalNotes: userStats.totalNotes || 0,
            totalBookmarks: userStats.totalBookmarks || 0,
            totalHighlights: userStats.totalHighlights || 0
          })
        }

      } catch (error) {
        console.error('Error fetching user data:', error)
        setError('Failed to load profile data')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchUserData()
    }
  }, [user, authLoading])

  const handleSave = async () => {
    if (!user) return

    try {
      setSaving(true)
      setError(null)

      // Update user profile in Supabase Auth
      const { error: updateError } = await updateProfile({
        full_name: profileData.name,
        bio: profileData.bio,
        location: profileData.location,
        denomination: profileData.denomination
      })

      if (updateError) {
        console.error('Profile update error:', updateError)
        setError('Failed to update profile')
        return
      }

      setIsEditing(false)
      console.log('Profile updated successfully')
    } catch (error) {
      console.error('Unexpected error updating profile:', error)
      setError('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset to original user data
    if (user) {
      setProfileData({
        name: user.user_metadata?.full_name || '',
        email: user.email || '',
        bio: user.user_metadata?.bio || '',
        joinDate: user.created_at || '',
        location: user.user_metadata?.location || '',
        denomination: user.user_metadata?.denomination || ''
      })
    }
    setIsEditing(false)
    setError(null)
  }

  const getUserInitials = () => {
    if (!profileData.name) return user?.email?.[0]?.toUpperCase() || 'U'
    return profileData.name.split(' ').map((word: string) => word[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatJoinDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      })
    } catch {
      return 'Recently'
    }
  }

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="container mx-auto p-6 pb-24 md:pb-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show login prompt for unauthenticated users
  if (!user) {
    return (
      <div className="container mx-auto p-6 pb-24 md:pb-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Profile Not Available</h2>
            <p className="text-muted-foreground mb-6">Sign in to view and manage your profile</p>
            <Button onClick={() => window.location.href = '/auth'}>
              Sign In
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 pb-24 md:pb-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your account and reading preferences
          </p>
        </div>
        <User className="h-8 w-8 text-muted-foreground" />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Information */}
        <div className="md:col-span-2 space-y-6">
          {/* Basic Profile */}
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Your personal information and bio
                </CardDescription>
              </div>
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="text-2xl">{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{profileData.name || profileData.email}</h3>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Joined {formatJoinDate(profileData.joinDate)}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Profile Fields */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-sm p-2 bg-muted/20 rounded">{profileData.name || 'Not set'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <p className="text-sm p-2 bg-muted/20 rounded flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {profileData.email}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  {isEditing ? (
                    <Input
                      id="location"
                      value={profileData.location}
                      onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                      placeholder="City, State/Country"
                    />
                  ) : (
                    <p className="text-sm p-2 bg-muted/20 rounded">{profileData.location || 'Not set'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="denomination">Denomination</Label>
                  {isEditing ? (
                    <Input
                      id="denomination"
                      value={profileData.denomination}
                      onChange={(e) => setProfileData({...profileData, denomination: e.target.value})}
                      placeholder="e.g., Non-denominational, Baptist, etc."
                    />
                  ) : (
                    <p className="text-sm p-2 bg-muted/20 rounded">{profileData.denomination || 'Not set'}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                {isEditing ? (
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    placeholder="Tell others about yourself and your faith journey..."
                    className="min-h-[100px]"
                  />
                ) : (
                  <p className="text-sm p-2 bg-muted/20 rounded min-h-[50px]">
                    {profileData.bio || 'No bio added yet'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Preferences</CardTitle>
              <CardDescription>
                Control your account settings and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications" className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about your reading progress
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) => 
                    updatePreferences({ emailNotifications: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="public-profile" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Public Profile
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow others to see your reading progress
                  </p>
                </div>
                <Switch
                  id="public-profile"
                  checked={preferences.publicProfile}
                  onCheckedChange={(checked) => 
                    updatePreferences({ publicProfile: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-stats" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Show Reading Statistics
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Display your stats on your profile
                  </p>
                </div>
                <Switch
                  id="show-stats"
                  checked={preferences.showReadingStats}
                  onCheckedChange={(checked) => 
                    updatePreferences({ showReadingStats: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="daily-reminders" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Daily Reading Reminders
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded to maintain your reading streak
                  </p>
                </div>
                <Switch
                  id="daily-reminders"
                  checked={preferences.dailyReminders}
                  onCheckedChange={(checked) => 
                    updatePreferences({ dailyReminders: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="analytics-visible" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Show Analytics & Statistics
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Display detailed reading analytics throughout the app
                  </p>
                </div>
                <Switch
                  id="analytics-visible"
                  checked={preferences.analyticsVisible}
                  onCheckedChange={(checked) => 
                    updatePreferences({ analyticsVisible: checked })
                  }
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="space-y-0.5">
                  <Label htmlFor="home-page" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Default Home Page
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Choose which page to show when you open the app
                  </p>
                </div>
                <Select
                  value={preferences.homePage}
                  onValueChange={(value) => 
                    updatePreferences({ homePage: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dashboard">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Dashboard
                      </div>
                    </SelectItem>
                    <SelectItem value="reader">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Bible Reader
                      </div>
                    </SelectItem>
                    <SelectItem value="literature">
                      <div className="flex items-center gap-2">
                        <Library className="h-4 w-4" />
                        Literature Library
                      </div>
                    </SelectItem>
                    <SelectItem value="notes">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        My Notes
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Reading Statistics */}
          {preferences.analyticsVisible ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Reading Stats
                </CardTitle>
                <CardDescription>
                  Your spiritual journey progress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {readingStats.totalBooks}
                    </div>
                    <div className="text-xs text-muted-foreground">Books Read</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {readingStats.readingStreak}
                    </div>
                    <div className="text-xs text-muted-foreground">Day Streak</div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chapters:</span>
                    <span className="font-medium">{readingStats.totalChapters.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Verses:</span>
                    <span className="font-medium">{readingStats.totalVerses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Notes:</span>
                    <span className="font-medium">{readingStats.totalNotes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bookmarks:</span>
                    <span className="font-medium">{readingStats.totalBookmarks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Highlights:</span>
                    <span className="font-medium">{readingStats.totalHighlights}</span>
                  </div>
                </div>

                <Separator />

                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Favorite Book
                  </div>
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {readingStats.favoriteBook}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                  Analytics Disabled
                </CardTitle>
                <CardDescription>
                  Enable analytics to see your reading progress
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-8">
                <div className="space-y-4">
                  <div className="p-4 bg-muted/30 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                    <BarChart3 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Your reading statistics are hidden
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Turn on analytics in Privacy & Preferences to track your progress
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Achievements
              </CardTitle>
              <CardDescription>
                Your spiritual milestones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {achievements.map((achievement, index) => (
                <div 
                  key={index} 
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    achievement.earned 
                      ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' 
                      : 'bg-muted/30'
                  }`}
                >
                  <div className={`p-1 rounded-full ${
                    achievement.earned 
                      ? 'bg-amber-100 dark:bg-amber-900/40' 
                      : 'bg-muted'
                  }`}>
                    <Award className={`h-4 w-4 ${
                      achievement.earned 
                        ? 'text-amber-600 dark:text-amber-400' 
                        : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium text-sm ${
                      achievement.earned ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {achievement.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {achievement.description}
                    </div>
                  </div>
                  {achievement.earned && (
                    <Badge variant="secondary" className="text-xs">
                      Earned
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage 