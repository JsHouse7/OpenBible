'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ReaderPreferences,
  defaultReaderPreferences,
} from '@/lib/readerPreferences'

const STORAGE_KEY = 'openbible-reader-preferences'

function resolveAppIsDark(): boolean {
  if (typeof document === 'undefined') return false
  const root = document.documentElement
  if (root.classList.contains('dark')) return true
  if (root.classList.contains('light')) return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function themeAwareDefaults(): ReaderPreferences {
  if (resolveAppIsDark()) {
    return { ...defaultReaderPreferences, theme: 'black' }
  }
  return defaultReaderPreferences
}

export function useReaderPreferences() {
  const [prefs, setPrefs] = useState<ReaderPreferences>(defaultReaderPreferences)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        setPrefs({ ...defaultReaderPreferences, ...JSON.parse(raw) })
      } else {
        // No saved reader theme yet — follow the app's dark mode with a night page.
        setPrefs(themeAwareDefaults())
      }
    } catch {
      setPrefs(themeAwareDefaults())
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
    const next = themeAwareDefaults()
    setPrefs(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  return { prefs, updatePrefs, resetPrefs, loaded }
}
