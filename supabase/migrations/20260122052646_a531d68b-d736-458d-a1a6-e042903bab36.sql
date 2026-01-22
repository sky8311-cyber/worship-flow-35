-- Add score_key column to store the selected score key (may differ from performance key)
ALTER TABLE public.set_songs 
ADD COLUMN IF NOT EXISTS score_key TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.set_songs.score_key IS 'The score key selected by worship leader (may differ from performance key)';

-- Migrate existing data: extract score_key from override_score_file_url
UPDATE public.set_songs ss
SET score_key = (
  SELECT sc.key 
  FROM public.song_scores sc 
  WHERE sc.file_url = ss.override_score_file_url 
  LIMIT 1
)
WHERE ss.override_score_file_url IS NOT NULL 
  AND ss.score_key IS NULL;