-- Create song_youtube_links table for multiple YouTube links with custom labels
CREATE TABLE public.song_youtube_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  position INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.song_youtube_links ENABLE ROW LEVEL SECURITY;

-- Anyone can view youtube links
CREATE POLICY "Anyone can view youtube links" 
ON public.song_youtube_links 
FOR SELECT 
USING (true);

-- Worship leaders can insert youtube links
CREATE POLICY "Worship leaders can insert youtube links" 
ON public.song_youtube_links 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'worship_leader') OR is_admin(auth.uid()));

-- Worship leaders can update youtube links
CREATE POLICY "Worship leaders can update youtube links" 
ON public.song_youtube_links 
FOR UPDATE 
USING (has_role(auth.uid(), 'worship_leader') OR is_admin(auth.uid()));

-- Worship leaders can delete youtube links
CREATE POLICY "Worship leaders can delete youtube links" 
ON public.song_youtube_links 
FOR DELETE 
USING (has_role(auth.uid(), 'worship_leader') OR is_admin(auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_song_youtube_links_song_id ON public.song_youtube_links(song_id);