-- Create notification trigger for new worship sets
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
BEGIN
  -- Only notify when status changes to 'published'
  IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status != 'published') THEN
    -- Get creator info
    SELECT full_name, avatar_url INTO v_creator_name, v_creator_avatar
    FROM public.profiles
    WHERE id = NEW.created_by;
    
    -- Get community name
    SELECT name INTO v_community_name
    FROM public.worship_communities
    WHERE id = NEW.community_id;
    
    -- Notify all community members except the creator
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

-- Create trigger for worship sets
CREATE TRIGGER trigger_notify_new_worship_set
AFTER INSERT OR UPDATE ON public.service_sets
FOR EACH ROW
EXECUTE FUNCTION notify_new_worship_set();

-- Create notification trigger for new calendar events
CREATE OR REPLACE FUNCTION public.notify_new_calendar_event()
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
BEGIN
  -- Get creator info
  SELECT full_name, avatar_url INTO v_creator_name, v_creator_avatar
  FROM public.profiles
  WHERE id = NEW.created_by;
  
  -- Get community name
  SELECT name INTO v_community_name
  FROM public.worship_communities
  WHERE id = NEW.community_id;
  
  -- Notify all community members except the creator
  FOR v_member IN 
    SELECT user_id FROM public.community_members 
    WHERE community_id = NEW.community_id AND user_id != NEW.created_by
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type, metadata)
    VALUES (
      v_member.user_id,
      'new_calendar_event',
      'New Event',
      v_creator_name || ' created a new event: ' || NEW.title,
      NEW.id,
      'calendar_event',
      jsonb_build_object(
        'actor_name', v_creator_name,
        'actor_avatar', v_creator_avatar,
        'community_name', v_community_name,
        'event_title', NEW.title,
        'event_date', NEW.event_date,
        'event_type', NEW.event_type
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for calendar events
CREATE TRIGGER trigger_notify_new_calendar_event
AFTER INSERT ON public.calendar_events
FOR EACH ROW
EXECUTE FUNCTION notify_new_calendar_event();