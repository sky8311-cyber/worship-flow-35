-- Fix set_songs RLS policy to allow community members to view published sets
-- Drop the old policy
DROP POLICY IF EXISTS "View set songs" ON public.set_songs;

-- Create updated policy that allows community members to view songs from published sets
CREATE POLICY "View set songs"
ON public.set_songs
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM service_sets ss
    LEFT JOIN community_members cm ON cm.community_id = ss.community_id
    WHERE ss.id = set_songs.service_set_id
    AND (
      -- Creator can view their own sets
      ss.created_by = auth.uid()
      OR
      -- Community members can view published sets
      (ss.status = 'published' AND cm.user_id = auth.uid())
      OR
      -- Collaborators can view sets they're invited to
      is_set_collaborator(auth.uid(), ss.id)
      OR
      -- Admins can view all
      is_admin(auth.uid())
    )
  )
);