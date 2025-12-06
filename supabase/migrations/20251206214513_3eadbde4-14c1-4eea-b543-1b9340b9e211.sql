-- Add RLS policy for community managers to delete join requests
CREATE POLICY "Community managers can delete join requests"
ON community_join_requests FOR DELETE
USING (
  is_community_leader(auth.uid(), community_id)
  OR EXISTS (
    SELECT 1 FROM worship_communities wc
    WHERE wc.id = community_join_requests.community_id
    AND wc.leader_id = auth.uid()
  )
  OR is_admin(auth.uid())
);