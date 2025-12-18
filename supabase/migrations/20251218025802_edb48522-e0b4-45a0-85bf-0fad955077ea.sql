-- Update post_comments SELECT policy to support feedback_post type
DROP POLICY IF EXISTS "Community members can view comments" ON post_comments;

CREATE POLICY "Community members can view comments" ON post_comments
FOR SELECT TO authenticated USING (
  -- community_post: 커뮤니티 멤버만
  ((post_type = 'community_post'::text) AND (EXISTS (
    SELECT 1 FROM community_posts cp
    JOIN community_members cm ON cm.community_id = cp.community_id
    WHERE cp.id = post_comments.post_id AND cm.user_id = auth.uid()
  )))
  OR
  -- worship_set: 커뮤니티 멤버만  
  ((post_type = 'worship_set'::text) AND (EXISTS (
    SELECT 1 FROM service_sets ss
    JOIN community_members cm ON cm.community_id = ss.community_id
    WHERE ss.id = post_comments.post_id AND cm.user_id = auth.uid()
  )))
  OR
  -- calendar_event: 커뮤니티 멤버만
  ((post_type = 'calendar_event'::text) AND (EXISTS (
    SELECT 1 FROM calendar_events ce
    JOIN community_members cm ON cm.community_id = ce.community_id
    WHERE ce.id = post_comments.post_id AND cm.user_id = auth.uid()
  )))
  OR
  -- feedback_post: worship_leader, community_leader, admin만
  ((post_type = 'feedback_post'::text) AND (
    has_role(auth.uid(), 'worship_leader'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    is_any_community_leader(auth.uid())
  ))
  OR
  -- Admin은 모든 댓글 볼 수 있음
  is_admin(auth.uid())
  OR
  -- 본인이 작성한 댓글은 항상 볼 수 있음
  (author_id = auth.uid())
);