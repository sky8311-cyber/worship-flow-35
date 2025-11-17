-- Drop existing permissive policy
DROP POLICY IF EXISTS "Enable all access for songs" ON songs;

-- New policy 1: All authenticated users can view songs
CREATE POLICY "Authenticated users can view songs"
ON songs
FOR SELECT
TO authenticated
USING (true);

-- New policy 2: Only worship leaders can insert songs
CREATE POLICY "Worship leaders can insert songs"
ON songs
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'worship_leader'::app_role) 
  OR public.is_admin(auth.uid())
);

-- New policy 3: Only worship leaders can update songs
CREATE POLICY "Worship leaders can update songs"
ON songs
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'worship_leader'::app_role) 
  OR public.is_admin(auth.uid())
);

-- New policy 4: Only worship leaders can delete songs
CREATE POLICY "Worship leaders can delete songs"
ON songs
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'worship_leader'::app_role) 
  OR public.is_admin(auth.uid())
);