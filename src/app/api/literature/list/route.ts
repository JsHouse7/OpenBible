import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/** GET responses must not be cached or the library can stay empty after new uploads (CDN / Next data cache). */
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl?.trim() || !supabaseKey?.trim()) {
      console.error('API: literature/list missing Supabase env')
      return NextResponse.json(
        { error: 'Server configuration error', works: [] },
        { status: 503 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    let works: any[] | null = null
    let listError: { message: string; code?: string } | null = null

    const withEmbed = await supabase
      .from('works')
      .select(
        'id, title, slug, description, content, year_published, created_at, author_id, authors ( name )'
      )
      .order('created_at', { ascending: false })

    if (withEmbed.error) {
      console.warn(
        'API: literature/list embed authors failed, retrying without join:',
        withEmbed.error.message
      )
      const plain = await supabase
        .from('works')
        .select(
          'id, title, slug, description, content, year_published, created_at, author_id'
        )
        .order('created_at', { ascending: false })
      works = plain.data
      listError = plain.error
    } else {
      works = withEmbed.data
    }

    if (listError) {
      console.error('API: Error fetching works list:', listError)
      return NextResponse.json({ error: 'Failed to fetch works' }, { status: 500 })
    }

    const authorNameFromRow = (w: any): string | null => {
      const a = w.authors
      if (!a) return null
      if (typeof a === 'object' && a !== null && 'name' in a && typeof (a as { name: string }).name === 'string') {
        return (a as { name: string }).name
      }
      return null
    }

    const transformed = (works || []).map((w: any) => {
      let parsed: any = null
      try {
        if (typeof w.content === 'string') {
          parsed = JSON.parse(w.content)
        } else if (w.content && typeof w.content === 'object') {
          parsed = w.content
        }
      } catch {
        parsed = null
      }

      const chapters = Array.isArray(parsed?.chapters) ? parsed.chapters : []
      const wordCount =
        parsed?.metadata?.wordCount ??
        chapters.reduce((sum: number, c: any) => sum + (c?.wordCount || 0), 0)
      const chapterCount = parsed?.metadata?.chapterCount ?? chapters.length
      const estimatedReadingTime =
        parsed?.metadata?.estimatedReadingTime ??
        (wordCount ? Math.ceil(wordCount / 200) : 0)

      const diff = parsed?.difficulty ?? parsed?.metadata?.difficulty ?? 'intermediate'
      const difficulty =
        diff === 'beginner' || diff === 'intermediate' || diff === 'advanced'
          ? diff
          : 'intermediate'

      const yearRaw = parsed?.year ?? w.year_published ?? null
      const yearNum =
        yearRaw === null || yearRaw === undefined ? undefined : Number(yearRaw)
      const year =
        yearNum !== undefined && Number.isFinite(yearNum) ? yearNum : undefined

      const author =
        (typeof parsed?.author === 'string' && parsed.author.trim()
          ? parsed.author
          : null) ||
        authorNameFromRow(w) ||
        'Unknown Author'

      return {
        id: w.id,
        title: parsed?.title || w.title || 'Untitled',
        author,
        description: (parsed?.description ?? w.description) || '',
        year,
        difficulty,
        wordCount,
        chapterCount,
        estimatedReadingTime,
        filename: `${w.slug || 'work'}.json`,
        dateAdded: parsed?.metadata?.parseDate ?? parsed?.metadata?.dateAdded ?? w.created_at,
      }
    })

    return NextResponse.json(
      { works: transformed },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    )
  } catch (error) {
    console.error('API: Error in /api/literature/list:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}