-- Add friend_request and friend_accepted to notification types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS valid_notification_type;
ALTER TABLE public.notifications ADD CONSTRAINT valid_notification_type CHECK (
  type = ANY (ARRAY[
    'new_member', 'invitation_accepted', 'new_community', 'new_song',
    'post_like', 'comment', 'new_worship_set', 'new_calendar_event',
    'birthday', 'join_request', 'join_approved', 'join_rejected',
    'level_up', 'new_post', 'new_worship_leader_application',
    'post_comment', 'collaborator_invited', 'promoted_to_owner',
    'promoted_to_community_leader', 'promoted_to_worship_leader',
    'demoted_to_member', 'support_reply', 'event_reminder',
    'friend_request', 'friend_accepted'
  ])
);

-- Trigger: notify on friend request INSERT
CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requester_name TEXT;
BEGIN
  IF NEW.status = 'pending' THEN
    SELECT full_name INTO requester_name FROM public.profiles WHERE id = NEW.requester_user_id;
    INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type)
    VALUES (
      NEW.addressee_user_id,
      'friend_request',
      COALESCE(requester_name, 'Someone') || ' wants to be neighbors',
      COALESCE(requester_name, 'Someone') || '님이 이웃 신청을 보냈습니다.',
      NEW.id,
      'friend'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_friend_request ON public.friends;
CREATE TRIGGER on_friend_request
  AFTER INSERT ON public.friends
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_friend_request();

-- Trigger: notify on friend accepted
CREATE OR REPLACE FUNCTION public.notify_friend_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  accepter_name TEXT;
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    SELECT full_name INTO accepter_name FROM public.profiles WHERE id = NEW.addressee_user_id;
    INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type)
    VALUES (
      NEW.requester_user_id,
      'friend_accepted',
      COALESCE(accepter_name, 'Someone') || ' accepted your neighbor request',
      COALESCE(accepter_name, 'Someone') || '님이 이웃 신청을 수락했습니다.',
      NEW.id,
      'friend'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_friend_accepted ON public.friends;
CREATE TRIGGER on_friend_accepted
  AFTER UPDATE ON public.friends
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_friend_accepted();