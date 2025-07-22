import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Work ID is required' }, { status: 400 });
    }

    // Delete from work_authors
    const { error: waError } = await supabase
      .from('work_authors')
      .delete()
      .eq('work_id', id);

    if (waError) throw waError;

    // Delete from works
    const { error: workError } = await supabase
      .from('works')
      .delete()
      .eq('id', id);

    if (workError) throw workError;

    // Optional: Clean up authors with no works
    const { data: orphanAuthors } = await supabase
      .from('authors')
      .select('id')
      .not('id', 'in', '(SELECT author_id FROM work_authors)');

    if (orphanAuthors?.length) {
      await supabase
        .from('authors')
        .delete()
        .in('id', orphanAuthors.map(a => a.id));
    }

    return NextResponse.json({ message: 'Work deleted successfully' });
  } catch (error) {
    console.error('Error deleting work:', error);
    return NextResponse.json({ error: 'Failed to delete work' }, { status: 500 });
  }
}