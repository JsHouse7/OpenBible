import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import slugify from 'slugify';

export async function POST(request: Request) {
  try {
    const { work } = await request.json();

    if (!work?.id) {
      return NextResponse.json({ error: 'Work ID is required' }, { status: 400 });
    }

    // Get existing work to preserve content and other fields
    const { data: existingWork, error: fetchError } = await supabase
      .from('works')
      .select('*')
      .eq('id', work.id)
      .single();

    if (fetchError || !existingWork) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 });
    }

    // Handle author update
    let authorId = existingWork.author_id;
    if (work.author && work.author !== existingWork.author) {
      // Check if author exists
      const { data: existingAuthor } = await supabase
        .from('authors')
        .select('id')
        .eq('name', work.author)
        .single();

      if (existingAuthor) {
        authorId = existingAuthor.id;
      } else {
        // Create new author
        const authorSlug = slugify(work.author);
        const { data: newAuthor, error: authorError } = await supabase
          .from('authors')
          .insert({ name: work.author, slug: authorSlug })
          .select('id')
          .single();

        if (authorError) throw authorError;
        authorId = newAuthor.id;
      }

      // Update work_authors if necessary
      await supabase
        .from('work_authors')
        .update({ author_id: authorId })
        .eq('work_id', work.id);
    }

    // Update work
    const updatedData = {
      title: work.title || existingWork.title,
      slug: slugify(work.title || existingWork.title),
      description: work.description || existingWork.description,
      year_published: work.year || existingWork.year_published,
      difficulty: work.difficulty || existingWork.difficulty,
      updated_at: new Date().toISOString(),
      author_id: authorId
    };

    const { data, error } = await supabase
      .from('works')
      .update(updatedData)
      .eq('id', work.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: 'Work updated successfully', work: data });
  } catch (error) {
    console.error('Error updating work:', error);
    return NextResponse.json({ error: 'Failed to update work' }, { status: 500 });
  }
}