-- Add is_private column to songs table (default false = public)
ALTER TABLE public.songs ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;

-- Update existing songs to be explicitly public
UPDATE public.songs SET is_private = FALSE WHERE is_private IS NULL;