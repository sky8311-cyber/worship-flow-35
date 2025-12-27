-- Add takeover request fields to set_edit_locks table
ALTER TABLE public.set_edit_locks 
ADD COLUMN IF NOT EXISTS takeover_requested_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS takeover_requested_at timestamptz,
ADD COLUMN IF NOT EXISTS takeover_requester_name text;