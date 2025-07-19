'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { userPreferencesService, UserPreferences as ServiceUserPreferences } from '@/lib/userPreferencesService'
import { useAuth } from '@/components/AuthProvider'

interface UserPreferences {
  // Existing preferences
  emailNotifications: boolean
  publicProfile: boolean
  showReadingStats: boolean
  dailyReminders: boolean
  analyticsVisible: boolean
  homePage: string
  
  // Appearance settings
  fontSize: number
  lineHeight: number
  fontFamily: string
  readingMode: string
  
  // Bible settings
  bibleVersion: string
  verseNumbersVisible: boolean
  crossReferencesVisible: boolean
  footnoteVisible: boolean
  
  // Reading settings
  autoScroll: boolean
  highlightEnabled: boolean
  bookmarksVisible: boolean
  
  // Study settings
  commentaryVisible: boolean
  concordanceVisible: boolean
  dictionaryVisible: boolean
  
  // Privacy settings
  shareReadingProgress: boolean
  allowDataCollection: boolean
}

const defaultPreferences: UserPreferences = {
  emailNotifications: true,
  publicProfile: false,
  showReadingStats: true,
  dailyReminders: true,
  analyticsVisible: true,
  homePage: 'dashboard',
  fontSize: 16,
  lineHeight: 1.6,
  fontFamily: 'Inter',
  readingMode: 'comfortable',
  bibleVersion: 'ESV',
  verseNumbersVisible: true,
  crossReferencesVisible: false,
  footnoteVisible: false,
  autoScroll: false,
  highlightEnabled: true,
  bookmarksVisible: true,
  commentaryVisible: false,
  concordanceVisible: false,
  dictionaryVisible: false,
  shareReadingProgress: true,
  allowDataCollection: true,
}

interface UserPreferencesContextType {
  preferences: UserPreferences
  updatePreferences: (newPreferences: Partial<UserPreferences>) => void
  resetPreferences: () => void
  isAnalyticsVisible: () => boolean
  getHomePage: () => string
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  isLoaded: boolean
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined)

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)
  const [isLoaded, setIsLoaded] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Load preferences from database on mount, but only when user is authenticated
  useEffect(() => {
    const loadPreferences = async () => {
      if (!authLoading) {
        if (user) {
          try {
            await userPreferencesService.migrateFromLocalStorage()
            const dbPreferences = await userPreferencesService.getPreferences()
            const mergedPreferences = { ...defaultPreferences, ...dbPreferences }
            setPreferences(mergedPreferences)
          } catch (error) {
            console.error('Failed to load preferences, using defaults:', error)
            const localPreferences = await userPreferencesService.getPreferences()
            const mergedPreferences = { ...defaultPreferences, ...localPreferences }
            setPreferences(mergedPreferences)
          }
        }
        setIsLoaded(true)
      }
    }

    loadPreferences()
  }, [user, authLoading])

  // Save preferences to database whenever they change (only after initial load and if user exists)
  useEffect(() => {
    if (!isLoaded || !user) return

    const debounceSave = setTimeout(() => {
      const savePreferences = async () => {
        try {
          setSaveStatus('saving')
          await userPreferencesService.savePreferences(preferences)
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus('idle'), 2000)
        } catch (error) {
          console.error('Failed to save preferences:', error)
          setSaveStatus('error')
        }
      }
      savePreferences()
    }, 1000)

    return () => clearTimeout(debounceSave)
  }, [preferences, isLoaded, user])

  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }))

    if (user) {
      setSaveStatus('saving')
      try {
        await userPreferencesService.updatePreferences(newPreferences)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch (error) {
        console.error('Failed to update preferences:', error)
        setSaveStatus('error')
      }
    }
  }

  const resetPreferences = async () => {
    setPreferences(defaultPreferences)

    if (user) {
      setSaveStatus('saving')
      try {
        await userPreferencesService.savePreferences(defaultPreferences)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch (error) {
        console.error('Failed to reset preferences:', error)
        setSaveStatus('error')
      }
    }
  }

  const isAnalyticsVisible = () => preferences.analyticsVisible
  const getHomePage = () => preferences.homePage

  const value: UserPreferencesContextType = {
    preferences,
    updatePreferences,
    resetPreferences,
    isAnalyticsVisible,
    getHomePage,
    saveStatus,
    isLoaded,
  }

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  )
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext)
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider')
  }
  return context
}