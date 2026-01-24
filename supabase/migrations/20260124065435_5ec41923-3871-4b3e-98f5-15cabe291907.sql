-- 1. Drop existing SELECT policies
DROP POLICY IF EXISTS "Users can view their sets and community sets" ON service_sets;
DROP POLICY IF EXISTS "View set songs" ON set_songs;

-- 2. Create updated service_sets SELECT policy
-- Published sets are visible to ALL authenticated users (cross-community discovery)
CREATE POLICY "Users can view own, collaborator, or published sets"
ON service_sets FOR SELECT
TO public
USING (
  created_by = auth.uid() OR 
  is_set_collaborator(auth.uid(), id) OR 
  is_admin(auth.uid()) OR 
  status = 'published'
);

-- 3. Create updated set_songs SELECT policy
-- Songs from published sets are visible to all authenticated users
CREATE POLICY "View set songs"
ON set_songs FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM service_sets ss
    WHERE ss.id = set_songs.service_set_id 
    AND (
      ss.created_by = auth.uid() OR 
      ss.status = 'published' OR
      is_set_collaborator(auth.uid(), ss.id) OR 
      is_admin(auth.uid())
    )
  )
);