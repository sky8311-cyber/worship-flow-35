
-- =============================================
-- Studio v2 Phase A: Database Foundation
-- =============================================

-- 1. studio_spaces
CREATE TABLE public.studio_spaces (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id              uuid NOT NULL REFERENCES public.worship_rooms(id) ON DELETE CASCADE,
  name                 text NOT NULL DEFAULT '새 공간',
  icon                 text NOT NULL DEFAULT '📌',
  color                text NOT NULL DEFAULT '#b8902a',
  sort_order           integer NOT NULL DEFAULT 0,
  visibility           text NOT NULL DEFAULT 'public',
  guestbook_enabled    boolean NOT NULL DEFAULT false,
  guestbook_permission text NOT NULL DEFAULT 'all',
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

CREATE INDEX idx_studio_spaces_room_id ON public.studio_spaces(room_id, sort_order);

CREATE OR REPLACE FUNCTION public.validate_studio_space_fields()
  RETURNS trigger LANGUAGE plpgsql AS $function$
BEGIN
  IF NEW.visibility NOT IN ('private', 'friends', 'public') THEN
    RAISE EXCEPTION 'visibility must be private, friends, or public, got: %', NEW.visibility;
  END IF;
  IF NEW.guestbook_permission NOT IN ('all', 'friends') THEN
    RAISE EXCEPTION 'guestbook_permission must be all or friends, got: %', NEW.guestbook_permission;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_validate_studio_space
  BEFORE INSERT OR UPDATE ON public.studio_spaces
  FOR EACH ROW EXECUTE FUNCTION public.validate_studio_space_fields();

CREATE TRIGGER trg_studio_spaces_updated_at
  BEFORE UPDATE ON public.studio_spaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.studio_spaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spaces_select" ON public.studio_spaces FOR SELECT TO authenticated
  USING (room_id IN (
    SELECT id FROM public.worship_rooms
    WHERE owner_user_id = auth.uid() OR visibility = 'public'
  ));

CREATE POLICY "spaces_insert" ON public.studio_spaces FOR INSERT TO authenticated
  WITH CHECK (room_id IN (SELECT id FROM public.worship_rooms WHERE owner_user_id = auth.uid()));

CREATE POLICY "spaces_update" ON public.studio_spaces FOR UPDATE TO authenticated
  USING (room_id IN (SELECT id FROM public.worship_rooms WHERE owner_user_id = auth.uid()));

CREATE POLICY "spaces_delete" ON public.studio_spaces FOR DELETE TO authenticated
  USING (room_id IN (SELECT id FROM public.worship_rooms WHERE owner_user_id = auth.uid()));

-- 2. space_blocks
CREATE TABLE public.space_blocks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id    uuid NOT NULL REFERENCES public.studio_spaces(id) ON DELETE CASCADE,
  block_type  text NOT NULL,
  pos_x       integer NOT NULL DEFAULT 0,
  pos_y       integer NOT NULL DEFAULT 0,
  size_w      integer NOT NULL DEFAULT 200,
  size_h      integer NOT NULL DEFAULT 150,
  z_index     integer NOT NULL DEFAULT 1,
  content     jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_space_blocks_space_id ON public.space_blocks(space_id);

CREATE TRIGGER trg_space_blocks_updated_at
  BEFORE UPDATE ON public.space_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.space_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "space_blocks_select" ON public.space_blocks FOR SELECT TO authenticated
  USING (space_id IN (
    SELECT ss.id FROM public.studio_spaces ss
    JOIN public.worship_rooms wr ON wr.id = ss.room_id
    WHERE wr.owner_user_id = auth.uid() OR wr.visibility = 'public'
  ));

CREATE POLICY "space_blocks_insert" ON public.space_blocks FOR INSERT TO authenticated
  WITH CHECK (space_id IN (
    SELECT ss.id FROM public.studio_spaces ss
    JOIN public.worship_rooms wr ON wr.id = ss.room_id
    WHERE wr.owner_user_id = auth.uid()
  ));

CREATE POLICY "space_blocks_update" ON public.space_blocks FOR UPDATE TO authenticated
  USING (space_id IN (
    SELECT ss.id FROM public.studio_spaces ss
    JOIN public.worship_rooms wr ON wr.id = ss.room_id
    WHERE wr.owner_user_id = auth.uid()
  ));

CREATE POLICY "space_blocks_delete" ON public.space_blocks FOR DELETE TO authenticated
  USING (space_id IN (
    SELECT ss.id FROM public.studio_spaces ss
    JOIN public.worship_rooms wr ON wr.id = ss.room_id
    WHERE wr.owner_user_id = auth.uid()
  ));

-- 3. space_guestbook
CREATE TABLE public.space_guestbook (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id        uuid NOT NULL REFERENCES public.studio_spaces(id) ON DELETE CASCADE,
  author_user_id  uuid NOT NULL REFERENCES public.profiles(id),
  body            text NOT NULL,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_space_guestbook_space_id ON public.space_guestbook(space_id, created_at DESC);

ALTER TABLE public.space_guestbook ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guestbook_public_read" ON public.space_guestbook FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "guestbook_auth_insert" ON public.space_guestbook FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND author_user_id = auth.uid());

CREATE POLICY "guestbook_delete" ON public.space_guestbook FOR DELETE TO authenticated
  USING (
    author_user_id = auth.uid()
    OR space_id IN (
      SELECT ss.id FROM public.studio_spaces ss
      JOIN public.worship_rooms wr ON wr.id = ss.room_id
      WHERE wr.owner_user_id = auth.uid()
    )
  );
