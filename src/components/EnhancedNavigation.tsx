'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/components/ThemeProvider'
import { useAuth } from '@/components/AuthProvider'
import { useFonts } from '@/hooks/useFonts'
import { notesService, analyticsService } from '@/lib/database'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import SearchBar from '@/components/SearchBar'
import { 
  Menu,
  Search,
  Home,
  BookOpen,
  Star,
  Settings,
  Bell,
  User,
  Moon,
  Sun,
  Monitor,
  Library,
  Bookmark,
  Heart,
  Target,
  TrendingUp,
  Calendar,
  Shield
} from 'lucide-react'

const EnhancedNavigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notesCount, setNotesCount] = useState(0)
  const [notificationsCount, setNotificationsCount] = useState(0)
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()
  const { getUITextClasses } = useFonts()
  const router = useRouter()
  const pathname = usePathname()

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, badge: null, href: '/dashboard' },
    { id: 'bible', label: 'Bible Reader', icon: BookOpen, badge: null, href: '/bible' },
    { id: 'literature', label: 'Literature', icon: Library, badge: null, href: '/literature' },
    { id: 'notes', label: 'My Notes', icon: Star, badge: notesCount > 0 ? notesCount.toString() : null, href: '/notes' },
    { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark, badge: null, href: '/bookmarks' },
    { id: 'highlights', label: 'Highlights', icon: Heart, badge: null, href: '/highlights' },
    { id: 'progress', label: 'Progress', icon: TrendingUp, badge: null, href: '/progress' },
    { id: 'reading-plans', label: 'Reading Plans', icon: Calendar, badge: 'Soon', href: '/reading-plans' },
    { id: 'profile', label: 'My Profile', icon: User, badge: null, href: '/profile' },
  ]

  const getCurrentPage = () => {
    if (pathname === '/') return 'dashboard'
    return pathname.slice(1) // Remove leading slash
  }

  const handleNavigation = (href: string) => {
    router.push(href)
    setMobileMenuOpen(false)
    setUserMenuOpen(false)
  }

  const toggleTheme = () => {
    const themes = ['light', 'dark', 'system'] as const
    const currentIndex = themes.indexOf(theme)
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    setTheme(nextTheme)
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return <Sun className="h-4 w-4" />
      case 'dark': return <Moon className="h-4 w-4" />
      case 'system': return <Monitor className="h-4 w-4" />
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

  // Fetch user data for dynamic counts
  useEffect(() => {
    const fetchUserCounts = async () => {
      if (!user?.id) {
        setNotesCount(0)
        setNotificationsCount(0)
        return
      }

      try {
        // Fetch notes count
        const notesResult = await notesService.getUserNotes(user.id)
        setNotesCount(notesResult.data?.length || 0)

        // For notifications, we'll use a simple calculation based on recent activity
        // In a real app, you'd have a notifications table
        const statsResult = await analyticsService.getUserStats(user.id)
        const recentActivity = (statsResult.data?.totalNotes || 0) + (statsResult.data?.totalBookmarks || 0)
        setNotificationsCount(Math.min(recentActivity, 9)) // Cap at 9 for UI
      } catch (error) {
        console.error('Error fetching user counts:', error)
      }
    }

    fetchUserCounts()
  }, [user])

  return (
    <>
      {/* Main Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container">
          
          {/* Mobile Layout */}
          <div className="flex h-14 items-center justify-between md:hidden px-4">
            {/* Left side - Logo and Menu */}
            <div className="flex items-center gap-3">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      OpenBible
                    </SheetTitle>
                    <SheetDescription>
                      Navigate your spiritual journey
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-2">
                    {navigationItems.map((item) => (
                      <Button
                        key={item.id}
                        variant={getCurrentPage() === item.id ? "default" : "ghost"}
                        className="w-full justify-start h-11"
                        onClick={() => {
                          handleNavigation(item.href)
                        }}
                      >
                        <item.icon className="mr-3 h-4 w-4" />
                        {item.label}
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </Button>
                    ))}
                    
                    {/* Quick Actions */}
                    <div className="pt-4 border-t mt-4">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start h-11"
                        onClick={() => {
                          toggleTheme()
                          setMobileMenuOpen(false)
                        }}
                      >
                        {getThemeIcon()}
                        <span className="ml-3">Switch Theme</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start h-11"
                        onClick={() => {
                          handleNavigation('/settings')
                          setMobileMenuOpen(false)
                        }}
                      >
                        <Settings className="mr-3 h-4 w-4" />
                        Settings
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-lg font-bold text-foreground">OpenBible</span>
              </div>
            </div>

            {/* Right side - Search and Notifications */}
            <div className="flex items-center gap-2">
              {/* Mobile Search */}
              <div className="w-8">
                <SearchBar 
                  placeholder="Search..."
                  className="h-9 w-9 p-0"
                  variant="mobile"
                />
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-4 w-4" />
                {notificationsCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 text-[10px] p-0 flex items-center justify-center min-w-0">
                    {notificationsCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex h-16 items-center justify-between">
            {/* Logo and Mobile Menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <span className="text-xl font-bold text-foreground">OpenBible</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="flex items-center space-x-1">
              {navigationItems.slice(0, 4).map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => handleNavigation(item.href)}
                  className={`relative ${
                    getCurrentPage() === item.id 
                      ? 'text-foreground font-medium' 
                      : 'text-muted-foreground'
                  }`}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                  {item.badge && (
                    <Badge variant="secondary" className="ml-2">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>

            {/* Search and Actions */}
            <div className="flex items-center space-x-2">
              {/* Search */}
              <SearchBar 
                placeholder="Search Bible & Literature..."
                className="w-[300px]"
                variant="desktop"
              />

              {/* Theme Toggle */}
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {getThemeIcon()}
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                {notificationsCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
                    {notificationsCount}
                  </Badge>
                )}
              </Button>

              {/* User Menu */}
              <Sheet open={userMenuOpen} onOpenChange={setUserMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <SheetTitle>{getUserDisplayName()}</SheetTitle>
                        <p className="text-sm text-muted-foreground">{user?.email || 'Not signed in'}</p>
                      </div>
                    </div>
                  </SheetHeader>
                  <div className="mt-6 space-y-2">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => {
                        handleNavigation('/profile')
                        setUserMenuOpen(false)
                      }}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => {
                        handleNavigation('/settings')
                        setUserMenuOpen(false)
                      }}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => {
                        window.open('/auth', '_blank')
                        setUserMenuOpen(false)
                      }}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Authentication Demo
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start" 
                      onClick={() => {
                        toggleTheme()
                        setUserMenuOpen(false)
                      }}
                    >
                      {getThemeIcon()}
                      <span className="ml-2">Switch Theme</span>
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

    </>
  )
}

export default EnhancedNavigation