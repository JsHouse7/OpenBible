import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Work ID is required' }, { status: 400 })
    }

    console.log('API: Loading work with ID:', id)

    // Get work details with authors
    const { data: work, error: workError } = await supabase
      .from('literature_works')
      .select(`
        *,
        work_authors!inner(
          authors(name)
        )
      `)
      .eq('id', id)
      .single()

    if (workError) {
      console.error('API: Error fetching work:', workError)
      return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    }

    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    }

    // Transform the data to match expected format
    const transformedWork = {
      id: work.id,
      title: work.title,
      author: work.work_authors.map((wa: any) => wa.authors.name).join(', '),
      year: work.year,
      difficulty: work.difficulty,
      description: work.description,
      content: work.content,
      chapters: work.chapters || [],
      metadata: {
        wordCount: work.word_count,
        chapterCount: work.chapter_count,
        dateAdded: work.created_at
      }
    }

    console.log('API: Successfully loaded work:', transformedWork.title)
    return NextResponse.json(transformedWork)

  } catch (error) {
    console.error('API: Error in load route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}