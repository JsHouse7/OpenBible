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
    name: 'Crimson Text',
    value: 'crimson',
    className: 'font-crimson',
    description: 'Elegant serif inspired by old-style typefaces'
  },
  {
    name: 'Lora',
    value: 'lora',
    className: 'font-lora',
    description: 'Modern serif with calligraphic roots'
  },
  {
    name: 'Playfair Display',
    value: 'playfair',
    className: 'font-playfair',
    description: 'Distinctive serif with high contrast'
  },
  {
    name: 'Source Serif 4',
    value: 'source-serif',
    className: 'font-source-serif',
    description: 'Contemporary serif designed for screens'
  },
  {
    name: 'EB Garamond',
    value: 'eb-garamond',
    className: 'font-eb-garamond',
    description: 'Revival of Claude Garamont\'s humanist typeface'
  },
  {
    name: 'Libre Baskerville',
    value: 'libre-baskerville',
    className: 'font-libre-baskerville',
    description: 'Web optimization of Baskerville typeface'
  },
  {
    name: 'Inter',
    value: 'inter',
    className: 'font-sans',
    description: 'Modern sans-serif designed for interfaces'
  }
]

export function useFonts() {
  const { preferences } = useUserPreferences()

  const getFontClass = (type: 'body' | 'heading' | 'ui' = 'body'): string => {
    const selectedFont = fontOptions.find(font => font.value === preferences.appearance.fontFamily)
    
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
    const size = preferences.appearance.fontSize
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
    const lineHeight = preferences.appearance.lineHeight
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
    currentFont: fontOptions.find(font => font.value === preferences.appearance.fontFamily) || fontOptions[0]
  }
}