-- Add device info and last saved time to set_edit_locks
ALTER TABLE public.set_edit_locks 
ADD COLUMN IF NOT EXISTS holder_device text,
ADD COLUMN IF NOT EXISTS last_saved_at timestamptz;