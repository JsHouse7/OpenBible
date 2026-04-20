import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { LiteratureWork } from '@/lib/literatureParser'
import { toSlug } from '@/lib/textSlug'

export async function POST(request: NextRequest) {
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
    const { work } = body;
    
    if (!work) {
      return NextResponse.json(
        { error: 'Literature work data is required' },
        { status: 400 }
      )
    }

    const literatureWork: LiteratureWork = work

    // Resolve author: prefer first match when duplicate names exist (.limit(1), not .single())
    let authorId: string
    const { data: authorRows, error: authorLookupError } = await supabase
      .from('authors')
      .select('id')
      .eq('name', literatureWork.author)
      .limit(1)

    if (authorLookupError) {
      console.error('Author lookup failed:', authorLookupError)
      return NextResponse.json({ error: 'Failed to look up author' }, { status: 500 })
    }

    if (authorRows?.[0]?.id) {
      authorId = authorRows[0].id
    } else {
      // Create new author
      if (!literatureWork.author) {
        return NextResponse.json(
          { error: 'Author name is required' },
          { status: 400 }
        )
      }
      const authorSlug = toSlug(literatureWork.author)
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

    // Existing work by (title + author): at most one row (.limit(1))
    const { data: workRows, error: workLookupError } = await supabase
      .from('works')
      .select('id')
      .eq('title', literatureWork.title)
      .eq('author_id', authorId)
      .limit(1)

    if (workLookupError) {
      console.error('Work lookup failed:', workLookupError)
      return NextResponse.json({ error: 'Failed to look up work' }, { status: 500 })
    }

    const existingWorkId = workRows?.[0]?.id

    let savedWork
    if (existingWorkId) {
      const mergedWork: LiteratureWork = { ...literatureWork, id: existingWorkId }
      const { data, error: workError } = await supabase
        .from('works')
        .update({
          description: literatureWork.description || '',
          content_type: 'book',
          year_published: literatureWork.year || null,
          is_available: true,
          content: JSON.stringify(mergedWork),
        })
        .eq('id', existingWorkId)
        .select()
        .single()

      if (workError) {
        console.error('Error updating work:', workError)
        const forbidden =
          workError.code === '42501' ||
          workError.message?.toLowerCase().includes('policy') ||
          workError.message?.toLowerCase().includes('permission')
        return NextResponse.json(
          { error: forbidden ? 'Not allowed to update this work' : 'Failed to update literature work' },
          { status: forbidden ? 403 : 500 }
        )
      }
      savedWork = data
    } else {
      // Create new work
      if (!literatureWork.title) {
        return NextResponse.json({ error: 'Work title is required' }, { status: 400 });
      }
      const workSlug = toSlug(literatureWork.title)
      
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
          content: JSON.stringify(literatureWork),
          owner_user_id: user.id,
        })
        .select()
        .single()

      if (workError) {
        console.error('Error creating work:', workError)
        return NextResponse.json(
          {
            error: 'Failed to create literature work',
            details: workError.message,
          },
          { status: 500 }
        )
      }
      savedWork = data

      // Align stored JSON `id` with database row UUID (parser id is client-generated before insert)
      const mergedWork: LiteratureWork = { ...literatureWork, id: data.id }
      const { error: syncError } = await supabase
        .from('works')
        .update({ content: JSON.stringify(mergedWork) })
        .eq('id', data.id)

      if (syncError) {
        console.error('Failed to sync work content id:', syncError)
        return NextResponse.json(
          { error: 'Work created but failed to finalize content', details: syncError.message },
          { status: 500 }
        )
      }
      savedWork = { ...data, content: JSON.stringify(mergedWork) }
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