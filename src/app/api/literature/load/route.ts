import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workId = searchParams.get('id')
    
    if (!workId) {
      return NextResponse.json(
        { error: 'Work ID is required' },
        { status: 400 }
      )
    }

    // Get the work from database
    const { data: work, error } = await supabase
      .from('works')
      .select(`
        *,
        authors (
          name,
          slug,
          bio,
          birth_year,
          death_year,
          traditions,
          era,
          image_url
        )
      `)
      .eq('id', workId)
      .single()

    if (error || !work) {
      console.error('Error loading work:', error)
      return NextResponse.json(
        { error: 'Work not found' },
        { status: 404 }
      )
    }

    // Parse the content back to LiteratureWork format
    let literatureWork
    try {
      literatureWork = JSON.parse(work.content)
    } catch (parseError) {
      console.error('Error parsing work content:', parseError)
      return NextResponse.json(
        { error: 'Invalid work content format' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { work: literatureWork },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error loading literature work:', error)
    return NextResponse.json(
      { error: 'Failed to load literature work' },
      { status: 500 }
    )
  }
}