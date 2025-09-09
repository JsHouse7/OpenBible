import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Missing Supabase environment variables for reference API');
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Bible book name mappings and abbreviations
const BOOK_MAPPINGS: { [key: string]: string } = {
  // Old Testament
  'gen': 'Genesis', 'genesis': 'Genesis',
  'exo': 'Exodus', 'exodus': 'Exodus', 'ex': 'Exodus',
  'lev': 'Leviticus', 'leviticus': 'Leviticus',
  'num': 'Numbers', 'numbers': 'Numbers',
  'deu': 'Deuteronomy', 'deuteronomy': 'Deuteronomy', 'deut': 'Deuteronomy',
  'jos': 'Joshua', 'joshua': 'Joshua', 'josh': 'Joshua',
  'jdg': 'Judges', 'judges': 'Judges',
  'rut': 'Ruth', 'ruth': 'Ruth',
  '1sa': '1 Samuel', '1 samuel': '1 Samuel', '1sam': '1 Samuel',
  '2sa': '2 Samuel', '2 samuel': '2 Samuel', '2sam': '2 Samuel',
  '1ki': '1 Kings', '1 kings': '1 Kings',
  '2ki': '2 Kings', '2 kings': '2 Kings',
  '1ch': '1 Chronicles', '1 chronicles': '1 Chronicles', '1chr': '1 Chronicles',
  '2ch': '2 Chronicles', '2 chronicles': '2 Chronicles', '2chr': '2 Chronicles',
  'ezr': 'Ezra', 'ezra': 'Ezra',
  'neh': 'Nehemiah', 'nehemiah': 'Nehemiah',
  'est': 'Esther', 'esther': 'Esther',
  'job': 'Job',
  'psa': 'Psalms', 'psalms': 'Psalms', 'ps': 'Psalms',
  'pro': 'Proverbs', 'proverbs': 'Proverbs', 'prov': 'Proverbs',
  'ecc': 'Ecclesiastes', 'ecclesiastes': 'Ecclesiastes',
  'sng': 'Song of Solomon', 'song of solomon': 'Song of Solomon', 'sos': 'Song of Solomon',
  'isa': 'Isaiah', 'isaiah': 'Isaiah',
  'jer': 'Jeremiah', 'jeremiah': 'Jeremiah',
  'lam': 'Lamentations', 'lamentations': 'Lamentations',
  'eze': 'Ezekiel', 'ezekiel': 'Ezekiel', 'ezek': 'Ezekiel',
  'dan': 'Daniel', 'daniel': 'Daniel',
  'hos': 'Hosea', 'hosea': 'Hosea',
  'joe': 'Joel', 'joel': 'Joel',
  'amo': 'Amos', 'amos': 'Amos',
  'oba': 'Obadiah', 'obadiah': 'Obadiah',
  'jon': 'Jonah', 'jonah': 'Jonah',
  'mic': 'Micah', 'micah': 'Micah',
  'nah': 'Nahum', 'nahum': 'Nahum',
  'hab': 'Habakkuk', 'habakkuk': 'Habakkuk',
  'zep': 'Zephaniah', 'zephaniah': 'Zephaniah',
  'hag': 'Haggai', 'haggai': 'Haggai',
  'zec': 'Zechariah', 'zechariah': 'Zechariah', 'zech': 'Zechariah',
  'mal': 'Malachi', 'malachi': 'Malachi',
  
  // New Testament
  'mat': 'Matthew', 'matthew': 'Matthew', 'matt': 'Matthew', 'mt': 'Matthew',
  'mar': 'Mark', 'mark': 'Mark', 'mk': 'Mark',
  'luk': 'Luke', 'luke': 'Luke', 'lk': 'Luke',
  'joh': 'John', 'john': 'John', 'jn': 'John',
  'act': 'Acts', 'acts': 'Acts',
  'rom': 'Romans', 'romans': 'Romans',
  '1co': '1 Corinthians', '1 corinthians': '1 Corinthians', '1cor': '1 Corinthians',
  '2co': '2 Corinthians', '2 corinthians': '2 Corinthians', '2cor': '2 Corinthians',
  'gal': 'Galatians', 'galatians': 'Galatians',
  'eph': 'Ephesians', 'ephesians': 'Ephesians',
  'phi': 'Philippians', 'philippians': 'Philippians', 'phil': 'Philippians',
  'col': 'Colossians', 'colossians': 'Colossians',
  '1th': '1 Thessalonians', '1 thessalonians': '1 Thessalonians', '1thess': '1 Thessalonians',
  '2th': '2 Thessalonians', '2 thessalonians': '2 Thessalonians', '2thess': '2 Thessalonians',
  '1ti': '1 Timothy', '1 timothy': '1 Timothy', '1tim': '1 Timothy',
  '2ti': '2 Timothy', '2 timothy': '2 Timothy', '2tim': '2 Timothy',
  'tit': 'Titus', 'titus': 'Titus',
  'phm': 'Philemon', 'philemon': 'Philemon',
  'heb': 'Hebrews', 'hebrews': 'Hebrews',
  'jas': 'James', 'james': 'James',
  '1pe': '1 Peter', '1 peter': '1 Peter', '1pet': '1 Peter',
  '2pe': '2 Peter', '2 peter': '2 Peter', '2pet': '2 Peter',
  '1jo': '1 John', '1 john': '1 John',
  '2jo': '2 John', '2 john': '2 John',
  '3jo': '3 John', '3 john': '3 John',
  'jud': 'Jude', 'jude': 'Jude',
  'rev': 'Revelation', 'revelation': 'Revelation'
};

interface ParsedReference {
  book: string;
  chapter?: number;
  verse?: number;
  endVerse?: number;
  isValid: boolean;
  originalInput: string;
}

function parseReference(reference: string): ParsedReference {
  const original = reference.trim();
  const normalized = reference.toLowerCase().trim();
  
  // Pattern: Book Chapter:Verse or Book Chapter:Verse-EndVerse
  const patterns = [
    // John 3:16 or John 3:16-17
    /^([a-z0-9\s]+?)\s+(\d+):(\d+)(?:-(\d+))?$/,
    // John 3 (whole chapter)
    /^([a-z0-9\s]+?)\s+(\d+)$/,
    // Just book name
    /^([a-z0-9\s]+?)$/
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      const bookInput = match[1].trim();
      const book = BOOK_MAPPINGS[bookInput];
      
      if (book) {
        return {
          book,
          chapter: match[2] ? parseInt(match[2]) : undefined,
          verse: match[3] ? parseInt(match[3]) : undefined,
          endVerse: match[4] ? parseInt(match[4]) : undefined,
          isValid: true,
          originalInput: original
        };
      }
    }
  }

  return {
    book: '',
    isValid: false,
    originalInput: original
  };
}

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('ref');
    const translation = searchParams.get('translation') || 'KJV';

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference parameter is required' },
        { status: 400 }
      );
    }

    const parsed = parseReference(reference);
    
    if (!parsed.isValid) {
      return NextResponse.json({
        reference: parsed.originalInput,
        parsed: null,
        verses: [],
        suggestions: await getSuggestions(reference)
      });
    }

    // Build query based on parsed reference
    let query = supabase
      .from('bible_verses')
      .select('*')
      .eq('book', parsed.book)
      .eq('translation', translation);

    if (parsed.chapter) {
      query = query.eq('chapter', parsed.chapter);
    }

    if (parsed.verse) {
      if (parsed.endVerse) {
        query = query.gte('verse', parsed.verse).lte('verse', parsed.endVerse);
      } else {
        query = query.eq('verse', parsed.verse);
      }
    }

    query = query.order('chapter').order('verse');

    const { data: verses, error } = await query;

    if (error) {
      console.error('Reference search error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch verses' },
        { status: 500 }
      );
    }

    // Update search analytics
    await supabase.rpc('update_search_analytics', {
      query_text: reference,
      search_type_param: 'reference'
    });

    return NextResponse.json({
      reference: parsed.originalInput,
      parsed,
      verses: verses || [],
      count: verses?.length || 0
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference, version = 'KJV', userId } = body;

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference is required' },
        { status: 400 }
      );
    }

    // Save search to history if user is authenticated
    if (userId) {
      const { error: historyError } = await supabase
        .from('search_history')
        .insert({
          user_id: userId,
          query: reference,
          search_type: 'reference',
          filters: { version },
          results_count: 0 // Will be updated after search
        });

      if (historyError) {
        console.error('Failed to save search history:', historyError);
      }
    }

    // Perform the search using GET logic
    const searchUrl = new URL(request.url);
    searchUrl.searchParams.set('ref', reference);
    searchUrl.searchParams.set('version', version);

    const searchRequest = new NextRequest(searchUrl);
    return GET(searchRequest);
  } catch (error) {
    console.error('POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getSuggestions(input: string): Promise<string[]> {
  const normalized = input.toLowerCase().trim();
  const suggestions: string[] = [];
  
  // Find book name suggestions
  for (const [key, value] of Object.entries(BOOK_MAPPINGS)) {
    if (key.includes(normalized) || value.toLowerCase().includes(normalized)) {
      if (!suggestions.includes(value)) {
        suggestions.push(value);
      }
    }
  }
  
  return suggestions.slice(0, 5); // Return top 5 suggestions
}