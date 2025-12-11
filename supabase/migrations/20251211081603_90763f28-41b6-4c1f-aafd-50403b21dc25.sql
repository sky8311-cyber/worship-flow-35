-- Update valid_notification_type constraint to include 'new_post'
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS valid_notification_type;

ALTER TABLE public.notifications ADD CONSTRAINT valid_notification_type 
CHECK (type IN (
  'new_member',
  'invitation_accepted',
  'new_community',
  'new_song',
  'post_like',
  'comment',
  'new_worship_set',
  'new_calendar_event',
  'birthday',
  'join_request',
  'join_approved',
  'join_rejected',
  'level_up',
  'new_post'
));

-- Create trigger function to notify community members of new posts
CREATE OR REPLACE FUNCTION public.notify_community_new_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_name TEXT;
  v_author_avatar TEXT;
  v_community_name TEXT;
  v_member RECORD;
BEGIN
  -- Get author info
  SELECT full_name, avatar_url INTO v_author_name, v_author_avatar
  FROM public.profiles
  WHERE id = NEW.author_id;
  
  -- Get community name
  SELECT name INTO v_community_name
  FROM public.worship_communities
  WHERE id = NEW.community_id;
  
  -- Notify all community members except the author
  FOR v_member IN 
    SELECT user_id FROM public.community_members 
    WHERE community_id = NEW.community_id AND user_id != NEW.author_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type, metadata)
    VALUES (
      v_member.user_id,
      'new_post',
      'New Post',
      v_author_name || ' posted in ' || v_community_name,
      NEW.id,
      'community_post',
      jsonb_build_object(
        'actor_name', v_author_name,
        'actor_avatar', v_author_avatar,
        'community_name', v_community_name,
        'post_preview', LEFT(NEW.content, 100)
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger on community_posts table
DROP TRIGGER IF EXISTS trigger_notify_community_new_post ON public.community_posts;

CREATE TRIGGER trigger_notify_community_new_post
  AFTER INSERT ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_community_new_post();