import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: works, error } = await supabase
      .from('works')
      .select('id, title, slug, description, content, year_published, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('API: Error fetching works list:', error)
      return NextResponse.json({ error: 'Failed to fetch works' }, { status: 500 })
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
      const wordCount = parsed?.metadata?.wordCount ?? chapters.reduce((sum: number, c: any) => sum + (c?.wordCount || 0), 0)
      const chapterCount = parsed?.metadata?.chapterCount ?? chapters.length
      const estimatedReadingTime = parsed?.metadata?.estimatedReadingTime ?? (wordCount ? Math.round(wordCount / 200) : 0)

      return {
        id: w.id,
        title: parsed?.title || w.title,
        author: parsed?.author || 'Unknown Author',
        description: (parsed?.description ?? w.description) || '',
        year: parsed?.year ?? w.year_published ?? null,
        difficulty: parsed?.difficulty ?? parsed?.metadata?.difficulty ?? 'intermediate',
        metadata: {
          wordCount,
          chapterCount,
          estimatedReadingTime,
          dateAdded: parsed?.metadata?.dateAdded ?? w.created_at
        }
      }
    })

    return NextResponse.json({ works: transformed })
  } catch (error) {
    console.error('API: Error in /api/literature/list:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}