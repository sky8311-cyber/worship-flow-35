-- Create song_scores table for multiple score files per song with key variations
CREATE TABLE IF NOT EXISTS song_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT DEFAULT 'image',
  page_number INTEGER DEFAULT 1,
  position INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_song_scores_song_id ON song_scores(song_id);
CREATE INDEX IF NOT EXISTS idx_song_scores_key ON song_scores(key);

-- Enable RLS
ALTER TABLE song_scores ENABLE ROW LEVEL SECURITY;

-- RLS policies (same as songs table)
CREATE POLICY "Anyone can view song scores"
  ON song_scores FOR SELECT
  USING (true);

CREATE POLICY "Worship leaders can manage song scores"
  ON song_scores FOR ALL
  USING (has_role(auth.uid(), 'worship_leader'::app_role) OR is_admin(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'worship_leader'::app_role) OR is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_song_scores_updated_at
  BEFORE UPDATE ON song_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Keep songs.score_file_url for backward compatibility (will be migrated later)