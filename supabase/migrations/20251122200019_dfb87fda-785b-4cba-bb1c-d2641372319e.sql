
-- Phase 1 & 4: Fix RLS policies for worship set visibility and editing

-- First, let's fix the SELECT policy to allow community members to view published sets
DROP POLICY IF EXISTS "View service sets" ON service_sets;

CREATE POLICY "View service sets" 
ON service_sets FOR SELECT
USING (
  -- Published sets visible to community members
  (
    status = 'published' 
    AND is_community_member(auth.uid(), community_id)
  )
  OR
  -- Draft sets visible to creator, collaborators, and admins
  (
    status = 'draft' 
    AND (
      created_by = auth.uid() 
      OR is_admin(auth.uid()) 
      OR is_set_collaborator(auth.uid(), id)
    )
  )
  OR
  -- Admins can see everything
  is_admin(auth.uid())
);

-- Now, let's fix the UPDATE policy to restrict editing to authorized users only
DROP POLICY IF EXISTS "Update service sets" ON service_sets;

CREATE POLICY "Update service sets" 
ON service_sets FOR UPDATE
USING (
  created_by = auth.uid() 
  OR is_admin(auth.uid()) 
  OR is_set_collaborator(auth.uid(), id)
  OR (
    -- Community leaders can edit sets in their community
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = service_sets.community_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'community_leader'
    )
  )
);
