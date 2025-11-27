-- Add UPDATE policy for community_members (currently missing)
CREATE POLICY "Leaders and admins can update members"
ON community_members
FOR UPDATE
USING (
  -- Community owner can update members
  EXISTS (
    SELECT 1 FROM worship_communities wc
    WHERE wc.id = community_members.community_id 
    AND wc.leader_id = auth.uid()
  )
  OR
  -- Admins can update members from any community
  is_admin(auth.uid())
  OR
  -- Community leaders can update members in their community
  EXISTS (
    SELECT 1 FROM community_members cm
    WHERE cm.community_id = community_members.community_id
    AND cm.user_id = auth.uid()
    AND cm.role = 'community_leader'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM worship_communities wc
    WHERE wc.id = community_members.community_id 
    AND wc.leader_id = auth.uid()
  )
  OR
  is_admin(auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM community_members cm
    WHERE cm.community_id = community_members.community_id
    AND cm.user_id = auth.uid()
    AND cm.role = 'community_leader'
  )
);

-- Update DELETE policy to also allow self-removal
DROP POLICY IF EXISTS "Leaders and community leaders can remove members" ON community_members;

CREATE POLICY "Leaders, community leaders, and self can remove members"
ON community_members
FOR DELETE
USING (
  -- Users can remove themselves (leave community)
  auth.uid() = user_id
  OR
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