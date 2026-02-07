-- Drop the existing restrictive policy that excludes new members (seeds = 0)
DROP POLICY IF EXISTS "Can view leaderboard user profiles" ON profiles;

-- Create new policy: Authenticated users can view basic profiles for leaderboard
-- This allows all authenticated users to see new members too
CREATE POLICY "Authenticated users can view basic profiles for leaderboard"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);