-- Add RLS policy to allow community managers to delete invitations
-- Drop existing DELETE policy if any
DROP POLICY IF EXISTS "Community managers can delete invitations" ON community_invitations;

-- Create policy allowing community managers to delete any invitation for their community
CREATE POLICY "Community managers can delete invitations"
ON community_invitations FOR DELETE
USING (
  invited_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM worship_communities wc
    WHERE wc.id = community_invitations.community_id
    AND wc.leader_id = auth.uid()
  )
  OR is_community_leader(auth.uid(), community_id)
  OR is_admin(auth.uid())
);