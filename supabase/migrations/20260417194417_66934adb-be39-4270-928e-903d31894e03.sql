ALTER TABLE public.set_songs
  ADD COLUMN IF NOT EXISTS score_ref_url TEXT,
  ADD COLUMN IF NOT EXISTS score_ref_thumbnail TEXT,
  ADD COLUMN IF NOT EXISTS private_score_file_url TEXT;