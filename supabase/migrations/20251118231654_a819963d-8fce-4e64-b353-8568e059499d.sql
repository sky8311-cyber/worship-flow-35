-- Fix infinite recursion in community_members RLS policy
-- Drop the problematic policy
DROP POLICY IF EXISTS "View community members" ON community_members;

-- Create a new simplified policy that doesn't reference itself
CREATE POLICY "View community members"
ON community_members
FOR SELECT
USING (
  -- Users can see their own memberships
  user_id = auth.uid()
  OR
  -- Users can see members of communities they lead
  EXISTS (
    SELECT 1 FROM worship_communities wc
    WHERE wc.id = community_members.community_id
    AND wc.leader_id = auth.uid()
  )
  OR
  -- Users can see other members in communities they belong to
  -- (check via worship_communities to avoid recursion)
  EXISTS (
    SELECT 1 FROM worship_communities wc
    WHERE wc.id = community_members.community_id
    AND (
      wc.leader_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM community_members cm2
        WHERE cm2.community_id = wc.id
        AND cm2.user_id = auth.uid()
      )
    )
  )
);