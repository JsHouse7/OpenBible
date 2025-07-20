import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { LiteratureWork } from '@/lib/literatureParser'

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}

export async function POST(request: NextRequest) {
  console.log('Received request to /api/literature/save');
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
  }

  const token = authHeader.substring(7)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json();
    console.log('Request body:', body);
    const { work } = body;
    
    if (!work) {
      return NextResponse.json(
        { error: 'Literature work data is required' },
        { status: 400 }
      )
    }

    const literatureWork: LiteratureWork = work

    // First, check if author exists or create new one
    let authorId: string
    const { data: existingAuthor } = await supabase
      .from('authors')
      .select('id')
      .eq('name', literatureWork.author)
      .single()

    if (existingAuthor) {
      authorId = existingAuthor.id
    } else {
      // Create new author
      if (!literatureWork.author) {
        return NextResponse.json(
          { error: 'Author name is required' },
          { status: 400 }
        )
      }
      const authorSlug = slugify(literatureWork.author)
      const { data: newAuthor, error: authorError } = await supabase
        .from('authors')
        .insert({
          name: literatureWork.author,
          slug: authorSlug,
          bio: null,
          birth_year: null,
          death_year: null,
          traditions: [],
          era: null,
          image_url: null
        })
        .select('id')
        .single()

      if (authorError || !newAuthor) {
        console.error('Error creating author:', authorError)
        return NextResponse.json(
          { 
            error: 'Failed to create author',
            details: authorError?.message
          },
          { status: 500 }
        )
      }
      authorId = newAuthor.id
    }

    // Create or update the work
    const { data: existingWork } = await supabase
      .from('works')
      .select('id')
      .eq('title', literatureWork.title)
      .eq('author_id', authorId)
      .single()

    let savedWork
    if (existingWork) {
      // Update existing work
      const { data, error: workError } = await supabase
        .from('works')
        .update({
          description: literatureWork.description || '',
          content_type: 'book',
          year_published: literatureWork.year || null,
          is_available: true,
          word_count: literatureWork.wordCount,
          chapter_count: literatureWork.chapterCount,
          estimated_reading_time: literatureWork.estimatedReadingTime,
          content: JSON.stringify(literatureWork)
        })
        .eq('id', existingWork.id)
        .select()
        .single()

      if (workError) {
        console.error('Error updating work:', workError)
        return NextResponse.json(
          { error: 'Failed to update literature work' },
          { status: 500 }
        )
      }
      savedWork = data
    } else {
      // Create new work
      if (!literatureWork.title) {
        return NextResponse.json({ error: 'Work title is required' }, { status: 400 });
      }
      const workSlug = slugify(literatureWork.title)
      
      const { data, error: workError } = await supabase
        .from('works')
        .insert({
          author_id: authorId,
          title: literatureWork.title,
          slug: workSlug,
          description: literatureWork.description || '',
          content_type: 'book',
          year_published: literatureWork.year || null,
          is_available: true,
          word_count: literatureWork.wordCount,
          chapter_count: literatureWork.chapterCount,
          estimated_reading_time: literatureWork.estimatedReadingTime,
          content: JSON.stringify(literatureWork)
        })
        .select()
        .single()

      if (workError) {
        console.error('Error creating work:', workError)
        return NextResponse.json(
          { 
            error: 'Failed to create literature work',
            details: workError.message 
          },
          { status: 500 }
        )
      }
      savedWork = data
    }

    return NextResponse.json(
      { 
        message: 'Literature work saved successfully', 
        work: savedWork,
        author_id: authorId
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error saving literature work:', error)
    return NextResponse.json(
      { error: 'Failed to save literature work' },
      { status: 500 }
    )
  }
}