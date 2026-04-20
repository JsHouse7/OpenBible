import { supabase } from '@/lib/supabase';
import { LiteratureWork } from './literatureParser'

// Re-export LiteratureWork for other components
export type { LiteratureWork }

function normalizeLiteratureWorkSummary(raw: unknown): LiteratureWorkSummary {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const meta =
    r.metadata && typeof r.metadata === 'object'
      ? (r.metadata as Record<string, unknown>)
      : {}

  const diff = r.difficulty ?? meta.difficulty
  const difficulty: LiteratureWorkSummary['difficulty'] =
    diff === 'beginner' || diff === 'intermediate' || diff === 'advanced' ? diff : 'intermediate'

  const wordCount = Number(r.wordCount ?? meta.wordCount ?? 0)
  const chapterCount = Number(r.chapterCount ?? meta.chapterCount ?? 0)
  const estimatedReadingTime = Number(r.estimatedReadingTime ?? meta.estimatedReadingTime ?? 0)

  let year: number | undefined
  const yr = r.year
  if (typeof yr === 'number' && Number.isFinite(yr)) year = yr
  else if (typeof yr === 'string' && yr !== '') {
    const n = Number(yr)
    if (Number.isFinite(n)) year = n
  }

  return {
    id: String(r.id ?? ''),
    title: String(r.title ?? ''),
    author: String(r.author ?? ''),
    year,
    difficulty,
    description: String(r.description ?? ''),
    wordCount: Number.isFinite(wordCount) ? wordCount : 0,
    chapterCount: Number.isFinite(chapterCount) ? chapterCount : 0,
    estimatedReadingTime: Number.isFinite(estimatedReadingTime) ? estimatedReadingTime : 0,
    filename: String(r.filename ?? `${r.id ?? 'work'}.json`),
    dateAdded: String(r.dateAdded ?? meta.dateAdded ?? new Date().toISOString()),
  }
}

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
  /**
   * Save a literature work to the Supabase database. Returns the persisted row id (matches JSON `content.id` after save).
   */
  static async saveLiteratureWork(work: LiteratureWork): Promise<{ id: string }> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('Sign in required to save literature.')
    }

    try {
      const response = await fetch('/api/literature/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ work }),
      })

      const responseText = await response.text()

      if (!response.ok) {
        let errorData: { error?: string }
        try {
          errorData = JSON.parse(responseText)
        } catch {
          errorData = { error: responseText }
        }
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      try {
        const result = JSON.parse(responseText) as { work?: { id?: string } }
        const id = result.work?.id
        if (!id || typeof id !== 'string') {
          throw new Error('Save succeeded but server did not return work id.')
        }
        return { id }
      } catch (e) {
        if (e instanceof Error && e.message.includes('did not return')) throw e
        console.error('Failed to parse save response:', responseText)
        throw new Error('Received an invalid response from the server.')
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
      const rawWorks = Array.isArray(result.works) ? result.works : []
      return {
        works: rawWorks.map((w: unknown) => normalizeLiteratureWorkSummary(w)),
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
   * Parse a JSON file into `LiteratureWork[]` for local validation. Call
   * `saveLiteratureWork` for each work to persist to Supabase (requires auth).
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
   * Download every work via the public load API into one JSON export file (client-side).
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
   * Extract text from a PDF on the server (`/api/literature/extract-pdf`).
   * Chain with `LiteratureParser.parseText(text, options, 'pdf')`.
   */
  static async extractPdfText(file: File): Promise<{ text: string; pageCount?: number }> {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/literature/extract-pdf', { method: 'POST', body: form })
    const raw = await res.text()
    if (!res.ok) {
      let msg = raw
      try {
        const err = JSON.parse(raw) as { error?: string }
        if (err.error) msg = err.error
      } catch {
        /* use raw */
      }
      throw new Error(msg || 'PDF text extraction failed')
    }
    const data = JSON.parse(raw) as { text: string; pageCount?: number }
    return { text: data.text, pageCount: data.pageCount }
  }

  /**
   * Fetch HTML from a URL server-side (`/api/literature/fetch-html`) with basic SSRF protections.
   * Chain with `LiteratureParser.parseHtml(html)`.
   */
  static async fetchHtmlFromUrl(url: string): Promise<{ html: string; finalUrl: string }> {
    const res = await fetch('/api/literature/fetch-html', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.trim() }),
    })
    const raw = await res.text()
    if (!res.ok) {
      let msg = raw
      try {
        const err = JSON.parse(raw) as { error?: string }
        if (err.error) msg = err.error
      } catch {
        /* use raw */
      }
      throw new Error(msg || 'Failed to fetch HTML page')
    }
    return JSON.parse(raw) as { html: string; finalUrl: string }
  }

  /**
   * Sanitize local/inline HTML on the server before `LiteratureParser.parseHtml`.
   */
  static async sanitizeHtmlLiterature(html: string): Promise<string> {
    const res = await fetch('/api/literature/sanitize-html', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html }),
    })
    const raw = await res.text()
    if (!res.ok) {
      let msg = raw
      try {
        const err = JSON.parse(raw) as { error?: string }
        if (err.error) msg = err.error
      } catch {
        /* use raw */
      }
      throw new Error(msg || 'HTML sanitization failed')
    }
    const data = JSON.parse(raw) as { html: string }
    return data.html
  }

  /**
   * Extract plain text from a .docx on the server (`/api/literature/extract-docx`).
   * Chain with `LiteratureParser.parseText(text, options, 'docx')`.
   */
  static async extractDocxText(file: File): Promise<{ text: string }> {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/literature/extract-docx', { method: 'POST', body: form })
    const raw = await res.text()
    if (!res.ok) {
      let msg = raw
      try {
        const err = JSON.parse(raw) as { error?: string }
        if (err.error) msg = err.error
      } catch {
        /* use raw */
      }
      throw new Error(msg || 'DOCX text extraction failed')
    }
    return JSON.parse(raw) as { text: string }
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

  /** Trigger download of a UTF-8 `.txt` with title, author, and all chapters. */
  static async downloadWorkAsPlainText(workId: string): Promise<void> {
    const work = await this.loadLiteratureWork(workId)
    if (!work) {
      throw new Error('Work not found')
    }
    const body = work.chapters
      .map((ch) => `${ch.title}\n\n${ch.content}`)
      .join('\n\n---\n\n')
    const header = `${work.title}\nby ${work.author}${work.year != null ? ` (${work.year})` : ''}\n\n`
    const blob = new Blob([header + body], { type: 'text/plain;charset=utf-8' })
    const safe = work.title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-') || 'work'
    this.triggerBlobDownload(blob, `${safe}.txt`)
  }

  /** Trigger download of full `LiteratureWork` JSON (useful for backup or re-import after edit). */
  static async downloadWorkAsJson(workId: string): Promise<void> {
    const work = await this.loadLiteratureWork(workId)
    if (!work) {
      throw new Error('Work not found')
    }
    const blob = new Blob([JSON.stringify(work, null, 2)], { type: 'application/json' })
    const safe = work.title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-') || 'work'
    this.triggerBlobDownload(blob, `${safe}.json`)
  }

  private static triggerBlobDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
}