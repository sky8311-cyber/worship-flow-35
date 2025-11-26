-- Drop the restrictive existing policy on community_members
DROP POLICY IF EXISTS "View community members" ON community_members;

-- Create new policy allowing community members to see each other
CREATE POLICY "View community members"
ON community_members
FOR SELECT
USING (
  -- User can see their own membership
  (user_id = auth.uid())
  OR 
  -- User is a leader and can see all members
  (EXISTS (
    SELECT 1 FROM worship_communities wc
    WHERE wc.id = community_members.community_id 
    AND wc.leader_id = auth.uid()
  ))
  OR
  -- User is a member of the same community (can see other members)
  (EXISTS (
    SELECT 1 FROM community_members cm
    WHERE cm.community_id = community_members.community_id
    AND cm.user_id = auth.uid()
  ))
);