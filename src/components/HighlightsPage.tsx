'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { highlightsService } from '@/lib/database'
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
  Highlighter,
  MoreVertical,
  Trash2,
  Filter,
  SortAsc,
  SortDesc,
  Clock,
  BookOpen,
  Plus,
  Loader2,
  Palette
} from 'lucide-react'
import { Label } from '@/components/ui/label'

interface DatabaseHighlight {
  id: string
  user_id: string
  book: string
  chapter: number
  verse: number
  color: string
  created_at: string
}

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: 'yellow', class: 'bg-yellow-200 text-yellow-800 border-yellow-300' },
  { name: 'Blue', value: 'blue', class: 'bg-blue-200 text-blue-800 border-blue-300' },
  { name: 'Green', value: 'green', class: 'bg-green-200 text-green-800 border-green-300' },
  { name: 'Pink', value: 'pink', class: 'bg-pink-200 text-pink-800 border-pink-300' },
  { name: 'Purple', value: 'purple', class: 'bg-purple-200 text-purple-800 border-purple-300' },
  { name: 'Orange', value: 'orange', class: 'bg-orange-200 text-orange-800 border-orange-300' }
]

const HighlightsPage = () => {
  const { user, loading: authLoading } = useAuth()
  const { getTransitionClass } = useAnimations()
  const [highlights, setHighlights] = useState<DatabaseHighlight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'book' | 'verse'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterBook, setFilterBook] = useState<string>('all')
  const [filterColor, setFilterColor] = useState<string>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [saving, setSaving] = useState(false)

  const [newHighlight, setNewHighlight] = useState({
    book: '',
    chapter: 1,
    verse: 1,
    color: 'yellow'
  })

  // Fetch user highlights from database
  useEffect(() => {
    const fetchHighlights = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        const { data, error: highlightsError } = await highlightsService.getUserHighlights(user.id)
        
        if (highlightsError) {
          console.error('Error fetching highlights:', highlightsError)
          setError('Failed to load your highlights')
          return
        }

        setHighlights(data || [])
      } catch (error) {
        console.error('Error fetching highlights:', error)
        setError('Failed to load your highlights')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchHighlights()
    }
  }, [user, authLoading])

  const handleAddHighlight = async () => {
    if (!user?.id || !newHighlight.book || !newHighlight.chapter || !newHighlight.verse) return

    try {
      setSaving(true)
      setError(null)

      const { data, error: addError } = await highlightsService.addHighlight(
        user.id,
        newHighlight.book,
        newHighlight.chapter,
        newHighlight.verse,
        newHighlight.color
      )

      if (addError) {
        console.error('Error adding highlight:', addError)
        setError('Failed to add highlight')
        return
      }

      // Refresh highlights list
      const { data: updatedHighlights } = await highlightsService.getUserHighlights(user.id)
      setHighlights(updatedHighlights || [])

      // Reset form
      setShowAddDialog(false)
      setNewHighlight({ book: '', chapter: 1, verse: 1, color: 'yellow' })
      
    } catch (error) {
      console.error('Error adding highlight:', error)
      setError('Failed to add highlight')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteHighlight = async (highlight: DatabaseHighlight) => {
    if (!user?.id) return

    try {
      setSaving(true)
      setError(null)

      const { error: deleteError } = await highlightsService.removeHighlight(
        user.id,
        highlight.book,
        highlight.chapter,
        highlight.verse
      )

      if (deleteError) {
        console.error('Error deleting highlight:', deleteError)
        setError('Failed to delete highlight')
        return
      }

      // Remove from local state
      setHighlights(highlights.filter(h => h.id !== highlight.id))
      
    } catch (error) {
      console.error('Error deleting highlight:', error)
      setError('Failed to delete highlight')
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
    const books = Array.from(new Set(highlights.map(highlight => highlight.book))).sort()
    return books
  }

  const getReference = (highlight: DatabaseHighlight) => {
    return `${highlight.book} ${highlight.chapter}:${highlight.verse}`
  }

  const getColorClass = (color: string) => {
    const colorConfig = HIGHLIGHT_COLORS.find(c => c.value === color)
    return colorConfig?.class || 'bg-yellow-200 text-yellow-800 border-yellow-300'
  }

  const filteredAndSortedHighlights = highlights
    .filter(highlight => {
      const reference = getReference(highlight)
      const matchesSearch = reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           highlight.book.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesBook = filterBook === 'all' || highlight.book === filterBook
      const matchesColor = filterColor === 'all' || highlight.color === filterColor
      return matchesSearch && matchesBook && matchesColor
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
            <p className="text-muted-foreground">Loading your highlights...</p>
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
            <Highlighter className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Highlights Not Available</h2>
            <p className="text-muted-foreground mb-6">Sign in to view and create your personal Bible verse highlights</p>
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
          <h1 className="text-3xl font-bold tracking-tight">My Highlights</h1>
          <p className="text-muted-foreground">
            Your highlighted Bible verses and passages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{highlights.length} highlights</Badge>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Highlight
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Highlight</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="book">Book</Label>
                    <Input
                      id="book"
                      value={newHighlight.book}
                      onChange={(e) => setNewHighlight({...newHighlight, book: e.target.value})}
                      placeholder="e.g., John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="chapter">Chapter</Label>
                    <Input
                      id="chapter"
                      type="number"
                      min="1"
                      value={newHighlight.chapter}
                      onChange={(e) => setNewHighlight({...newHighlight, chapter: parseInt(e.target.value) || 1})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="verse">Verse</Label>
                    <Input
                      id="verse"
                      type="number"
                      min="1"
                      value={newHighlight.verse}
                      onChange={(e) => setNewHighlight({...newHighlight, verse: parseInt(e.target.value) || 1})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="color">Highlight Color</Label>
                  <Select value={newHighlight.color} onValueChange={(value) => setNewHighlight({...newHighlight, color: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {HIGHLIGHT_COLORS.map(color => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border ${color.class}`}></div>
                            {color.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddHighlight}
                    disabled={!newHighlight.book || saving}
                  >
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Highlighter className="h-4 w-4 mr-2" />}
                    Add Highlight
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
                  placeholder="Search highlights by verse reference..."
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

              <Select value={filterColor} onValueChange={setFilterColor}>
                <SelectTrigger className="w-[120px]">
                  <Palette className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colors</SelectItem>
                  {HIGHLIGHT_COLORS.map(color => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded border ${color.class}`}></div>
                        {color.name}
                      </div>
                    </SelectItem>
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

      {/* Highlights List */}
      <div className="space-y-4">
        {filteredAndSortedHighlights.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Highlighter className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No highlights found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterBook !== 'all' || filterColor !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Start highlighting verses while reading to see them here'}
                </p>
                {!searchTerm && filterBook === 'all' && filterColor === 'all' && (
                  <Button onClick={() => window.location.href = '/bible'}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Start Reading
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedHighlights.map((highlight) => (
            <Card key={highlight.id} className={cn("transition-all duration-200", getTransitionClass('default'))}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={getColorClass(highlight.color)}>
                        <Highlighter className="h-3 w-3 mr-1" />
                        {getReference(highlight)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(highlight.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{highlight.book} {highlight.chapter}:{highlight.verse}</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => window.location.href = `/bible?book=${encodeURIComponent(highlight.book)}&chapter=${highlight.chapter}&verse=${highlight.verse}`}
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Go to Verse
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteHighlight(highlight)}
                        className="text-red-600 dark:text-red-400"
                        disabled={saving}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Highlight
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default HighlightsPage