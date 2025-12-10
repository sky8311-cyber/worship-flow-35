-- Fix post_likes RLS policy: restrict to authenticated users only
DROP POLICY IF EXISTS "Users can view likes" ON post_likes;
CREATE POLICY "Authenticated users can view likes" ON post_likes 
FOR SELECT USING (auth.uid() IS NOT NULL);