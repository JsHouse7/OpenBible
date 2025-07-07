"use client"

import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { COMPLETE_BIBLE_BOOKS } from "@/data/completeBible"

interface ChapterSelectorProps {
  book: string
  currentChapter: number
  onChapterSelect: (chapter: number) => void
  onClose: () => void
}

export function ChapterSelector({ book, currentChapter, onChapterSelect, onClose }: ChapterSelectorProps) {
  const bookInfo = COMPLETE_BIBLE_BOOKS.find(b => b.name === book)
  const chapters = Array.from({ length: bookInfo?.chapters || 1 }, (_, i) => i + 1)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[80vh] overflow-hidden">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{book} - Select Chapter</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
          
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 overflow-y-auto max-h-[60vh]">
            {chapters.map((chapter) => (
              <Button
                key={chapter}
                variant={currentChapter === chapter ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  onChapterSelect(chapter)
                  onClose()
                }}
                className="w-full h-12 text-base"
              >
                {chapter}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 