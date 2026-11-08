import { describe, expect, it } from 'vitest'
import { libraryViewState, normalizeWorkSummary, summarizeListedWork } from './catalog'
import { missingPublicSupabaseResponse, publicSupabaseConfigError } from '../supabaseRouteAuth'

describe('public Supabase config', () => {
  it('names the missing public variable and does not require a service key', () => {
    expect(publicSupabaseConfigError({ url: '  ', anonKey: '' })).toMatch(/NEXT_PUBLIC_SUPABASE_URL/)
    expect(publicSupabaseConfigError({ url: 'https://example.supabase.co', anonKey: '' })).toMatch(/ANON_KEY/)
    expect(publicSupabaseConfigError({ url: 'https://example.supabase.co', anonKey: 'anon' })).toBeNull()
    expect(missingPublicSupabaseResponse({ url: '', anonKey: '' })).toMatchObject({
      code: 'SUPABASE_NOT_CONFIGURED',
    })
    expect(missingPublicSupabaseResponse({ url: 'https://example.supabase.co', anonKey: 'anon' })).toBeNull()
  })
})

describe('catalog summaries', () => {
  it('marks an empty shell incomplete even when stored metadata claims a word count', () => {
    const summary = summarizeListedWork({
      id: 'shell',
      title: 'Institutes shell',
      description: 'A systematic theology.',
      year_published: 1536,
      created_at: '2026-09-07T00:00:00.000Z',
      content: JSON.stringify({
        title: 'Institutes shell',
        author: 'John Calvin',
        difficulty: 'advanced',
        chapters: [{ id: 1, title: 'Book I', content: '  ' }],
        metadata: { wordCount: 450000, estimatedReadingTime: 1800 },
      }),
    })
    expect(summary.textStatus).toBe('incomplete')
    expect(summary.wordCount).toBe(0)
    expect(summary.author).toBe('John Calvin')
    expect(summary.chapterCount).toBe(1)
  })

  it('marks a month-by-month work with missing months incomplete', () => {
    const summary = summarizeListedWork({
      id: 'checkbook',
      title: "Faith's Checkbook",
      description: 'A year’s daily promises with brief comments.',
      content: {
        author: 'Charles Spurgeon',
        chapters: ['January', 'February', 'August', 'October'].map((title, index) => ({
          id: index + 1,
          title,
          content: `${title} still has a devotion on the page.`,
        })),
      },
    })
    expect(summary.textStatus).toBe('incomplete')
    expect(summary.wordCount).toBeGreaterThan(0)
  })

  it('does not call a described incomplete work complete', () => {
    const summary = summarizeListedWork({
      id: 'checkbook',
      title: "Faith's Checkbook",
      description: 'This copy is incomplete.',
      content: {
        author: 'Charles Spurgeon',
        chapters: [{ id: 1, title: 'January 1', content: 'A short devotion for the morning.' }],
      },
    })
    expect(summary.textStatus).toBe('incomplete')
    expect(summary.wordCount).toBeGreaterThan(0)
  })

  it('accepts the older nested list payload and the flat payload', () => {
    const nested = normalizeWorkSummary({
      id: 'nested',
      title: 'Nested',
      author: 'Author',
      description: 'A finished essay.',
      difficulty: 'beginner',
      metadata: { wordCount: 400, chapterCount: 2, estimatedReadingTime: 2, dateAdded: '2026-09-07T00:00:00.000Z' },
    })
    expect(nested?.wordCount).toBe(400)
    expect(nested?.chapterCount).toBe(2)
    expect(nested?.textStatus).toBe('ready')

    const flat = normalizeWorkSummary({
      id: 'flat',
      title: 'Flat',
      author: 'Author',
      description: 'Ready',
      difficulty: 'intermediate',
      wordCount: 800,
      chapterCount: 4,
      estimatedReadingTime: 4,
      dateAdded: '2026-09-07T00:00:00.000Z',
      textStatus: 'ready',
    })
    expect(flat?.estimatedReadingTime).toBe(4)
  })
})

describe('library view states', () => {
  it('does not blame filters when the catalog request fails', () => {
    const configured = libraryViewState({
      status: 'error',
      code: 'SUPABASE_NOT_CONFIGURED',
      works: [],
      filtered: [],
    })
    const failed = libraryViewState({
      status: 'error',
      code: 'LIBRARY_REQUEST_FAILED',
      works: [],
      filtered: [],
    })
    expect(configured.kind).toBe('error')
    expect(configured.message.toLowerCase()).not.toContain('filter')
    expect(configured.message).toMatch(/not configured/i)
    expect(failed.kind).toBe('error')
    expect(failed.message.toLowerCase()).not.toContain('filter')
    expect(failed.message).toMatch(/could not be loaded/i)
  })

  it('separates an empty catalog from a search that matches nothing', () => {
    expect(libraryViewState({ status: 'ready', works: [], filtered: [] }).kind).toBe('empty-catalog')
    const filtered = libraryViewState({
      status: 'ready',
      works: [{ id: '1' }],
      filtered: [],
    })
    expect(filtered.kind).toBe('empty-filters')
    expect(filtered.message.toLowerCase()).toContain('filter')
    expect(libraryViewState({ status: 'loading', works: [], filtered: [] }).kind).toBe('loading')
  })
})
