-- OpenBible Database Schema
-- Run this in your Supabase SQL editor to set up the database

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.settings.jwt_secret" TO 'your-jwt-secret';

-- Bible content table
CREATE TABLE bible_verses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  text TEXT NOT NULL,
  translation TEXT NOT NULL DEFAULT 'KJV',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Create unique constraint for book/chapter/verse/translation
  UNIQUE(book, chapter, verse, translation)
);

-- Create indexes for fast queries
CREATE INDEX idx_bible_book_chapter ON bible_verses(book, chapter);
CREATE INDEX idx_bible_translation ON bible_verses(translation);
CREATE INDEX idx_bible_search ON bible_verses USING GIN (to_tsvector('english', text));

-- User notes table
CREATE TABLE user_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate notes per verse per user
  UNIQUE(user_id, book, chapter, verse)
);

-- User bookmarks table
CREATE TABLE user_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate bookmarks
  UNIQUE(user_id, book, chapter, verse)
);

-- User reading progress table
CREATE TABLE reading_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint per user per book
  UNIQUE(user_id, book)
);

-- User highlights table
CREATE TABLE user_highlights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  color TEXT DEFAULT 'yellow',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate highlights
  UNIQUE(user_id, book, chapter, verse)
);

-- Authors table for future Christian literature feature
CREATE TABLE authors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  bio TEXT,
  birth_year INTEGER,
  death_year INTEGER,
  traditions TEXT[],
  era TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Works table for future Christian literature feature
CREATE TABLE works (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES authors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL, -- 'commentary', 'devotional', 'sermon', 'book'
  year_published INTEGER,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_highlights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see and modify their own data

-- User notes policies
CREATE POLICY "Users can view their own notes" ON user_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes" ON user_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" ON user_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" ON user_notes
  FOR DELETE USING (auth.uid() = user_id);

-- User bookmarks policies
CREATE POLICY "Users can view their own bookmarks" ON user_bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks" ON user_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" ON user_bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Reading progress policies
CREATE POLICY "Users can view their own reading progress" ON reading_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reading progress" ON reading_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading progress" ON reading_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- User highlights policies
CREATE POLICY "Users can view their own highlights" ON user_highlights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own highlights" ON user_highlights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own highlights" ON user_highlights
  FOR DELETE USING (auth.uid() = user_id);

-- Bible verses are public (no RLS needed)
-- Authors and works are public (no RLS needed)

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to user_notes table
CREATE TRIGGER update_user_notes_updated_at 
  BEFORE UPDATE ON user_notes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample Bible data (John 3)
INSERT INTO bible_verses (book, chapter, verse, text, translation) VALUES
('John', 3, 1, 'There was a man of the Pharisees, named Nicodemus, a ruler of the Jews:', 'KJV'),
('John', 3, 2, 'The same came to Jesus by night, and said unto him, Rabbi, we know that thou art a teacher come from God: for no man can do these miracles that thou doest, except God be with him.', 'KJV'),
('John', 3, 3, 'Jesus answered and said unto him, Verily, verily, I say unto thee, Except a man be born again, he cannot see the kingdom of God.', 'KJV'),
('John', 3, 4, 'Nicodemus saith unto him, How can a man be born when he is old? can he enter the second time into his mother''s womb, and be born?', 'KJV'),
('John', 3, 5, 'Jesus answered, Verily, verily, I say unto thee, Except a man be born of water and of the Spirit, he cannot enter into the kingdom of God.', 'KJV'),
('John', 3, 6, 'That which is born of the flesh is flesh; and that which is born of the Spirit is spirit.', 'KJV'),
('John', 3, 7, 'Marvel not that I said unto thee, Ye must be born again.', 'KJV'),
('John', 3, 8, 'The wind bloweth where it listeth, and thou hearest the sound thereof, but canst not tell whence it cometh, and whither it goeth: so is every one that is born of the Spirit.', 'KJV'),
('John', 3, 9, 'Nicodemus answered and said unto him, How can these things be?', 'KJV'),
('John', 3, 10, 'Jesus answered and said unto him, Art thou a master of Israel, and knowest not these things?', 'KJV'),
('John', 3, 11, 'Verily, verily, I say unto thee, We speak that we do know, and testify that we have seen; and ye receive not our witness.', 'KJV'),
('John', 3, 12, 'If I have told you earthly things, and ye believe not, how shall ye believe, if I tell you of heavenly things?', 'KJV'),
('John', 3, 13, 'And no man hath ascended up to heaven, but he that came down from heaven, even the Son of man which is in heaven.', 'KJV'),
('John', 3, 14, 'And as Moses lifted up the serpent in the wilderness, even so must the Son of man be lifted up:', 'KJV'),
('John', 3, 15, 'That whosoever believeth in him should not perish, but have eternal life.', 'KJV'),
('John', 3, 16, 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.', 'KJV'),
('John', 3, 17, 'For God sent not his Son into the world to condemn the world; but that the world through him might be saved.', 'KJV'),
('John', 3, 18, 'He that believeth on him is not condemned: but he that believeth not is condemned already, because he hath not believed in the name of the only begotten Son of God.', 'KJV'),
('John', 3, 19, 'And this is the condemnation, that light is come into the world, and men loved darkness rather than light, because their deeds were evil.', 'KJV'),
('John', 3, 20, 'For every one that doeth evil hateth the light, neither cometh to the light, lest his deeds should be reproved.', 'KJV'),
('John', 3, 21, 'But he that doeth truth cometh to the light, that his deeds may be made manifest, that they are wrought in God.', 'KJV');

-- Sample authors for future feature
INSERT INTO authors (name, slug, bio, birth_year, death_year, traditions, era) VALUES
('Charles Spurgeon', 'spurgeon', 'British Particular Baptist preacher who remains highly influential among Christians of various denominations.', 1834, 1892, ARRAY['Baptist', 'Reformed'], 'Victorian'),
('John Calvin', 'calvin', 'French theologian, pastor and reformer in Geneva during the Protestant Reformation.', 1509, 1564, ARRAY['Reformed', 'Protestant'], 'Reformation'),
('Augustine of Hippo', 'augustine', 'Theologian and philosopher whose writings influenced the development of Western Christianity and philosophy.', 354, 430, ARRAY['Catholic', 'Patristic'], 'Early Church'),
('Martin Luther', 'luther', 'German professor of theology, priest, author, composer, and monk who was a seminal figure in the Protestant Reformation.', 1483, 1546, ARRAY['Lutheran', 'Protestant'], 'Reformation');

-- Add sample works
INSERT INTO works (author_id, title, slug, description, content_type, year_published) VALUES
((SELECT id FROM authors WHERE slug = 'spurgeon'), 'Morning and Evening', 'morning-evening', 'Daily devotional readings for morning and evening', 'devotional', 1869),
((SELECT id FROM authors WHERE slug = 'calvin'), 'Institutes of the Christian Religion', 'institutes', 'Foundational work of Protestant systematic theology', 'theology', 1559),
((SELECT id FROM authors WHERE slug = 'augustine'), 'Confessions', 'confessions', 'Autobiographical work outlining Augustine''s sinful youth and conversion', 'autobiography', 397),
((SELECT id FROM authors WHERE slug = 'luther'), 'Commentary on Galatians', 'galatians-commentary', 'Martin Luther''s commentary on Paul''s letter to the Galatians', 'commentary', 1535); 