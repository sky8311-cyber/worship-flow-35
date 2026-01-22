-- Create song_topics table for admin-managed topics (replacing freeform tags)
CREATE TABLE IF NOT EXISTS public.song_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ko TEXT NOT NULL UNIQUE,
  name_en TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.song_topics ENABLE ROW LEVEL SECURITY;

-- Anyone can read topics
CREATE POLICY "Anyone can read topics" ON public.song_topics
  FOR SELECT USING (true);

-- Only admins can insert topics
CREATE POLICY "Only admins can insert topics" ON public.song_topics
  FOR INSERT WITH CHECK (
    public.is_admin(auth.uid())
  );

-- Only admins can update topics
CREATE POLICY "Only admins can update topics" ON public.song_topics
  FOR UPDATE USING (
    public.is_admin(auth.uid())
  );

-- Only admins can delete topics
CREATE POLICY "Only admins can delete topics" ON public.song_topics
  FOR DELETE USING (
    public.is_admin(auth.uid())
  );

-- Remove category column from songs table
ALTER TABLE public.songs DROP COLUMN IF EXISTS category;