'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { bookmarksService } from '@/lib/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
  Share2,
  Plus,
  BookmarkCheck,
  Loader2
} from 'lucide-react'
import { Label } from '@/components/ui/label'

interface DatabaseBookmark {
  id: string
  user_id: string
  book: string
  chapter: number
  verse: number
  title?: string
  created_at: string
}

const BookmarksPage = () => {
  const { user, loading: authLoading } = useAuth()
  const { getTransitionClass } = useAnimations()
  const [bookmarks, setBookmarks] = useState<DatabaseBookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'book' | 'verse'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterBook, setFilterBook] = useState<string>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [saving, setSaving] = useState(false)

  const [newBookmark, setNewBookmark] = useState({
    book: '',
    chapter: 1,
    verse: 1,
    title: ''
  })

  // Fetch user bookmarks from database
  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        const { data, error: bookmarksError } = await bookmarksService.getUserBookmarks(user.id)
        
        if (bookmarksError) {
          console.error('Error fetching bookmarks:', bookmarksError)
          setError('Failed to load your bookmarks')
          return
        }

        setBookmarks(data || [])
      } catch (error) {
        console.error('Error fetching bookmarks:', error)
        setError('Failed to load your bookmarks')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchBookmarks()
    }
  }, [user, authLoading])

  const handleAddBookmark = async () => {
    if (!user?.id || !newBookmark.book || !newBookmark.chapter || !newBookmark.verse) return

    try {
      setSaving(true)
      setError(null)

      const { data, error: addError } = await bookmarksService.addBookmark(
        user.id,
        newBookmark.book,
        newBookmark.chapter,
        newBookmark.verse,
        newBookmark.title || undefined
      )

      if (addError) {
        console.error('Error adding bookmark:', addError)
        setError('Failed to add bookmark')
        return
      }

      // Refresh bookmarks list
      const { data: updatedBookmarks } = await bookmarksService.getUserBookmarks(user.id)
      setBookmarks(updatedBookmarks || [])

      // Reset form
      setShowAddDialog(false)
      setNewBookmark({ book: '', chapter: 1, verse: 1, title: '' })
      
    } catch (error) {
      console.error('Error adding bookmark:', error)
      setError('Failed to add bookmark')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteBookmark = async (bookmark: DatabaseBookmark) => {
    if (!user?.id) return

    try {
      setSaving(true)
      setError(null)

      const { error: deleteError } = await bookmarksService.removeBookmark(
        user.id,
        bookmark.book,
        bookmark.chapter,
        bookmark.verse
      )

      if (deleteError) {
        console.error('Error deleting bookmark:', deleteError)
        setError('Failed to delete bookmark')
        return
      }

      // Remove from local state
      setBookmarks(bookmarks.filter(b => b.id !== bookmark.id))
      
    } catch (error) {
      console.error('Error deleting bookmark:', error)
      setError('Failed to delete bookmark')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Unknown date'
    }
  }

  const getUniqueBooks = () => {
    const books = Array.from(new Set(bookmarks.map(bookmark => bookmark.book))).sort()
    return books
  }

  const getReference = (bookmark: DatabaseBookmark) => {
    return `${bookmark.book} ${bookmark.chapter}:${bookmark.verse}`
  }

  const filteredAndSortedBookmarks = bookmarks
    .filter(bookmark => {
      const reference = getReference(bookmark)
      const matchesSearch = reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           bookmark.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           bookmark.book.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesBook = filterBook === 'all' || bookmark.book === filterBook
      return matchesSearch && matchesBook
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
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

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="container mx-auto p-6 pb-24 md:pb-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading your bookmarks...</p>
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
            <BookmarkIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Bookmarks Not Available</h2>
            <p className="text-muted-foreground mb-6">Sign in to view and manage your saved verses</p>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Bookmarks</h1>
          <p className="text-muted-foreground">
            Your saved verses and favorite passages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{bookmarks.length} bookmarks</Badge>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Bookmark
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Bookmark</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="book">Book</Label>
                    <Input
                      id="book"
                      value={newBookmark.book}
                      onChange={(e) => setNewBookmark({...newBookmark, book: e.target.value})}
                      placeholder="e.g., John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="chapter">Chapter</Label>
                    <Input
                      id="chapter"
                      type="number"
                      min="1"
                      value={newBookmark.chapter}
                      onChange={(e) => setNewBookmark({...newBookmark, chapter: parseInt(e.target.value) || 1})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="verse">Verse</Label>
                    <Input
                      id="verse"
                      type="number"
                      min="1"
                      value={newBookmark.verse}
                      onChange={(e) => setNewBookmark({...newBookmark, verse: parseInt(e.target.value) || 1})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="title">Title (Optional)</Label>
                  <Input
                    id="title"
                    value={newBookmark.title}
                    onChange={(e) => setNewBookmark({...newBookmark, title: e.target.value})}
                    placeholder="Add a title for this bookmark..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddBookmark}
                    disabled={!newBookmark.book || saving}
                  >
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <BookmarkCheck className="h-4 w-4 mr-2" />}
                    Add Bookmark
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

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
              <Select value={filterBook} onValueChange={setFilterBook}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by book" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Books</SelectItem>
                  {getUniqueBooks().map(book => (
                    <SelectItem key={book} value={book}>{book}</SelectItem>
                  ))}
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
          <TabsTrigger value="all">All Bookmarks ({bookmarks.length})</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
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
                    {searchTerm || filterBook !== 'all' 
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
                        <span className="font-medium">{getReference(bookmark)}</span>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDeleteBookmark(bookmark)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Bookmark
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <blockquote className="text-foreground leading-relaxed mb-3 italic border-l-4 border-primary pl-4">
                      "{bookmark.title || bookmark.book} ${bookmark.chapter}:${bookmark.verse}"
                    </blockquote>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(bookmark.created_at)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4">
          <div className="grid gap-4">
            {bookmarks.filter(b => b.title).map((bookmark, index) => (
              <Card key={bookmark.id} className={cn(
                "group hover:shadow-md transition-all duration-200",
                getTransitionClass('default'),
                "animate-in fade-in-0 slide-in-from-bottom-2"
              )} style={{ animationDelay: `${index * 50}ms` }}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500 fill-current" />
                      <span className="font-medium">{getReference(bookmark)}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <blockquote className="text-foreground leading-relaxed italic border-l-4 border-red-500 pl-4">
                    "{bookmark.title || bookmark.book} ${bookmark.chapter}:${bookmark.verse}"
                  </blockquote>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <div className="grid gap-4">
            {bookmarks
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
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
                        <span className="font-medium">{getReference(bookmark)}</span>
                        <Badge variant="outline" className="text-xs">
                          {formatDate(bookmark.created_at)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <blockquote className="text-foreground leading-relaxed italic border-l-4 border-primary pl-4">
                      "{bookmark.title || bookmark.book} ${bookmark.chapter}:${bookmark.verse}"
                    </blockquote>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default BookmarksPage