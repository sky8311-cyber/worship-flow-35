-- Create song_enrichment_suggestions table
CREATE TABLE public.song_enrichment_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  
  -- Suggested data
  suggested_lyrics TEXT,
  suggested_key TEXT,
  suggested_topics TEXT[],
  
  -- Metadata
  lyrics_source TEXT,
  confidence TEXT DEFAULT 'medium',
  ai_notes TEXT,
  
  -- Status management
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'partial')),
  
  -- Applied fields tracking
  applied_fields TEXT[],
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id),
  review_notes TEXT,
  
  -- Only one pending suggestion per song
  CONSTRAINT unique_pending_per_song UNIQUE (song_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- Create index for faster queries
CREATE INDEX idx_enrichment_suggestions_status ON public.song_enrichment_suggestions(status);
CREATE INDEX idx_enrichment_suggestions_song_id ON public.song_enrichment_suggestions(song_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.song_enrichment_suggestions;

-- Enable RLS
ALTER TABLE public.song_enrichment_suggestions ENABLE ROW LEVEL SECURITY;

-- Admins can manage all suggestions
CREATE POLICY "Admins can manage enrichment suggestions"
  ON public.song_enrichment_suggestions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Worship leaders can view suggestions for songs they created
CREATE POLICY "Users can view their song suggestions"
  ON public.song_enrichment_suggestions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.songs WHERE id = song_id AND created_by = auth.uid()
  ));

-- Add enrichment tracking columns to songs table
ALTER TABLE public.songs ADD COLUMN IF NOT EXISTS enrichment_status TEXT DEFAULT 'none';
ALTER TABLE public.songs ADD COLUMN IF NOT EXISTS last_enrichment_at TIMESTAMPTZ;

-- Create function to check if song needs enrichment
CREATE OR REPLACE FUNCTION public.check_song_needs_enrichment()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if lyrics, key, or topics are missing
  IF (NEW.lyrics IS NULL OR NEW.lyrics = '') 
     OR (NEW.default_key IS NULL OR NEW.default_key = '')
     OR (NEW.topics IS NULL OR NEW.topics = '') THEN
    
    -- Only flag if not already pending and not recently processed
    IF (NEW.enrichment_status IS NULL OR NEW.enrichment_status NOT IN ('pending', 'enriched'))
       AND (NEW.last_enrichment_at IS NULL 
            OR NEW.last_enrichment_at < now() - interval '24 hours') THEN
      NEW.enrichment_status := 'needs_processing';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic detection
DROP TRIGGER IF EXISTS song_enrichment_check ON public.songs;
CREATE TRIGGER song_enrichment_check
  BEFORE INSERT OR UPDATE ON public.songs
  FOR EACH ROW
  EXECUTE FUNCTION public.check_song_needs_enrichment();