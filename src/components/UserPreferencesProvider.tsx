'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { userPreferencesService, UserPreferences as ServiceUserPreferences } from '@/lib/userPreferencesService'

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
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)
  const [isLoaded, setIsLoaded] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Load preferences from database on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        // First, try to migrate any existing localStorage data
        await userPreferencesService.migrateFromLocalStorage()
        
        // Then load preferences from database
        const dbPreferences = await userPreferencesService.getPreferences()
        
        // Merge with defaults to ensure all properties exist
        const mergedPreferences = { ...defaultPreferences, ...dbPreferences }
        setPreferences(mergedPreferences)
      } catch (error) {
        console.error('Failed to load preferences:', error)
        setSaveStatus('error')
      } finally {
        setIsLoaded(true)
      }
    }

    loadPreferences()
  }, [])

  // Save preferences to database whenever they change (only after initial load)
  useEffect(() => {
    if (!isLoaded) return

    const savePreferences = async () => {
      try {
        setSaveStatus('saving')
        await userPreferencesService.savePreferences(preferences)
        setSaveStatus('saved')
        
        // Reset to idle after showing saved status
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch (error) {
        console.error('Failed to save preferences:', error)
        setSaveStatus('error')
      }
    }

    savePreferences()
  }, [preferences, isLoaded])

  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    setSaveStatus('saving')
    setPreferences(prev => ({ ...prev, ...newPreferences }))
    
    try {
      // Also update in database immediately for better UX
      await userPreferencesService.updatePreferences(newPreferences)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Failed to update preferences:', error)
      setSaveStatus('error')
    }
  }

  const resetPreferences = async () => {
    setSaveStatus('saving')
    setPreferences(defaultPreferences)
    
    try {
      await userPreferencesService.savePreferences(defaultPreferences)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Failed to reset preferences:', error)
      setSaveStatus('error')
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