-- Verse Search Feature Migration
-- This migration adds search functionality to the OpenBible application
-- Created: 2024

-- Add search_vector column to bible_verses table for full-text search
ALTER TABLE bible_verses 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_bible_verses_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.text, '') || ' ' || 
    COALESCE(NEW.book, '') || ' ' || 
    COALESCE(NEW.chapter::text, '') || ' ' || 
    COALESCE(NEW.verse::text, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector
DROP TRIGGER IF EXISTS bible_verses_search_vector_trigger ON bible_verses;
CREATE TRIGGER bible_verses_search_vector_trigger
  BEFORE INSERT OR UPDATE ON bible_verses
  FOR EACH ROW
  EXECUTE FUNCTION update_bible_verses_search_vector();

-- Update existing records with search vector
UPDATE bible_verses 
SET search_vector = to_tsvector('english', 
  COALESCE(text, '') || ' ' || 
  COALESCE(book, '') || ' ' || 
  COALESCE(chapter::text, '') || ' ' || 
  COALESCE(verse::text, '')
)
WHERE search_vector IS NULL;

-- Create GIN index for full-text search performance
CREATE INDEX IF NOT EXISTS idx_bible_verses_search_vector 
ON bible_verses USING GIN(search_vector);

-- Create search_history table for user search tracking
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  search_type VARCHAR(20) NOT NULL CHECK (search_type IN ('verse', 'reference', 'keyword')),
  filters JSONB DEFAULT '{}',
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create saved_searches table for bookmarked searches
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  query TEXT NOT NULL,
  search_type VARCHAR(20) NOT NULL CHECK (search_type IN ('verse', 'reference', 'keyword')),
  filters JSONB DEFAULT '{}',
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create search_analytics table for popular search tracking
CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  search_type VARCHAR(20) NOT NULL CHECK (search_type IN ('verse', 'reference', 'keyword')),
  search_count INTEGER DEFAULT 1,
  last_searched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history USING GIN(to_tsvector('english', query));

CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_public ON saved_searches(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_saved_searches_created_at ON saved_searches(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_count ON search_analytics(search_count DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_last_searched ON search_analytics(last_searched DESC);

-- Enable Row Level Security
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for search_history
CREATE POLICY "Users can view their own search history" ON search_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search history" ON search_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own search history" ON search_history
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search history" ON search_history
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for saved_searches
CREATE POLICY "Users can view their own saved searches" ON saved_searches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public saved searches" ON saved_searches
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Users can insert their own saved searches" ON saved_searches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved searches" ON saved_searches
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved searches" ON saved_searches
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for search_analytics (read-only for users, admin can manage)
CREATE POLICY "Anyone can view search analytics" ON search_analytics
  FOR SELECT TO authenticated, anon USING (TRUE);

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON search_history TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON search_history TO authenticated;

GRANT SELECT ON saved_searches TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON saved_searches TO authenticated;

GRANT SELECT ON search_analytics TO anon, authenticated;
GRANT INSERT, UPDATE ON search_analytics TO authenticated;

-- Create function for search suggestions
CREATE OR REPLACE FUNCTION get_search_suggestions(search_term TEXT, limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  suggestion TEXT,
  search_type VARCHAR(20),
  popularity INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.query as suggestion,
    sa.search_type,
    sa.search_count as popularity
  FROM search_analytics sa
  WHERE sa.query ILIKE '%' || search_term || '%'
  ORDER BY sa.search_count DESC, sa.last_searched DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update search analytics
CREATE OR REPLACE FUNCTION update_search_analytics(query_text TEXT, search_type_param VARCHAR(20))
RETURNS VOID AS $$
BEGIN
  INSERT INTO search_analytics (query, search_type, search_count, last_searched)
  VALUES (query_text, search_type_param, 1, NOW())
  ON CONFLICT (query, search_type) 
  DO UPDATE SET 
    search_count = search_analytics.search_count + 1,
    last_searched = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unique constraint for search analytics
CREATE UNIQUE INDEX IF NOT EXISTS idx_search_analytics_unique 
ON search_analytics(query, search_type);

-- Create function for verse search with ranking
CREATE OR REPLACE FUNCTION search_verses(
  search_query TEXT,
  book_filter TEXT DEFAULT NULL,
  version_filter TEXT DEFAULT 'KJV',
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  book VARCHAR(50),
  chapter INTEGER,
  verse INTEGER,
  text TEXT,
  version VARCHAR(10),
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bv.id,
    bv.book,
    bv.chapter,
    bv.verse,
    bv.text,
    bv.version,
    ts_rank(bv.search_vector, plainto_tsquery('english', search_query)) as rank
  FROM bible_verses bv
  WHERE 
    bv.search_vector @@ plainto_tsquery('english', search_query)
    AND (book_filter IS NULL OR bv.book = book_filter)
    AND (version_filter IS NULL OR bv.version = version_filter)
  ORDER BY rank DESC, bv.book, bv.chapter, bv.verse
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;