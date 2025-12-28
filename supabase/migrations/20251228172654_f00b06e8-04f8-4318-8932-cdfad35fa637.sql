-- Drop existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS valid_notification_type;

-- Add updated constraint with new type
ALTER TABLE notifications ADD CONSTRAINT valid_notification_type 
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
  'new_worship_leader_application'
]));