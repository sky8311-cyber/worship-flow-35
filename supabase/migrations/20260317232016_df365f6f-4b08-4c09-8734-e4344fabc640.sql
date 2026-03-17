CREATE TABLE room_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES room_posts(id) ON DELETE CASCADE NOT NULL,
  author_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE room_post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Can read comments on viewable posts"
ON room_post_comments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM room_posts rp
    JOIN worship_rooms wr ON wr.id = rp.room_id
    WHERE rp.id = room_post_comments.post_id
    AND can_view_room(wr.id, auth.uid())
  )
);

CREATE POLICY "Authenticated users can comment"
ON room_post_comments FOR INSERT TO authenticated
WITH CHECK (author_user_id = auth.uid());

CREATE POLICY "Authors can delete own comments"
ON room_post_comments FOR DELETE TO authenticated
USING (author_user_id = auth.uid());