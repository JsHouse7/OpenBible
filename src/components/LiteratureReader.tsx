'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { LiteratureService, LiteratureWork } from '@/lib/literatureService'
import { EbookReader } from '@/components/reader/EbookReader'

interface LiteratureReaderProps {
  workId: string
  onClose: () => void
}

export function LiteratureReader({ workId, onClose }: LiteratureReaderProps) {
  const [work, setWork] = useState<LiteratureWork | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    LiteratureService.getLiteratureWork(workId)
      .then((w) => {
        if (!w) setError('Work not found')
        else setWork(w)
      })
      .catch(() => setError('Failed to load work'))
  }, [workId])

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={onClose}>Back to library</Button>
        </div>
      </div>
    )
  }

  if (!work) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return <EbookReader work={work} onClose={onClose} />
}
