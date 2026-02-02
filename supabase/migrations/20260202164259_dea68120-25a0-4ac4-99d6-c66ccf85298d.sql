-- Update notify_leaders_new_song() to only notify admins for private songs
CREATE OR REPLACE FUNCTION public.notify_leaders_new_song()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  actor_profile RECORD;
BEGIN
  -- Get the profile of the user who added the song
  IF NEW.created_by IS NOT NULL THEN
    SELECT full_name, avatar_url INTO actor_profile
    FROM profiles
    WHERE id = NEW.created_by;
  END IF;
  
  -- For private songs, only notify admins
  -- For public songs, notify admins and worship leaders
  INSERT INTO notifications (user_id, type, title, message, related_id, related_type, metadata)
  SELECT DISTINCT ON (ur.user_id)
    ur.user_id,
    'new_song',
    'New Song Added',
    'added a new song to the library',
    NEW.id,
    'song',
    jsonb_build_object(
      'song_title', NEW.title,
      'song_artist', NEW.artist,
      'actor_name', COALESCE(actor_profile.full_name, 'A user'),
      'actor_avatar', actor_profile.avatar_url,
      'is_private', COALESCE(NEW.is_private, false)
    )
  FROM user_roles ur
  WHERE (
    -- Private songs: only notify admins
    (NEW.is_private = true AND ur.role = 'admin')
    OR
    -- Public songs: notify admins and worship leaders
    (COALESCE(NEW.is_private, false) = false AND ur.role IN ('admin', 'worship_leader'))
  )
  AND ur.user_id != NEW.created_by;  -- Don't notify the person who added the song
  
  RETURN NEW;
END;
$function$;