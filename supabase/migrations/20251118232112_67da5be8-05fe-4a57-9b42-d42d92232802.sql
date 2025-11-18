-- Fix infinite recursion in set_collaborators RLS policy

-- Drop the existing recursive policy
DROP POLICY IF EXISTS "View set collaborators" ON public.set_collaborators;

-- Recreate a non-recursive, clear visibility policy
CREATE POLICY "View set collaborators"
ON public.set_collaborators
FOR SELECT
USING (
  -- Users can always see collaborator rows where they are the collaborator
  user_id = auth.uid()
  OR
  -- Creators of a service set can see all collaborators on their sets
  EXISTS (
    SELECT 1
    FROM public.service_sets ss
    WHERE ss.id = set_collaborators.service_set_id
      AND ss.created_by = auth.uid()
  )
  OR
  -- Admins can see all collaborators
  public.is_admin(auth.uid())
);
