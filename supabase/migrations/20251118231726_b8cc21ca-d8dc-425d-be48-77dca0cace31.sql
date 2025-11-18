-- Further simplify community_members policy to completely eliminate recursion
DROP POLICY IF EXISTS "View community members" ON community_members;

-- Create a completely recursion-free policy
CREATE POLICY "View community members"
ON community_members
FOR SELECT
USING (
  -- Users can see their own memberships
  user_id = auth.uid()
  OR
  -- Community leaders can see all members of their communities
  EXISTS (
    SELECT 1 FROM worship_communities wc
    WHERE wc.id = community_members.community_id
    AND wc.leader_id = auth.uid()
  )
);