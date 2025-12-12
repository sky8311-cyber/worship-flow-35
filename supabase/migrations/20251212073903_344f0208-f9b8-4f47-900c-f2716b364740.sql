-- Add key_change_to column to set_songs for key changes during songs
ALTER TABLE public.set_songs
ADD COLUMN key_change_to text;