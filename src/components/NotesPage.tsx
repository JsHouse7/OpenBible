'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAnimations } from '@/components/AnimationProvider'
import { cn } from '@/lib/utils'
import {
  Search,
  Plus,
  BookOpen,
  Calendar,
  MoreVertical,
  Edit3,
  Trash2,
  Star,
  Filter,
  Tag,
  SortAsc,
  SortDesc,
  Clock,
  MessageSquare
} from 'lucide-react'

interface Note {
  id: string
  verseId: string
  text: string
  timestamp: string
  book: string
  chapter: number
  verse: number
  tags?: string[]
  isStarred?: boolean
  category?: 'study' | 'devotional' | 'question' | 'insight' | 'prayer'
}

const NotesPage = () => {
  const { getTransitionClass } = useAnimations()
  const [notes, setNotes] = useState<Note[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'book' | 'verse'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingText, setEditingText] = useState('')

  // Load notes from localStorage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('openbible-notes')
    if (savedNotes) {
      try {
        const parsed = JSON.parse(savedNotes)
        setNotes(parsed)
      } catch (error) {
        console.error('Failed to parse saved notes:', error)
        // Initialize with sample notes if parsing fails
        initializeSampleNotes()
      }
    } else {
      // Initialize with sample notes
      initializeSampleNotes()
    }
  }, [])

  const initializeSampleNotes = () => {
    const sampleNotes: Note[] = [
      {
        id: 'note-1',
        verseId: 'john-3-16',
        text: 'This verse perfectly encapsulates the essence of God\'s love for humanity. The word "world" here is kosmos in Greek, meaning the entire ordered universe. God\'s love extends to all creation.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        book: 'John',
        chapter: 3,
        verse: 16,
        tags: ['love', 'salvation', 'eternal life'],
        isStarred: true,
        category: 'study'
      },
      {
        id: 'note-2',
        verseId: 'psalm-23-1',
        text: 'Personal reflection: In times of uncertainty, remembering that the Lord is my shepherd brings such peace. I am not wandering alone.',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        book: 'Psalms',
        chapter: 23,
        verse: 1,
        tags: ['comfort', 'guidance', 'trust'],
        isStarred: false,
        category: 'devotional'
      },
      {
        id: 'note-3',
        verseId: 'romans-8-28',
        text: 'How can ALL things work together for good? This seems impossible when facing trials. Need to study the context more deeply.',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        book: 'Romans',
        chapter: 8,
        verse: 28,
        tags: ['providence', 'suffering', 'hope'],
        isStarred: false,
        category: 'question'
      },
      {
        id: 'note-4',
        verseId: 'philippians-4-13',
        text: 'Breakthrough moment: Realized this isn\'t about human strength but about Christ\'s strength working through our weakness. Context is about contentment in all circumstances.',
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        book: 'Philippians',
        chapter: 4,
        verse: 13,
        tags: ['strength', 'contentment', 'dependence'],
        isStarred: true,
        category: 'insight'
      }
    ]
    setNotes(sampleNotes)
    localStorage.setItem('openbible-notes', JSON.stringify(sampleNotes))
  }

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    localStorage.setItem('openbible-notes', JSON.stringify(notes))
  }, [notes])

  const filteredAndSortedNotes = notes
    .filter(note => {
      const matchesSearch = note.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           note.book.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           note.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCategory = filterCategory === 'all' || note.category === filterCategory
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
      case 'study': return 'bg-blue-500'
      case 'devotional': return 'bg-green-500'
      case 'question': return 'bg-yellow-500'
      case 'insight': return 'bg-purple-500'
      case 'prayer': return 'bg-pink-500'
      default: return 'bg-gray-500'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'study': return '📚'
      case 'devotional': return '🙏'
      case 'question': return '❓'
      case 'insight': return '💡'
      case 'prayer': return '🕊️'
      default: return '📝'
    }
  }

  const handleEditNote = (note: Note) => {
    setSelectedNote(note)
    setEditingText(note.text)
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = () => {
    if (selectedNote && editingText.trim()) {
      setNotes(prev => prev.map(note => 
        note.id === selectedNote.id 
          ? { ...note, text: editingText.trim(), timestamp: new Date().toISOString() }
          : note
      ))
      setIsEditModalOpen(false)
      setSelectedNote(null)
      setEditingText('')
    }
  }

  const handleDeleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId))
  }

  const handleToggleStar = (noteId: string) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, isStarred: !note.isStarred }
        : note
    ))
  }

  const starredNotes = notes.filter(note => note.isStarred)
  const totalNotes = notes.length

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Notes</h1>
          <p className="text-muted-foreground">
            Your study notes and spiritual insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{totalNotes} notes</Badge>
          <Badge variant="outline">{starredNotes.length} starred</Badge>
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
                  placeholder="Search notes, verses, or tags..."
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
                  <SelectItem value="study">Study</SelectItem>
                  <SelectItem value="devotional">Devotional</SelectItem>
                  <SelectItem value="question">Question</SelectItem>
                  <SelectItem value="insight">Insight</SelectItem>
                  <SelectItem value="prayer">Prayer</SelectItem>
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
          <TabsTrigger value="all">All Notes ({totalNotes})</TabsTrigger>
          <TabsTrigger value="starred">Starred ({starredNotes.length})</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredAndSortedNotes.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No notes found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || filterCategory !== 'all' 
                      ? 'Try adjusting your search or filters'
                      : 'Start taking notes as you read to capture your insights'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredAndSortedNotes.map((note, index) => (
                <Card key={note.id} className={cn(
                  "group hover:shadow-md transition-all duration-200",
                  getTransitionClass('default'),
                  "animate-in fade-in-0 slide-in-from-bottom-2"
                )} style={{ animationDelay: `${index * 50}ms` }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{note.book} {note.chapter}:{note.verse}</span>
                        {note.category && (
                          <Badge variant="secondary" className={`${getCategoryColor(note.category)} text-white text-xs`}>
                            {getCategoryIcon(note.category)} {note.category}
                          </Badge>
                        )}
                        {note.isStarred && (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditNote(note)}>
                            <Edit3 className="mr-2 h-4 w-4" />
                            Edit Note
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStar(note.id)}>
                            <Star className="mr-2 h-4 w-4" />
                            {note.isStarred ? 'Remove Star' : 'Add Star'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Note
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground leading-relaxed mb-3">{note.text}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(note.timestamp)}
                        </div>
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            <div className="flex gap-1">
                              {note.tags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs py-0">
                                  {tag}
                                </Badge>
                              ))}
                              {note.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs py-0">
                                  +{note.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="starred" className="space-y-4">
          <div className="grid gap-4">
            {starredNotes.map((note, index) => (
              <Card key={note.id} className={cn(
                "group hover:shadow-md transition-all duration-200",
                getTransitionClass('default'),
                "animate-in fade-in-0 slide-in-from-bottom-2"
              )} style={{ animationDelay: `${index * 50}ms` }}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{note.book} {note.chapter}:{note.verse}</span>
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed">{note.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <div className="grid gap-4">
            {notes
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, 10)
              .map((note, index) => (
                <Card key={note.id} className={cn(
                  "group hover:shadow-md transition-all duration-200",
                  getTransitionClass('default'),
                  "animate-in fade-in-0 slide-in-from-bottom-2"
                )} style={{ animationDelay: `${index * 50}ms` }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{note.book} {note.chapter}:{note.verse}</span>
                        <Badge variant="outline" className="text-xs">
                          {formatDate(note.timestamp)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground leading-relaxed">{note.text}</p>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Note Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>
              {selectedNote && `${selectedNote.book} ${selectedNote.chapter}:${selectedNote.verse}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              placeholder="Enter your note..."
              className="min-h-[120px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={!editingText.trim()}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default NotesPage