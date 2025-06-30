"use client"

import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { COMPLETE_BIBLE_BOOKS } from "@/data/completeBible"

interface BookSelectorProps {
  currentBook: string
  onBookSelect: (book: string) => void
  onClose: () => void
  onOpenChapterSelector?: () => void
}

export function BookSelector({ currentBook, onBookSelect, onClose, onOpenChapterSelector }: BookSelectorProps) {
  const oldTestamentBooks = COMPLETE_BIBLE_BOOKS.filter(book => book.testament === 'old')
  const newTestamentBooks = COMPLETE_BIBLE_BOOKS.filter(book => book.testament === 'new')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Select a Book</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
          
          <div className="space-y-6 overflow-y-auto max-h-[60vh]">
            {/* Old Testament */}
            <div>
              <h3 className="font-medium text-muted-foreground mb-3">Old Testament</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {oldTestamentBooks.map((book) => (
                  <Button
                    key={book.name}
                    variant={currentBook === book.name ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      onBookSelect(book.name)
                      onClose()
                      // Auto-open chapter selector after a brief delay
                      setTimeout(() => {
                        onOpenChapterSelector?.()
                      }, 100)
                    }}
                    className="justify-start text-sm"
                  >
                    {book.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* New Testament */}
            <div>
              <h3 className="font-medium text-muted-foreground mb-3">New Testament</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {newTestamentBooks.map((book) => (
                  <Button
                    key={book.name}
                    variant={currentBook === book.name ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      onBookSelect(book.name)
                      onClose()
                      // Auto-open chapter selector after a brief delay
                      setTimeout(() => {
                        onOpenChapterSelector?.()
                      }, 100)
                    }}
                    className="justify-start text-sm"
                  >
                    {book.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 