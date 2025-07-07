'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { notesService } from '@/lib/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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
  MessageSquare,
  FileText,
  Save,
  X,
  Loader2
} from 'lucide-react'

interface Note {
  id: string
  user_id: string
  book: string
  chapter: number
  verse: number
  note: string
  created_at: string
  updated_at: string
}

const NotesPage = () => {
  const { user, loading: authLoading } = useAuth()
  const { getTransitionClass } = useAnimations()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'book' | 'verse'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterBook, setFilterBook] = useState<string>('all')
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingText, setEditingText] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [saving, setSaving] = useState(false)

  const [newNote, setNewNote] = useState({
    book: '',
    chapter: 1,
    verse: 1,
    note: ''
  })

  // Fetch user notes from database
  useEffect(() => {
    const fetchNotes = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        const { data, error: notesError } = await notesService.getUserNotes(user.id)
        
        if (notesError) {
          console.error('Error fetching notes:', notesError)
          setError('Failed to load your notes')
          return
        }

        setNotes(data || [])
      } catch (error) {
        console.error('Error fetching notes:', error)
        setError('Failed to load your notes')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchNotes()
    }
  }, [user, authLoading])

  const handleSaveNote = async (noteData: Partial<Note>) => {
    if (!user?.id || !noteData.book || !noteData.chapter || !noteData.verse || !noteData.note) return

    try {
      setSaving(true)
      setError(null)

      const { data, error: saveError } = await notesService.saveNote(
        user.id,
        noteData.book,
        noteData.chapter,
        noteData.verse,
        noteData.note
      )

      if (saveError) {
        console.error('Error saving note:', saveError)
        setError('Failed to save note')
        return
      }

      // Refresh notes list
      const { data: updatedNotes } = await notesService.getUserNotes(user.id)
      setNotes(updatedNotes || [])

      // Reset form/dialog
      setSelectedNote(null)
      setShowAddDialog(false)
      setNewNote({ book: '', chapter: 1, verse: 1, note: '' })
      
    } catch (error) {
      console.error('Error saving note:', error)
      setError('Failed to save note')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteNote = async (note: Note) => {
    if (!user?.id) return

    try {
      setSaving(true)
      setError(null)

      const { error: deleteError } = await notesService.deleteNote(
        user.id,
        note.book,
        note.chapter,
        note.verse
      )

      if (deleteError) {
        console.error('Error deleting note:', deleteError)
        setError('Failed to delete note')
        return
      }

      // Remove from local state
      setNotes(notes.filter(n => n.id !== note.id))
      
    } catch (error) {
      console.error('Error deleting note:', error)
      setError('Failed to delete note')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Unknown date'
    }
  }

  const getUniqueBooks = () => {
    const books = Array.from(new Set(notes.map(note => note.book))).sort()
    return books
  }

  const filteredAndSortedNotes = notes
    .filter(note => {
      const matchesSearch = note.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           note.book.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesBook = filterBook === 'all' || note.book === filterBook
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
            <p className="text-muted-foreground">Loading your notes...</p>
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
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Notes Not Available</h2>
            <p className="text-muted-foreground mb-6">Sign in to view and create your personal Bible study notes</p>
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
          <h1 className="text-3xl font-bold tracking-tight">My Notes</h1>
          <p className="text-muted-foreground">
            Your personal Bible study notes and insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{notes.length} notes</Badge>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Note</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="book">Book</Label>
                    <Input
                      id="book"
                      value={newNote.book}
                      onChange={(e) => setNewNote({...newNote, book: e.target.value})}
                      placeholder="e.g., John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="chapter">Chapter</Label>
                    <Input
                      id="chapter"
                      type="number"
                      min="1"
                      value={newNote.chapter}
                      onChange={(e) => setNewNote({...newNote, chapter: parseInt(e.target.value) || 1})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="verse">Verse</Label>
                    <Input
                      id="verse"
                      type="number"
                      min="1"
                      value={newNote.verse}
                      onChange={(e) => setNewNote({...newNote, verse: parseInt(e.target.value) || 1})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="note">Note</Label>
                  <Textarea
                    id="note"
                    value={newNote.note}
                    onChange={(e) => setNewNote({...newNote, note: e.target.value})}
                    placeholder="Write your note here..."
                    className="min-h-[100px]"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => handleSaveNote(newNote)}
                    disabled={!newNote.book || !newNote.note || saving}
                  >
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Note
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
                  placeholder="Search notes, verses, or tags..."
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
          <TabsTrigger value="all">All Notes ({notes.length})</TabsTrigger>
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
                    {searchTerm || filterBook !== 'all' 
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
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedNote(note)
                            setEditingText(note.note)
                            setIsEditModalOpen(true)
                          }}>
                            <Edit3 className="mr-2 h-4 w-4" />
                            Edit Note
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteNote(note)}
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
                    <p className="text-foreground leading-relaxed mb-3">{note.note}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(note.created_at)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <div className="grid gap-4">
            {notes
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
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
                          {formatDate(note.created_at)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground leading-relaxed">{note.note}</p>
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
              <Button onClick={() => {
                if (selectedNote) {
                  handleSaveNote({
                    book: selectedNote.book,
                    chapter: selectedNote.chapter,
                    verse: selectedNote.verse,
                    note: editingText.trim()
                  })
                }
              }} disabled={!editingText.trim() || saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
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