-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Authors can delete own posts" ON public.community_posts;

-- Create new policy allowing authors, admins, and worship leaders to delete
CREATE POLICY "Authors, admins, and worship leaders can delete posts"
ON public.community_posts
FOR DELETE
TO authenticated
USING (
  auth.uid() = author_id OR 
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'worship_leader')
);