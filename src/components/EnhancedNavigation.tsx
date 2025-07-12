'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/components/ThemeProvider'
import { useAuth } from '@/components/AuthProvider'
import { bibleService, notesService, analyticsService } from '@/lib/database'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [notesCount, setNotesCount] = useState(0)
  const [notificationsCount, setNotificationsCount] = useState(0)
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()
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

  const quickSearchItems = [
    { type: 'book', title: 'Genesis', description: 'First book of the Bible' },
    { type: 'book', title: 'John', description: 'Gospel of John' },
    { type: 'book', title: 'Psalms', description: 'Book of Psalms' },
    { type: 'literature', title: 'Mere Christianity', description: 'C.S. Lewis' },
    { type: 'literature', title: 'Confessions', description: 'Augustine of Hippo' },
    { type: 'verse', title: 'John 3:16', description: 'For God so loved the world...' },
    { type: 'verse', title: 'Romans 8:28', description: 'And we know that in all things...' },
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

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'book': return <BookOpen className="h-4 w-4" />
      case 'literature': return <Library className="h-4 w-4" />
      case 'verse': return <Star className="h-4 w-4" />
      default: return <Search className="h-4 w-4" />
    }
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

  // Search functionality
  useEffect(() => {
    const searchVerses = async () => {
      if (!searchQuery.trim() || searchQuery.length < 3) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        const { data, error } = await bibleService.searchVerses(searchQuery, 'KJV', 10)
        if (!error && data) {
          setSearchResults(data)
        } else {
          setSearchResults([])
        }
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    const debounceTimer = setTimeout(searchVerses, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const handleSearchSelect = (result: any) => {
    setSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
    // Navigate to the verse
    router.push(`/reader?book=${result.book}&chapter=${result.chapter}&verse=${result.verse}`)
  }

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
              {/* Mobile Search Button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-4 w-4" />
              </Button>

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
              <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-[200px] justify-start text-muted-foreground">
                    <Search className="mr-2 h-4 w-4" />
                    Search Bible & Literature...
                  </Button>
                </DialogTrigger>
                <DialogContent className="mx-4 md:mx-0 max-w-[calc(100vw-2rem)] md:max-w-2xl max-h-[85vh] p-0 gap-0">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 md:p-6 border-b bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Search className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <DialogTitle className="text-lg md:text-xl font-semibold">Search OpenBible</DialogTitle>
                        <p className="text-sm text-muted-foreground">Books, verses, literature & topics</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Search Content */}
                  <div className="flex-1 overflow-hidden">
                    <Command className="border-0">
                      <div className="p-4 md:p-6 border-b">
                        <CommandInput 
                          placeholder="Search Bible verses..." 
                          className="h-12 text-base bg-muted/30 border-0 rounded-xl px-4"
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                        />
                      </div>
                      <CommandList className="max-h-[60vh] overflow-y-auto">
                        <CommandEmpty>
                          <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center">
                            <div className="p-3 md:p-4 bg-muted/30 rounded-full mb-3 md:mb-4">
                              <Search className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
                            </div>
                            <p className="text-sm md:text-base font-medium text-muted-foreground">
                              {isSearching ? 'Searching...' : searchQuery.length < 3 ? 'Type at least 3 characters to search' : 'No results found'}
                            </p>
                            <p className="text-xs md:text-sm text-muted-foreground mt-1">
                              {!isSearching && searchQuery.length >= 3 && 'Try different keywords'}
                            </p>
                          </div>
                        </CommandEmpty>
                        
                        <div className="p-2 md:p-4">
                          {/* Search Results */}
                          {searchResults.length > 0 && (
                            <CommandGroup>
                              <div className="flex items-center gap-2 px-3 py-2 md:py-3 mb-2 md:mb-3">
                                <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
                                <span className="font-medium md:font-semibold text-sm md:text-base text-foreground">Search Results</span>
                              </div>
                              {searchResults.map((result, index) => (
                                <CommandItem 
                                  key={index} 
                                  onSelect={() => handleSearchSelect(result)}
                                  className="mx-2 mb-2 p-3 md:p-4 rounded-lg md:rounded-xl hover:bg-muted/50 cursor-pointer"
                                >
                                  <div className="flex items-start gap-3 md:gap-4 w-full">
                                    <div className="p-2 md:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg md:rounded-xl flex-shrink-0">
                                      <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium md:font-semibold text-foreground mb-1">
                                        {result.book} {result.chapter}:{result.verse}
                                      </div>
                                      <div className="text-sm text-muted-foreground line-clamp-2">
                                        {result.text}
                                      </div>
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}

                          {/* Default suggestions when no search query */}
                          {!searchQuery.trim() && (
                            <>
                              {/* Bible Books Section */}
                              <CommandGroup>
                                <div className="flex items-center gap-2 px-3 py-2 md:py-3 mb-2 md:mb-3">
                                  <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
                                  <span className="font-medium md:font-semibold text-sm md:text-base text-foreground">Bible Books</span>
                                </div>
                                {quickSearchItems.filter(item => item.type === 'book').map((item, index) => (
                                  <CommandItem 
                                    key={index} 
                                    onSelect={() => setSearchOpen(false)}
                                    className="mx-2 mb-2 p-3 md:p-4 rounded-lg md:rounded-xl hover:bg-muted/50 cursor-pointer"
                                  >
                                    <div className="flex items-center gap-3 md:gap-4 w-full">
                                      <div className="p-2 md:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg md:rounded-xl">
                                        <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
                                      </div>
                                      <div className="flex-1">
                                        <div className="font-medium md:font-semibold text-foreground">{item.title}</div>
                                        <div className="text-sm text-muted-foreground">{item.description}</div>
                                      </div>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>

                              {/* Popular Verses Section */}
                              <CommandGroup>
                                <div className="flex items-center gap-2 px-3 py-2 md:py-3 mb-2 md:mb-3 mt-4 md:mt-6">
                                  <Star className="h-4 w-4 md:h-5 md:w-5 text-amber-600 dark:text-amber-400" />
                                  <span className="font-medium md:font-semibold text-sm md:text-base text-foreground">Popular Verses</span>
                                </div>
                                {quickSearchItems.filter(item => item.type === 'verse').map((item, index) => (
                                  <CommandItem 
                                    key={index} 
                                    onSelect={() => setSearchOpen(false)}
                                    className="mx-2 mb-2 p-3 md:p-4 rounded-lg md:rounded-xl hover:bg-muted/50 cursor-pointer"
                                  >
                                    <div className="flex items-center gap-3 md:gap-4 w-full">
                                      <div className="p-2 md:p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg md:rounded-xl">
                                        <Star className="h-4 w-4 md:h-5 md:w-5 text-amber-600 dark:text-amber-400" />
                                      </div>
                                      <div className="flex-1">
                                        <div className="font-medium md:font-semibold text-foreground">{item.title}</div>
                                        <div className="text-sm text-muted-foreground">{item.description}</div>
                                      </div>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </>
                          )}
                        </div>
                      </CommandList>
                    </Command>
                  </div>
                  
                  {/* Footer */}
                  <div className="p-4 md:p-6 border-t bg-muted/10">
                    <div className="flex items-center justify-center gap-2 text-xs md:text-sm text-muted-foreground">
                      <span>Type to search or browse suggestions above</span>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

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