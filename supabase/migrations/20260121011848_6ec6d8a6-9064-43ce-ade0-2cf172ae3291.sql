-- Drop the old constraint
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS valid_notification_type;

-- Add updated constraint with all notification types including support_reply
ALTER TABLE public.notifications
ADD CONSTRAINT valid_notification_type 
CHECK (type = ANY (ARRAY[
  -- Existing types
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
  -- Missing types (from CHAT_NOTIFICATION_TYPES in useNotifications.ts)
  'post_comment',
  'collaborator_invited',
  'promoted_to_owner',
  'promoted_to_community_leader',
  'promoted_to_worship_leader',
  'demoted_to_member',
  'new_feedback_post',
  'new_community_post',
  'support_reply'
]::text[]));