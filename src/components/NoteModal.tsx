"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Textarea } from "@/components/ui/textarea"
import { useAnimations } from "@/components/AnimationProvider"
import { cn } from "@/lib/utils"
import type { BibleVerse } from "@/data/completeBible"

interface Note {
  id: string
  verseId: string
  text: string
  timestamp: string
  book: string
  chapter: number
  verse: number
}

interface NoteModalProps {
  verse: BibleVerse | null
  existingNote?: Note
  isOpen: boolean
  onClose: () => void
  onSave: (noteText: string) => void
}

export function NoteModal({ verse, existingNote, isOpen, onClose, onSave }: NoteModalProps) {
  const [noteText, setNoteText] = useState("")
  const { getTransitionClass } = useAnimations()

  useEffect(() => {
    if (isOpen && existingNote) {
      setNoteText(existingNote.text)
    } else if (isOpen) {
      setNoteText("")
    }
  }, [isOpen, existingNote])

  const handleSave = () => {
    if (noteText.trim()) {
      onSave(noteText.trim())
      setNoteText("")
      onClose()
    }
  }

  const handleCancel = () => {
    setNoteText("")
    onClose()
  }

  if (!isOpen || !verse) {
    return null
  }

  return (
    <div 
      className={cn(
        "fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50",
        "animate-in fade-in-0 duration-200",
        getTransitionClass('default')
      )}
    >
      <Card 
        className={cn(
          "w-full max-w-md",
          "animate-in zoom-in-95 slide-in-from-bottom-4 fade-in-0 duration-300"
        )}
      >
        <CardHeader>
          <CardTitle className="text-lg">
            {existingNote ? "Edit Note" : "Add Note"} - {verse.book} {verse.chapter}:{verse.verse}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-muted/50 rounded-md border">
            <p className="text-sm text-muted-foreground font-serif leading-relaxed">
              "{verse.text}"
            </p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="note-text" className="text-sm font-medium">
              Your Note
            </label>
            <Textarea
              id="note-text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Write your thoughts, insights, or reflections about this verse..."
              className="min-h-[120px] resize-none"
              autoFocus
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className={cn(
                "hover:scale-105 active:scale-95",
                getTransitionClass('fast')
              )}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!noteText.trim()}
              className={cn(
                "hover:scale-105 active:scale-95",
                getTransitionClass('fast')
              )}
            >
              {existingNote ? "Update Note" : "Save Note"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 