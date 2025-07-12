'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { bibleService } from '@/lib/database'

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
  'CSB': {
    name: 'Christian Standard Bible',
    abbreviation: 'CSB',
    language: 'English',
    year: 2017,
    description: 'Balances accuracy and readability with optimal translation.'
  },
  'MSG': {
    name: 'The Message',
    abbreviation: 'MSG',
    language: 'English',
    year: 2002,
    description: 'A contemporary paraphrase in modern American idiom.'
  },
  'AMP': {
    name: 'Amplified Bible',
    abbreviation: 'AMP',
    language: 'English',
    year: 1965,
    description: 'Expands on the text to give readers a deeper understanding.'
  },
  'NRSV': {
    name: 'New Revised Standard Version',
    abbreviation: 'NRSV',
    language: 'English',
    year: 1989,
    description: 'An academic translation with inclusive language.'
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

  // Load available translations from the database
  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        // Fetch available translations from the database
        const { data: translations, error } = await bibleService.getAvailableTranslations()
        
        if (error || !translations) {
          console.error('Error fetching translations:', error)
          // Use fallback version if we can't get translations
          setAvailableVersions([fallbackVersion])
        } else {
          // Map database translations to full version objects
          const versionObjects = translations.map(code => {
            const info = translationInfo[code as keyof typeof translationInfo] || {
              name: `${code} Translation`,
              abbreviation: code,
              language: 'Unknown',
              description: 'Bible translation'
            }
            
            return {
              id: (code as string).toLowerCase(),
              ...info
            }
          })
          
          // If we have no versions, use the fallback
          if (versionObjects.length === 0) {
            setAvailableVersions([fallbackVersion])
          } else {
            setAvailableVersions(versionObjects)
          }
        }
        
        setIsLoading(false)
      } catch (err) {
        console.error('Error in translation loading:', err)
        setAvailableVersions([fallbackVersion])
        setIsLoading(false)
      }
    }
    
    fetchTranslations()
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