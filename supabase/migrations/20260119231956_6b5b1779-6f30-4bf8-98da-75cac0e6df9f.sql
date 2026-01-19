-- Worship Rooms Feature - Phase 1 Database Schema

-- 1. Enums
CREATE TYPE public.room_visibility AS ENUM ('private', 'friends', 'public');
CREATE TYPE public.friend_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE public.room_post_type AS ENUM ('prayer', 'concern', 'note', 'testimony', 'general');
CREATE TYPE public.room_reaction_type AS ENUM ('amen', 'praying', 'like');

-- 2. Add is_ambassador column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_ambassador BOOLEAN DEFAULT false;

-- 3. worship_rooms table
CREATE TABLE public.worship_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  visibility room_visibility NOT NULL DEFAULT 'friends',
  theme_config JSONB DEFAULT '{"wallpaper": "default", "backgroundColor": "#f8f9fa", "floorStyle": "wood", "decorations": []}',
  bgm_song_id UUID REFERENCES public.songs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner_user_id)
);

-- 4. room_posts table
CREATE TABLE public.room_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.worship_rooms(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_type room_post_type NOT NULL DEFAULT 'general',
  content TEXT NOT NULL,
  visibility room_visibility,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. room_reactions table
CREATE TABLE public.room_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.room_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type room_reaction_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- 6. friends table
CREATE TABLE public.friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status friend_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(requester_user_id, addressee_user_id),
  CHECK (requester_user_id != addressee_user_id)
);

-- 7. Helper Functions (SECURITY DEFINER)

-- Check if two users are friends
CREATE OR REPLACE FUNCTION public.are_friends(user_a UUID, user_b UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friends
    WHERE status = 'accepted'
      AND ((requester_user_id = user_a AND addressee_user_id = user_b)
        OR (requester_user_id = user_b AND addressee_user_id = user_a))
  );
$$;

-- Check if user can view a room
CREATE OR REPLACE FUNCTION public.can_view_room(room_id_param UUID, viewer_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  room_record RECORD;
BEGIN
  SELECT owner_user_id, visibility INTO room_record
  FROM public.worship_rooms WHERE id = room_id_param;
  
  IF NOT FOUND THEN RETURN FALSE; END IF;
  IF room_record.owner_user_id = viewer_id THEN RETURN TRUE; END IF;
  IF room_record.visibility = 'public' THEN RETURN TRUE; END IF;
  IF room_record.visibility = 'friends' THEN
    RETURN public.are_friends(viewer_id, room_record.owner_user_id);
  END IF;
  RETURN FALSE;
END;
$$;

-- Auto-create worship room for new users
CREATE OR REPLACE FUNCTION public.create_default_worship_room()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.worship_rooms (owner_user_id, visibility)
  VALUES (NEW.id, 'friends')
  ON CONFLICT (owner_user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to create room on profile creation
DROP TRIGGER IF EXISTS on_profile_created_create_room ON public.profiles;
CREATE TRIGGER on_profile_created_create_room
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_worship_room();

-- Update timestamp trigger for rooms
CREATE OR REPLACE FUNCTION public.update_worship_room_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_worship_rooms_updated_at
  BEFORE UPDATE ON public.worship_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_worship_room_updated_at();

CREATE TRIGGER update_room_posts_updated_at
  BEFORE UPDATE ON public.room_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_worship_room_updated_at();

CREATE TRIGGER update_friends_updated_at
  BEFORE UPDATE ON public.friends
  FOR EACH ROW
  EXECUTE FUNCTION public.update_worship_room_updated_at();

-- 8. RLS Policies

-- worship_rooms RLS
ALTER TABLE public.worship_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own room" ON public.worship_rooms
  FOR SELECT USING (owner_user_id = auth.uid());

CREATE POLICY "Users can update own room" ON public.worship_rooms
  FOR UPDATE USING (owner_user_id = auth.uid());

CREATE POLICY "Users can insert own room" ON public.worship_rooms
  FOR INSERT WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Anyone can view public rooms" ON public.worship_rooms
  FOR SELECT USING (visibility = 'public');

CREATE POLICY "Friends can view friends-only rooms" ON public.worship_rooms
  FOR SELECT USING (
    visibility = 'friends' AND 
    public.are_friends(auth.uid(), owner_user_id)
  );

-- room_posts RLS
ALTER TABLE public.room_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authors can manage own posts" ON public.room_posts
  FOR ALL USING (author_user_id = auth.uid());

CREATE POLICY "View posts based on room visibility" ON public.room_posts
  FOR SELECT USING (
    public.can_view_room(room_id, auth.uid())
  );

CREATE POLICY "Can post if can view room" ON public.room_posts
  FOR INSERT WITH CHECK (
    public.can_view_room(room_id, auth.uid())
  );

-- room_reactions RLS
ALTER TABLE public.room_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reactions" ON public.room_reactions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "View reactions on viewable posts" ON public.room_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.room_posts rp
      WHERE rp.id = post_id
      AND public.can_view_room(rp.room_id, auth.uid())
    )
  );

-- friends RLS
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friend relationships" ON public.friends
  FOR SELECT USING (
    requester_user_id = auth.uid() OR addressee_user_id = auth.uid()
  );

CREATE POLICY "Users can send friend requests" ON public.friends
  FOR INSERT WITH CHECK (requester_user_id = auth.uid());

CREATE POLICY "Users can update friend requests they received" ON public.friends
  FOR UPDATE USING (addressee_user_id = auth.uid());

CREATE POLICY "Users can delete own friend relationships" ON public.friends
  FOR DELETE USING (
    requester_user_id = auth.uid() OR addressee_user_id = auth.uid()
  );

-- 9. Indexes for performance
CREATE INDEX idx_worship_rooms_owner ON public.worship_rooms(owner_user_id);
CREATE INDEX idx_worship_rooms_visibility ON public.worship_rooms(visibility);
CREATE INDEX idx_room_posts_room ON public.room_posts(room_id);
CREATE INDEX idx_room_posts_author ON public.room_posts(author_user_id);
CREATE INDEX idx_room_reactions_post ON public.room_reactions(post_id);
CREATE INDEX idx_friends_requester ON public.friends(requester_user_id);
CREATE INDEX idx_friends_addressee ON public.friends(addressee_user_id);
CREATE INDEX idx_friends_status ON public.friends(status);
CREATE INDEX idx_profiles_ambassador ON public.profiles(is_ambassador) WHERE is_ambassador = true;

-- 10. Create rooms for existing users
INSERT INTO public.worship_rooms (owner_user_id, visibility)
SELECT id, 'friends'
FROM public.profiles
WHERE NOT EXISTS (
  SELECT 1 FROM public.worship_rooms WHERE owner_user_id = profiles.id
)
ON CONFLICT (owner_user_id) DO NOTHING;