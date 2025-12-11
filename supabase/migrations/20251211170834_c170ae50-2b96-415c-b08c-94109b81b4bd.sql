-- Drop existing permissive storage policies on scores bucket
DROP POLICY IF EXISTS "Anyone can upload scores" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete scores" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update their scores" ON storage.objects;

-- Create secure storage policies for scores bucket
-- Only authenticated worship leaders can upload scores
CREATE POLICY "Worship leaders can upload scores"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'scores' 
  AND auth.role() = 'authenticated'
  AND (
    public.has_role(auth.uid(), 'worship_leader') 
    OR public.is_admin(auth.uid())
  )
);

-- Only worship leaders can update scores
CREATE POLICY "Worship leaders can update scores"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'scores' 
  AND auth.role() = 'authenticated'
  AND (
    public.has_role(auth.uid(), 'worship_leader') 
    OR public.is_admin(auth.uid())
  )
);

-- Only worship leaders can delete scores
CREATE POLICY "Worship leaders can delete scores"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'scores' 
  AND auth.role() = 'authenticated'
  AND (
    public.has_role(auth.uid(), 'worship_leader') 
    OR public.is_admin(auth.uid())
  )
);