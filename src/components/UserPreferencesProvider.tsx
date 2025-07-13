'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

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
  verseNumbers: boolean
  highlightEnabled: boolean
  autoSave: boolean
  audioEnabled: boolean
  
  // Notification settings
  notifications: boolean
  dailyReadingReminders: boolean
  weeklyProgressUpdates: boolean
  newLiteratureReleases: boolean
  achievementNotifications: boolean
  
  // Privacy settings
  analyticsCollection: boolean
  crashReporting: boolean
  publicReadingStats: boolean
}

interface UserPreferencesContextType {
  preferences: UserPreferences
  updatePreferences: (newPreferences: Partial<UserPreferences>) => void
  resetPreferences: () => void
  isAnalyticsVisible: () => boolean
  getHomePage: () => string
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
}

const defaultPreferences: UserPreferences = {
  // Existing preferences
  emailNotifications: true,
  publicProfile: false,
  showReadingStats: true,
  dailyReminders: true,
  analyticsVisible: false,
  homePage: 'dashboard',
  
  // Appearance settings
  fontSize: 16,
  lineHeight: 1.6,
  fontFamily: 'Georgia',
  readingMode: 'standard',
  
  // Bible settings
  verseNumbers: true,
  highlightEnabled: true,
  autoSave: true,
  audioEnabled: false,
  
  // Notification settings
  notifications: true,
  dailyReadingReminders: true,
  weeklyProgressUpdates: true,
  newLiteratureReleases: false,
  achievementNotifications: true,
  
  // Privacy settings
  analyticsCollection: true,
  crashReporting: true,
  publicReadingStats: false
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined)

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)
  const [isLoaded, setIsLoaded] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Load preferences from localStorage only on client side
  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem('userPreferences')
      if (savedPreferences) {
        const parsed = JSON.parse(savedPreferences)
        setPreferences({ ...defaultPreferences, ...parsed })
      }
    } catch (error) {
      console.error('Failed to parse saved preferences:', error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save preferences to localStorage whenever they change (only after initial load)
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('userPreferences', JSON.stringify(preferences))
      } catch (error) {
        console.error('Failed to save preferences:', error)
      }
    }
  }, [preferences, isLoaded])

  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    setSaveStatus('saving')
    setPreferences(prev => ({ ...prev, ...newPreferences }))
    
    // Show saved status briefly
    setTimeout(() => {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }, 300)
  }
  
  const resetPreferences = () => {
    setSaveStatus('saving')
    setPreferences(defaultPreferences)
    
    setTimeout(() => {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }, 300)
  }

  const isAnalyticsVisible = () => preferences.analyticsVisible

  const getHomePage = () => preferences.homePage

  const value = {
    preferences,
    updatePreferences,
    resetPreferences,
    isAnalyticsVisible,
    getHomePage,
    saveStatus
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