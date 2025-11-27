-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Leaders and admins can update members" ON community_members;
DROP POLICY IF EXISTS "Leaders, community leaders, and self can remove members" ON community_members;

-- Recreate UPDATE policy using is_community_leader() SECURITY DEFINER function
CREATE POLICY "Leaders and admins can update members" 
ON community_members
FOR UPDATE
USING (
  -- Community owner can update
  (EXISTS (
    SELECT 1 FROM worship_communities wc
    WHERE wc.id = community_members.community_id 
    AND wc.leader_id = auth.uid()
  ))
  OR is_admin(auth.uid())
  -- Use SECURITY DEFINER function to avoid recursion
  OR is_community_leader(auth.uid(), community_members.community_id)
)
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM worship_communities wc
    WHERE wc.id = community_members.community_id 
    AND wc.leader_id = auth.uid()
  ))
  OR is_admin(auth.uid())
  OR is_community_leader(auth.uid(), community_members.community_id)
);

-- Recreate DELETE policy using is_community_leader() SECURITY DEFINER function
CREATE POLICY "Leaders, community leaders, and self can remove members" 
ON community_members
FOR DELETE
USING (
  -- Self-removal allowed
  (auth.uid() = user_id)
  -- Community owner can remove
  OR (EXISTS (
    SELECT 1 FROM worship_communities wc
    WHERE wc.id = community_members.community_id 
    AND wc.leader_id = auth.uid()
  ))
  OR is_admin(auth.uid())
  -- Use SECURITY DEFINER function to avoid recursion
  OR is_community_leader(auth.uid(), community_members.community_id)
);