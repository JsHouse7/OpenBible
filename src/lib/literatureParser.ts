import JSZip from 'jszip'
import { Readability } from '@mozilla/readability'
import {
  cleanPdfText,
  countWords,
  isHtmlContent,
  normalizeChapterContent,
  stripHtmlToText,
  textToHtml,
} from './literatureContentUtils'

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
    contentFormat?: 'html' | 'text' | 'mixed'
  }
}

export interface LiteratureChapter {
  id: number
  title: string
  content: string
  plainText?: string
  contentFormat?: 'html' | 'text'
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
    /^\s*SECTION\s+(\d+)\s*[:.\-]?\s*(.*?)$/im,
  ]

  private static readonly FOOTNOTE_PATTERNS = [
    /\[\d+\]/g,
    /\(\d+\)/g,
    /\*\d+/g,
    /†\d*/g,
  ]

  static async parseText(
    content: string,
    options: Partial<ParseOptions> = {},
    sourceFormat = 'txt'
  ): Promise<LiteratureWork> {
    const finalOptions: ParseOptions = {
      chapterDetection: 'auto',
      preserveFormatting: true,
      extractMetadata: true,
      ...options,
    }

    let cleaned =
      sourceFormat === 'pdf' ? cleanPdfText(content) : this.cleanText(content, finalOptions)

    const chapters = this.detectChaptersFromText(cleaned, finalOptions)
    const metadata = this.generateMetadata(
      chapters.map((c) => c.plainText || stripHtmlToText(c.content)).join(' '),
      sourceFormat
    )

    return {
      id: this.generateId(),
      title: this.extractTitle(cleaned) || 'Untitled Work',
      author: this.extractAuthor(cleaned) || 'Unknown Author',
      difficulty: 'intermediate',
      description: this.generateDescription(cleaned),
      chapters,
      metadata: {
        ...metadata,
        contentFormat: 'text',
      },
    }
  }

  static async parseEpub(
    file: File,
    options: Partial<ParseOptions> = {}
  ): Promise<LiteratureWork> {
    const zip = new JSZip()
    const zipContent = await zip.loadAsync(file)

    const opfFile = await this.findOpfFile(zipContent)
    const metadata = await this.extractEpubMetadata(zipContent, opfFile)
    const tocTitles = await this.extractEpubTocTitles(zipContent, opfFile)
    const chapters = await this.extractEpubChapters(zipContent, opfFile, tocTitles, options)

    const allText = chapters.map((c) => c.plainText || stripHtmlToText(c.content)).join(' ')

    return {
      id: this.generateId(),
      title: metadata.title || 'Untitled Work',
      author: metadata.author || 'Unknown Author',
      year: metadata.year,
      difficulty: 'intermediate',
      description:
        metadata.description || this.generateDescription(allText),
      chapters,
      metadata: {
        originalFormat: 'epub',
        parseDate: new Date().toISOString(),
        wordCount: chapters.reduce((sum, ch) => sum + ch.wordCount, 0),
        estimatedReadingTime: chapters.reduce((sum, ch) => sum + ch.estimatedReadingTime, 0),
        contentFormat: 'html',
      },
    }
  }

  static async parseHtml(
    content: string,
    options: Partial<ParseOptions> = {}
  ): Promise<LiteratureWork> {
    const finalOptions: ParseOptions = {
      chapterDetection: 'auto',
      preserveFormatting: true,
      extractMetadata: true,
      ...options,
    }

    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'text/html')

    const readability = new Readability(doc.cloneNode(true) as Document)
    const article = readability.parse()

    let title = this.extractHtmlTitle(doc)
    let author = this.extractHtmlAuthor(doc)
    let bodyHtml = ''
    let bodyText = ''

    if (article?.content && article.content.trim().length > 200) {
      bodyHtml = article.content
      bodyText = article.textContent || ''
      if (article.title) title = article.title
      if (article.byline) author = article.byline
    } else {
      const primary = this.getPrimaryHtmlElement(doc)
      bodyHtml = primary?.innerHTML || doc.body?.innerHTML || content
      bodyText = primary?.textContent || doc.body?.textContent || content
    }

    const chapters = this.detectChaptersFromHtml(bodyHtml, bodyText, finalOptions)
    const metadata = this.generateMetadata(bodyText, 'html')

    return {
      id: this.generateId(),
      title,
      author,
      difficulty: 'intermediate',
      description: this.generateDescription(bodyText),
      chapters,
      metadata: {
        ...metadata,
        contentFormat: 'html',
      },
    }
  }

  private static getPrimaryHtmlElement(doc: Document): Element | null {
    const selectors = [
      'article',
      'main',
      '[role="main"]',
      '.entry-content',
      '.post-content',
      '.article-body',
      '.post-body',
      '#article-body',
      '#content',
      '#main-content',
    ]
    for (const sel of selectors) {
      const el = doc.querySelector(sel)
      if (el && (el.textContent?.trim().length ?? 0) > 400) return el
    }
    return doc.body
  }

  private static detectChaptersFromHtml(
    html: string,
    plainText: string,
    options: ParseOptions
  ): LiteratureChapter[] {
    const parser = new DOMParser()
    const doc = parser.parseFromString(`<div id="root">${html}</div>`, 'text/html')
    const root = doc.getElementById('root')

    if (!root) {
      return this.detectChaptersFromText(plainText, options)
    }

    const headings = root.querySelectorAll('h1, h2, h3')
    const hasMultipleHeadings = headings.length >= 2

    if (hasMultipleHeadings && options.chapterDetection !== 'pageBreaks') {
      const chapters: LiteratureChapter[] = []
      let chapterNumber = 0
      let currentTitle = 'Introduction'
      let currentNodes: string[] = []

      const flush = () => {
        const joined = currentNodes.join('\n').trim()
        if (!joined) return
        chapterNumber++
        chapters.push(
          this.createChapterFromHtml(chapterNumber, currentTitle, joined)
        )
      }

      for (const child of Array.from(root.children)) {
        const tag = child.tagName.toLowerCase()
        if (['h1', 'h2', 'h3'].includes(tag)) {
          flush()
          currentTitle = child.textContent?.trim() || `Chapter ${chapterNumber + 1}`
          currentNodes = []
        } else {
          currentNodes.push(child.outerHTML)
        }
      }
      flush()

      if (chapters.length > 0) return chapters
    }

    return this.detectChaptersFromText(plainText, options)
  }

  private static detectChaptersFromText(
    content: string,
    options: ParseOptions
  ): LiteratureChapter[] {
    const textChapters = this.detectChapters(content, options)
    return textChapters.map((ch) => {
      const normalized = normalizeChapterContent(ch.content, 'text')
      return {
        ...ch,
        content: normalized.content,
        plainText: normalized.plainText,
        contentFormat: normalized.contentFormat,
        wordCount: countWords(normalized.plainText),
        estimatedReadingTime: Math.ceil(countWords(normalized.plainText) / 200),
      }
    })
  }

  private static createChapterFromHtml(
    id: number,
    title: string,
    html: string
  ): LiteratureChapter {
    const normalized = normalizeChapterContent(html, 'html')
    const wc = countWords(normalized.plainText)
    return {
      id,
      title,
      content: normalized.content,
      plainText: normalized.plainText,
      contentFormat: 'html',
      wordCount: wc,
      estimatedReadingTime: Math.ceil(wc / 200),
    }
  }

  private static extractHtmlTitle(doc: Document): string {
    const og = doc.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim()
    if (og) return og
    const tw = doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content')?.trim()
    if (tw) return tw
    const h1 = doc.querySelector('h1')?.textContent?.trim()
    if (h1 && h1.length < 300) return h1
    const t = doc.querySelector('title')?.textContent?.trim()
    return t || 'Untitled Work'
  }

  private static extractHtmlAuthor(doc: Document): string {
    const selectors = [
      'meta[name="author"]',
      'meta[property="article:author"]',
      'meta[name="DC.creator"]',
      'meta[property="book:author"]',
      '[itemprop="author"]',
    ]
    for (const sel of selectors) {
      const el = doc.querySelector(sel)
      const fromMeta = el?.getAttribute('content')?.trim()
      if (fromMeta) return fromMeta
      const text = el?.textContent?.trim()
      if (text && text.length < 200) return text
    }
    return 'Unknown Author'
  }

  private static cleanText(content: string, options: ParseOptions): string {
    let cleaned = content

    if (options.removeFootnotes) {
      this.FOOTNOTE_PATTERNS.forEach((pattern) => {
        cleaned = cleaned.replace(pattern, '')
      })
    }

    cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    if (!options.preserveFormatting) {
      cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
    }
    return cleaned.trim()
  }

  private static detectChapters(content: string, options: ParseOptions): LiteratureChapter[] {
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

      for (const pattern of this.CHAPTER_PATTERNS) {
        const match = line.match(pattern)
        if (match) {
          isChapterStart = true
          chapterTitle = match[2] ? match[2].trim() : `Chapter ${match[1]}`
          break
        }
      }

      if (isChapterStart) {
        if (currentChapter) {
          const chContent = currentChapter.content.join('\n').trim()
          if (chContent) {
            chapters.push(this.createChapter(chapterNumber, currentChapter.title, chContent))
          }
        }
        chapterNumber++
        currentChapter = { title: chapterTitle || `Chapter ${chapterNumber}`, content: [] }
      } else if (currentChapter) {
        currentChapter.content.push(line)
      } else if (chapterNumber === 0) {
        if (!currentChapter) {
          currentChapter = { title: 'Introduction', content: [] }
          chapterNumber = 1
        }
        currentChapter.content.push(line)
      }
    }

    if (currentChapter) {
      const chContent = currentChapter.content.join('\n').trim()
      if (chContent) {
        chapters.push(this.createChapter(chapterNumber, currentChapter.title, chContent))
      }
    }

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
      const endPos = nextMarker
        ? content.indexOf(nextMarker, startPos + marker.length)
        : content.length
      const chapterContent = content.substring(startPos + marker.length, endPos).trim()
      if (chapterContent) {
        chapters.push(this.createChapter(chapterNumber, marker, chapterContent))
        chapterNumber++
      }
      currentPos = endPos
    }

    return chapters.length > 0 ? chapters : [this.createChapter(1, 'Full Text', content)]
  }

  private static detectPageBreakChapters(content: string): LiteratureChapter[] {
    return content
      .split(/\f|\n\s*\n\s*\n/)
      .filter((page) => page.trim().length > 100)
      .map((page, index) => this.createChapter(index + 1, `Page ${index + 1}`, page.trim()))
  }

  private static detectHeaderChapters(content: string): LiteratureChapter[] {
    const lines = content.split('\n')
    const chapters: LiteratureChapter[] = []
    let currentChapter: { title: string; content: string[] } | null = null
    let chapterNumber = 0

    for (const line of lines) {
      const isHeader = this.isLikelyHeader(line)
      if (isHeader && line.trim().length > 0) {
        if (currentChapter) {
          const chContent = currentChapter.content.join('\n').trim()
          if (chContent) {
            chapters.push(this.createChapter(chapterNumber, currentChapter.title, chContent))
          }
        }
        chapterNumber++
        currentChapter = { title: line.trim(), content: [] }
      } else if (currentChapter) {
        currentChapter.content.push(line)
      }
    }

    if (currentChapter) {
      const chContent = currentChapter.content.join('\n').trim()
      if (chContent) {
        chapters.push(this.createChapter(chapterNumber, currentChapter.title, chContent))
      }
    }

    return chapters.length > 0 ? chapters : [this.createChapter(1, 'Full Text', content)]
  }

  private static isLikelyHeader(line: string): boolean {
    const trimmed = line.trim()
    if (trimmed.length === 0 || trimmed.length > 100) return false
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 3) return true
    if (/^\s*[IVXLCDM]+\.?\s+/.test(trimmed)) return true
    if (/^\s*\d+\.?\s+/.test(trimmed)) return true
    if (/^\s*[A-Z][a-z]+\s+[IVXLCDM]+/.test(trimmed)) return true
    return false
  }

  private static createChapter(id: number, title: string, content: string): LiteratureChapter {
    const plain = isHtmlContent(content) ? stripHtmlToText(content) : content
    const wc = countWords(plain)
    const normalized = normalizeChapterContent(content)
    return {
      id,
      title,
      content: normalized.content,
      plainText: normalized.plainText,
      contentFormat: normalized.contentFormat,
      wordCount: wc,
      estimatedReadingTime: Math.ceil(wc / 200),
    }
  }

  private static extractTitle(content: string): string | null {
    const lines = content.split('\n').slice(0, 10)
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.length > 5 && trimmed.length < 100) {
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
      const byMatch = trimmed.match(/^by\s+([A-Za-z\s.]+)$/i)
      if (byMatch) return byMatch[1].trim()
      if (/^[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(trimmed)) return trimmed
    }
    return null
  }

  private static generateDescription(content: string): string {
    const plain = isHtmlContent(content) ? stripHtmlToText(content) : content
    const words = plain.trim().split(/\s+/)
    const excerpt = words.slice(0, 50).join(' ')
    return excerpt.length < plain.length ? excerpt + '...' : excerpt
  }

  private static generateMetadata(content: string, format: string) {
    const wordCount = countWords(content)
    return {
      originalFormat: format,
      parseDate: new Date().toISOString(),
      wordCount,
      estimatedReadingTime: Math.ceil(wordCount / 200),
    }
  }

  private static generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  private static async findOpfFile(zip: JSZip): Promise<string> {
    const containerXml = await zip.file('META-INF/container.xml')?.async('text')
    if (containerXml) {
      const parser = new DOMParser()
      const doc = parser.parseFromString(containerXml, 'text/xml')
      const opfPath = doc.querySelector('rootfile')?.getAttribute('full-path')
      if (opfPath) return opfPath
    }
    const opfFiles = Object.keys(zip.files).filter((name) => name.endsWith('.opf'))
    return opfFiles[0] || ''
  }

  private static epubResolvePath(opfPath: string, href: string): string {
    const baseDir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : ''
    const combined = `${baseDir}${href}`
    const segments = combined.split('/').filter((s) => s.length > 0 && s !== '.')
    const stack: string[] = []
    for (const seg of segments) {
      if (seg === '..') stack.pop()
      else stack.push(seg)
    }
    return stack.join('/')
  }

  private static async getOrderedContentPathsFromOpf(
    zip: JSZip,
    opfPath: string
  ): Promise<string[] | null> {
    const opfContent = await zip.file(opfPath)?.async('text')
    if (!opfContent) return null

    const parser = new DOMParser()
    const doc = parser.parseFromString(opfContent, 'text/xml')

    const idToHref = new Map<string, string>()
    const all = doc.getElementsByTagName('*')
    for (let i = 0; i < all.length; i++) {
      const el = all[i]
      if (el.localName !== 'item') continue
      if (el.parentElement?.localName !== 'manifest') continue
      const id = el.getAttribute('id')
      const href = el.getAttribute('href')
      if (id && href) idToHref.set(id, href)
    }

    const paths: string[] = []
    for (let i = 0; i < all.length; i++) {
      const itemref = all[i]
      if (itemref.localName !== 'itemref') continue
      if (itemref.parentElement?.localName !== 'spine') continue
      if (itemref.getAttribute('linear') === 'no') continue
      const idref = itemref.getAttribute('idref')
      if (!idref) continue
      const href = idToHref.get(idref)
      if (!href) continue
      const zipPath = this.epubResolvePath(opfPath, href)
      let file = zip.files[zipPath]
      let resolved = zipPath
      if (!file || file.dir) {
        try {
          const decoded = decodeURIComponent(zipPath)
          if (decoded !== zipPath && zip.files[decoded] && !zip.files[decoded].dir) {
            file = zip.files[decoded]
            resolved = decoded
          }
        } catch {
          /* ignore */
        }
      }
      if (file && !file.dir) paths.push(resolved)
    }

    return paths.length > 0 ? paths : null
  }

  private static async extractEpubTocTitles(
    zip: JSZip,
    opfPath: string
  ): Promise<Map<string, string>> {
    const titles = new Map<string, string>()
    const opfContent = await zip.file(opfPath)?.async('text')
    if (!opfContent) return titles

    const parser = new DOMParser()
    const doc = parser.parseFromString(opfContent, 'text/xml')

    const idToHref = new Map<string, string>()
    const all = doc.getElementsByTagName('*')
    for (let i = 0; i < all.length; i++) {
      const el = all[i]
      if (el.localName !== 'item') continue
      if (el.parentElement?.localName !== 'manifest') continue
      const id = el.getAttribute('id')
      const href = el.getAttribute('href')
      if (id && href) idToHref.set(id, href)
    }

    let navHref: string | null = null
    let ncxHref: string | null = null
    for (let i = 0; i < all.length; i++) {
      const el = all[i]
      if (el.localName !== 'item') continue
      if (el.parentElement?.localName !== 'manifest') continue
      const props = el.getAttribute('properties') || ''
      const mediaType = el.getAttribute('media-type') || ''
      const href = el.getAttribute('href')
      if (!href) continue
      if (props.includes('nav')) navHref = this.epubResolvePath(opfPath, href)
      if (mediaType === 'application/x-dtbncx+xml') ncxHref = this.epubResolvePath(opfPath, href)
    }

    if (navHref) {
      const navContent = await zip.file(navHref)?.async('text')
      if (navContent) {
        const navDoc = parser.parseFromString(navContent, 'text/html')
        navDoc.querySelectorAll('nav a, a[href]').forEach((a) => {
          const href = a.getAttribute('href')
          const label = a.textContent?.trim()
          if (href && label) {
            const resolved = this.epubResolvePath(opfPath, href.split('#')[0])
            if (!titles.has(resolved)) titles.set(resolved, label)
          }
        })
      }
    }

    if (ncxHref && titles.size === 0) {
      const ncxContent = await zip.file(ncxHref)?.async('text')
      if (ncxContent) {
        const ncxDoc = parser.parseFromString(ncxContent, 'text/xml')
        ncxDoc.querySelectorAll('navPoint').forEach((np) => {
          const label = np.querySelector('navLabel text')?.textContent?.trim()
          const src = np.querySelector('content')?.getAttribute('src')
          if (label && src) {
            const resolved = this.epubResolvePath(opfPath, src.split('#')[0])
            if (!titles.has(resolved)) titles.set(resolved, label)
          }
        })
      }
    }

    return titles
  }

  private static async extractEpubMetadata(zip: JSZip, opfPath: string): Promise<{
    title?: string
    author?: string
    description?: string
    year?: number
  }> {
    const opfContent = await zip.file(opfPath)?.async('text')
    if (!opfContent) return {}

    const parser = new DOMParser()
    const doc = parser.parseFromString(opfContent, 'text/xml')

    const dateEl = doc.querySelector('dc\\:date, date')
    const dateStr = dateEl?.textContent

    return {
      title: doc.querySelector('dc\\:title, title')?.textContent || undefined,
      author: doc.querySelector('dc\\:creator, creator')?.textContent || undefined,
      description: doc.querySelector('dc\\:description, description')?.textContent || undefined,
      year: dateStr ? new Date(dateStr).getFullYear() : undefined,
    }
  }

  private static async extractEpubChapters(
    zip: JSZip,
    opfPath: string,
    tocTitles: Map<string, string>,
    options: Partial<ParseOptions>
  ): Promise<LiteratureChapter[]> {
    let orderedPaths = await this.getOrderedContentPathsFromOpf(zip, opfPath)
    if (!orderedPaths || orderedPaths.length === 0) {
      orderedPaths = Object.keys(zip.files)
        .filter((name) => {
          const f = zip.files[name]
          return !f.dir && (name.endsWith('.html') || name.endsWith('.xhtml') || name.endsWith('.htm'))
        })
        .sort((a, b) => a.localeCompare(b))
    }

    const chapters: LiteratureChapter[] = []
    const parser = new DOMParser()

    for (let i = 0; i < orderedPaths.length; i++) {
      const zipPath = orderedPaths[i]
      const file = zip.files[zipPath]
      const raw = await file.async('text')
      const doc = parser.parseFromString(raw, 'text/html')
      const body = doc.body
      if (!body) continue

      const textContent = body.textContent?.trim() || ''
      if (!textContent) continue

      const title =
        tocTitles.get(zipPath) ||
        doc.querySelector('h1, h2, title')?.textContent?.trim() ||
        `Chapter ${i + 1}`

      let html = body.innerHTML
      if (options.removeFootnotes) {
        body.querySelectorAll('aside, .footnote, [epub\\:type="footnote"]').forEach((el) => el.remove())
        html = body.innerHTML
      }

      chapters.push(this.createChapterFromHtml(i + 1, title, html))
    }

    return chapters
  }

  /** Merge, split, rename, or delete chapters during import review. */
  static mergeChapters(chapters: LiteratureChapter[], indices: number[]): LiteratureChapter[] {
    if (indices.length < 2) return chapters
    const sorted = [...indices].sort((a, b) => a - b)
    const first = sorted[0]
    const toMerge = sorted.map((i) => chapters[i])
    const mergedContent = toMerge.map((c) => c.content).join('\n')
    const mergedTitle = toMerge[0].title
    const merged = this.createChapterFromHtml(first + 1, mergedTitle, mergedContent)

    const result = chapters.filter((_, i) => !sorted.includes(i))
    result.splice(first, 0, merged)
    return result.map((ch, i) => ({ ...ch, id: i + 1 }))
  }

  static splitChapterAt(
    chapters: LiteratureChapter[],
    chapterIndex: number,
    splitPlainOffset: number
  ): LiteratureChapter[] {
    const ch = chapters[chapterIndex]
    if (!ch) return chapters

    const plain = ch.plainText || stripHtmlToText(ch.content)
    const part1 = plain.slice(0, splitPlainOffset).trim()
    const part2 = plain.slice(splitPlainOffset).trim()
    if (!part1 || !part2) return chapters

    const newChapters = [...chapters]
    const first = this.createChapterFromHtml(ch.id, ch.title, textToHtml(part1))
    const second = this.createChapterFromHtml(ch.id + 1, `${ch.title} (continued)`, textToHtml(part2))
    newChapters.splice(chapterIndex, 1, first, second)
    return newChapters.map((c, i) => ({ ...c, id: i + 1 }))
  }

  static renameChapter(
    chapters: LiteratureChapter[],
    chapterIndex: number,
    newTitle: string
  ): LiteratureChapter[] {
    return chapters.map((ch, i) =>
      i === chapterIndex ? { ...ch, title: newTitle } : ch
    )
  }

  static deleteChapter(chapters: LiteratureChapter[], chapterIndex: number): LiteratureChapter[] {
    if (chapters.length <= 1) return chapters
    return chapters
      .filter((_, i) => i !== chapterIndex)
      .map((ch, i) => ({ ...ch, id: i + 1 }))
  }

  static recalculateWorkMetadata(work: LiteratureWork): LiteratureWork {
    const wordCount = work.chapters.reduce((sum, ch) => sum + ch.wordCount, 0)
    const estimatedReadingTime = work.chapters.reduce((sum, ch) => sum + ch.estimatedReadingTime, 0)
    return {
      ...work,
      metadata: {
        originalFormat: work.metadata?.originalFormat || 'unknown',
        parseDate: work.metadata?.parseDate || new Date().toISOString(),
        wordCount,
        estimatedReadingTime,
        contentFormat: work.metadata?.contentFormat,
      },
    }
  }
}
