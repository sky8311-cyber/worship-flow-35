-- Add cooldown_days column to automated_email_settings
ALTER TABLE public.automated_email_settings 
ADD COLUMN IF NOT EXISTS cooldown_days INTEGER DEFAULT 7;

-- Update existing records to have default cooldown of 7 days
UPDATE public.automated_email_settings 
SET cooldown_days = 7 
WHERE cooldown_days IS NULL;

-- Update the get_automated_email_recipients function to include cooldown logic
CREATE OR REPLACE FUNCTION public.get_automated_email_recipients(
  p_email_type TEXT,
  p_trigger_days INTEGER,
  p_cooldown_days INTEGER DEFAULT 7
)
RETURNS TABLE(
  id UUID,
  email TEXT,
  full_name TEXT,
  last_active_at TIMESTAMPTZ,
  days_inactive INTEGER,
  community_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_email_type = 'inactive_user' THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.email,
      p.full_name,
      p.last_active_at,
      EXTRACT(DAY FROM (now() - COALESCE(p.last_active_at, p.created_at)))::INTEGER as days_inactive,
      NULL::TEXT as community_name
    FROM profiles p
    WHERE p.last_active_at IS NOT NULL
      AND p.last_active_at < now() - (p_trigger_days || ' days')::INTERVAL
      -- Cooldown: don't send if already sent within cooldown period
      AND NOT EXISTS (
        SELECT 1 FROM automated_email_log ael
        WHERE ael.user_id = p.id
          AND ael.email_type = 'inactive_user'
          AND ael.sent_at > now() - (p_cooldown_days || ' days')::INTERVAL
      )
    ORDER BY p.last_active_at ASC;
    
  ELSIF p_email_type = 'no_team_invite' THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.email,
      p.full_name,
      wc.created_at as last_active_at,
      EXTRACT(DAY FROM (now() - wc.created_at))::INTEGER as days_inactive,
      wc.name as community_name
    FROM worship_communities wc
    JOIN profiles p ON p.id = wc.leader_id
    WHERE wc.created_at < now() - (p_trigger_days || ' days')::INTERVAL
      AND (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = wc.id) = 1
      -- Cooldown: don't send if already sent within cooldown period
      AND NOT EXISTS (
        SELECT 1 FROM automated_email_log ael
        WHERE ael.user_id = p.id
          AND ael.email_type = 'no_team_invite'
          AND ael.sent_at > now() - (p_cooldown_days || ' days')::INTERVAL
      )
    ORDER BY wc.created_at ASC;
    
  ELSIF p_email_type = 'no_worship_set' THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.email,
      p.full_name,
      MAX(ss.created_at) as last_active_at,
      EXTRACT(DAY FROM (now() - COALESCE(MAX(ss.created_at), p.created_at)))::INTEGER as days_inactive,
      NULL::TEXT as community_name
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.id AND ur.role = 'worship_leader'
    LEFT JOIN service_sets ss ON ss.created_by = p.id
    GROUP BY p.id, p.email, p.full_name, p.created_at
    HAVING COALESCE(MAX(ss.created_at), p.created_at) < now() - (p_trigger_days || ' days')::INTERVAL
      -- Cooldown: don't send if already sent within cooldown period
      AND NOT EXISTS (
        SELECT 1 FROM automated_email_log ael
        WHERE ael.user_id = p.id
          AND ael.email_type = 'no_worship_set'
          AND ael.sent_at > now() - (p_cooldown_days || ' days')::INTERVAL
      )
    ORDER BY days_inactive DESC;
  END IF;
END;
$$;