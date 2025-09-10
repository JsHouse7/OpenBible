import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import slugify from 'slugify'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }
    const token = authHeader.substring(7)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    const { work } = await request.json()
    if (!work?.id) {
      return NextResponse.json({ error: 'Work ID is required' }, { status: 400 })
    }

    // Fetch existing work
    const { data: existingWork, error: fetchError } = await supabase
      .from('works')
      .select('*')
      .eq('id', work.id)
      .single()

    if (fetchError || !existingWork) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    }

    // Resolve/ensure author id
    let authorId: string | null = existingWork.author_id || null
    if (work.author && typeof work.author === 'string') {
      const { data: existingAuthor } = await supabase
        .from('authors')
        .select('id')
        .eq('name', work.author)
        .single()

      if (existingAuthor?.id) {
        authorId = existingAuthor.id
      } else {
        const { data: newAuthor, error: authorError } = await supabase
          .from('authors')
          .insert({ name: work.author, slug: slugify(work.author) })
          .select('id')
          .single()
        if (authorError || !newAuthor) {
          throw authorError || new Error('Failed to create author')
        }
        authorId = newAuthor.id
      }
    }

    // Merge JSON content
    let parsed: any = null
    try {
      if (typeof existingWork.content === 'string') {
        parsed = JSON.parse(existingWork.content)
      } else if (existingWork.content && typeof existingWork.content === 'object') {
        parsed = existingWork.content
      }
    } catch {
      parsed = null
    }

    const updatedContent = {
      ...(parsed || {}),
      ...(work.title ? { title: work.title } : {}),
      ...(work.author ? { author: work.author } : {}),
      ...(work.year ? { year: work.year } : {}),
      ...(work.description ? { description: work.description } : {}),
      ...(work.difficulty ? { difficulty: work.difficulty } : {}),
    }

    const updatedData: any = {
      title: work.title || existingWork.title,
      slug: slugify(work.title || existingWork.title),
      description: work.description ?? existingWork.description,
      year_published: work.year ?? existingWork.year_published,
      content: JSON.stringify(updatedContent),
    }
    if (authorId) updatedData.author_id = authorId

    const { data, error } = await supabase
      .from('works')
      .update(updatedData)
      .eq('id', work.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ message: 'Work updated successfully', work: data })
  } catch (error) {
    console.error('Error updating work:', error)
    return NextResponse.json({ error: 'Failed to update work' }, { status: 500 })
  }
}