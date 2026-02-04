-- Update get_automated_email_recipients to use GLOBAL cooldown (any email type)
CREATE OR REPLACE FUNCTION public.get_automated_email_recipients(
  p_email_type TEXT,
  p_trigger_days INTEGER,
  p_cooldown_days INTEGER DEFAULT 7
)
RETURNS TABLE (
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
    SELECT DISTINCT ON (p.id)
      p.id,
      au.email::TEXT,
      p.full_name,
      p.last_active_at,
      EXTRACT(DAY FROM now() - COALESCE(p.last_active_at, p.created_at))::INTEGER AS days_inactive,
      NULL::TEXT AS community_name
    FROM profiles p
    JOIN auth.users au ON au.id = p.id
    WHERE au.email_confirmed_at IS NOT NULL
      AND COALESCE(p.last_active_at, p.created_at) < now() - (p_trigger_days || ' days')::INTERVAL
      -- GLOBAL cooldown: check ALL email types, not just this one
      AND NOT EXISTS (
        SELECT 1 FROM automated_email_log ael
        WHERE ael.user_id = p.id
          AND ael.status = 'sent'
          AND ael.sent_at > now() - (p_cooldown_days || ' days')::INTERVAL
      )
    ORDER BY p.id, COALESCE(p.last_active_at, p.created_at) ASC;

  ELSIF p_email_type = 'no_team_invite' THEN
    RETURN QUERY
    SELECT DISTINCT ON (p.id)
      p.id,
      au.email::TEXT,
      p.full_name,
      p.last_active_at,
      EXTRACT(DAY FROM now() - wc.created_at)::INTEGER AS days_inactive,
      wc.name AS community_name
    FROM profiles p
    JOIN auth.users au ON au.id = p.id
    JOIN worship_communities wc ON wc.created_by = p.id
    WHERE au.email_confirmed_at IS NOT NULL
      AND wc.created_at < now() - (p_trigger_days || ' days')::INTERVAL
      AND NOT EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = wc.id
          AND cm.user_id != p.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM community_invitations ci
        WHERE ci.community_id = wc.id
          AND ci.invited_by = p.id
      )
      -- GLOBAL cooldown: check ALL email types
      AND NOT EXISTS (
        SELECT 1 FROM automated_email_log ael
        WHERE ael.user_id = p.id
          AND ael.status = 'sent'
          AND ael.sent_at > now() - (p_cooldown_days || ' days')::INTERVAL
      )
    ORDER BY p.id, wc.created_at ASC;

  ELSIF p_email_type = 'no_worship_set' THEN
    RETURN QUERY
    SELECT DISTINCT ON (p.id)
      p.id,
      au.email::TEXT,
      p.full_name,
      p.last_active_at,
      EXTRACT(DAY FROM now() - p.created_at)::INTEGER AS days_inactive,
      NULL::TEXT AS community_name
    FROM profiles p
    JOIN auth.users au ON au.id = p.id
    WHERE au.email_confirmed_at IS NOT NULL
      AND p.created_at < now() - (p_trigger_days || ' days')::INTERVAL
      AND NOT EXISTS (
        SELECT 1 FROM worship_sets ws
        WHERE ws.created_by = p.id
      )
      -- GLOBAL cooldown: check ALL email types
      AND NOT EXISTS (
        SELECT 1 FROM automated_email_log ael
        WHERE ael.user_id = p.id
          AND ael.status = 'sent'
          AND ael.sent_at > now() - (p_cooldown_days || ' days')::INTERVAL
      )
    ORDER BY p.id, p.created_at ASC;

  ELSE
    RAISE EXCEPTION 'Unknown email type: %', p_email_type;
  END IF;
END;
$$;