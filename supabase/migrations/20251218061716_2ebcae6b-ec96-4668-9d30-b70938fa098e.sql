-- Fix notify_leaders_new_song to prevent duplicates for users with multiple roles
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
  
  -- Notify all admins and worship leaders (DISTINCT to prevent duplicates for users with multiple roles)
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
      'actor_avatar', actor_profile.avatar_url
    )
  FROM user_roles ur
  WHERE ur.role IN ('admin', 'worship_leader')
    AND ur.user_id != NEW.created_by;  -- Don't notify the person who added the song
  
  RETURN NEW;
END;
$function$;

-- Fix notify_invitation_accepted to prevent duplicates when owner is also a leader
CREATE OR REPLACE FUNCTION public.notify_invitation_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_community_name TEXT;
  v_invitee_name TEXT;
  v_invitee_avatar TEXT;
BEGIN
  -- Only proceed if status changed to accepted
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Get community name
    SELECT name INTO v_community_name
    FROM public.worship_communities
    WHERE id = NEW.community_id;
    
    -- Get invitee info
    SELECT full_name, avatar_url INTO v_invitee_name, v_invitee_avatar
    FROM public.profiles
    WHERE email = NEW.email;
    
    -- Notify community owner and leaders (using DISTINCT to prevent duplicates)
    INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type, metadata)
    SELECT DISTINCT user_id, 
      'invitation_accepted',
      'Invitation Accepted',
      v_invitee_name || ' accepted invitation to ' || v_community_name,
      NEW.community_id,
      'community',
      jsonb_build_object(
        'actor_name', v_invitee_name,
        'actor_avatar', v_invitee_avatar,
        'community_name', v_community_name
      )
    FROM (
      -- Community owner
      SELECT wc.leader_id AS user_id
      FROM public.worship_communities wc
      WHERE wc.id = NEW.community_id
      UNION
      -- Community leaders
      SELECT cm.user_id
      FROM public.community_members cm
      WHERE cm.community_id = NEW.community_id
        AND cm.role = 'community_leader'
    ) AS recipients;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Clean up existing duplicate notifications
DELETE FROM notifications n1
USING notifications n2
WHERE n1.id > n2.id
  AND n1.user_id = n2.user_id
  AND n1.related_id = n2.related_id
  AND n1.type = n2.type
  AND DATE_TRUNC('second', n1.created_at) = DATE_TRUNC('second', n2.created_at);