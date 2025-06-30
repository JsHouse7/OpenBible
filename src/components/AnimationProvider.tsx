'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type AnimationPreferences = {
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

  // Load preferences from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('animation-preferences')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setPreferences(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        console.error('Failed to parse animation preferences:', error)
      }
    }

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

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('animation-preferences', JSON.stringify(preferences))
  }, [preferences])

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

    const speeds = {
      slow: 'transition-all duration-500 ease-in-out',
      normal: 'transition-all duration-300 ease-in-out', 
      fast: 'transition-all duration-150 ease-in-out'
    }

    switch (type) {
      case 'fast':
        return speeds.fast
      case 'slow':
        return speeds.slow
      default:
        return speeds[preferences.animationSpeed]
    }
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
        return false
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

  return (
    <AnimationContext.Provider value={{ preferences, updatePreferences, getTransitionClass, getDuration, isAnimationEnabled }}>
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