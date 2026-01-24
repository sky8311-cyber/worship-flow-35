-- Add event_reminder notification type to the constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS valid_notification_type;
ALTER TABLE public.notifications ADD CONSTRAINT valid_notification_type 
CHECK (type = ANY (ARRAY[
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
  'new_post',
  'new_worship_leader_application',
  'post_comment',
  'collaborator_invited',
  'promoted_to_owner',
  'promoted_to_community_leader',
  'promoted_to_worship_leader',
  'demoted_to_member',
  'support_reply',
  'event_reminder'
]::text[]));

-- Create table to track sent reminders (to avoid duplicates)
CREATE TABLE IF NOT EXISTS public.event_reminder_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.event_reminder_log ENABLE ROW LEVEL SECURITY;

-- Service role can insert/read (for edge function)
CREATE POLICY "Service role can manage reminder logs"
ON public.event_reminder_log
FOR ALL
USING (true)
WITH CHECK (true);