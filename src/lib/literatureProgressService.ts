import { supabase } from '@/lib/supabase'
import {
  GUEST_BOOKMARKS_KEY,
  GUEST_HIGHLIGHTS_KEY,
  GUEST_PROGRESS_KEY,
} from '@/lib/readerPreferences'

export interface LiteratureProgress {
  workId: string
  chapterIndex: number
  positionAnchor: number
  percent: number
  lastReadAt: string
}

export interface LiteratureBookmark {
  id: string
  workId: string
  chapterIndex: number
  positionAnchor: number
  label?: string
  excerpt?: string
  createdAt: string
}

export interface LiteratureHighlight {
  id: string
  workId: string
  chapterIndex: number
  startAnchor: number
  endAnchor: number
  color: string
  note?: string
  excerpt?: string
  createdAt: string
}

function readGuestJson<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeGuestJson<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(data))
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return {}
  return { Authorization: `Bearer ${session.access_token}` }
}

export const literatureProgressService = {
  async getProgress(workId: string): Promise<LiteratureProgress | null> {
    const headers = await getAuthHeaders()
    if (!headers.Authorization) {
      const all = readGuestJson<LiteratureProgress>(GUEST_PROGRESS_KEY)
      return all.find((p) => p.workId === workId) ?? null
    }

    const res = await fetch(`/api/literature/progress?workId=${encodeURIComponent(workId)}`, {
      headers,
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.progress ?? null
  },

  async getAllProgress(): Promise<LiteratureProgress[]> {
    const headers = await getAuthHeaders()
    if (!headers.Authorization) {
      return readGuestJson<LiteratureProgress>(GUEST_PROGRESS_KEY)
    }

    const res = await fetch('/api/literature/progress', { headers })
    if (!res.ok) return []
    const data = await res.json()
    return data.progress ?? []
  },

  async saveProgress(progress: Omit<LiteratureProgress, 'lastReadAt'>): Promise<void> {
    const headers = await getAuthHeaders()
    const payload = { ...progress, lastReadAt: new Date().toISOString() }

    if (!headers.Authorization) {
      const all = readGuestJson<LiteratureProgress>(GUEST_PROGRESS_KEY)
      const idx = all.findIndex((p) => p.workId === progress.workId)
      if (idx >= 0) all[idx] = payload
      else all.push(payload)
      writeGuestJson(GUEST_PROGRESS_KEY, all)
      return
    }

    await fetch('/api/literature/progress', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  },

  async getBookmarks(workId: string): Promise<LiteratureBookmark[]> {
    const headers = await getAuthHeaders()
    if (!headers.Authorization) {
      return readGuestJson<LiteratureBookmark>(GUEST_BOOKMARKS_KEY).filter(
        (b) => b.workId === workId
      )
    }

    const res = await fetch(
      `/api/literature/bookmarks?workId=${encodeURIComponent(workId)}`,
      { headers }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.bookmarks ?? []
  },

  async addBookmark(
    bookmark: Omit<LiteratureBookmark, 'id' | 'createdAt'>
  ): Promise<LiteratureBookmark> {
    const headers = await getAuthHeaders()
    const created: LiteratureBookmark = {
      ...bookmark,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }

    if (!headers.Authorization) {
      const all = readGuestJson<LiteratureBookmark>(GUEST_BOOKMARKS_KEY)
      all.push(created)
      writeGuestJson(GUEST_BOOKMARKS_KEY, all)
      return created
    }

    const res = await fetch('/api/literature/bookmarks', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(bookmark),
    })
    const data = await res.json()
    return data.bookmark ?? created
  },

  async deleteBookmark(id: string): Promise<void> {
    const headers = await getAuthHeaders()
    if (!headers.Authorization) {
      const all = readGuestJson<LiteratureBookmark>(GUEST_BOOKMARKS_KEY).filter(
        (b) => b.id !== id
      )
      writeGuestJson(GUEST_BOOKMARKS_KEY, all)
      return
    }

    await fetch('/api/literature/bookmarks', {
      method: 'DELETE',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  },

  async getHighlights(workId: string): Promise<LiteratureHighlight[]> {
    const headers = await getAuthHeaders()
    if (!headers.Authorization) {
      return readGuestJson<LiteratureHighlight>(GUEST_HIGHLIGHTS_KEY).filter(
        (h) => h.workId === workId
      )
    }

    const res = await fetch(
      `/api/literature/highlights?workId=${encodeURIComponent(workId)}`,
      { headers }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.highlights ?? []
  },

  async addHighlight(
    highlight: Omit<LiteratureHighlight, 'id' | 'createdAt'>
  ): Promise<LiteratureHighlight> {
    const headers = await getAuthHeaders()
    const created: LiteratureHighlight = {
      ...highlight,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }

    if (!headers.Authorization) {
      const all = readGuestJson<LiteratureHighlight>(GUEST_HIGHLIGHTS_KEY)
      all.push(created)
      writeGuestJson(GUEST_HIGHLIGHTS_KEY, all)
      return created
    }

    const res = await fetch('/api/literature/highlights', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(highlight),
    })
    const data = await res.json()
    return data.highlight ?? created
  },

  async deleteHighlight(id: string): Promise<void> {
    const headers = await getAuthHeaders()
    if (!headers.Authorization) {
      const all = readGuestJson<LiteratureHighlight>(GUEST_HIGHLIGHTS_KEY).filter(
        (h) => h.id !== id
      )
      writeGuestJson(GUEST_HIGHLIGHTS_KEY, all)
      return
    }

    await fetch('/api/literature/highlights', {
      method: 'DELETE',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  },
}
