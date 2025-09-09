-- Search Feature Migration
-- Adds search functionality tables and indexes to the OpenBible database

-- Search history table for tracking user searches
CREATE TABLE search_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  filters JSONB DEFAULT '{}',
  results_count INTEGER DEFAULT 0,
  search_type TEXT DEFAULT 'verse', -- 'verse', 'reference', 'advanced'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved searches table for bookmarked searches
CREATE TABLE saved_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  query TEXT NOT NULL,
  filters JSONB DEFAULT '{}',
  search_type TEXT DEFAULT 'verse',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search analytics table for tracking popular searches
CREATE TABLE search_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  search_count INTEGER DEFAULT 1,
  last_searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint on query for aggregation
  UNIQUE(query)
);

-- Create indexes for search performance
CREATE INDEX idx_search_history_user ON search_history(user_id, created_at DESC);
CREATE INDEX idx_search_history_query ON search_history(query);
CREATE INDEX idx_saved_searches_user ON saved_searches(user_id, created_at DESC);
CREATE INDEX idx_search_analytics_count ON search_analytics(search_count DESC);
CREATE INDEX idx_search_analytics_recent ON search_analytics(last_searched_at DESC);

-- Enhance bible_verses table with better search capabilities
-- Add search vector column for better full-text search performance
ALTER TABLE bible_verses ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Update search vector for existing data
UPDATE bible_verses SET search_vector = to_tsvector('english', book || ' ' || chapter || ':' || verse || ' ' || text);

-- Create GIN index on search vector for fast full-text search
DROP INDEX IF EXISTS idx_bible_search;
CREATE INDEX idx_bible_search_vector ON bible_verses USING GIN (search_vector);

-- Create composite indexes for reference searches
CREATE INDEX IF NOT EXISTS idx_bible_reference_lookup ON bible_verses(book, chapter, verse, translation);
CREATE INDEX IF NOT EXISTS idx_bible_book_translation ON bible_verses(book, translation);
CREATE INDEX IF NOT EXISTS idx_bible_chapter_range ON bible_verses(book, chapter, translation) WHERE chapter IS NOT NULL;

-- Create function to automatically update search vector
CREATE OR REPLACE FUNCTION update_bible_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', NEW.book || ' ' || NEW.chapter || ':' || NEW.verse || ' ' || NEW.text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector on insert/update
DROP TRIGGER IF EXISTS trigger_update_bible_search_vector ON bible_verses;
CREATE TRIGGER trigger_update_bible_search_vector
  BEFORE INSERT OR UPDATE ON bible_verses
  FOR EACH ROW
  EXECUTE FUNCTION update_bible_search_vector();

-- Enable Row Level Security on new tables
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for search tables

-- Search history policies
CREATE POLICY "Users can view their own search history" ON search_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search history" ON search_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search history" ON search_history
  FOR DELETE USING (auth.uid() = user_id);

-- Saved searches policies
CREATE POLICY "Users can view their own saved searches" ON saved_searches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved searches" ON saved_searches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved searches" ON saved_searches
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved searches" ON saved_searches
  FOR DELETE USING (auth.uid() = user_id);

-- Search analytics policies (read-only for users, write for system)
CREATE POLICY "Search analytics are publicly readable" ON search_analytics
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert search analytics" ON search_analytics
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "System can update search analytics" ON search_analytics
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON search_analytics TO anon;
GRANT SELECT ON search_analytics TO authenticated;
GRANT ALL PRIVILEGES ON search_history TO authenticated;
GRANT ALL PRIVILEGES ON saved_searches TO authenticated;
GRANT INSERT, UPDATE ON search_analytics TO authenticated;

-- Create function for search suggestions based on popular queries
CREATE OR REPLACE FUNCTION get_search_suggestions(query_prefix TEXT, limit_count INTEGER DEFAULT 5)
RETURNS TABLE(suggestion TEXT, search_count INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.query,
    sa.search_count
  FROM search_analytics sa
  WHERE sa.query ILIKE query_prefix || '%'
  ORDER BY sa.search_count DESC, sa.last_searched_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for updating search analytics
CREATE OR REPLACE FUNCTION update_search_analytics(search_query TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO search_analytics (query, search_count, last_searched_at)
  VALUES (search_query, 1, NOW())
  ON CONFLICT (query)
  DO UPDATE SET 
    search_count = search_analytics.search_count + 1,
    last_searched_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_search_suggestions(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_search_suggestions(TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION update_search_analytics(TEXT) TO authenticated;

COMMIT;