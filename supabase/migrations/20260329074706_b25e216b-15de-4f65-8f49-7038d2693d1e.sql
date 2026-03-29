
-- 1. Add guestbook columns to worship_rooms
ALTER TABLE public.worship_rooms
  ADD COLUMN IF NOT EXISTS guestbook_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS guestbook_permission text NOT NULL DEFAULT 'all';

-- 2. Create room_guestbook table
CREATE TABLE public.room_guestbook (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.worship_rooms(id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. Migrate existing data from space_guestbook to room_guestbook
INSERT INTO public.room_guestbook (id, room_id, author_user_id, body, created_at)
SELECT sg.id, ss.room_id, sg.author_user_id, sg.body, sg.created_at
FROM public.space_guestbook sg
JOIN public.studio_spaces ss ON ss.id = sg.space_id;

-- 4. Enable RLS
ALTER TABLE public.room_guestbook ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies
CREATE POLICY "Anyone can read room guestbook"
  ON public.room_guestbook FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert guestbook entries"
  ON public.room_guestbook FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_user_id);

CREATE POLICY "Authors or room owners can delete guestbook entries"
  ON public.room_guestbook FOR DELETE
  TO authenticated
  USING (
    auth.uid() = author_user_id
    OR auth.uid() = (SELECT owner_user_id FROM public.worship_rooms WHERE id = room_id)
  );

-- 6. Index
CREATE INDEX idx_room_guestbook_room_id ON public.room_guestbook(room_id);
