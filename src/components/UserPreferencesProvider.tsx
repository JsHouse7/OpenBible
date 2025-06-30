'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface UserPreferences {
  emailNotifications: boolean
  publicProfile: boolean
  showReadingStats: boolean
  dailyReminders: boolean
  analyticsVisible: boolean
  homePage: string
}

interface UserPreferencesContextType {
  preferences: UserPreferences
  updatePreferences: (newPreferences: Partial<UserPreferences>) => void
  isAnalyticsVisible: () => boolean
  getHomePage: () => string
}

const defaultPreferences: UserPreferences = {
  emailNotifications: true,
  publicProfile: false,
  showReadingStats: true,
  dailyReminders: true,
  analyticsVisible: false, // Default off
  homePage: 'dashboard'
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined)

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('userPreferences')
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences)
        setPreferences({ ...defaultPreferences, ...parsed })
      } catch (error) {
        console.error('Failed to parse saved preferences:', error)
      }
    }
  }, [])

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('userPreferences', JSON.stringify(preferences))
  }, [preferences])

  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }))
  }

  const isAnalyticsVisible = () => preferences.analyticsVisible

  const getHomePage = () => preferences.homePage

  const value = {
    preferences,
    updatePreferences,
    isAnalyticsVisible,
    getHomePage
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