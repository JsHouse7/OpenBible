'use client'

import { useState } from 'react'
import { useUserPreferences } from './UserPreferencesProvider'
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
  FileText
} from 'lucide-react'

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false)
  const { preferences, updatePreferences } = useUserPreferences()
  const [profileData, setProfileData] = useState({
    name: 'John Believer',
    email: 'john.believer@example.com',
    bio: 'Passionate about studying God\'s Word and growing in faith. Love sharing insights with the community.',
    joinDate: '2023-03-15',
    location: 'Nashville, TN',
    denomination: 'Non-denominational'
  })

  const readingStats = {
    totalBooks: 42,
    totalChapters: 487,
    totalVerses: 12043,
    readingStreak: 23,
    favoriteBook: 'Psalms',
    totalNotes: 156,
    totalBookmarks: 89,
    totalHighlights: 234
  }

  const achievements = [
    { title: 'First Steps', description: 'Complete your first chapter', earned: true },
    { title: 'Dedicated Reader', description: 'Read for 7 consecutive days', earned: true },
    { title: 'Scripture Scholar', description: 'Complete 10 books', earned: true },
    { title: 'Note Taker', description: 'Create 50 notes', earned: true },
    { title: 'Wisdom Seeker', description: 'Complete Proverbs', earned: false },
    { title: 'Prayer Warrior', description: 'Complete 100 chapters', earned: false }
  ]

  const handleSave = () => {
    // Here you would typically save to your backend/database
    setIsEditing(false)
    console.log('Profile saved:', profileData)
  }

  const handleCancel = () => {
    // Reset any unsaved changes
    setIsEditing(false)
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
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                  >
                    <Save className="h-4 w-4 mr-2" />
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
                    <AvatarFallback className="text-2xl">JB</AvatarFallback>
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
                  <h3 className="text-xl font-semibold">{profileData.name}</h3>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Joined {new Date(profileData.joinDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long' 
                    })}
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
                    />
                  ) : (
                    <p className="text-sm p-2 bg-muted/20 rounded">{profileData.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    />
                  ) : (
                    <p className="text-sm p-2 bg-muted/20 rounded flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {profileData.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  {isEditing ? (
                    <Input
                      id="location"
                      value={profileData.location}
                      onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                    />
                  ) : (
                    <p className="text-sm p-2 bg-muted/20 rounded flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      {profileData.location}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="denomination">Denomination</Label>
                  {isEditing ? (
                    <Input
                      id="denomination"
                      value={profileData.denomination}
                      onChange={(e) => setProfileData({...profileData, denomination: e.target.value})}
                    />
                  ) : (
                    <p className="text-sm p-2 bg-muted/20 rounded">{profileData.denomination}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                {isEditing ? (
                  <Textarea
                    id="bio"
                    rows={3}
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-sm p-3 bg-muted/20 rounded">{profileData.bio}</p>
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