import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'Work ID is required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Fetch work by id
    const { data: work, error: workError } = await supabase
      .from('works')
      .select('id, title, slug, description, content, year_published, created_at, author_id')
      .eq('id', id)
      .single()

    if (workError || !work) {
      console.error('API: Error fetching work:', workError)
      return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    }

    // Resolve author name if available
    let authorName: string | null = null
    if (work.author_id) {
      const { data: authorRow } = await supabase
        .from('authors')
        .select('name')
        .eq('id', work.author_id)
        .single()
      authorName = authorRow?.name ?? null
    }

    // Parse stored JSON content and normalize to expected shape
    let parsed: any = null
    try {
      if (typeof work.content === 'string') {
        parsed = JSON.parse(work.content)
      } else if (work.content && typeof work.content === 'object') {
        parsed = work.content
      }
    } catch {
      parsed = null
    }

    const chapters = Array.isArray(parsed?.chapters) ? parsed.chapters : []
    const wordCount = parsed?.metadata?.wordCount ?? chapters.reduce((sum: number, c: any) => sum + (c?.wordCount || 0), 0)
    const chapterCount = parsed?.metadata?.chapterCount ?? chapters.length
    const estimatedReadingTime = parsed?.metadata?.estimatedReadingTime ?? (wordCount ? Math.round(wordCount / 200) : 0)

    const transformedWork = {
      id: work.id,
      title: parsed?.title || work.title,
      author: authorName || parsed?.author || 'Unknown Author',
      year: parsed?.year ?? work.year_published ?? null,
      difficulty: parsed?.difficulty ?? parsed?.metadata?.difficulty ?? 'intermediate',
      description: (parsed?.description ?? work.description) || '',
      chapters,
      metadata: {
        wordCount,
        chapterCount,
        estimatedReadingTime,
        dateAdded: parsed?.metadata?.dateAdded ?? work.created_at
      }
    }

    console.log('API: Successfully loaded work:', transformedWork.title)
    return NextResponse.json({ work: transformedWork })
  } catch (error) {
    console.error('API: Error in /api/literature/load:', error)
    return NextResponse.json({ error: 'Failed to load work' }, { status: 500 })
  }
}