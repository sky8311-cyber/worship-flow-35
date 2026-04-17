-- Phase 1: Score Privacy Layer
-- Add score_is_public flag to song_scores (default false = private)
ALTER TABLE public.song_scores
  ADD COLUMN IF NOT EXISTS score_is_public BOOLEAN NOT NULL DEFAULT false;

-- Backfill: ensure all existing scores are private
UPDATE public.song_scores
  SET score_is_public = false
  WHERE score_is_public IS DISTINCT FROM false;

-- Mirror flag on legacy songs.score_file_url column for parity
ALTER TABLE public.songs
  ADD COLUMN IF NOT EXISTS score_is_public BOOLEAN NOT NULL DEFAULT false;

UPDATE public.songs
  SET score_is_public = false
  WHERE score_is_public IS DISTINCT FROM false;

-- Index for faster filtering when (eventually) any public scores exist
CREATE INDEX IF NOT EXISTS idx_song_scores_is_public
  ON public.song_scores(score_is_public)
  WHERE score_is_public = true;