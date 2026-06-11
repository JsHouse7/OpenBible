-- Lexicon / word-study feature: Strong's occurrence index (concordance)
-- One row per (Strong's number, KJV verse) occurrence, populated by
-- scripts/import-strongs-occurrences.mjs from public/bible-tagged-kjv data.

CREATE TABLE IF NOT EXISTS strongs_occurrences (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  strongs_id TEXT NOT NULL,        -- 'G26', 'H430'
  book TEXT NOT NULL,
  book_order SMALLINT NOT NULL,    -- canonical book ordering (1 = Genesis)
  chapter SMALLINT NOT NULL,
  verse SMALLINT NOT NULL,
  surface TEXT NOT NULL,           -- English word/phrase as translated, e.g. 'loved'
  position SMALLINT NOT NULL,      -- token index within the verse
  text TEXT NOT NULL DEFAULT ''    -- full KJV verse text (denormalized for result display)
);

CREATE INDEX IF NOT EXISTS idx_strongs_occ_id
  ON strongs_occurrences(strongs_id, book_order, chapter, verse);
CREATE INDEX IF NOT EXISTS idx_strongs_occ_surface
  ON strongs_occurrences(strongs_id, surface);
CREATE INDEX IF NOT EXISTS idx_strongs_occ_book
  ON strongs_occurrences(strongs_id, book);

-- Read-only public data
ALTER TABLE strongs_occurrences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read strongs occurrences" ON strongs_occurrences;
CREATE POLICY "Anyone can read strongs occurrences" ON strongs_occurrences
  FOR SELECT USING (true);

GRANT SELECT ON strongs_occurrences TO anon, authenticated;

-- Paginated, filterable occurrence lookup in canonical order
CREATE OR REPLACE FUNCTION get_strongs_occurrences(
  strongs_param TEXT,
  book_filter TEXT DEFAULT NULL,
  surface_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 25,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  book TEXT,
  chapter SMALLINT,
  verse SMALLINT,
  surface TEXT,
  text TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT o.book, o.chapter, o.verse, o.surface, o.text
  FROM strongs_occurrences o
  WHERE o.strongs_id = strongs_param
    AND (book_filter IS NULL OR o.book = book_filter)
    AND (surface_filter IS NULL OR lower(o.surface) = lower(surface_filter))
  ORDER BY o.book_order, o.chapter, o.verse, o.position
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- Summary: total count plus how the word is rendered in English, with counts
CREATE OR REPLACE FUNCTION get_strongs_summary(
  strongs_param TEXT,
  book_filter TEXT DEFAULT NULL,
  surface_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  total BIGINT,
  surfaces JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    count(*) AS total,
    COALESCE(
      (
        SELECT jsonb_agg(jsonb_build_object('surface', s.surface, 'count', s.cnt) ORDER BY s.cnt DESC)
        FROM (
          SELECT lower(o2.surface) AS surface, count(*) AS cnt
          FROM strongs_occurrences o2
          WHERE o2.strongs_id = strongs_param
            AND (book_filter IS NULL OR o2.book = book_filter)
            AND (surface_filter IS NULL OR lower(o2.surface) = lower(surface_filter))
          GROUP BY lower(o2.surface)
          ORDER BY cnt DESC
          LIMIT 15
        ) s
      ),
      '[]'::jsonb
    ) AS surfaces
  FROM strongs_occurrences o
  WHERE o.strongs_id = strongs_param
    AND (book_filter IS NULL OR o.book = book_filter)
    AND (surface_filter IS NULL OR lower(o.surface) = lower(surface_filter));
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

GRANT EXECUTE ON FUNCTION get_strongs_occurrences TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_strongs_summary TO anon, authenticated;
