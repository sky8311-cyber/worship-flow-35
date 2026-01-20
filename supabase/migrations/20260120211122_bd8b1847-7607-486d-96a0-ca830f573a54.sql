-- Create function to check if a viewer can see a private song in a worship set
CREATE OR REPLACE FUNCTION public.can_view_private_song(
  _viewer_id uuid,
  _song_id uuid,
  _set_community_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM songs s
    WHERE s.id = _song_id
    AND (
      -- Public songs are visible to all
      (s.is_private = false OR s.is_private IS NULL)
      OR
      -- Private songs - visible to owner
      (s.is_private = true AND s.created_by = _viewer_id)
      OR
      -- Private songs - visible to same community members
      (s.is_private = true AND _set_community_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = _set_community_id
        AND cm.user_id = _viewer_id
        -- Song owner must also be in the same community
        AND EXISTS (
          SELECT 1 FROM community_members cm2
          WHERE cm2.community_id = _set_community_id
          AND cm2.user_id = s.created_by
        )
      ))
    )
  )
$$;