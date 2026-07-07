'use client'

import { useMemo } from 'react'
import type { LiteratureWork } from '@/lib/literatureParser'
import { literatureProgressService } from '@/lib/literatureProgressService'
import type { ReaderBook, ReaderPersistence } from './readerTypes'
import { EbookReader } from './EbookReader'

function literatureWorkToReaderBook(work: LiteratureWork): ReaderBook {
  return {
    id: work.id,
    title: work.title,
    subtitle: work.author,
    chapters: work.chapters.map((ch) => ({
      id: ch.id,
      title: ch.title,
      html: ch.content,
      wordCount: ch.wordCount,
      plainText: ch.plainText,
    })),
  }
}

function createLiteraturePersistence(): ReaderPersistence {
  return {
    getProgress: (bookId) => literatureProgressService.getProgress(bookId),
    saveProgress: (bookId, progress) =>
      literatureProgressService.saveProgress({
        workId: bookId,
        chapterIndex: progress.chapterIndex,
        positionAnchor: progress.positionAnchor,
        percent: progress.percent,
      }),
    getBookmarks: (bookId) => literatureProgressService.getBookmarks(bookId),
    addBookmark: (bookId, bm) =>
      literatureProgressService.addBookmark({
        workId: bookId,
        chapterIndex: bm.chapterIndex,
        positionAnchor: bm.positionAnchor,
        label: bm.label,
        excerpt: bm.excerpt,
      }),
    addHighlight: async (bookId, h) => {
      await literatureProgressService.addHighlight({
        workId: bookId,
        chapterIndex: h.chapterIndex,
        startAnchor: h.startAnchor,
        endAnchor: h.endAnchor,
        color: h.color,
        excerpt: h.excerpt,
      })
    },
  }
}

interface LiteratureEbookReaderProps {
  work: LiteratureWork
  onClose: () => void
}

export function LiteratureEbookReader({ work, onClose }: LiteratureEbookReaderProps) {
  const book = useMemo(() => literatureWorkToReaderBook(work), [work])
  const persistence = useMemo(() => createLiteraturePersistence(), [])

  return (
    <EbookReader
      book={book}
      persistence={persistence}
      onClose={onClose}
      enableBookmarks
      enableHighlights
    />
  )
}
