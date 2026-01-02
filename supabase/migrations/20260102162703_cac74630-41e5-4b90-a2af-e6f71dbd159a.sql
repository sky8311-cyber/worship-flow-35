-- Table to track when users last read comments on posts
CREATE TABLE public.post_comment_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL,
  post_type text NOT NULL CHECK (post_type IN ('community_post', 'feedback_post', 'worship_set', 'calendar_event')),
  last_read_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id, post_type)
);

-- Enable RLS
ALTER TABLE public.post_comment_reads ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own read records
CREATE POLICY "Users can view their own reads"
  ON public.post_comment_reads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reads"
  ON public.post_comment_reads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reads"
  ON public.post_comment_reads FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_post_comment_reads_user_post ON public.post_comment_reads(user_id, post_id, post_type);

-- Drop existing trigger if exists (from previous notify_post_comment function)
DROP TRIGGER IF EXISTS on_post_comment_notify ON public.post_comments;

-- Create or replace the comment notification function
CREATE OR REPLACE FUNCTION public.notify_post_comment_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_post_author_id uuid;
  v_actor_profile RECORD;
  v_post_preview text;
BEGIN
  -- Get commenter info
  SELECT full_name, avatar_url INTO v_actor_profile
  FROM public.profiles WHERE id = NEW.author_id;

  -- Get post author based on post type
  IF NEW.post_type = 'community_post' THEN
    SELECT author_id, LEFT(content, 50) INTO v_post_author_id, v_post_preview
    FROM public.community_posts WHERE id = NEW.post_id;
  ELSIF NEW.post_type = 'feedback_post' THEN
    SELECT author_id, LEFT(content, 50) INTO v_post_author_id, v_post_preview
    FROM public.feedback_posts WHERE id = NEW.post_id;
  END IF;

  -- Don't notify if commenting on own post
  IF v_post_author_id IS NOT NULL AND v_post_author_id != NEW.author_id THEN
    INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type, metadata)
    VALUES (
      v_post_author_id,
      'post_comment',
      '새 댓글',
      v_actor_profile.full_name || '님이 회원님의 게시물에 댓글을 남겼습니다.',
      NEW.post_id,
      NEW.post_type,
      jsonb_build_object(
        'actor_id', NEW.author_id,
        'actor_name', v_actor_profile.full_name,
        'actor_avatar', v_actor_profile.avatar_url,
        'comment_preview', LEFT(NEW.content, 100),
        'post_preview', v_post_preview
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for comment notifications
CREATE TRIGGER on_post_comment_notify
  AFTER INSERT ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_post_comment_trigger();

-- Function for new feedback post notifications to admins
CREATE OR REPLACE FUNCTION public.notify_new_feedback_post()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_record RECORD;
  v_actor_profile RECORD;
  v_post_type_label text;
BEGIN
  -- Get author info
  SELECT full_name, avatar_url INTO v_actor_profile
  FROM public.profiles WHERE id = NEW.author_id;

  -- Map post_type to Korean label
  v_post_type_label := CASE NEW.post_type
    WHEN 'bug' THEN '버그 제보'
    WHEN 'feature' THEN '기능 제안'
    WHEN 'improvement' THEN '개선 제안'
    ELSE '일반 피드백'
  END;

  -- Notify all admins except the author
  FOR v_admin_record IN 
    SELECT user_id FROM public.user_roles 
    WHERE role = 'admin' AND user_id != NEW.author_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type, metadata)
    VALUES (
      v_admin_record.user_id,
      'new_feedback_post',
      '새 피드백',
      v_actor_profile.full_name || '님이 ' || v_post_type_label || '을(를) 남겼습니다.',
      NEW.id,
      'feedback_post',
      jsonb_build_object(
        'actor_id', NEW.author_id,
        'actor_name', v_actor_profile.full_name,
        'actor_avatar', v_actor_profile.avatar_url,
        'post_type', NEW.post_type,
        'content_preview', LEFT(NEW.content, 100)
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new feedback post notifications
CREATE TRIGGER on_feedback_post_notify_admins
  AFTER INSERT ON public.feedback_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_feedback_post();