DROP POLICY IF EXISTS "Users can delete their own pending requests" ON community_join_requests;

CREATE POLICY "Users can delete their own join requests"
ON community_join_requests FOR DELETE
USING (user_id = auth.uid());