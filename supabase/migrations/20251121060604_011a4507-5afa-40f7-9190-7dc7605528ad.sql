-- Step 1: Create helper function for community_leader check
CREATE OR REPLACE FUNCTION public.is_community_leader(_user_id uuid, _community_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.community_members
    WHERE user_id = _user_id 
      AND community_id = _community_id
      AND role = 'community_leader'
  )
$$;

-- Step 2: Update service_sets RLS policies to include community_leader
DROP POLICY IF EXISTS "Create service sets" ON public.service_sets;

CREATE POLICY "Create service sets"
ON public.service_sets
FOR INSERT
TO authenticated
WITH CHECK (
  -- worship_leader can create in all communities
  is_admin(auth.uid()) 
  OR has_role(auth.uid(), 'worship_leader'::app_role)
  OR (
    -- community_leader can only create in their community
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = service_sets.community_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'community_leader'
    )
  )
);

-- Step 3: Update songs INSERT policy to allow community_leader
DROP POLICY IF EXISTS "Worship leaders can insert songs" ON public.songs;

CREATE POLICY "Worship leaders can insert songs"
ON public.songs
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'worship_leader'::app_role) 
  OR is_admin(auth.uid())
  OR (
    -- community_leader can also add new songs
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.role = 'community_leader'
    )
  )
);

-- Step 4: Extend profiles table for social media style profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ministry_role text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instrument text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instagram_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS youtube_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_image_url text;

COMMENT ON COLUMN public.profiles.bio IS '자기소개 (최대 500자)';
COMMENT ON COLUMN public.profiles.location IS '교회/지역';
COMMENT ON COLUMN public.profiles.ministry_role IS '사역 역할';
COMMENT ON COLUMN public.profiles.instrument IS '악기/포지션';
COMMENT ON COLUMN public.profiles.instagram_url IS '인스타그램 프로필';
COMMENT ON COLUMN public.profiles.youtube_url IS '유튜브 채널';
COMMENT ON COLUMN public.profiles.cover_image_url IS '프로필 커버 이미지';

-- Step 5: Create profile-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Step 6: RLS policies for profile-images bucket
CREATE POLICY "Anyone can view profile images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload their own profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-images');

CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-images');

CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-images');