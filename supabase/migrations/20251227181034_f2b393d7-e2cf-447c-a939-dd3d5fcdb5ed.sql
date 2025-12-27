-- Create set_edit_locks table for managing edit sessions
CREATE TABLE public.set_edit_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id uuid NOT NULL UNIQUE REFERENCES public.service_sets(id) ON DELETE CASCADE,
  holder_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  holder_session_id text NOT NULL,
  holder_name text NOT NULL,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '2 minutes'),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add index for faster lookups
CREATE INDEX idx_set_edit_locks_set_id ON public.set_edit_locks(set_id);
CREATE INDEX idx_set_edit_locks_expires_at ON public.set_edit_locks(expires_at);

-- Enable RLS
ALTER TABLE public.set_edit_locks ENABLE ROW LEVEL SECURITY;

-- Anyone can read locks (to see who's editing)
CREATE POLICY "Anyone can read edit locks"
  ON public.set_edit_locks
  FOR SELECT
  USING (true);

-- Users can insert their own locks
CREATE POLICY "Users can create their own locks"
  ON public.set_edit_locks
  FOR INSERT
  WITH CHECK (auth.uid() = holder_user_id);

-- Users can update their own locks (for heartbeat)
CREATE POLICY "Users can update their own locks"
  ON public.set_edit_locks
  FOR UPDATE
  USING (auth.uid() = holder_user_id);

-- Users can delete their own locks OR expired locks
CREATE POLICY "Users can delete their own or expired locks"
  ON public.set_edit_locks
  FOR DELETE
  USING (auth.uid() = holder_user_id OR expires_at < now());

-- Enable realtime for live lock updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.set_edit_locks;