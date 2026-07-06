-- Literature reader: progress, bookmarks, highlights

CREATE TABLE IF NOT EXISTS literature_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  chapter_index INTEGER NOT NULL DEFAULT 0,
  position_anchor INTEGER NOT NULL DEFAULT 0,
  percent REAL NOT NULL DEFAULT 0,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, work_id)
);

CREATE TABLE IF NOT EXISTS literature_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  chapter_index INTEGER NOT NULL DEFAULT 0,
  position_anchor INTEGER NOT NULL DEFAULT 0,
  label TEXT,
  excerpt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS literature_highlights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  chapter_index INTEGER NOT NULL DEFAULT 0,
  start_anchor INTEGER NOT NULL DEFAULT 0,
  end_anchor INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT 'yellow',
  note TEXT,
  excerpt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE literature_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE literature_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE literature_highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY literature_progress_select ON literature_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY literature_progress_insert ON literature_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY literature_progress_update ON literature_progress
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY literature_progress_delete ON literature_progress
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY literature_bookmarks_select ON literature_bookmarks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY literature_bookmarks_insert ON literature_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY literature_bookmarks_update ON literature_bookmarks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY literature_bookmarks_delete ON literature_bookmarks
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY literature_highlights_select ON literature_highlights
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY literature_highlights_insert ON literature_highlights
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY literature_highlights_update ON literature_highlights
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY literature_highlights_delete ON literature_highlights
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_literature_progress_user ON literature_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_literature_progress_last_read ON literature_progress(user_id, last_read_at DESC);
CREATE INDEX IF NOT EXISTS idx_literature_bookmarks_work ON literature_bookmarks(user_id, work_id);
CREATE INDEX IF NOT EXISTS idx_literature_highlights_work ON literature_highlights(user_id, work_id);
