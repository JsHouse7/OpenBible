export interface CatalogWorkSummary {
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
  textStatus: 'ready' | 'incomplete'
}

export class LiteratureLibraryError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status: number, code: string) {
    super(message)
    this.name = 'LiteratureLibraryError'
    this.status = status
    this.code = code
  }
}

const INCOMPLETE_TEXT = /\bincomplete\b/i
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']

function describedAsIncomplete(title: string, description: string) {
  return INCOMPLETE_TEXT.test(`${title} ${description}`)
}

function hasMonthGap(chapters: Array<{ title?: unknown }>) {
  const titles = chapters.map((chapter) => String(chapter?.title || '').toLowerCase())
  const present = MONTHS.filter((month) => titles.some((title) => title.includes(month)))
  return present.length >= 4 && present.length < 12
}

export interface ListedWorkRow {
  id: string
  title?: string | null
  description?: string | null
  year_published?: number | null
  created_at?: string | null
  content?: unknown
}

function difficultyOf(value: unknown): CatalogWorkSummary['difficulty'] {
  if (value === 'beginner' || value === 'intermediate' || value === 'advanced') return value
  return 'intermediate'
}

function numberOr(value: unknown, fallback: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof fallback === 'number' && Number.isFinite(fallback)) return fallback
  return 0
}

function parsedContent(content: unknown): Record<string, any> | null {
  if (!content) return null
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content) as unknown
      return parsed && typeof parsed === 'object' ? parsed as Record<string, any> : null
    } catch {
      return null
    }
  }
  return typeof content === 'object' ? content as Record<string, any> : null
}

export function summarizeListedWork(row: ListedWorkRow): CatalogWorkSummary {
  const parsed = parsedContent(row.content)
  const chapters = Array.isArray(parsed?.chapters) ? parsed.chapters : []
  const texts = chapters.map((chapter: { content?: unknown }) => (typeof chapter?.content === 'string' ? chapter.content : ''))
  const hasText = texts.some((text: string) => text.trim().length > 0)
  const wordCount = hasText ? texts.join(' ').trim().split(/\s+/).filter(Boolean).length : 0
  const description = String(parsed?.description ?? row.description ?? '')
  const title = String(parsed?.title || row.title || 'Untitled')
  const metadata = parsed?.metadata && typeof parsed.metadata === 'object' ? parsed.metadata : {}
  const markedIncomplete = metadata.incomplete === true || metadata.complete === false || metadata.status === 'incomplete'
  const textStatus: CatalogWorkSummary['textStatus'] =
    !hasText || markedIncomplete || describedAsIncomplete(title, description) || hasMonthGap(chapters) ? 'incomplete' : 'ready'

  return {
    id: row.id,
    title,
    author: String(parsed?.author || 'Unknown Author'),
    description,
    year: typeof parsed?.year === 'number' ? parsed.year : row.year_published ?? undefined,
    difficulty: difficultyOf(parsed?.difficulty ?? metadata.difficulty),
    wordCount,
    chapterCount: chapters.length,
    estimatedReadingTime: wordCount ? Math.max(1, Math.round(wordCount / 200)) : 0,
    filename: typeof parsed?.filename === 'string' ? parsed.filename : '',
    dateAdded: String(metadata.dateAdded ?? row.created_at ?? ''),
    textStatus,
  }
}

export function normalizeWorkSummary(raw: unknown): CatalogWorkSummary | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, any>
  if (typeof record.id !== 'string' || typeof record.title !== 'string') return null
  const metadata = record.metadata && typeof record.metadata === 'object' ? record.metadata : {}
  const description = String(record.description ?? '')
  const wordCount = numberOr(record.wordCount, metadata.wordCount)
  const explicit = record.textStatus === 'ready' || record.textStatus === 'incomplete' ? record.textStatus : null
  const textStatus: CatalogWorkSummary['textStatus'] = explicit
    ?? (INCOMPLETE_TEXT.test(`${record.title} ${description}`) || wordCount === 0 ? 'incomplete' : 'ready')

  return {
    id: record.id,
    title: record.title,
    author: String(record.author || 'Unknown Author'),
    description,
    year: typeof record.year === 'number' ? record.year : undefined,
    difficulty: difficultyOf(record.difficulty),
    wordCount,
    chapterCount: numberOr(record.chapterCount, metadata.chapterCount),
    estimatedReadingTime: numberOr(record.estimatedReadingTime, metadata.estimatedReadingTime),
    filename: typeof record.filename === 'string' ? record.filename : '',
    dateAdded: String(record.dateAdded ?? metadata.dateAdded ?? ''),
    textStatus,
  }
}

export function libraryViewState(input: {
  status: 'loading' | 'error' | 'ready'
  code?: string
  works: unknown[]
  filtered: unknown[]
}): { kind: 'loading' | 'error' | 'empty-catalog' | 'empty-filters' | 'list'; message: string } {
  if (input.status === 'loading') return { kind: 'loading', message: '' }
  if (input.status === 'error') {
    if (input.code === 'SUPABASE_NOT_CONFIGURED') {
      return {
        kind: 'error',
        message: 'The literature library is not configured on this server. Set the public Supabase URL and anon key, then try again.',
      }
    }
    return {
      kind: 'error',
      message: 'The literature library could not be loaded. Trying again is the next step.',
    }
  }
  if (input.works.length === 0) {
    return { kind: 'empty-catalog', message: 'No works are in the catalog yet.' }
  }
  if (input.filtered.length === 0) {
    return { kind: 'empty-filters', message: 'Nothing matches these filters.' }
  }
  return { kind: 'list', message: '' }
}
