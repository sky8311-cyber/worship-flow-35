-- Fix community_members RLS policy to allow self-join via invite link
DROP POLICY IF EXISTS "Leaders can add members" ON community_members;

CREATE POLICY "Users can join communities or leaders can add members"
ON community_members
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow users to add themselves to a community
  user_id = auth.uid()
  OR
  -- Allow community leaders to add others
  EXISTS (
    SELECT 1 FROM worship_communities wc
    WHERE wc.id = community_members.community_id
      AND wc.leader_id = auth.uid()
  )
);