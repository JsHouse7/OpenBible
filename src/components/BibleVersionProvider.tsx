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
}

const BibleVersionContext = createContext<BibleVersionContextType | undefined>(undefined)

const availableVersions: BibleVersion[] = [
  {
    id: 'kjv',
    name: 'King James Version',
    abbreviation: 'KJV',
    language: 'English',
    year: 1611,
    description: 'The classic English translation with traditional language and poetic beauty.',
    isDefault: true
  },
  {
    id: 'niv',
    name: 'New International Version',
    abbreviation: 'NIV',
    language: 'English',
    year: 1978,
    description: 'A widely used modern translation balancing accuracy and readability.'
  },
  {
    id: 'esv',
    name: 'English Standard Version',
    abbreviation: 'ESV',
    language: 'English',
    year: 2001,
    description: 'A literal translation emphasizing word-for-word accuracy.'
  },
  {
    id: 'nlt',
    name: 'New Living Translation',
    abbreviation: 'NLT',
    language: 'English',
    year: 1996,
    description: 'A thought-for-thought translation in contemporary English.'
  },
  {
    id: 'nasb',
    name: 'New American Standard Bible',
    abbreviation: 'NASB',
    language: 'English',
    year: 1971,
    description: 'Known for its literal accuracy and scholarly approach.'
  },
  {
    id: 'nkjv',
    name: 'New King James Version',
    abbreviation: 'NKJV',
    language: 'English',
    year: 1982,
    description: 'Updates the KJV language while preserving its style and accuracy.'
  },
  {
    id: 'csb',
    name: 'Christian Standard Bible',
    abbreviation: 'CSB',
    language: 'English',
    year: 2017,
    description: 'Balances accuracy and readability with optimal translation.'
  },
  {
    id: 'msg',
    name: 'The Message',
    abbreviation: 'MSG',
    language: 'English',
    year: 2002,
    description: 'A contemporary paraphrase in modern American idiom.'
  },
  {
    id: 'amp',
    name: 'Amplified Bible',
    abbreviation: 'AMP',
    language: 'English',
    year: 1965,
    description: 'Expands on the text to give readers a deeper understanding.'
  },
  {
    id: 'nrsv',
    name: 'New Revised Standard Version',
    abbreviation: 'NRSV',
    language: 'English',
    year: 1989,
    description: 'An academic translation with inclusive language.'
  }
]

const defaultVersion = availableVersions.find(v => v.isDefault) || availableVersions[0]

export function BibleVersionProvider({ children }: { children: React.ReactNode }) {
  const [selectedVersion, setSelectedVersionState] = useState<BibleVersion>(defaultVersion)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load saved version preference only on client side
  useEffect(() => {
    try {
      const savedVersionId = localStorage.getItem('openbible-selected-version')
      if (savedVersionId) {
        const savedVersion = availableVersions.find(v => v.id === savedVersionId)
        if (savedVersion) {
          setSelectedVersionState(savedVersion)
        }
      }
    } catch (error) {
      console.error('Failed to load saved version:', error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

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
      setSelectedVersion 
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