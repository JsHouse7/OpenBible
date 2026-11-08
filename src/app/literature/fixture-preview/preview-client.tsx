'use client'

import LiteratureLibrary from '@/components/LiteratureLibrary'
import type { ReaderWork } from '@/components/literature/LiteratureReaderView'
import type { LiteratureWorkSummary } from '@/lib/literatureService'

interface FixtureWork extends ReaderWork {
  id: string
  difficulty: LiteratureWorkSummary['difficulty']
  description: string
  year?: number
}

export default function FixturePreview({ works }: { works: FixtureWork[] }) {
  const summaries: LiteratureWorkSummary[] = works.map((work) => {
    const words = work.chapters
      .map((chapter) => chapter.content || '')
      .join(' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length
    const incomplete = /\bincomplete\b/i.test(`${work.title} ${work.description}`)
    return {
      id: work.id,
      title: work.title,
      author: work.author,
      year: work.year,
      difficulty: work.difficulty,
      description: work.description,
      wordCount: words,
      chapterCount: work.chapters.length,
      estimatedReadingTime: words ? Math.max(1, Math.round(words / 200)) : 0,
      filename: '',
      dateAdded: '2026-11-08T00:00:00.000Z',
      textStatus: incomplete ? 'incomplete' : 'ready',
    }
  })

  return (
    <LiteratureLibrary
      previewWorks={summaries}
      previewBanner="Local fixture preview. These books are not part of the catalog and are not saved as library data."
      resolvePreviewWork={(workId) => works.find((work) => work.id === workId) ?? null}
    />
  )
}
