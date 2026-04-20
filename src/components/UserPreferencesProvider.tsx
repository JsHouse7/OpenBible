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

  /** Used by Settings UI (persisted in JSON preferences blob). */
  verseNumbers: boolean
  autoSave: boolean
  notifications: boolean
  audioEnabled: boolean
  dailyReadingReminders: boolean
  weeklyProgressUpdates: boolean
  newLiteratureReleases: boolean
  achievementNotifications: boolean
  analyticsCollection: boolean
  crashReporting: boolean
  publicReadingStats: boolean
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
  fontFamily: 'inter',
  readingMode: 'standard',
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
  verseNumbers: true,
  autoSave: true,
  notifications: true,
  audioEnabled: false,
  dailyReadingReminders: true,
  weeklyProgressUpdates: true,
  newLiteratureReleases: true,
  achievementNotifications: true,
  analyticsCollection: true,
  crashReporting: true,
  publicReadingStats: false,
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

  // Load preferences: DB when signed in; localStorage / API 401 path when signed out
  useEffect(() => {
    const loadPreferences = async () => {
      if (!authLoading) {
        userPreferencesService.clearCache()
        if (user) {
          try {
            await userPreferencesService.migrateFromLocalStorage()
            const dbPreferences = await userPreferencesService.getPreferences()
            const mergedPreferences = { ...defaultPreferences, ...dbPreferences }
            setPreferences(mergedPreferences)
          } catch (error) {
            console.error('Failed to load preferences, using defaults:', error)
            userPreferencesService.clearCache()
            const fallback = await userPreferencesService.getPreferences()
            setPreferences({ ...defaultPreferences, ...fallback })
          }
        } else {
          try {
            const localPreferences = await userPreferencesService.getPreferences()
            setPreferences({ ...defaultPreferences, ...localPreferences })
          } catch (error) {
            console.error('Failed to load local preferences:', error)
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