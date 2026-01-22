-- Add topics column to songs table
ALTER TABLE public.songs ADD COLUMN IF NOT EXISTS topics TEXT;