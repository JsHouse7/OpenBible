'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ReaderPreferences,
  defaultReaderPreferences,
} from '@/lib/readerPreferences'

const STORAGE_KEY = 'openbible-reader-preferences'

export function useReaderPreferences() {
  const [prefs, setPrefs] = useState<ReaderPreferences>(defaultReaderPreferences)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        setPrefs({ ...defaultReaderPreferences, ...JSON.parse(raw) })
      }
    } catch {
      /* use defaults */
    }
    setLoaded(true)
  }, [])

  const updatePrefs = useCallback((partial: Partial<ReaderPreferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...partial }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const resetPrefs = useCallback(() => {
    setPrefs(defaultReaderPreferences)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultReaderPreferences))
  }, [])

  return { prefs, updatePrefs, resetPrefs, loaded }
}
