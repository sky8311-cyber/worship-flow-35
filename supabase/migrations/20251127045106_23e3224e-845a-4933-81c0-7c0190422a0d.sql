-- Update RLS policy to allow admins and community_leaders to remove members
DROP POLICY IF EXISTS "Leaders can remove members" ON community_members;

CREATE POLICY "Leaders and community leaders can remove members"
ON community_members
FOR DELETE
USING (
  -- Community owner can remove members
  EXISTS (
    SELECT 1 FROM worship_communities wc
    WHERE wc.id = community_members.community_id 
    AND wc.leader_id = auth.uid()
  )
  OR
  -- Admins can remove members from any community
  is_admin(auth.uid())
  OR
  -- Community leaders can remove members from their community
  EXISTS (
    SELECT 1 FROM community_members cm
    WHERE cm.community_id = community_members.community_id
    AND cm.user_id = auth.uid()
    AND cm.role = 'community_leader'
  )
);