-- Drop existing SELECT policy on service_sets
DROP POLICY IF EXISTS "Users can view their sets and community sets" ON public.service_sets;

-- Create new SELECT policy with proper draft visibility rules
-- Draft: only creator, collaborators, or admin can see
-- Published: community members can also see
CREATE POLICY "Users can view their sets and community sets" 
ON public.service_sets 
FOR SELECT 
USING (
  (created_by = auth.uid()) 
  OR is_set_collaborator(auth.uid(), id) 
  OR is_admin(auth.uid())
  OR (status = 'published' AND community_id IS NOT NULL AND is_community_member(auth.uid(), community_id))
);