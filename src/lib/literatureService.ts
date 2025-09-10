import { supabase } from '@/lib/supabase';
import { LiteratureWork } from './literatureParser'

// Re-export LiteratureWork for other components
export type { LiteratureWork }

export interface LiteratureIndex {
  works: LiteratureWorkSummary[]
  lastUpdated: string
}

export interface LiteratureWorkSummary {
  id: string
  title: string
  author: string
  year?: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  description: string
  wordCount: number
  chapterCount: number
  estimatedReadingTime: number
  filename: string
  dateAdded: string
}

export class LiteratureService {
  private static readonly LITERATURE_PATH = '/literature/'
  private static readonly INDEX_FILE = 'index.json'

  /**
   * Save a literature work to the Supabase database
   */
  static async saveLiteratureWork(work: LiteratureWork): Promise<void> {
    try {
      console.log(`Attempting to save literature work: ${work.title}`);
      
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/literature/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ work }),
      })

      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const responseText = await response.text();
        console.error('Error response text:', responseText);
        
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText };
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      try {
        const result = JSON.parse(responseText);
        console.log('Literature work saved successfully:', result);
        console.log(`Literature work "${work.title}" saved successfully to database`);
      } catch (e) {
        console.error('Failed to parse JSON response:', responseText);
        throw new Error('Received an invalid response from the server.');
      }
    } catch (error) {
      console.error('Error saving literature work:', error)
      throw new Error(`Failed to save literature work: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Load a literature work by ID from Supabase database
   */
  static async loadLiteratureWork(id: string): Promise<LiteratureWork | null> {
    try {
      const response = await fetch('/api/literature/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      return result.work as LiteratureWork
    } catch (error) {
      console.error(`Error loading literature work ${id}:`, error)
      return null
    }
  }

  /**
   * Get a literature work with fallback to loading if not cached
   */
  static async getLiteratureWork(id: string): Promise<LiteratureWork | null> {
    return this.loadLiteratureWork(id)
  }

  /**
   * Load the literature index from Supabase database
   */
  static async loadLiteratureIndex(): Promise<LiteratureIndex> {
    try {
      const response = await fetch('/api/literature/list')
      
      if (!response.ok) {
        console.error('Failed to load literature index from database')
        return {
          works: [],
          lastUpdated: new Date().toISOString()
        }
      }
      
      const result = await response.json()
      return {
        works: result.works,
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error loading literature index:', error)
      return {
        works: [],
        lastUpdated: new Date().toISOString()
      }
    }
  }

  /**
   * Get the literature index (alias for loadLiteratureIndex)
   */
  static async getLiteratureIndex(): Promise<LiteratureIndex> {
    return this.loadLiteratureIndex()
  }

  /**
   * Delete a literature work
   */
  static async deleteLiteratureWork(id: string): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/literature/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ id })
      });

      if (!response.ok) {
        throw new Error(`Failed to delete work: ${response.statusText}`);
      }

      console.log(`Literature work ${id} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting literature work ${id}:`, error);
      throw new Error(`Failed to delete literature work: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateLiteratureWork(updatedWork: Partial<LiteratureWork>): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/literature/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ work: updatedWork })
      });

      if (!response.ok) {
        throw new Error(`Failed to update work: ${response.statusText}`);
      }

      console.log(`Literature work ${updatedWork.id} updated successfully`);
    } catch (error) {
      console.error(`Error updating literature work ${updatedWork.id}:`, error);
      throw new Error(`Failed to update literature work: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search literature works
   */
  static async searchLiteratureWorks(query: string): Promise<LiteratureWorkSummary[]> {
    const index = await this.getLiteratureIndex()
    const lowercaseQuery = query.toLowerCase()
    
    return index.works.filter(work => 
      work.title.toLowerCase().includes(lowercaseQuery) ||
      work.author.toLowerCase().includes(lowercaseQuery) ||
      work.description.toLowerCase().includes(lowercaseQuery)
    )
  }

  /**
   * Get works by difficulty level
   */
  static async getWorksByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): Promise<LiteratureWorkSummary[]> {
    const index = await this.getLiteratureIndex()
    return index.works.filter(work => work.difficulty === difficulty)
  }

  /**
   * Get works by author
   */
  static async getWorksByAuthor(author: string): Promise<LiteratureWorkSummary[]> {
    const index = await this.getLiteratureIndex()
    return index.works.filter(work => 
      work.author.toLowerCase().includes(author.toLowerCase())
    )
  }

  /**
   * Update the literature index with a new work
   */
  private static async updateIndex(work: LiteratureWork, filename: string): Promise<void> {
    const index = await this.getLiteratureIndex()
    
    // Remove existing entry if updating
    const existingIndex = index.works.findIndex(w => w.id === work.id)
    if (existingIndex !== -1) {
      index.works.splice(existingIndex, 1)
    }
    
    // Add new entry
    const workSummary: LiteratureWorkSummary = {
      id: work.id,
      title: work.title,
      author: work.author,
      year: work.year,
      difficulty: work.difficulty,
      description: work.description,
      wordCount: work.metadata?.wordCount || 0,
      chapterCount: work.chapters.length,
      estimatedReadingTime: work.metadata?.estimatedReadingTime || 0,
      filename,
      dateAdded: new Date().toISOString()
    }
    
    index.works.push(workSummary)
    index.lastUpdated = new Date().toISOString()
    
    // Sort by title
    index.works.sort((a, b) => a.title.localeCompare(b.title))
    
    await this.saveFile(this.INDEX_FILE, JSON.stringify(index, null, 2))
  }

  /**
   * Save a file to the literature directory using the API
   */
  private static async saveFile(filename: string, content: string): Promise<void> {
    try {
      console.log(`Attempting to save file: ${filename}`);
      console.log(`Content length: ${content.length} characters`);
      
      const requestBody = { filename, content };
      console.log('Request body prepared:', { filename, contentLength: content.length });
      
      const response = await fetch('/api/literature/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log(`Response status: ${response.status}`);
      console.log(`Response ok: ${response.ok}`);
      
      if (!response.ok) {
        const responseText = await response.text();
        console.error('Error response text:', responseText);
        
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText };
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`File ${filename} saved successfully:`, result.message);
    } catch (error) {
      console.error(`Error saving file ${filename}:`, error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate a literature work structure
   */
  static validateLiteratureWork(work: any): work is LiteratureWork {
    return (
      typeof work === 'object' &&
      typeof work.id === 'string' &&
      typeof work.title === 'string' &&
      typeof work.author === 'string' &&
      ['beginner', 'intermediate', 'advanced'].includes(work.difficulty) &&
      typeof work.description === 'string' &&
      Array.isArray(work.chapters) &&
      work.chapters.every((chapter: any) => 
        typeof chapter.id === 'number' &&
        typeof chapter.title === 'string' &&
        typeof chapter.content === 'string' &&
        typeof chapter.wordCount === 'number' &&
        typeof chapter.estimatedReadingTime === 'number'
      )
    )
  }

  /**
   * Import literature works from a JSON file
   */
  static async importLiteratureWorks(file: File): Promise<LiteratureWork[]> {
    try {
      const content = await file.text()
      const data = JSON.parse(content)
      
      // Handle both single work and array of works
      const works = Array.isArray(data) ? data : [data]
      
      const validWorks: LiteratureWork[] = []
      
      for (const work of works) {
        if (this.validateLiteratureWork(work)) {
          validWorks.push(work)
        } else {
          console.warn('Invalid work structure found, skipping:', work)
        }
      }
      
      return validWorks
    } catch (error) {
      throw new Error(`Failed to import literature works: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Export all literature works to a JSON file
   */
  static async exportLiteratureWorks(): Promise<void> {
    try {
      const index = await this.getLiteratureIndex()
      const allWorks: LiteratureWork[] = []
      
      // Load all works
      for (const workSummary of index.works) {
        const work = await this.loadLiteratureWork(workSummary.id)
        if (work) {
          allWorks.push(work)
        }
      }
      
      const exportData = {
        exportDate: new Date().toISOString(),
        worksCount: allWorks.length,
        works: allWorks
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `literature-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      
      URL.revokeObjectURL(url)
    } catch (error) {
      throw new Error(`Failed to export literature works: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get statistics about the literature collection
   */
  static async getCollectionStats(): Promise<{
    totalWorks: number
    totalWords: number
    totalChapters: number
    averageReadingTime: number
    difficultyBreakdown: Record<string, number>
    authorCount: number
  }> {
    const index = await this.getLiteratureIndex()
    
    const stats = {
      totalWorks: index.works.length,
      totalWords: index.works.reduce((sum, work) => sum + work.wordCount, 0),
      totalChapters: index.works.reduce((sum, work) => sum + work.chapterCount, 0),
      averageReadingTime: index.works.length > 0 
        ? Math.round(index.works.reduce((sum, work) => sum + work.estimatedReadingTime, 0) / index.works.length)
        : 0,
      difficultyBreakdown: {
        beginner: index.works.filter(w => w.difficulty === 'beginner').length,
        intermediate: index.works.filter(w => w.difficulty === 'intermediate').length,
        advanced: index.works.filter(w => w.difficulty === 'advanced').length
      },
      authorCount: new Set(index.works.map(w => w.author)).size
    }
    
    return stats
  }
}