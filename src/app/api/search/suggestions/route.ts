import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Missing Supabase environment variables for suggestions API');
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Common Bible search terms and phrases
const COMMON_SEARCH_TERMS = [
  'love', 'faith', 'hope', 'peace', 'joy', 'salvation', 'grace', 'mercy',
  'forgiveness', 'prayer', 'wisdom', 'strength', 'comfort', 'healing',
  'blessing', 'eternal life', 'kingdom of heaven', 'holy spirit',
  'jesus christ', 'lord god', 'almighty', 'righteousness', 'truth',
  'light', 'darkness', 'sin', 'redemption', 'covenant', 'promise'
];

// Bible book names for reference suggestions
const BIBLE_BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
  'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah',
  'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah',
  'Haggai', 'Zechariah', 'Malachi', 'Matthew', 'Mark', 'Luke',
  'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians',
  'Galatians', 'Ephesians', 'Philippians', 'Colossians',
  '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy',
  'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
  '1 John', '2 John', '3 John', 'Jude', 'Revelation'
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all'; // 'verse', 'reference', 'all'
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.length < 2) {
      return NextResponse.json({
        suggestions: [],
        type: 'empty'
      });
    }

    // If Supabase is not configured, return basic suggestions
    if (!supabase) {
      const suggestions: Array<{
        text: string;
        type: 'verse' | 'reference' | 'popular';
      }> = [];
      
      const normalizedQuery = query.toLowerCase().trim();
      
      // Add Bible book suggestions for reference searches
      if (type === 'all' || type === 'reference') {
        const bookSuggestions = BIBLE_BOOKS
          .filter(book => book.toLowerCase().includes(normalizedQuery))
          .slice(0, 5)
          .map(book => ({
            text: book,
            type: 'reference' as const
          }));
        
        suggestions.push(...bookSuggestions);
      }
      
      // Add common search terms for verse searches
      if (type === 'all' || type === 'verse') {
        const termSuggestions = COMMON_SEARCH_TERMS
          .filter(term => term.includes(normalizedQuery))
          .slice(0, 3)
          .map(term => ({
            text: term,
            type: 'popular' as const
          }));
        
        suggestions.push(...termSuggestions);
      }
      
      return NextResponse.json({
        suggestions: suggestions.slice(0, limit),
        query: normalizedQuery,
        type
      });
    }

    const suggestions: Array<{
      text: string;
      type: 'verse' | 'reference' | 'popular';
      popularity?: number;
    }> = [];

    const normalizedQuery = query.toLowerCase().trim();

    // Get suggestions from search analytics (popular searches)
    if (type === 'all' || type === 'verse') {
      try {
        const { data: analyticsData, error: analyticsError } = await supabase
          .rpc('get_search_suggestions', {
            search_term: normalizedQuery,
            limit_count: Math.min(limit, 5)
          });

        if (!analyticsError && analyticsData) {
          analyticsData.forEach((item: any) => {
            suggestions.push({
              text: item.suggestion,
              type: item.search_type === 'reference' ? 'reference' : 'verse',
              popularity: item.popularity
            });
          });
        }
      } catch (error) {
        console.error('Analytics suggestions error:', error);
      }
    }

    // Add Bible book suggestions for reference searches
    if (type === 'all' || type === 'reference') {
      const bookSuggestions = BIBLE_BOOKS
        .filter(book => book.toLowerCase().includes(normalizedQuery))
        .slice(0, 5)
        .map(book => ({
          text: book,
          type: 'reference' as const
        }));
      
      suggestions.push(...bookSuggestions);
    }

    // Add common search terms for verse searches
    if (type === 'all' || type === 'verse') {
      const termSuggestions = COMMON_SEARCH_TERMS
        .filter(term => term.includes(normalizedQuery))
        .slice(0, 3)
        .map(term => ({
          text: term,
          type: 'popular' as const
        }));
      
      suggestions.push(...termSuggestions);
    }

    // Get word-based suggestions from actual verse content
    if (type === 'all' || type === 'verse') {
      try {
        const { data: verseData, error: verseError } = await supabase
          .from('bible_verses')
          .select('text')
          .textSearch('search_vector', normalizedQuery)
          .limit(5);

        if (!verseError && verseData) {
          // Extract relevant phrases from verse text
          verseData.forEach((verse: any) => {
            const text = verse.text.toLowerCase();
            const words = text.split(/\s+/);
            const queryIndex = words.findIndex(word => 
              word.includes(normalizedQuery.split(' ')[0])
            );
            
            if (queryIndex !== -1) {
              // Extract a phrase around the found word
              const start = Math.max(0, queryIndex - 2);
              const end = Math.min(words.length, queryIndex + 3);
              const phrase = words.slice(start, end).join(' ');
              
              if (phrase.length > normalizedQuery.length && 
                  !suggestions.some(s => s.text.toLowerCase() === phrase)) {
                suggestions.push({
                  text: phrase,
                  type: 'verse'
                });
              }
            }
          });
        }
      } catch (error) {
        console.error('Verse suggestions error:', error);
      }
    }

    // Remove duplicates and sort by relevance
    const uniqueSuggestions = suggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.text.toLowerCase() === suggestion.text.toLowerCase())
      )
      .sort((a, b) => {
        // Prioritize by popularity, then by type, then alphabetically
        if (a.popularity && b.popularity) {
          return b.popularity - a.popularity;
        }
        if (a.popularity && !b.popularity) return -1;
        if (!a.popularity && b.popularity) return 1;
        
        // Prioritize exact matches
        const aExact = a.text.toLowerCase().startsWith(normalizedQuery);
        const bExact = b.text.toLowerCase().startsWith(normalizedQuery);
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        return a.text.localeCompare(b.text);
      })
      .slice(0, limit);

    return NextResponse.json({
      suggestions: uniqueSuggestions,
      query: normalizedQuery,
      type
    });
  } catch (error) {
    console.error('Suggestions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, type = 'all', limit = 10 } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Use GET logic with POST data
    const searchUrl = new URL(request.url);
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('type', type);
    searchUrl.searchParams.set('limit', limit.toString());

    const searchRequest = new NextRequest(searchUrl);
    return GET(searchRequest);
  } catch (error) {
    console.error('POST Suggestions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}