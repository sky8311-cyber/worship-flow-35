-- Drop the overly permissive SELECT policy on post_comments
DROP POLICY IF EXISTS "Users can view comments" ON public.post_comments;

-- Create a new secure SELECT policy that checks community membership
-- Comments are viewable only if the user is a member of the community that owns the content
CREATE POLICY "Community members can view comments"
ON public.post_comments
FOR SELECT
USING (
  -- For community_posts: check if user is a member of the post's community
  (post_type = 'community_post' AND EXISTS (
    SELECT 1 FROM public.community_posts cp
    JOIN public.community_members cm ON cm.community_id = cp.community_id
    WHERE cp.id = post_comments.post_id AND cm.user_id = auth.uid()
  ))
  OR
  -- For worship_sets: check if user is a member of the set's community
  (post_type = 'worship_set' AND EXISTS (
    SELECT 1 FROM public.service_sets ss
    JOIN public.community_members cm ON cm.community_id = ss.community_id
    WHERE ss.id = post_comments.post_id AND cm.user_id = auth.uid()
  ))
  OR
  -- For calendar_events: check if user is a member of the event's community
  (post_type = 'calendar_event' AND EXISTS (
    SELECT 1 FROM public.calendar_events ce
    JOIN public.community_members cm ON cm.community_id = ce.community_id
    WHERE ce.id = post_comments.post_id AND cm.user_id = auth.uid()
  ))
  OR
  -- Admins can view all comments
  public.is_admin(auth.uid())
  OR
  -- Authors can always view their own comments
  author_id = auth.uid()
);