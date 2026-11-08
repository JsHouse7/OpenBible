'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/components/AuthProvider'
import { LiteratureLibraryError, libraryViewState } from '@/lib/literature/catalog'
import type { LiteratureAnnotation } from '@/lib/literature/annotations'
import { LiteratureReaderView, type ReaderWork } from '@/components/literature/LiteratureReaderView'
import { LiteratureService } from '@/lib/literatureService'
import { userPreferencesService } from '@/lib/userPreferencesService'

interface LiteratureReaderProps {
  workId: string
  onClose: () => void
  initialWork?: ReaderWork | null
  previewLabel?: string
}

export function LiteratureReader({ workId, onClose, initialWork, previewLabel }: LiteratureReaderProps) {
  const { user } = useAuth()
  const [work, setWork] = useState<ReaderWork | null>(initialWork ?? null)
  const [failure, setFailure] = useState<string | null>(null)
  const [accountPosition, setAccountPosition] = useState<unknown>(null)
  const [accountAnnotations, setAccountAnnotations] = useState<LiteratureAnnotation[]>([])
  const positionsRef = useRef<Record<string, unknown>>({})
  const annotationsRef = useRef<LiteratureAnnotation[]>([])

  useEffect(() => {
    if (initialWork) {
      setWork(initialWork)
      return
    }
    let cancelled = false
    setWork(null)
    setFailure(null)
    LiteratureService.getLiteratureWork(workId)
      .then((loaded) => {
        if (cancelled) return
        if (!loaded) {
          setFailure('This work could not be found.')
          return
        }
        setWork(loaded)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        if (error instanceof LiteratureLibraryError) {
          setFailure(libraryViewState({
            status: 'error',
            code: error.code,
            works: [],
            filtered: [],
          }).message)
          return
        }
        setFailure('The literature library could not be loaded. Trying again is the next step.')
      })
    return () => {
      cancelled = true
    }
  }, [initialWork, workId])

  useEffect(() => {
    let cancelled = false
    userPreferencesService.getPreferences()
      .then((preferences) => {
        if (cancelled) return
        const positions = preferences.literatureReadingPositions
        positionsRef.current = positions && typeof positions === 'object' ? positions as Record<string, unknown> : {}
        const notes = Array.isArray(preferences.literatureAnnotations) ? preferences.literatureAnnotations as LiteratureAnnotation[] : []
        annotationsRef.current = notes
        setAccountPosition(positionsRef.current[workId])
        setAccountAnnotations(notes)
      })
      .catch(() => {
        // Signed-out preference requests return an empty set. Reading still works.
      })
    return () => {
      cancelled = true
    }
  }, [workId])

  const onAccountPosition = useCallback((position: { workId: string }) => {
    positionsRef.current = { ...positionsRef.current, [position.workId]: position }
    if (!user) return
    userPreferencesService.updatePreferences({ literatureReadingPositions: positionsRef.current }).catch(() => {})
  }, [user])

  const onAccountAnnotations = useCallback((annotations: LiteratureAnnotation[]) => {
    annotationsRef.current = annotations
    if (!user) return
    userPreferencesService.updatePreferences({ literatureAnnotations: annotations }).catch(() => {})
  }, [user])

  if (failure) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#f3eee6] p-6">
        <div className="max-w-md space-y-4 text-center">
          <p className="font-playfair text-3xl text-[#2a2118]">The book did not open</p>
          <p className="text-sm leading-6 text-[#5c5146]">{failure}</p>
          <Button onClick={onClose}>Back to the library</Button>
        </div>
      </div>
    )
  }

  if (!work) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#f3eee6]">
        <p className="font-source-serif text-xl text-[#5c5146]">Opening the book…</p>
        <Button className="sr-only" onClick={onClose}>Close</Button>
      </div>
    )
  }

  return (
    <LiteratureReaderView
      work={work}
      workId={workId}
      onClose={onClose}
      previewLabel={previewLabel}
      accountPosition={accountPosition}
      accountAnnotations={accountAnnotations}
      onAccountPosition={onAccountPosition}
      onAccountAnnotations={onAccountAnnotations}
    />
  )
}

export default LiteratureReader
