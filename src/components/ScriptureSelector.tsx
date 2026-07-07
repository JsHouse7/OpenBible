"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBibleVersion } from "@/components/BibleVersionProvider"
import { COMPLETE_BIBLE_BOOKS, loadChapterData } from "@/data/completeBible"

export type ScriptureSelectorTab = "book" | "chapter" | "verse"

interface ScriptureSelectorProps {
  currentBook: string
  currentChapter: number
  currentVerse?: number
  initialTab?: ScriptureSelectorTab
  onBookSelect: (book: string) => void
  onChapterSelect: (chapter: number) => void
  onVerseSelect: (verse: number) => void
  onClose: () => void
}

export function ScriptureSelector({
  currentBook,
  currentChapter,
  currentVerse,
  initialTab = "book",
  onBookSelect,
  onChapterSelect,
  onVerseSelect,
  onClose,
}: ScriptureSelectorProps) {
  const [activeTab, setActiveTab] = useState<ScriptureSelectorTab>(initialTab)
  const [verseNumbers, setVerseNumbers] = useState<number[]>([])
  const [loadingVerses, setLoadingVerses] = useState(false)
  const { selectedVersion } = useBibleVersion()

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  useEffect(() => {
    if (activeTab !== "verse" || !currentBook || currentChapter < 1) {
      return
    }

    let cancelled = false
    setLoadingVerses(true)

    loadChapterData(currentBook, currentChapter, selectedVersion.abbreviation)
      .then((verses) => {
        if (cancelled) return
        setVerseNumbers(verses.map((verse) => verse.verse))
      })
      .catch(() => {
        if (!cancelled) setVerseNumbers([])
      })
      .finally(() => {
        if (!cancelled) setLoadingVerses(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeTab, currentBook, currentChapter, selectedVersion.abbreviation])

  const oldTestamentBooks = COMPLETE_BIBLE_BOOKS.filter((book) => book.testament === "old")
  const newTestamentBooks = COMPLETE_BIBLE_BOOKS.filter((book) => book.testament === "new")
  const bookInfo = COMPLETE_BIBLE_BOOKS.find((book) => book.name === currentBook)
  const chapters = Array.from({ length: bookInfo?.chapters || 1 }, (_, index) => index + 1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden">
        <CardContent className="flex min-h-0 flex-1 flex-col p-6">
          <div className="mb-4 flex shrink-0 items-center justify-between">
            <h2 className="text-xl font-semibold">Go to Scripture</h2>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
              ✕
            </Button>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as ScriptureSelectorTab)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <TabsList className="mb-4 grid w-full shrink-0 grid-cols-3">
              <TabsTrigger value="book" data-testid="scripture-selector-tab-book">
                Book
              </TabsTrigger>
              <TabsTrigger value="chapter" data-testid="scripture-selector-tab-chapter">
                Chapter
              </TabsTrigger>
              <TabsTrigger value="verse" data-testid="scripture-selector-tab-verse">
                Verse
              </TabsTrigger>
            </TabsList>

            <TabsContent value="book" className="mt-0 min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-6 pb-2">
                <div>
                  <h3 className="mb-3 font-medium text-muted-foreground">Old Testament</h3>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {oldTestamentBooks.map((book) => (
                      <Button
                        key={book.name}
                        variant={currentBook === book.name ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          onBookSelect(book.name)
                          setActiveTab("chapter")
                        }}
                        className="justify-start text-sm"
                      >
                        {book.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 font-medium text-muted-foreground">New Testament</h3>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {newTestamentBooks.map((book) => (
                      <Button
                        key={book.name}
                        variant={currentBook === book.name ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          onBookSelect(book.name)
                          setActiveTab("chapter")
                        }}
                        className="justify-start text-sm"
                      >
                        {book.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="chapter" className="mt-0 min-h-0 flex-1 overflow-y-auto">
              <p className="mb-3 text-sm text-muted-foreground">{currentBook}</p>
              <div className="grid grid-cols-4 gap-2 pb-2 sm:grid-cols-5">
                {chapters.map((chapter) => (
                  <Button
                    key={chapter}
                    variant={currentChapter === chapter ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      onChapterSelect(chapter)
                      setActiveTab("verse")
                    }}
                    className="h-12 w-full text-base"
                  >
                    {chapter}
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="verse" className="mt-0 min-h-0 flex-1 overflow-y-auto">
              <p className="mb-3 text-sm text-muted-foreground">
                {currentBook} {currentChapter}
              </p>
              {loadingVerses ? (
                <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                  Loading verses...
                </div>
              ) : verseNumbers.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No verses available for this chapter.
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-2 pb-2 sm:grid-cols-6">
                  {verseNumbers.map((verse) => (
                    <Button
                      key={verse}
                      variant={currentVerse === verse ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        onVerseSelect(verse)
                        onClose()
                      }}
                      className="h-10 w-full text-sm"
                    >
                      {verse}
                    </Button>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
