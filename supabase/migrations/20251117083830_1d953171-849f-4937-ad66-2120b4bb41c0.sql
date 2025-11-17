-- Step 1: Create enum types for set status and collaborator roles
CREATE TYPE set_status AS ENUM ('draft', 'published');
CREATE TYPE collaborator_role AS ENUM ('editor', 'viewer');

-- Step 2: Add status column to service_sets table
ALTER TABLE service_sets 
ADD COLUMN status set_status DEFAULT 'draft' NOT NULL;

-- Update existing data based on is_public
UPDATE service_sets 
SET status = CASE 
  WHEN is_public = true THEN 'published'::set_status 
  ELSE 'draft'::set_status 
END;

-- Step 3: Create set_collaborators table
CREATE TABLE set_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_set_id UUID NOT NULL REFERENCES service_sets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role collaborator_role DEFAULT 'editor' NOT NULL,
  invited_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(service_set_id, user_id)
);

-- Enable RLS on set_collaborators
ALTER TABLE set_collaborators ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS policies for set_collaborators
-- View collaborators if you're the creator or a collaborator
CREATE POLICY "View set collaborators"
ON set_collaborators FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM service_sets 
    WHERE id = service_set_id 
    AND (created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM set_collaborators sc 
      WHERE sc.service_set_id = service_sets.id 
      AND sc.user_id = auth.uid()
    ))
  )
);

-- Only set creator can add collaborators
CREATE POLICY "Add collaborators"
ON set_collaborators FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM service_sets 
    WHERE id = service_set_id AND created_by = auth.uid()
  )
);

-- Only set creator can remove collaborators
CREATE POLICY "Remove collaborators"
ON set_collaborators FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM service_sets 
    WHERE id = service_set_id AND created_by = auth.uid()
  )
);

-- Only set creator can update collaborator roles
CREATE POLICY "Update collaborators"
ON set_collaborators FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM service_sets 
    WHERE id = service_set_id AND created_by = auth.uid()
  )
);

-- Step 5: Update service_sets RLS policies
DROP POLICY IF EXISTS "View community service sets" ON service_sets;
DROP POLICY IF EXISTS "Update own service sets" ON service_sets;

-- New policy: Published sets visible to community members, Draft only to creator and collaborators
CREATE POLICY "View service sets"
ON service_sets FOR SELECT
USING (
  (status = 'published' AND (
    is_public = true OR 
    is_admin(auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = service_sets.community_id 
      AND cm.user_id = auth.uid()
    )
  ))
  OR
  (status = 'draft' AND (
    created_by = auth.uid() OR
    is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM set_collaborators 
      WHERE service_set_id = service_sets.id 
      AND user_id = auth.uid()
    )
  ))
);

-- Creator and editor collaborators can update
CREATE POLICY "Update service sets"
ON service_sets FOR UPDATE
USING (
  created_by = auth.uid() OR 
  is_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM set_collaborators 
    WHERE service_set_id = service_sets.id 
    AND user_id = auth.uid() 
    AND role = 'editor'
  )
);

-- Step 6: Add role column to community_invitations if not exists
ALTER TABLE community_invitations
ADD COLUMN IF NOT EXISTS role text DEFAULT 'member';