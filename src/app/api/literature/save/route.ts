import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { LiteratureWork } from '@/lib/literatureParser'

export async function POST(request: NextRequest) {
  try {
    const { work } = await request.json()
    
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
      const authorSlug = literatureWork.author.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
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
          { error: 'Failed to create author' },
          { status: 500 }
        )
      }
      authorId = newAuthor.id
    }

    // Create or update the work
    const workSlug = literatureWork.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    
    // First check if a work with this title and author already exists
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
          title: literatureWork.title,
          slug: workSlug,
          description: literatureWork.description || '',
          content_type: 'book',
          year_published: literatureWork.year || null,
          is_available: true,
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
      // Create new work (let database generate ID)
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
          content: JSON.stringify(literatureWork)
        })
        .select()
        .single()

      if (workError) {
        console.error('Error creating work:', workError)
        return NextResponse.json(
          { error: 'Failed to create literature work' },
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