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
   * Save a literature work to the public directory
   */
  static async saveLiteratureWork(work: LiteratureWork): Promise<void> {
    try {
      // Create filename from work ID
      const filename = `${work.id}.json`
      
      // Save the work file
      await this.saveFile(filename, JSON.stringify(work, null, 2))
      
      // Update the index
      await this.updateIndex(work, filename)
      
      console.log(`Literature work "${work.title}" saved successfully`)
    } catch (error) {
      console.error('Error saving literature work:', error)
      throw new Error(`Failed to save literature work: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Load a literature work by ID
   */
  static async loadLiteratureWork(id: string): Promise<LiteratureWork | null> {
    try {
      const filename = `${id}.json`
      const response = await fetch(`${this.LITERATURE_PATH}${filename}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const work: LiteratureWork = await response.json()
      return work
    } catch (error) {
      console.error(`Error loading literature work ${id}:`, error)
      return null
    }
  }

  /**
   * Get a literature work by ID (alias for loadLiteratureWork)
   */
  static async getLiteratureWork(id: string): Promise<LiteratureWork | null> {
    return this.loadLiteratureWork(id)
  }

  /**
   * Get the literature index (list of all works)
   */
  static async getLiteratureIndex(): Promise<LiteratureIndex> {
    try {
      const response = await fetch(`${this.LITERATURE_PATH}${this.INDEX_FILE}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          // Return empty index if file doesn't exist
          return {
            works: [],
            lastUpdated: new Date().toISOString()
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const index: LiteratureIndex = await response.json()
      return index
    } catch (error) {
      console.error('Error loading literature index:', error)
      // Return empty index on error
      return {
        works: [],
        lastUpdated: new Date().toISOString()
      }
    }
  }

  /**
   * Delete a literature work
   */
  static async deleteLiteratureWork(id: string): Promise<void> {
    try {
      // Remove from index
      const index = await this.getLiteratureIndex()
      const updatedWorks = index.works.filter(work => work.id !== id)
      
      const updatedIndex: LiteratureIndex = {
        works: updatedWorks,
        lastUpdated: new Date().toISOString()
      }
      
      await this.saveFile(this.INDEX_FILE, JSON.stringify(updatedIndex, null, 2))
      
      // Note: In a real implementation, you'd also delete the actual file
      // This would require a server-side API endpoint
      console.log(`Literature work ${id} removed from index`)
    } catch (error) {
      console.error(`Error deleting literature work ${id}:`, error)
      throw new Error(`Failed to delete literature work: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
   * Save a file to the literature directory
   * In a real implementation, this would use a server-side API
   */
  private static async saveFile(filename: string, content: string): Promise<void> {
    // For now, we'll create a download link for the user
    // In a production app, you'd send this to a server endpoint
    
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    // Create a temporary download link
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    URL.revokeObjectURL(url)
    
    // Show instructions to user
    console.log(`Please save ${filename} to the public/literature/ directory`)
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