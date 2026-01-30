-- Drop existing policy
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;

-- Create updated policy with join request visibility
CREATE POLICY "Users can view profiles" ON profiles FOR SELECT USING (
  -- 1. Can view own profile
  (auth.uid() = id) OR 
  
  -- 2. Can view profiles of users in same communities
  (EXISTS (
    SELECT 1 FROM community_members cm1
    JOIN community_members cm2 ON (cm1.community_id = cm2.community_id)
    WHERE (cm1.user_id = auth.uid()) AND (cm2.user_id = profiles.id)
  )) OR
  
  -- 3. NEW: Community managers can view profiles of users who requested to join their community
  (EXISTS (
    SELECT 1 FROM community_join_requests cjr
    JOIN community_members cm ON cjr.community_id = cm.community_id
    WHERE cjr.user_id = profiles.id
      AND cjr.status = 'pending'
      AND cm.user_id = auth.uid()
      AND cm.role IN ('community_leader', 'admin', 'owner')
  ))
);