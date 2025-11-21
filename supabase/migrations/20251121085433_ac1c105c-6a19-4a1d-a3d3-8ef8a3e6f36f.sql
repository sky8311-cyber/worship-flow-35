-- Remove BPM, time signature, and energy level from songs table
ALTER TABLE songs 
DROP COLUMN IF EXISTS bpm,
DROP COLUMN IF EXISTS time_signature,
DROP COLUMN IF EXISTS energy_level;

-- Add BPM, time signature, and energy level to set_songs table
ALTER TABLE set_songs
ADD COLUMN IF NOT EXISTS bpm integer,
ADD COLUMN IF NOT EXISTS time_signature text,
ADD COLUMN IF NOT EXISTS energy_level integer;