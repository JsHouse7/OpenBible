import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// strongs_occurrences is public read-only data (RLS anon SELECT), so the
// anon key is sufficient; prefer the service key when configured.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase environment variables for lexicon occurrences API');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const STRONGS_ID_RE = /^[HG]\d{1,4}$/;
const BOOK_RE = /^[1-3]? ?[A-Za-z ]{2,20}$/;

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const strongs = searchParams.get('strongs') || '';
    const book = searchParams.get('book');
    const surface = searchParams.get('surface');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10) || 25));
    const offset = (page - 1) * limit;

    if (!STRONGS_ID_RE.test(strongs)) {
      return NextResponse.json(
        { error: 'A valid Strong\'s number is required (e.g. G26 or H430)' },
        { status: 400 }
      );
    }
    if (book && !BOOK_RE.test(book)) {
      return NextResponse.json({ error: 'Invalid book filter' }, { status: 400 });
    }
    if (surface && surface.length > 60) {
      return NextResponse.json({ error: 'Invalid surface filter' }, { status: 400 });
    }

    const [occurrencesResult, summaryResult] = await Promise.all([
      supabase.rpc('get_strongs_occurrences', {
        strongs_param: strongs,
        book_filter: book || null,
        surface_filter: surface || null,
        limit_count: limit,
        offset_count: offset,
      }),
      supabase.rpc('get_strongs_summary', {
        strongs_param: strongs,
        book_filter: book || null,
        surface_filter: surface || null,
      }),
    ]);

    if (occurrencesResult.error || summaryResult.error) {
      console.error(
        'Occurrence search error:',
        occurrencesResult.error || summaryResult.error
      );
      return NextResponse.json({ error: 'Failed to search occurrences' }, { status: 500 });
    }

    const summary = summaryResult.data?.[0];
    const response = NextResponse.json({
      total: Number(summary?.total ?? 0),
      surfaces: summary?.surfaces ?? [],
      results: occurrencesResult.data ?? [],
      page,
      limit,
    });
    // Concordance data is immutable — cache aggressively at the CDN
    response.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=31536000');
    return response;
  } catch (error) {
    console.error('Lexicon occurrences API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
