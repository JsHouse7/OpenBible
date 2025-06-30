'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAnimations } from '@/components/AnimationProvider'
import { cn } from '@/lib/utils'
import {
  Search,
  BookOpen,
  MoreVertical,
  Trash2,
  Star,
  Filter,
  Tag,
  SortAsc,
  SortDesc,
  Clock,
  BookmarkIcon,
  Heart,
  Eye,
  Copy,
  Share2
} from 'lucide-react'

interface Bookmark {
  id: string
  verseId: string
  text: string
  reference: string
  timestamp: string
  book: string
  chapter: number
  verse: number
  endVerse?: number
  tags?: string[]
  category?: 'favorite' | 'study' | 'memorize' | 'share' | 'devotional'
  notes?: string
}

const BookmarksPage = () => {
  const { getTransitionClass } = useAnimations()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'book' | 'verse'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    const savedBookmarks = localStorage.getItem('openbible-bookmarks')
    if (savedBookmarks) {
      try {
        const parsed = JSON.parse(savedBookmarks)
        setBookmarks(parsed)
      } catch (error) {
        console.error('Failed to parse saved bookmarks:', error)
        initializeSampleBookmarks()
      }
    } else {
      initializeSampleBookmarks()
    }
  }, [])

  const initializeSampleBookmarks = () => {
    const sampleBookmarks: Bookmark[] = [
      {
        id: 'bookmark-1',
        verseId: 'john-3-16',
        text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
        reference: 'John 3:16',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        book: 'John',
        chapter: 3,
        verse: 16,
        tags: ['love', 'salvation', 'eternal life'],
        category: 'favorite',
        notes: 'The most famous verse in the Bible - the Gospel in a nutshell.'
      },
      {
        id: 'bookmark-2',
        verseId: 'psalm-23-1-6',
        text: 'The Lord is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters...',
        reference: 'Psalm 23:1-6',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        book: 'Psalms',
        chapter: 23,
        verse: 1,
        endVerse: 6,
        tags: ['comfort', 'guidance', 'protection'],
        category: 'devotional',
        notes: 'Perfect for times of anxiety and fear. God as our shepherd provides everything we need.'
      },
      {
        id: 'bookmark-3',
        verseId: 'philippians-4-13',
        text: 'I can do all things through Christ which strengtheneth me.',
        reference: 'Philippians 4:13',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        book: 'Philippians',
        chapter: 4,
        verse: 13,
        tags: ['strength', 'perseverance', 'Christ'],
        category: 'memorize',
        notes: 'Not about achieving worldly success, but about contentment in all circumstances through Christ.'
      },
      {
        id: 'bookmark-4',
        verseId: 'romans-8-28',
        text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
        reference: 'Romans 8:28',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        book: 'Romans',
        chapter: 8,
        verse: 28,
        tags: ['providence', 'hope', 'purpose'],
        category: 'study',
        notes: 'Key to understanding God\'s sovereignty in both good and difficult times.'
      }
    ]
    setBookmarks(sampleBookmarks)
    localStorage.setItem('openbible-bookmarks', JSON.stringify(sampleBookmarks))
  }

  // Save bookmarks to localStorage whenever bookmarks change
  useEffect(() => {
    localStorage.setItem('openbible-bookmarks', JSON.stringify(bookmarks))
  }, [bookmarks])

  const filteredAndSortedBookmarks = bookmarks
    .filter(bookmark => {
      const matchesSearch = bookmark.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           bookmark.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           bookmark.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCategory = filterCategory === 'all' || bookmark.category === filterCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          break
        case 'book':
          comparison = a.book.localeCompare(b.book) || a.chapter - b.chapter || a.verse - b.verse
          break
        case 'verse':
          comparison = a.book.localeCompare(b.book) || a.chapter - b.chapter || a.verse - b.verse
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'favorite': return 'bg-red-500'
      case 'study': return 'bg-blue-500'
      case 'memorize': return 'bg-purple-500'
      case 'share': return 'bg-green-500'
      case 'devotional': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'favorite': return '❤️'
      case 'study': return '📚'
      case 'memorize': return '🧠'
      case 'share': return '📤'
      case 'devotional': return '🙏'
      default: return '🔖'
    }
  }

  const handleViewDetails = (bookmark: Bookmark) => {
    setSelectedBookmark(bookmark)
    setIsDetailModalOpen(true)
  }

  const handleDeleteBookmark = (bookmarkId: string) => {
    setBookmarks(prev => prev.filter(bookmark => bookmark.id !== bookmarkId))
  }

  const handleCopyVerse = (bookmark: Bookmark) => {
    const textToCopy = `"${bookmark.text}" - ${bookmark.reference}`
    navigator.clipboard.writeText(textToCopy)
    // Could add a toast notification here
  }

  const favoriteBookmarks = bookmarks.filter(b => b.category === 'favorite')
  const totalBookmarks = bookmarks.length

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookmarks</h1>
          <p className="text-muted-foreground">
            Your saved verses and passages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{totalBookmarks} bookmarks</Badge>
          <Badge variant="outline">{favoriteBookmarks.length} favorites</Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bookmarks, verses, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="favorite">Favorites</SelectItem>
                  <SelectItem value="study">Study</SelectItem>
                  <SelectItem value="memorize">Memorize</SelectItem>
                  <SelectItem value="share">Share</SelectItem>
                  <SelectItem value="devotional">Devotional</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="book">Book</SelectItem>
                  <SelectItem value="verse">Verse</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Bookmarks ({totalBookmarks})</TabsTrigger>
          <TabsTrigger value="favorites">Favorites ({favoriteBookmarks.length})</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredAndSortedBookmarks.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <BookmarkIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No bookmarks found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || filterCategory !== 'all' 
                      ? 'Try adjusting your search or filters'
                      : 'Start bookmarking verses as you read to save them for later'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredAndSortedBookmarks.map((bookmark, index) => (
                <Card key={bookmark.id} className={cn(
                  "group hover:shadow-md transition-all duration-200",
                  getTransitionClass('default'),
                  "animate-in fade-in-0 slide-in-from-bottom-2"
                )} style={{ animationDelay: `${index * 50}ms` }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <BookmarkIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{bookmark.reference}</span>
                        {bookmark.category && (
                          <Badge variant="secondary" className={`${getCategoryColor(bookmark.category)} text-white text-xs`}>
                            {getCategoryIcon(bookmark.category)} {bookmark.category}
                          </Badge>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(bookmark)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyVerse(bookmark)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Verse
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteBookmark(bookmark.id)}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Bookmark
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <blockquote className="text-foreground leading-relaxed mb-3 italic border-l-4 border-primary pl-4">
                      "{bookmark.text}"
                    </blockquote>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(bookmark.timestamp)}
                        </div>
                        {bookmark.tags && bookmark.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            <div className="flex gap-1">
                              {bookmark.tags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs py-0">
                                  {tag}
                                </Badge>
                              ))}
                              {bookmark.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs py-0">
                                  +{bookmark.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {bookmark.notes && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">{bookmark.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4">
          <div className="grid gap-4">
            {favoriteBookmarks.map((bookmark, index) => (
              <Card key={bookmark.id} className={cn(
                "group hover:shadow-md transition-all duration-200",
                getTransitionClass('default'),
                "animate-in fade-in-0 slide-in-from-bottom-2"
              )} style={{ animationDelay: `${index * 50}ms` }}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500 fill-current" />
                      <span className="font-medium">{bookmark.reference}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <blockquote className="text-foreground leading-relaxed italic border-l-4 border-red-500 pl-4">
                    "{bookmark.text}"
                  </blockquote>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <div className="grid gap-4">
            {bookmarks
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, 10)
              .map((bookmark, index) => (
                <Card key={bookmark.id} className={cn(
                  "group hover:shadow-md transition-all duration-200",
                  getTransitionClass('default'),
                  "animate-in fade-in-0 slide-in-from-bottom-2"
                )} style={{ animationDelay: `${index * 50}ms` }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <BookmarkIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{bookmark.reference}</span>
                        <Badge variant="outline" className="text-xs">
                          {formatDate(bookmark.timestamp)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <blockquote className="text-foreground leading-relaxed italic border-l-4 border-primary pl-4">
                      "{bookmark.text}"
                    </blockquote>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedBookmark?.reference}</DialogTitle>
            <DialogDescription>
              Saved on {selectedBookmark && formatDate(selectedBookmark.timestamp)}
            </DialogDescription>
          </DialogHeader>
          {selectedBookmark && (
            <div className="space-y-4">
              <blockquote className="text-lg leading-relaxed italic border-l-4 border-primary pl-4">
                "{selectedBookmark.text}"
              </blockquote>
              
              {selectedBookmark.notes && (
                <div className="space-y-2">
                  <h4 className="font-medium">Notes:</h4>
                  <p className="text-muted-foreground">{selectedBookmark.notes}</p>
                </div>
              )}
              
              {selectedBookmark.tags && selectedBookmark.tags.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Tags:</h4>
                  <div className="flex gap-2 flex-wrap">
                    {selectedBookmark.tags.map(tag => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => handleCopyVerse(selectedBookmark)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Verse
                </Button>
                <Button variant="outline">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BookmarksPage