-- Update the trigger function message for better display format
CREATE OR REPLACE FUNCTION notify_leaders_new_song()
RETURNS trigger AS $$
DECLARE
  actor_profile RECORD;
BEGIN
  -- Get the profile of the user who added the song
  IF NEW.created_by IS NOT NULL THEN
    SELECT full_name, avatar_url INTO actor_profile
    FROM profiles
    WHERE id = NEW.created_by;
  END IF;
  
  -- Notify all admins and worship leaders
  INSERT INTO notifications (user_id, type, title, message, related_id, related_type, metadata)
  SELECT 
    ur.user_id,
    'new_song',
    'New Song Added',
    'added a new song to the library',
    NEW.id::text,
    'song',
    jsonb_build_object(
      'song_title', NEW.title,
      'song_artist', NEW.artist,
      'actor_name', COALESCE(actor_profile.full_name, 'A user'),
      'actor_avatar', actor_profile.avatar_url
    )
  FROM user_roles ur
  WHERE ur.role IN ('admin', 'worship_leader');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;