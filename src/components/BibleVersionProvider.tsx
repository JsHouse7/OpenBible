'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

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

const BibleVersionContext = createContext<BibleVersionContextType | undefined>(undefined)

// Mapping of translation codes to full version information
const translationInfo: Record<string, Omit<BibleVersion, 'id'>> = {
  'KJV': {
    name: 'King James Version',
    abbreviation: 'KJV',
    language: 'English',
    year: 1611,
    description: 'The classic English translation with traditional language and poetic beauty.',
    isDefault: true
  },
  'WEB': {
    name: 'World English Bible',
    abbreviation: 'WEB',
    language: 'English',
    year: 2000,
    description: 'A modern public domain translation based on the American Standard Version.'
  },
  'NIV': {
    name: 'New International Version',
    abbreviation: 'NIV',
    language: 'English',
    year: 1978,
    description: 'A widely used modern translation balancing accuracy and readability.'
  },
  'ESV': {
    name: 'English Standard Version',
    abbreviation: 'ESV',
    language: 'English',
    year: 2001,
    description: 'A literal translation emphasizing word-for-word accuracy.'
  },
  'NLT': {
    name: 'New Living Translation',
    abbreviation: 'NLT',
    language: 'English',
    year: 1996,
    description: 'A thought-for-thought translation in contemporary English.'
  },
  'NASB': {
    name: 'New American Standard Bible',
    abbreviation: 'NASB',
    language: 'English',
    year: 1971,
    description: 'Known for its literal accuracy and scholarly approach.'
  },
  'NKJV': {
    name: 'New King James Version',
    abbreviation: 'NKJV',
    language: 'English',
    year: 1982,
    description: 'Updates the KJV language while preserving its style and accuracy.'
  },
  'ASV': {
    name: 'American Standard Version',
    abbreviation: 'ASV',
    language: 'English',
    year: 1901,
    description: 'An early 20th century revision of the King James Version.'
  },
  'AKJV': {
    name: 'Authorized King James Version',
    abbreviation: 'AKJV',
    language: 'English',
    year: 1769,
    description: 'The 1769 revision of the King James Version.'
  },
  'NET': {
    name: 'New English Translation',
    abbreviation: 'NET',
    language: 'English',
    year: 2005,
    description: 'A modern translation with extensive translator notes.'
  },
  'YLT': {
    name: "Young's Literal Translation",
    abbreviation: 'YLT',
    language: 'English',
    year: 1898,
    description: 'An extremely literal translation preserving Hebrew and Greek word order.'
  },
  'NRSV': {
    name: 'New Revised Standard Version',
    abbreviation: 'NRSV',
    language: 'English',
    year: 1989,
    description: 'An academic translation with inclusive language.'
  },
  'NASB1995': {
    name: 'New American Standard Bible 1995',
    abbreviation: 'NASB1995',
    language: 'English',
    year: 1995,
    description: 'The 1995 update of the NASB with improved readability.'
  }
}

// Default version to use if no translations are available or none is selected
const fallbackVersion: BibleVersion = {
  id: 'kjv',
  ...translationInfo['KJV']
}

export function BibleVersionProvider({ children }: { children: React.ReactNode }) {
  const [availableVersions, setAvailableVersions] = useState<BibleVersion[]>([])
  const [selectedVersion, setSelectedVersionState] = useState<BibleVersion>(fallbackVersion)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load available translations from downloaded files
  useEffect(() => {
    const loadTranslations = () => {
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
        setIsLoading(false)
      } catch (err) {
        console.error('Error in translation loading:', err)
        setAvailableVersions([fallbackVersion])
        setIsLoading(false)
      }
    }
    
    loadTranslations()
  }, [])
  
  // Load saved version preference once we have available versions
  useEffect(() => {
    if (availableVersions.length > 0 && !isLoaded) {
      try {
        const savedVersionId = localStorage.getItem('openbible-selected-version')
        if (savedVersionId) {
          const savedVersion = availableVersions.find(v => v.id === savedVersionId)
          if (savedVersion) {
            setSelectedVersionState(savedVersion)
          }
        }
      } catch (err) {
        console.error('Error loading saved version preference:', err)
      } finally {
        setIsLoaded(true)
      }
    } else if (availableVersions.length > 0 && !isLoaded) {
      setIsLoaded(true)
    }
  }, [availableVersions, isLoaded])

  // Save version preference when it changes (only after initial load)
  const setSelectedVersion = (version: BibleVersion) => {
    setSelectedVersionState(version)
    if (isLoaded) {
      try {
        localStorage.setItem('openbible-selected-version', version.id)
      } catch (error) {
        console.error('Failed to save version preference:', error)
      }
    }
  }

  return (
    <BibleVersionContext.Provider value={{ 
      selectedVersion, 
      availableVersions, 
      setSelectedVersion,
      isLoading 
    }}>
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