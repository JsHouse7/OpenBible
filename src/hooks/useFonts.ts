'use client'

import { useUserPreferences } from '@/components/UserPreferencesProvider'

export interface FontOption {
  name: string
  value: string
  className: string
  description: string
}

export const fontOptions: FontOption[] = [
  {
    name: 'Merriweather',
    value: 'merriweather',
    className: 'font-merriweather',
    description: 'Classic serif font, excellent for reading'
  },
  {
    name: 'Georgia',
    value: 'georgia',
    className: 'font-georgia',
    description: 'Traditional serif font with excellent readability'
  },
  {
    name: 'Times New Roman',
    value: 'times',
    className: 'font-times',
    description: 'Classic serif font, familiar and readable'
  },
  {
    name: 'Inter',
    value: 'inter',
    className: 'font-inter',
    description: 'Modern sans-serif font, clean and contemporary'
  },
  {
    name: 'Open Sans',
    value: 'opensans',
    className: 'font-opensans',
    description: 'Friendly sans-serif font, highly legible'
  },
  {
    name: 'Lato',
    value: 'lato',
    className: 'font-lato',
    description: 'Humanist sans-serif font, warm and approachable'
  },
  {
    name: 'Roboto',
    value: 'roboto',
    className: 'font-roboto',
    description: 'Modern sans-serif font, clean and neutral'
  },
  {
    name: 'Source Sans Pro',
    value: 'sourcesans',
    className: 'font-sourcesans',
    description: 'Professional sans-serif font, clear and readable'
  },
  {
    name: 'Playfair Display',
    value: 'playfair',
    className: 'font-playfair',
    description: 'Elegant serif font with high contrast'
  },
  {
    name: 'Crimson Text',
    value: 'crimson',
    className: 'font-crimson',
    description: 'Book-style serif font, perfect for long reading'
  }
]

// Default preferences for SSR fallback
const defaultPreferences = {
  fontFamily: 'georgia',
  fontSize: 16,
  lineHeight: 1.6
}

export function useFonts() {
  // Safe hook usage with fallback for SSR
  let preferences
  try {
    const context = useUserPreferences()
    preferences = context?.preferences || defaultPreferences
  } catch {
    // Fallback for SSR or when context is not available
    preferences = defaultPreferences
  }

  const getFontClass = (type: 'body' | 'heading' | 'ui' = 'body'): string => {
    const selectedFont = fontOptions.find(font => font.value === preferences.fontFamily)
    
    if (!selectedFont) {
      return 'font-merriweather' // Default fallback
    }

    // For UI elements, prefer sans-serif unless specifically set to a serif font
    if (type === 'ui' && selectedFont.value !== 'inter') {
      return 'font-sans'
    }

    return selectedFont.className
  }

  const getFontSizeClass = (): string => {
    const size = preferences.fontSize
    const sizeMap = {
      12: 'text-xs',
      14: 'text-sm',
      16: 'text-base',
      18: 'text-lg',
      20: 'text-xl',
      22: 'text-2xl',
      24: 'text-3xl'
    }
    return sizeMap[size as keyof typeof sizeMap] || 'text-base'
  }

  const getLineHeightClass = (): string => {
    const lineHeight = preferences.lineHeight
    const lineHeightMap = {
      1.2: 'leading-tight',
      1.4: 'leading-snug',
      1.6: 'leading-normal',
      1.8: 'leading-relaxed',
      2.0: 'leading-loose'
    }
    return lineHeightMap[lineHeight as keyof typeof lineHeightMap] || 'leading-relaxed'
  }

  const getBibleTextClasses = (): string => {
    return `${getFontClass('body')} ${getFontSizeClass()} ${getLineHeightClass()}`
  }

  const getUITextClasses = (): string => {
    return `${getFontClass('ui')} text-sm leading-normal`
  }

  const getHeadingClasses = (level: 1 | 2 | 3 | 4 = 2): string => {
    const baseClasses = getFontClass('heading')
    const sizeClasses = {
      1: 'text-3xl font-bold',
      2: 'text-2xl font-semibold',
      3: 'text-xl font-medium',
      4: 'text-lg font-medium'
    }
    return `${baseClasses} ${sizeClasses[level]}`
  }

  return {
    fontOptions,
    getFontClass,
    getFontSizeClass,
    getLineHeightClass,
    getBibleTextClasses,
    getUITextClasses,
    getHeadingClasses,
    currentFont: fontOptions.find(font => font.value === preferences.fontFamily) || fontOptions[0]
  }
}