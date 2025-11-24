-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  related_type TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB,
  CONSTRAINT valid_notification_type CHECK (type IN (
    'new_member', 
    'invitation_accepted', 
    'new_community', 
    'new_song', 
    'post_like', 
    'comment'
  ))
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger function for new member notifications
CREATE OR REPLACE FUNCTION public.notify_admins_new_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert notification for all admins
  INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type, metadata)
  SELECT 
    ur.user_id,
    'new_member',
    'New Member Joined',
    NEW.full_name || ' has joined K-Worship',
    NEW.id,
    'member',
    jsonb_build_object(
      'actor_name', NEW.full_name,
      'actor_avatar', NEW.avatar_url,
      'actor_email', NEW.email
    )
  FROM public.user_roles ur
  WHERE ur.role = 'admin';
  
  RETURN NEW;
END;
$$;

-- Trigger function for invitation accepted notifications
CREATE OR REPLACE FUNCTION public.notify_invitation_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    
    -- Notify community leader (owner)
    INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type, metadata)
    SELECT 
      wc.leader_id,
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
    FROM public.worship_communities wc
    WHERE wc.id = NEW.community_id;
    
    -- Notify community leaders
    INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type, metadata)
    SELECT 
      cm.user_id,
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
    FROM public.community_members cm
    WHERE cm.community_id = NEW.community_id
      AND cm.role = 'community_leader';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger function for new community notifications
CREATE OR REPLACE FUNCTION public.notify_admins_new_community()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator_name TEXT;
  v_creator_avatar TEXT;
BEGIN
  -- Get creator info
  SELECT full_name, avatar_url INTO v_creator_name, v_creator_avatar
  FROM public.profiles
  WHERE id = NEW.leader_id;
  
  -- Insert notification for all admins
  INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type, metadata)
  SELECT 
    ur.user_id,
    'new_community',
    'New Community Created',
    v_creator_name || ' created community "' || NEW.name || '"',
    NEW.id,
    'community',
    jsonb_build_object(
      'actor_name', v_creator_name,
      'actor_avatar', v_creator_avatar,
      'community_name', NEW.name
    )
  FROM public.user_roles ur
  WHERE ur.role = 'admin';
  
  RETURN NEW;
END;
$$;

-- Trigger function for new song notifications
CREATE OR REPLACE FUNCTION public.notify_leaders_new_song()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert notification for all admins and worship leaders
  INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type, metadata)
  SELECT 
    ur.user_id,
    'new_song',
    'New Song Added',
    'New song "' || NEW.title || '"' || COALESCE(' by ' || NEW.artist, '') || ' was added',
    NEW.id,
    'song',
    jsonb_build_object(
      'song_title', NEW.title,
      'song_artist', NEW.artist
    )
  FROM public.user_roles ur
  WHERE ur.role IN ('admin', 'worship_leader');
  
  RETURN NEW;
END;
$$;

-- Trigger function for post like notifications
CREATE OR REPLACE FUNCTION public.notify_post_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_author_id UUID;
  v_liker_name TEXT;
  v_liker_avatar TEXT;
  v_post_content TEXT;
BEGIN
  -- Get post author
  SELECT author_id, content INTO v_post_author_id, v_post_content
  FROM public.community_posts
  WHERE id = NEW.post_id;
  
  -- Get liker info
  SELECT full_name, avatar_url INTO v_liker_name, v_liker_avatar
  FROM public.profiles
  WHERE id = NEW.user_id;
  
  -- Don't notify if user liked their own post
  IF v_post_author_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type, metadata)
    VALUES (
      v_post_author_id,
      'post_like',
      'Post Liked',
      v_liker_name || ' liked your post',
      NEW.post_id,
      'post',
      jsonb_build_object(
        'actor_name', v_liker_name,
        'actor_avatar', v_liker_avatar,
        'post_preview', LEFT(v_post_content, 50)
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger function for comment notifications
CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_author_id UUID;
  v_commenter_name TEXT;
  v_commenter_avatar TEXT;
  v_post_content TEXT;
BEGIN
  -- Get post author
  SELECT author_id, content INTO v_post_author_id, v_post_content
  FROM public.community_posts
  WHERE id = NEW.post_id;
  
  -- Get commenter info
  SELECT full_name, avatar_url INTO v_commenter_name, v_commenter_avatar
  FROM public.profiles
  WHERE id = NEW.author_id;
  
  -- Don't notify if user commented on their own post
  IF v_post_author_id != NEW.author_id THEN
    INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type, metadata)
    VALUES (
      v_post_author_id,
      'comment',
      'New Comment',
      v_commenter_name || ' commented on your post',
      NEW.post_id,
      'post',
      jsonb_build_object(
        'actor_name', v_commenter_name,
        'actor_avatar', v_commenter_avatar,
        'comment_preview', LEFT(NEW.content, 50),
        'post_preview', LEFT(v_post_content, 50)
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER trigger_notify_new_member
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_new_member();

CREATE TRIGGER trigger_notify_invitation_accepted
AFTER UPDATE ON public.community_invitations
FOR EACH ROW
EXECUTE FUNCTION public.notify_invitation_accepted();

CREATE TRIGGER trigger_notify_new_community
AFTER INSERT ON public.worship_communities
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_new_community();

CREATE TRIGGER trigger_notify_new_song
AFTER INSERT ON public.songs
FOR EACH ROW
EXECUTE FUNCTION public.notify_leaders_new_song();

CREATE TRIGGER trigger_notify_post_like
AFTER INSERT ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_post_like();

CREATE TRIGGER trigger_notify_comment
AFTER INSERT ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_post_comment();