import JSZip from 'jszip'

export interface LiteratureWork {
  id: string
  title: string
  author: string
  year?: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  description: string
  chapters: LiteratureChapter[]
  metadata?: {
    originalFormat: string
    parseDate: string
    wordCount: number
    estimatedReadingTime: number
  }
}

export interface LiteratureChapter {
  id: number
  title: string
  content: string
  wordCount: number
  estimatedReadingTime: number
}

export interface ParseOptions {
  chapterDetection: 'auto' | 'manual' | 'pageBreaks' | 'headers'
  chapterMarkers?: string[]
  removeFootnotes?: boolean
  preserveFormatting?: boolean
  splitByParagraphs?: boolean
  extractMetadata?: boolean
}

export class LiteratureParser {
  private static readonly CHAPTER_PATTERNS = [
    /^\s*CHAPTER\s+([IVXLCDM]+|\d+)\s*[:.\-]?\s*(.*?)$/im,
    /^\s*Chapter\s+(\d+)\s*[:.\-]?\s*(.*?)$/im,
    /^\s*(\d+)\s*[:.\-]\s*(.*?)$/im,
    /^\s*PART\s+([IVXLCDM]+|\d+)\s*[:.\-]?\s*(.*?)$/im,
    /^\s*SECTION\s+(\d+)\s*[:.\-]?\s*(.*?)$/im
  ]

  private static readonly FOOTNOTE_PATTERNS = [
    /\[\d+\]/g,
    /\(\d+\)/g,
    /\*\d+/g,
    /†\d*/g
  ]

  static async parseText(content: string, options: Partial<ParseOptions> = {}): Promise<LiteratureWork> {
    const defaultOptions: ParseOptions = {
      chapterDetection: 'auto',
      preserveFormatting: true,
      extractMetadata: true
    }
    const finalOptions = { ...defaultOptions, ...options }
    
    const cleanContent = this.cleanText(content, finalOptions)
    const chapters = this.detectChapters(cleanContent, finalOptions)
    const metadata = this.generateMetadata(content, 'txt')

    return {
      id: this.generateId(),
      title: this.extractTitle(content) || 'Untitled Work',
      author: this.extractAuthor(content) || 'Unknown Author',
      difficulty: 'intermediate',
      description: this.generateDescription(content),
      chapters,
      metadata
    }
  }

  static async parseEpub(file: File, options: Partial<ParseOptions> = {}): Promise<LiteratureWork> {
    const zip = new JSZip()
    const zipContent = await zip.loadAsync(file)
    
    // Extract EPUB metadata
    const opfFile = await this.findOpfFile(zipContent)
    const metadata = await this.extractEpubMetadata(zipContent, opfFile)
    
    // Extract content
    const chapters = await this.extractEpubChapters(zipContent, opfFile)
    
    return {
      id: this.generateId(),
      title: metadata.title || 'Untitled Work',
      author: metadata.author || 'Unknown Author',
      year: metadata.year,
      difficulty: 'intermediate',
      description: metadata.description || this.generateDescription(chapters.map(c => c.content).join(' ')),
      chapters,
      metadata: {
        originalFormat: 'epub',
        parseDate: new Date().toISOString(),
        wordCount: chapters.reduce((sum, ch) => sum + ch.wordCount, 0),
        estimatedReadingTime: chapters.reduce((sum, ch) => sum + ch.estimatedReadingTime, 0)
      }
    }
  }

  static async parseHtml(content: string, options: Partial<ParseOptions> = {}): Promise<LiteratureWork> {
    const defaultOptions: ParseOptions = {
      chapterDetection: 'auto',
      preserveFormatting: true,
      extractMetadata: true
    }
    const finalOptions = { ...defaultOptions, ...options }
    
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'text/html')
    
    // Extract metadata from HTML
    const title = doc.querySelector('title')?.textContent || 
                  doc.querySelector('h1')?.textContent || 'Untitled Work'
    const author = doc.querySelector('meta[name="author"]')?.getAttribute('content') || 'Unknown Author'
    
    // Extract content and detect chapters
    const bodyText = doc.body?.textContent || content
    const chapters = this.detectChapters(bodyText, finalOptions)
    const metadata = this.generateMetadata(bodyText, 'html')

    return {
      id: this.generateId(),
      title,
      author,
      difficulty: 'intermediate',
      description: this.generateDescription(bodyText),
      chapters,
      metadata
    }
  }

  private static cleanText(content: string, options: ParseOptions): string {
    let cleaned = content

    // Remove footnotes if requested
    if (options.removeFootnotes) {
      this.FOOTNOTE_PATTERNS.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '')
      })
    }

    // Normalize whitespace
    cleaned = cleaned.replace(/\r\n/g, '\n')
    cleaned = cleaned.replace(/\r/g, '\n')
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
    cleaned = cleaned.trim()

    return cleaned
  }

  private static detectChapters(content: string, options: ParseOptions): LiteratureChapter[] {
    const chapters: LiteratureChapter[] = []
    
    switch (options.chapterDetection) {
      case 'manual':
        return this.detectManualChapters(content, options.chapterMarkers || [])
      case 'pageBreaks':
        return this.detectPageBreakChapters(content)
      case 'headers':
        return this.detectHeaderChapters(content)
      default:
        return this.detectAutoChapters(content)
    }
  }

  private static detectAutoChapters(content: string): LiteratureChapter[] {
    const chapters: LiteratureChapter[] = []
    const lines = content.split('\n')
    let currentChapter: { title: string; content: string[] } | null = null
    let chapterNumber = 0

    for (const line of lines) {
      let isChapterStart = false
      let chapterTitle = ''

      // Try each chapter pattern
      for (const pattern of this.CHAPTER_PATTERNS) {
        const match = line.match(pattern)
        if (match) {
          isChapterStart = true
          chapterTitle = match[2] ? match[2].trim() : `Chapter ${match[1]}`
          break
        }
      }

      if (isChapterStart) {
        // Save previous chapter
        if (currentChapter) {
          const content = currentChapter.content.join('\n').trim()
          if (content) {
            chapters.push(this.createChapter(chapterNumber, currentChapter.title, content))
          }
        }

        // Start new chapter
        chapterNumber++
        currentChapter = {
          title: chapterTitle || `Chapter ${chapterNumber}`,
          content: []
        }
      } else if (currentChapter) {
        currentChapter.content.push(line)
      } else if (chapterNumber === 0) {
        // Content before first chapter
        if (!currentChapter) {
          currentChapter = {
            title: 'Introduction',
            content: []
          }
          chapterNumber = 1
        }
        currentChapter.content.push(line)
      }
    }

    // Save last chapter
    if (currentChapter) {
      const content = currentChapter.content.join('\n').trim()
      if (content) {
        chapters.push(this.createChapter(chapterNumber, currentChapter.title, content))
      }
    }

    // If no chapters detected, create single chapter
    if (chapters.length === 0) {
      chapters.push(this.createChapter(1, 'Full Text', content))
    }

    return chapters
  }

  private static detectManualChapters(content: string, markers: string[]): LiteratureChapter[] {
    const chapters: LiteratureChapter[] = []
    let currentPos = 0
    let chapterNumber = 1

    for (let i = 0; i < markers.length; i++) {
      const marker = markers[i]
      const nextMarker = markers[i + 1]
      
      const startPos = content.indexOf(marker, currentPos)
      if (startPos === -1) continue

      const endPos = nextMarker ? content.indexOf(nextMarker, startPos + marker.length) : content.length
      const chapterContent = content.substring(startPos + marker.length, endPos).trim()
      
      if (chapterContent) {
        chapters.push(this.createChapter(chapterNumber, marker, chapterContent))
        chapterNumber++
      }
      
      currentPos = endPos
    }

    return chapters
  }

  private static detectPageBreakChapters(content: string): LiteratureChapter[] {
    const pageBreaks = content.split(/\f|\n\s*\n\s*\n/)
    return pageBreaks
      .filter(page => page.trim().length > 100) // Filter out very short pages
      .map((page, index) => this.createChapter(index + 1, `Page ${index + 1}`, page.trim()))
  }

  private static detectHeaderChapters(content: string): LiteratureChapter[] {
    const lines = content.split('\n')
    const chapters: LiteratureChapter[] = []
    let currentChapter: { title: string; content: string[] } | null = null
    let chapterNumber = 0

    for (const line of lines) {
      // Detect headers (lines that are short, capitalized, or have specific formatting)
      const isHeader = this.isLikelyHeader(line)
      
      if (isHeader && line.trim().length > 0) {
        // Save previous chapter
        if (currentChapter) {
          const content = currentChapter.content.join('\n').trim()
          if (content) {
            chapters.push(this.createChapter(chapterNumber, currentChapter.title, content))
          }
        }

        // Start new chapter
        chapterNumber++
        currentChapter = {
          title: line.trim(),
          content: []
        }
      } else if (currentChapter) {
        currentChapter.content.push(line)
      }
    }

    // Save last chapter
    if (currentChapter) {
      const content = currentChapter.content.join('\n').trim()
      if (content) {
        chapters.push(this.createChapter(chapterNumber, currentChapter.title, content))
      }
    }

    return chapters.length > 0 ? chapters : [this.createChapter(1, 'Full Text', content)]
  }

  private static isLikelyHeader(line: string): boolean {
    const trimmed = line.trim()
    if (trimmed.length === 0 || trimmed.length > 100) return false
    
    // Check if line is all caps
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 3) return true
    
    // Check if line has header-like formatting
    if (/^\s*[IVXLCDM]+\.?\s+/.test(trimmed)) return true // Roman numerals
    if (/^\s*\d+\.?\s+/.test(trimmed)) return true // Numbers
    if (/^\s*[A-Z][a-z]+\s+[IVXLCDM]+/.test(trimmed)) return true // "Chapter I"
    
    return false
  }

  private static createChapter(id: number, title: string, content: string): LiteratureChapter {
    const wordCount = this.countWords(content)
    const estimatedReadingTime = Math.ceil(wordCount / 200) // 200 words per minute

    return {
      id,
      title,
      content,
      wordCount,
      estimatedReadingTime
    }
  }

  private static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  private static extractTitle(content: string): string | null {
    const lines = content.split('\n').slice(0, 10) // Check first 10 lines
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.length > 5 && trimmed.length < 100) {
        // Look for title-like patterns
        if (/^[A-Z][A-Za-z\s]+$/.test(trimmed) || trimmed === trimmed.toUpperCase()) {
          return trimmed
        }
      }
    }
    
    return null
  }

  private static extractAuthor(content: string): string | null {
    const lines = content.split('\n').slice(0, 20)
    
    for (const line of lines) {
      const trimmed = line.trim()
      // Look for "by Author Name" patterns
      const byMatch = trimmed.match(/^by\s+([A-Za-z\s.]+)$/i)
      if (byMatch) return byMatch[1].trim()
      
      // Look for author-like patterns
      if (/^[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(trimmed)) {
        return trimmed
      }
    }
    
    return null
  }

  private static generateDescription(content: string): string {
    const words = content.trim().split(/\s+/)
    const excerpt = words.slice(0, 50).join(' ')
    return excerpt.length < content.length ? excerpt + '...' : excerpt
  }

  private static generateMetadata(content: string, format: string) {
    const wordCount = this.countWords(content)
    return {
      originalFormat: format,
      parseDate: new Date().toISOString(),
      wordCount,
      estimatedReadingTime: Math.ceil(wordCount / 200)
    }
  }

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // EPUB-specific methods
  private static async findOpfFile(zip: JSZip): Promise<string> {
    // Implementation for finding OPF file in EPUB
    const containerXml = await zip.file('META-INF/container.xml')?.async('text')
    if (containerXml) {
      const parser = new DOMParser()
      const doc = parser.parseFromString(containerXml, 'text/xml')
      const opfPath = doc.querySelector('rootfile')?.getAttribute('full-path')
      if (opfPath) return opfPath
    }
    
    // Fallback: look for common OPF file names
    const opfFiles = Object.keys(zip.files).filter(name => name.endsWith('.opf'))
    return opfFiles[0] || ''
  }

  private static async extractEpubMetadata(zip: JSZip, opfPath: string): Promise<any> {
    const opfContent = await zip.file(opfPath)?.async('text')
    if (!opfContent) return {}

    const parser = new DOMParser()
    const doc = parser.parseFromString(opfContent, 'text/xml')
    
    return {
      title: doc.querySelector('dc\\:title, title')?.textContent,
      author: doc.querySelector('dc\\:creator, creator')?.textContent,
      description: doc.querySelector('dc\\:description, description')?.textContent,
      year: doc.querySelector('dc\\:date, date')?.textContent ? 
            new Date(doc.querySelector('dc\\:date, date')!.textContent!).getFullYear() : undefined
    }
  }

  private static async extractEpubChapters(zip: JSZip, opfPath: string): Promise<LiteratureChapter[]> {
    // This is a simplified implementation
    // In a real implementation, you'd parse the spine and extract HTML files
    const htmlFiles = Object.keys(zip.files).filter(name => 
      name.endsWith('.html') || name.endsWith('.xhtml')
    )
    
    const chapters: LiteratureChapter[] = []
    
    for (let i = 0; i < htmlFiles.length; i++) {
      const file = zip.files[htmlFiles[i]]
      const content = await file.async('text')
      const parser = new DOMParser()
      const doc = parser.parseFromString(content, 'text/html')
      const textContent = doc.body?.textContent || ''
      
      if (textContent.trim()) {
        chapters.push(this.createChapter(
          i + 1,
          doc.querySelector('h1, h2, title')?.textContent || `Chapter ${i + 1}`,
          textContent
        ))
      }
    }
    
    return chapters
  }
}