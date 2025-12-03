-- 1. Fix notification constraint to include join request types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS valid_notification_type;

ALTER TABLE notifications ADD CONSTRAINT valid_notification_type 
CHECK (type = ANY (ARRAY[
  'new_member'::text, 
  'invitation_accepted'::text, 
  'new_community'::text, 
  'new_song'::text, 
  'post_like'::text, 
  'comment'::text,
  'new_worship_set'::text,
  'new_calendar_event'::text,
  'birthday'::text,
  'level_up'::text,
  'join_request'::text,
  'join_approved'::text,
  'join_rejected'::text
]));

-- 2. CRITICAL: Fix insecure RLS policy on service_sets
DROP POLICY IF EXISTS "View service sets" ON service_sets;

CREATE POLICY "View service sets" ON service_sets
FOR SELECT USING (
  is_community_member(auth.uid(), community_id)
  OR is_admin(auth.uid())
);

-- 3. Create SECURITY DEFINER function for song usage history
CREATE OR REPLACE FUNCTION public.get_song_usage_sets(p_song_id uuid)
RETURNS TABLE (
  set_id uuid,
  service_name text,
  set_date date,
  community_id uuid,
  set_status text,
  created_by uuid,
  worship_leader text,
  song_position integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT 
    ss.id AS set_id,
    ss.service_name,
    ss.date AS set_date,
    ss.community_id,
    ss.status::text AS set_status,
    ss.created_by,
    ss.worship_leader,
    songs.position AS song_position
  FROM service_sets ss
  INNER JOIN set_songs songs ON songs.service_set_id = ss.id
  WHERE songs.song_id = p_song_id
    AND (
      is_community_member(auth.uid(), ss.community_id)
      OR (ss.status = 'published')
    )
  ORDER BY ss.date DESC
$$;