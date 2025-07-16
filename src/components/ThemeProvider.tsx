'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { userPreferencesService } from '@/lib/userPreferencesService'

type Theme = 'light' | 'dark' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'openbible-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const loadTheme = async () => {
      try {
        // First try to migrate from localStorage
        const localTheme = localStorage?.getItem(storageKey) as Theme
        if (localTheme) {
          await userPreferencesService.setPreference('theme', localTheme)
          localStorage.removeItem(storageKey)
          console.log('Migrated theme from localStorage to database')
        }

        // Load theme from database
        const savedTheme = await userPreferencesService.getPreference<Theme>('theme', defaultTheme)
        setTheme(savedTheme)
      } catch (error) {
        console.error('Error loading theme:', error)
        // Fallback to localStorage
        const localTheme = localStorage?.getItem(storageKey) as Theme
        if (localTheme) {
          setTheme(localTheme)
        }
      } finally {
        setIsLoaded(true)
      }
    }

    loadTheme()
  }, [storageKey, defaultTheme])

  useEffect(() => {
    if (!isLoaded) return

    const root = window.document.documentElement

    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light'

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme, isLoaded])

  const value = {
    theme,
    setTheme: async (theme: Theme) => {
      setTheme(theme)
      try {
        await userPreferencesService.setPreference('theme', theme)
        console.log('Theme saved to database successfully')
      } catch (error) {
        console.error('Error saving theme:', error)
        // Fallback to localStorage
        localStorage?.setItem(storageKey, theme)
      }
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}