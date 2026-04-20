-- OpenBible production fixes: translation column in search RPC, works ownership RLS, authors lockdown
-- Run in Supabase SQL Editor after prior migrations. Safe to re-run fragments with IF EXISTS where noted.

-- 1) Verse search RPC (OUT types = TEXT to match bible_verses; rank cast to real)
DROP FUNCTION IF EXISTS search_verses(text, text, text, integer, integer);
CREATE FUNCTION search_verses(
  search_query TEXT,
  book_filter TEXT DEFAULT NULL,
  version_filter TEXT DEFAULT 'KJV',
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  book TEXT,
  chapter INTEGER,
  verse INTEGER,
  text TEXT,
  version TEXT,
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
    bv.translation AS version,
    ts_rank(bv.search_vector, plainto_tsquery('english', search_query))::real AS rank
  FROM bible_verses bv
  WHERE
    bv.search_vector @@ plainto_tsquery('english', search_query)
    AND (book_filter IS NULL OR bv.book = book_filter)
    AND (version_filter IS NULL OR bv.translation = version_filter)
  ORDER BY rank DESC, bv.book, bv.chapter, bv.verse
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2) Literature: ownership column (nullable = catalog / seeded works)
ALTER TABLE works ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Drop work policies (idempotent: matches legacy names + current schema.sql names)
DROP POLICY IF EXISTS "Authenticated users can insert works" ON works;
DROP POLICY IF EXISTS "Authenticated users can update works" ON works;
DROP POLICY IF EXISTS "Works are publicly readable" ON works;
DROP POLICY IF EXISTS "Authenticated users can insert own works" ON works;
DROP POLICY IF EXISTS "Users can update own works" ON works;
DROP POLICY IF EXISTS "Users can delete own works" ON works;

CREATE POLICY "Works are publicly readable" ON works
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert own works" ON works
  FOR INSERT WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update own works" ON works
  FOR UPDATE USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete own works" ON works
  FOR DELETE USING (auth.uid() = owner_user_id);

-- 3) Authors: remove blanket update; keep public read + authenticated insert for uploads
DROP POLICY IF EXISTS "Authenticated users can update authors" ON authors;
