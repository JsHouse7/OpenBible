'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  Home, 
  BookOpen, 
  Library, 
  FileText, 
  Bookmark, 
  Highlighter,
  TrendingUp,
  Calendar,
  Settings,
  User,
  Menu,
  X,
  Bell,
  Search
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useAnimations } from '@/components/AnimationProvider'

const primaryNavItems = [
  { id: 'dashboard', icon: Home, label: 'Home', href: '/dashboard' },
  { id: 'bible', icon: BookOpen, label: 'Bible', href: '/bible' },
  { id: 'literature', icon: Library, label: 'Library', href: '/literature' },
  { id: 'notes', icon: FileText, label: 'Notes', href: '/notes' },
]

const secondaryNavItems = [
  { id: 'bookmarks', icon: Bookmark, label: 'Bookmarks', href: '/bookmarks' },
  { id: 'highlights', icon: Highlighter, label: 'Highlights', href: '/highlights' },
  { id: 'progress', icon: TrendingUp, label: 'Progress', href: '/progress' },
  { id: 'plans', icon: Calendar, label: 'Plans', href: '/reading-plans' },
  { id: 'settings', icon: Settings, label: 'Settings', href: '/settings' },
]

export default function MobileBottomNav() {
  const [showMenu, setShowMenu] = useState(false)
  const { getTransitionClass, isAnimationEnabled } = useAnimations()
  const router = useRouter()
  const pathname = usePathname()

  const toggleMenu = () => {
    setShowMenu(!showMenu)
  }

  const handleNavigation = (href: string) => {
    router.push(href)
    setShowMenu(false)
  }

  const getCurrentPage = () => {
    if (pathname === '/') return 'dashboard'
    return pathname.slice(1).split('/')[0] // Remove leading slash and get first segment
  }

  const currentPage = getCurrentPage()

  return (
    <>
      {/* Overlay */}
      {showMenu && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* Extended Menu */}
      {showMenu && (
        <div className={cn(
          "fixed bottom-20 left-4 right-4 bg-background/95 backdrop-blur-md border rounded-2xl shadow-2xl z-50 md:hidden",
          isAnimationEnabled('modal') && "animate-in slide-in-from-bottom-8 fade-in-0 duration-300"
        )}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Quick Access</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMenu(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Search */}
            <div className="mb-4">
              <Button
                variant="outline"
                className="w-full justify-start h-10"
                onClick={() => handleNavigation('/search')}
              >
                <Search className="h-4 w-4 mr-2" />
                Search Bible & Literature
              </Button>
            </div>

            {/* Secondary Navigation Grid */}
            <div className="grid grid-cols-2 gap-3">
              {secondaryNavItems.map((item) => (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? "default" : "ghost"}
                  className={cn(
                    "flex flex-col items-center gap-1 h-auto py-3 px-2",
                    getTransitionClass('default', 'button')
                  )}
                  onClick={() => handleNavigation(item.href)}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Button>
              ))}
            </div>

            {/* User Section */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Welcome back!</p>
                  <p className="text-xs text-muted-foreground">Continue your reading journey</p>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Bell className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t z-30 md:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {primaryNavItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "flex flex-col items-center gap-1 h-auto py-2 px-3 min-w-[60px] relative",
                getTransitionClass('fast', 'button'),
                currentPage === item.id 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => handleNavigation(item.href)}
            >
              <div className="relative">
                <item.icon className={cn(
                  "h-5 w-5",
                  currentPage === item.id && "scale-110",
                  getTransitionClass('fast', 'button')
                )} />
                {('badge' in item) && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 w-4 p-0 text-[10px] flex items-center justify-center"
                  >
                    {item.badge as React.ReactNode}
                  </Badge>
                )}
                {currentPage === item.id && (
                  <div className={cn(
                    "absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full",
                    isAnimationEnabled('button') && "animate-pulse"
                  )} />
                )}
              </div>
              <span className={cn(
                "text-xs font-medium",
                currentPage === item.id && "text-primary"
              )}>
                {item.label}
              </span>
            </Button>
          ))}
          
          {/* More Menu Button */}
          <Button
            variant="ghost"
            className={cn(
              "flex flex-col items-center gap-1 h-auto py-2 px-3 min-w-[60px] relative",
              getTransitionClass('fast', 'button'),
              showMenu 
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={toggleMenu}
          >
            <div className="relative">
              {showMenu ? (
                <X className={cn(
                  "h-5 w-5",
                  isAnimationEnabled('button') && "rotate-90",
                  getTransitionClass('fast', 'button')
                )} />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              {showMenu && (
                <div className={cn(
                  "absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full",
                  isAnimationEnabled('button') && "animate-pulse"
                )} />
              )}
            </div>
            <span className={cn(
              "text-xs font-medium",
              showMenu && "text-primary"
            )}>
              More
            </span>
          </Button>
        </div>
        
        {/* Home Indicator for iPhone */}
        <div className="h-1 bg-muted-foreground/20 rounded-full w-32 mx-auto mb-1" />
      </div>
    </>
  )
}