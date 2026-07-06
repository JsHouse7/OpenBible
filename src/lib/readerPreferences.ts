export type ReaderTheme = 'light' | 'sepia' | 'gray' | 'black'
export type ReaderMode = 'paginated' | 'scroll'
export type ReaderTextAlign = 'left' | 'justify'

export interface ReaderPreferences {
  fontSize: number
  lineHeight: number
  fontFamily: string
  margins: number
  textAlign: ReaderTextAlign
  theme: ReaderTheme
  readingMode: ReaderMode
  showChrome: boolean
}

export const defaultReaderPreferences: ReaderPreferences = {
  fontSize: 18,
  lineHeight: 1.7,
  fontFamily: 'crimson',
  margins: 24,
  textAlign: 'justify',
  theme: 'sepia',
  readingMode: 'paginated',
  showChrome: true,
}

export const readerThemeStyles: Record<
  ReaderTheme,
  { bg: string; text: string; muted: string; chrome: string }
> = {
  light: {
    bg: '#ffffff',
    text: '#1a1a1a',
    muted: '#6b7280',
    chrome: 'rgba(255,255,255,0.95)',
  },
  sepia: {
    bg: '#f4ecd8',
    text: '#3d2b1f',
    muted: '#7a6a56',
    chrome: 'rgba(244,236,216,0.95)',
  },
  gray: {
    bg: '#e5e5e5',
    text: '#262626',
    muted: '#737373',
    chrome: 'rgba(229,229,229,0.95)',
  },
  black: {
    bg: '#000000',
    text: '#d4d4d4',
    muted: '#a3a3a3',
    chrome: 'rgba(0,0,0,0.92)',
  },
}

export const GUEST_PROGRESS_KEY = 'openbible-literature-progress'
export const GUEST_BOOKMARKS_KEY = 'openbible-literature-bookmarks'
export const GUEST_HIGHLIGHTS_KEY = 'openbible-literature-highlights'
