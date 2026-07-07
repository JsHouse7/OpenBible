'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { BibleBookReader } from '@/components/reader/BibleBookReader'

function BibleBookPageInner() {
  const searchParams = useSearchParams()
  const book = searchParams.get('book') ?? 'John'
  const translation = searchParams.get('translation') ?? 'KJV'
  const chapter = parseInt(searchParams.get('chapter') ?? '1', 10)

  return (
    <BibleBookReader
      bookName={book}
      translation={translation}
      initialBibleChapter={Number.isFinite(chapter) ? chapter : 1}
    />
  )
}

export default function BibleBookPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 flex items-center justify-center bg-[#f4ecd8]">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-current opacity-50" />
        </div>
      }
    >
      <BibleBookPageInner />
    </Suspense>
  )
}
