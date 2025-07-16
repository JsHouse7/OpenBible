'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { userPreferencesService } from '@/lib/userPreferencesService'

type AnimationPreferences = {
  speed: string
  enabled: boolean | undefined
  enableAnimations: boolean
  animationSpeed: 'slow' | 'normal' | 'fast'
  reducedMotion: boolean
  pageTransitions: boolean
  verseAnimations: boolean
  buttonHovers: boolean
  modalAnimations: boolean
  loadingAnimations: boolean
  scrollAnimations: boolean
}

type AnimationContextType = {
  preferences: AnimationPreferences
  updatePreferences: (preferences: Partial<AnimationPreferences>) => void
  getTransitionClass: (type: 'default' | 'fast' | 'slow', animationType?: 'page' | 'verse' | 'button' | 'modal' | 'loading' | 'scroll') => string
  getDuration: (type: 'short' | 'medium' | 'long') => number
  isAnimationEnabled: (animationType: 'page' | 'verse' | 'button' | 'modal' | 'loading' | 'scroll') => boolean
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined)

const defaultPreferences: AnimationPreferences = {
  speed: 'normal',
  enabled: true,
  enableAnimations: true,
  animationSpeed: 'normal',
  reducedMotion: false,
  pageTransitions: true,
  verseAnimations: true,
  buttonHovers: true,
  modalAnimations: true,
  loadingAnimations: true,
  scrollAnimations: true
}

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<AnimationPreferences>(defaultPreferences)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load preferences from database on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        // First try to migrate from localStorage
        const localPrefs = localStorage?.getItem('animation-preferences')
        if (localPrefs) {
          const parsed = JSON.parse(localPrefs)
          await userPreferencesService.setPreference('animationPreferences', parsed)
          localStorage.removeItem('animation-preferences')
          console.log('Migrated animation preferences from localStorage to database')
        }

        // Load from database
        const savedPrefs = await userPreferencesService.getPreference<AnimationPreferences>('animationPreferences', defaultPreferences)
        setPreferences(savedPrefs)
      } catch (error) {
        console.error('Error loading animation preferences:', error)
        // Fallback to localStorage
        const localPrefs = localStorage?.getItem('animation-preferences')
        if (localPrefs) {
          try {
            const parsed = JSON.parse(localPrefs)
            setPreferences(prev => ({ ...prev, ...parsed }))
          } catch (parseError) {
            console.error('Failed to parse animation preferences:', parseError)
          }
        }
      } finally {
        setIsLoaded(true)
      }
    }

    loadPreferences()

    // Check for system reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mediaQuery.matches) {
      setPreferences(prev => ({ ...prev, reducedMotion: true }))
    }

    const handleChange = () => {
      setPreferences(prev => ({ ...prev, reducedMotion: mediaQuery.matches }))
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Save preferences when they change (only after initial load)
  useEffect(() => {
    if (isLoaded) {
      const savePreferences = async () => {
        try {
          await userPreferencesService.setPreference('animationPreferences', preferences)
          console.log('Animation preferences saved to database successfully')
        } catch (error) {
          console.error('Failed to save animation preferences:', error)
          // Fallback to localStorage
          try {
            localStorage.setItem('animation-preferences', JSON.stringify(preferences))
          } catch (localError) {
            console.error('Failed to save to localStorage:', localError)
          }
        }
      }
      savePreferences()
    }
  }, [preferences, isLoaded])

  const updatePreferences = (newPreferences: Partial<AnimationPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }))
  }

  const getTransitionClass = (type: 'default' | 'fast' | 'slow', animationType?: 'page' | 'verse' | 'button' | 'modal' | 'loading' | 'scroll') => {
    if (!preferences.enableAnimations || preferences.reducedMotion) {
      return ''
    }

    // Check specific animation type if provided
    if (animationType && !isAnimationEnabled(animationType)) {
      return ''
    }

    const baseClasses = {
      default: 'transition-all duration-300 ease-in-out',
      fast: 'transition-all duration-150 ease-in-out',
      slow: 'transition-all duration-500 ease-in-out'
    }

    return baseClasses[type]
  }

  const isAnimationEnabled = (animationType: 'page' | 'verse' | 'button' | 'modal' | 'loading' | 'scroll') => {
    if (!preferences.enableAnimations || preferences.reducedMotion) {
      return false
    }

    switch (animationType) {
      case 'page':
        return preferences.pageTransitions
      case 'verse':
        return preferences.verseAnimations
      case 'button':
        return preferences.buttonHovers
      case 'modal':
        return preferences.modalAnimations
      case 'loading':
        return preferences.loadingAnimations
      case 'scroll':
        return preferences.scrollAnimations
      default:
        return true
    }
  }

  const getDuration = (type: 'short' | 'medium' | 'long') => {
    if (!preferences.enableAnimations || preferences.reducedMotion) {
      return 0
    }

    const baseDurations = {
      short: { slow: 300, normal: 200, fast: 100 },
      medium: { slow: 500, normal: 300, fast: 200 },
      long: { slow: 800, normal: 500, fast: 300 }
    }

    return baseDurations[type][preferences.animationSpeed]
  }

  const value: AnimationContextType = {
    preferences,
    updatePreferences,
    getTransitionClass,
    getDuration,
    isAnimationEnabled
  }

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  )
}

export function useAnimations() {
  const context = useContext(AnimationContext)
  if (context === undefined) {
    throw new Error('useAnimations must be used within an AnimationProvider')
  }
  return context
}