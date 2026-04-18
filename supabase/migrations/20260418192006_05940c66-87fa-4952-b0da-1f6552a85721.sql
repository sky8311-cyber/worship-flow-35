-- 1. Add is_primary to set_song_scores
ALTER TABLE public.set_song_scores
  ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false;

-- Ensure only one primary score per set_song
CREATE UNIQUE INDEX IF NOT EXISTS uniq_primary_score_per_set_song
  ON public.set_song_scores (set_song_id)
  WHERE is_primary = true;

-- 2. Add key sync columns to set_songs
ALTER TABLE public.set_songs
  ADD COLUMN IF NOT EXISTS score_key text,
  ADD COLUMN IF NOT EXISTS performance_key text,
  ADD COLUMN IF NOT EXISTS transpose_amount text;