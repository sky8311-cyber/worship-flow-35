-- Initialize all existing users with Level 1 seed records
INSERT INTO public.user_seeds (user_id, total_seeds, current_level)
SELECT id, 0, 1 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Award retroactive profile setup achievement (profile_setup: 50 seeds)
WITH profile_users AS (
  SELECT id FROM public.profiles
  WHERE full_name IS NOT NULL AND bio IS NOT NULL AND location IS NOT NULL
)
INSERT INTO public.seed_achievements (user_id, achievement_type)
SELECT id, 'profile_setup'::seed_activity_type FROM profile_users
ON CONFLICT DO NOTHING;

-- Award retroactive avatar upload achievement (avatar_upload: 30 seeds)
WITH avatar_users AS (
  SELECT id FROM public.profiles WHERE avatar_url IS NOT NULL
)
INSERT INTO public.seed_achievements (user_id, achievement_type)
SELECT id, 'avatar_upload'::seed_activity_type FROM avatar_users
ON CONFLICT DO NOTHING;

-- Award retroactive first song achievements (first_song_added: 30 seeds)
WITH first_song_users AS (
  SELECT DISTINCT created_by FROM public.songs WHERE created_by IS NOT NULL
)
INSERT INTO public.seed_achievements (user_id, achievement_type)
SELECT created_by, 'first_song_added'::seed_activity_type FROM first_song_users
ON CONFLICT DO NOTHING;

-- Award retroactive first set created achievements (first_set_created: 30 seeds)
WITH first_set_users AS (
  SELECT DISTINCT created_by FROM public.service_sets WHERE created_by IS NOT NULL
)
INSERT INTO public.seed_achievements (user_id, achievement_type)
SELECT created_by, 'first_set_created'::seed_activity_type FROM first_set_users
ON CONFLICT DO NOTHING;

-- Award retroactive first set published achievements (first_set_published: 40 seeds)
WITH first_published_users AS (
  SELECT DISTINCT created_by FROM public.service_sets 
  WHERE created_by IS NOT NULL AND status = 'published'
)
INSERT INTO public.seed_achievements (user_id, achievement_type)
SELECT created_by, 'first_set_published'::seed_activity_type FROM first_published_users
ON CONFLICT DO NOTHING;

-- Award retroactive first community post achievements (first_community_post: 20 seeds)
WITH first_post_users AS (
  SELECT DISTINCT author_id FROM public.community_posts WHERE author_id IS NOT NULL
)
INSERT INTO public.seed_achievements (user_id, achievement_type)
SELECT author_id, 'first_community_post'::seed_activity_type FROM first_post_users
ON CONFLICT DO NOTHING;

-- Calculate and update total seeds based on achievements
UPDATE public.user_seeds us
SET total_seeds = (
  SELECT COALESCE(SUM(
    CASE sa.achievement_type
      WHEN 'profile_setup' THEN 50
      WHEN 'avatar_upload' THEN 30
      WHEN 'first_song_added' THEN 30
      WHEN 'first_set_created' THEN 30
      WHEN 'first_set_published' THEN 40
      WHEN 'first_community_post' THEN 20
      ELSE 0
    END
  ), 0)
  FROM public.seed_achievements sa
  WHERE sa.user_id = us.user_id
),
updated_at = now();

-- Recalculate levels based on total seeds
UPDATE public.user_seeds us
SET current_level = (
  SELECT level FROM public.seed_levels sl
  WHERE us.total_seeds >= sl.min_seeds 
    AND (sl.max_seeds IS NULL OR us.total_seeds <= sl.max_seeds)
  ORDER BY level DESC
  LIMIT 1
),
updated_at = now();