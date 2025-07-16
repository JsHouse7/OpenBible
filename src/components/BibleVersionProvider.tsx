'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { userPreferencesService } from '@/lib/userPreferencesService'

interface BibleVersion {
  id: string
  name: string
  abbreviation: string
  language: string
  year?: number
  description: string
  isDefault?: boolean
}

interface BibleVersionContextType {
  selectedVersion: BibleVersion
  availableVersions: BibleVersion[]
  setSelectedVersion: (version: BibleVersion) => void
  isLoading: boolean
}

const fallbackVersion: BibleVersion = {
  id: 'kjv',
  name: 'King James Version',
  abbreviation: 'KJV',
  language: 'English',
  year: 1611,
  description: 'The classic English translation of the Bible',
  isDefault: true
}

const BibleVersionContext = createContext<BibleVersionContextType | undefined>(undefined)

// Translation information for available versions
const translationInfo = {
  KJV: {
    name: 'King James Version',
    abbreviation: 'KJV',
    language: 'English',
    year: 1611,
    description: 'The classic English translation of the Bible'
  },
  ESV: {
    name: 'English Standard Version',
    abbreviation: 'ESV',
    language: 'English',
    year: 2001,
    description: 'A modern English translation emphasizing word-for-word accuracy'
  },
  NIV: {
    name: 'New International Version',
    abbreviation: 'NIV',
    language: 'English',
    year: 1978,
    description: 'A popular modern English translation balancing accuracy and readability'
  },
  WEB: {
    name: 'World English Bible',
    abbreviation: 'WEB',
    language: 'English',
    year: 2000,
    description: 'A public domain modern English translation'
  },
  NASB: {
    name: 'New American Standard Bible',
    abbreviation: 'NASB',
    language: 'English',
    year: 1971,
    description: 'A literal translation emphasizing accuracy to original texts'
  },
  NKJV: {
    name: 'New King James Version',
    abbreviation: 'NKJV',
    language: 'English',
    year: 1982,
    description: 'A modern update of the King James Version'
  },
  NLT: {
    name: 'New Living Translation',
    abbreviation: 'NLT',
    language: 'English',
    year: 1996,
    description: 'A thought-for-thought translation emphasizing clarity'
  },
  ASV: {
    name: 'American Standard Version',
    abbreviation: 'ASV',
    language: 'English',
    year: 1901,
    description: 'An early 20th century American revision of the Bible'
  }
}

export function BibleVersionProvider({ children }: { children: React.ReactNode }) {
  const [availableVersions, setAvailableVersions] = useState<BibleVersion[]>([])
  const [selectedVersion, setSelectedVersionState] = useState<BibleVersion>(fallbackVersion)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load available translations from downloaded files
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        // List of translations we have downloaded (will be expanded as more are added)
        const availableTranslations = ['KJV', 'ESV', 'NIV', 'WEB', 'NASB', 'NKJV', 'NLT', 'ASV']
        
        // Map translation codes to full version objects
        const versionObjects = availableTranslations.map(code => {
          const info = translationInfo[code as keyof typeof translationInfo] || {
            name: `${code} Translation`,
            abbreviation: code,
            language: 'English',
            description: 'Bible translation from jadenzaleski/BibleTranslations repository'
          }
          
          return {
            id: code.toLowerCase(),
            ...info
          }
        })
        
        setAvailableVersions(versionObjects)
        
        // Load saved version preference from database
        try {
          // First try to migrate from localStorage
          const localVersion = localStorage?.getItem('openbible-selected-version')
          if (localVersion) {
            await userPreferencesService.setPreference('bibleVersion', localVersion)
            localStorage.removeItem('openbible-selected-version')
            console.log('Migrated Bible version from localStorage to database')
          }

          // Load from database
          const savedVersionId = await userPreferencesService.getPreference<string>('bibleVersion', 'kjv')
          const savedVersion = versionObjects.find(v => v.id === savedVersionId) || fallbackVersion
          setSelectedVersionState(savedVersion)
        } catch (error) {
          console.error('Error loading Bible version preference:', error)
          // Fallback to localStorage
          const localVersion = localStorage?.getItem('openbible-selected-version')
          if (localVersion) {
            const savedVersion = versionObjects.find(v => v.id === localVersion) || fallbackVersion
            setSelectedVersionState(savedVersion)
          }
        }
        
      } catch (error) {
        console.error('Error loading Bible translations:', error)
        // Set fallback version if loading fails
        setAvailableVersions([fallbackVersion])
        setSelectedVersionState(fallbackVersion)
      } finally {
        setIsLoaded(true)
        setIsLoading(false)
      }
    }

    loadTranslations()
  }, [])

  const setSelectedVersion = async (version: BibleVersion) => {
    setSelectedVersionState(version)
    if (isLoaded) {
      try {
        await userPreferencesService.setPreference('bibleVersion', version.id)
        console.log('Bible version saved to database successfully')
      } catch (error) {
        console.error('Failed to save version preference:', error)
        // Fallback to localStorage
        try {
          localStorage.setItem('openbible-selected-version', version.id)
        } catch (localError) {
          console.error('Failed to save to localStorage:', localError)
        }
      }
    }
  }

  const value: BibleVersionContextType = {
    selectedVersion,
    availableVersions,
    setSelectedVersion,
    isLoading
  }

  return (
    <BibleVersionContext.Provider value={value}>
      {children}
    </BibleVersionContext.Provider>
  )
}

export function useBibleVersion() {
  const context = useContext(BibleVersionContext)
  if (context === undefined) {
    throw new Error('useBibleVersion must be used within a BibleVersionProvider')
  }
  return context
}