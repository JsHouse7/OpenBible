import { supabase } from './supabase'

export interface UserPreferences {
  theme?: string
  bibleVersion?: string
  fontSize?: number
  fontFamily?: string
  lineHeight?: number
  animationsEnabled?: boolean
  notificationsEnabled?: boolean
  dailyReminderTime?: string
  readingPlan?: string
  highlightColors?: string[]
  bookmarks?: any[]
  notes?: any[]
  readingProgress?: any
  searchHistory?: string[]
  favoriteVerses?: any[]
  studyNotes?: any[]
  [key: string]: any
}

class UserPreferencesService {
  private cache: UserPreferences | null = null
  private isLoading = false

  async getPreferences(): Promise<UserPreferences> {
    if (this.cache) {
      return this.cache
    }

    if (this.isLoading) {
      // Wait for ongoing request
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      return this.cache || {}
    }

    this.isLoading = true

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated, return empty preferences
          this.cache = {}
          return this.cache
        }
        throw new Error(`Failed to fetch preferences: ${response.statusText}`)
      }

      const data = await response.json()
      this.cache = data.preferences || {}
      return this.cache
    } catch (error) {
      console.error('Error fetching user preferences:', error)
      // Fallback to localStorage if database fails
      return this.getLocalStoragePreferences()
    } finally {
      this.isLoading = false
    }
  }

  async savePreferences(preferences: UserPreferences): Promise<void> {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated, save to localStorage
          this.saveToLocalStorage(preferences)
          return
        }
        throw new Error(`Failed to save preferences: ${response.statusText}`)
      }

      this.cache = preferences
      console.log('User preferences saved to database successfully')
    } catch (error) {
      console.error('Error saving user preferences:', error)
      // Fallback to localStorage if database fails
      this.saveToLocalStorage(preferences)
    }
  }

  async updatePreferences(partialPreferences: Partial<UserPreferences>): Promise<void> {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences: partialPreferences }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated, update localStorage
          const current = this.getLocalStoragePreferences()
          const updated = { ...current, ...partialPreferences }
          this.saveToLocalStorage(updated)
          return
        }
        throw new Error(`Failed to update preferences: ${response.statusText}`)
      }

      const data = await response.json()
      this.cache = data.preferences
      console.log('User preferences updated in database successfully')
    } catch (error) {
      console.error('Error updating user preferences:', error)
      // Fallback to localStorage if database fails
      const current = this.getLocalStoragePreferences()
      const updated = { ...current, ...partialPreferences }
      this.saveToLocalStorage(updated)
    }
  }

  async getPreference<T>(key: string, defaultValue?: T): Promise<T> {
    const preferences = await this.getPreferences()
    return preferences[key] !== undefined ? preferences[key] : defaultValue
  }

  async setPreference(key: string, value: any): Promise<void> {
    await this.updatePreferences({ [key]: value })
  }

  clearCache(): void {
    this.cache = null
  }

  // Fallback methods for localStorage
  private getLocalStoragePreferences(): UserPreferences {
    if (typeof window === 'undefined') return {}
    
    try {
      const stored = localStorage.getItem('userPreferences')
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return {}
    }
  }

  private saveToLocalStorage(preferences: UserPreferences): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem('userPreferences', JSON.stringify(preferences))
      this.cache = preferences
      console.log('User preferences saved to localStorage as fallback')
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }

  // Migration method to move localStorage data to database
  async migrateFromLocalStorage(): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      const localPrefs = this.getLocalStoragePreferences()
      if (Object.keys(localPrefs).length > 0) {
        await this.savePreferences(localPrefs)
        // Clear localStorage after successful migration
        localStorage.removeItem('userPreferences')
        console.log('Successfully migrated preferences from localStorage to database')
      }
    } catch (error) {
      console.error('Error migrating preferences from localStorage:', error)
    }
  }
}

export const userPreferencesService = new UserPreferencesService()