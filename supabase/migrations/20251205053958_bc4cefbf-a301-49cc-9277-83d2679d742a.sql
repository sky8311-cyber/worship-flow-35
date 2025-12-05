-- Allow viewing profiles of users on the seed leaderboard (public achievement display)
CREATE POLICY "Can view leaderboard user profiles"
ON public.profiles FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM user_seeds 
    WHERE user_seeds.user_id = profiles.id 
    AND user_seeds.total_seeds > 0
  )
);