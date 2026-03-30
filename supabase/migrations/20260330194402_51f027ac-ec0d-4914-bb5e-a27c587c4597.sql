
-- 1. Drop auto-create worship room trigger and function
DROP TRIGGER IF EXISTS on_profile_created_create_room ON public.profiles;
DROP FUNCTION IF EXISTS public.create_default_worship_room();

-- 2. Delete empty worship_rooms (no posts, no spaces)
DELETE FROM public.worship_rooms wr
WHERE NOT EXISTS (SELECT 1 FROM public.room_posts rp WHERE rp.room_id = wr.id)
  AND NOT EXISTS (SELECT 1 FROM public.studio_spaces ss WHERE ss.room_id = wr.id);

-- 3. Add onboarding_completed column
ALTER TABLE public.worship_rooms
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- 4. Mark existing rooms (that survived deletion) as onboarding complete
UPDATE public.worship_rooms SET onboarding_completed = true WHERE onboarding_completed = false;
