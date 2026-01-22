-- Update the notify_new_worship_set function to prevent duplicate notifications
-- when a worship set is published/unpublished multiple times within 24 hours

CREATE OR REPLACE FUNCTION public.notify_new_worship_set()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_creator_name TEXT;
  v_creator_avatar TEXT;
  v_community_name TEXT;
  v_member RECORD;
  v_recent_notification_exists BOOLEAN;
BEGIN
  IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status != 'published') THEN
    
    -- Check if a notification for this worship set was already sent within the last 24 hours
    SELECT EXISTS(
      SELECT 1 FROM public.notifications 
      WHERE related_id = NEW.id 
        AND related_type = 'worship_set'
        AND type = 'new_worship_set'
        AND created_at > NOW() - INTERVAL '24 hours'
    ) INTO v_recent_notification_exists;
    
    -- If a recent notification exists, skip sending duplicate notifications
    IF v_recent_notification_exists THEN
      RETURN NEW;
    END IF;
    
    -- Get creator info
    SELECT full_name, avatar_url INTO v_creator_name, v_creator_avatar
    FROM public.profiles WHERE id = NEW.created_by;
    
    -- Get community name
    SELECT name INTO v_community_name
    FROM public.worship_communities WHERE id = NEW.community_id;
    
    -- Send notification to all community members except the creator
    FOR v_member IN 
      SELECT user_id FROM public.community_members 
      WHERE community_id = NEW.community_id AND user_id != NEW.created_by
    LOOP
      INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type, metadata)
      VALUES (
        v_member.user_id, 
        'new_worship_set', 
        'New Worship Set',
        v_creator_name || ' published a new worship set in ' || v_community_name,
        NEW.id, 
        'worship_set',
        jsonb_build_object(
          'actor_name', v_creator_name,
          'actor_avatar', v_creator_avatar,
          'community_name', v_community_name,
          'set_name', NEW.service_name,
          'set_date', NEW.date
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;