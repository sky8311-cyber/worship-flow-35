-- Drop existing SELECT policy
DROP POLICY IF EXISTS "View service sets" ON service_sets;

-- Create new SELECT policy that includes creator and collaborators
CREATE POLICY "View service sets" ON service_sets
FOR SELECT USING (
  (created_by = auth.uid())
  OR is_set_collaborator(auth.uid(), id)
  OR is_community_member(auth.uid(), community_id)
  OR is_admin(auth.uid())
);