-- Add lyrics column to songs table
ALTER TABLE public.songs ADD COLUMN lyrics text;

-- Add lyrics column to set_songs table
ALTER TABLE public.set_songs ADD COLUMN lyrics text;