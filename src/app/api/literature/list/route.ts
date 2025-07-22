// Trigger Vercel deployment
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('API: Starting to fetch works from database...')
    const { data: works, error } = await supabase
      .from('works')
      .select(`
        id,
        title,
        slug,
        description,
        content_type,
        year_published,
        is_available,
        content,
        created_at,
        authors (
          id,
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
      .eq('is_available', true)
      .order('title')
    
    console.log('API: Database query completed')
    console.log('API: Error:', error)
    console.log('API: Number of works returned:', works?.length || 0)
    console.log('API: Works data:', works?.map(w => ({ id: w.id, title: w.title, is_available: w.is_available })))

    if (error) {
      console.error('Error loading works:', error)
      return NextResponse.json(
        { error: 'Failed to load literature works' },
        { status: 500 }
      )
    }

    // Transform to the expected format
    const literatureIndex = works.map((work: {
      id: string;
      title: string;
      authors?: {
        name: string;
        slug: string;
      };
      description: string | null;
      year_published: number;
      slug: string;
      created_at: string;
    }) => ({
      id: work.id,
      title: work.title,
      author: work.authors?.name || 'Unknown Author',
      description: work.description || '',
      year: work.year_published,
      filename: `${work.id}.json`, // For compatibility
      slug: work.slug,
      authorSlug: work.authors?.slug || 'unknown',
      created_at: work.created_at,
      // Add missing fields required by the LiteratureLibrary component
      difficulty: 'intermediate', // Default difficulty
      wordCount: 5000, // Default word count
      chapterCount: 1, // Default chapter count
      estimatedReadingTime: 25, // Default reading time in minutes
      dateAdded: work.created_at // Use created_at as dateAdded
    }))

    return NextResponse.json(
      { works: literatureIndex },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error loading literature works:', error)
    return NextResponse.json(
      { error: 'Failed to load literature works' },
      { status: 500 }
    )
  }
}