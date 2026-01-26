-- RPC 함수 수정: no_team_invite에서 유저당 1건만 발송하도록 DISTINCT ON 추가
CREATE OR REPLACE FUNCTION get_automated_email_recipients(
  p_email_type text,
  p_trigger_days integer,
  p_cooldown_days integer DEFAULT 7
)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  last_active_at timestamptz,
  days_inactive integer,
  community_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_email_type = 'inactive_user' THEN
    -- Users who haven't been active for X days
    RETURN QUERY
    SELECT 
      p.id,
      p.email,
      p.full_name,
      p.last_active_at,
      EXTRACT(DAY FROM (now() - COALESCE(p.last_active_at, p.created_at)))::INTEGER as days_inactive,
      NULL::text as community_name
    FROM profiles p
    WHERE (p.last_active_at IS NULL OR p.last_active_at < now() - (p_trigger_days || ' days')::INTERVAL)
      AND p.created_at < now() - (p_trigger_days || ' days')::INTERVAL
      AND NOT EXISTS (
        SELECT 1 FROM automated_email_log ael
        WHERE ael.user_id = p.id
          AND ael.email_type = 'inactive_user'
          AND ael.sent_at > now() - (p_cooldown_days || ' days')::INTERVAL
      );
      
  ELSIF p_email_type = 'no_team_invite' THEN
    -- Community leaders who are alone in their community for X days
    -- DISTINCT ON ensures only ONE email per user even if they lead multiple communities
    RETURN QUERY
    SELECT DISTINCT ON (p.id)
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
      AND NOT EXISTS (
        SELECT 1 FROM automated_email_log ael
        WHERE ael.user_id = p.id
          AND ael.email_type = 'no_team_invite'
          AND ael.sent_at > now() - (p_cooldown_days || ' days')::INTERVAL
      )
    ORDER BY p.id, wc.created_at ASC;
    
  ELSIF p_email_type = 'no_worship_set' THEN
    -- Worship leaders who haven't created a set in X days
    RETURN QUERY
    SELECT 
      p.id,
      p.email,
      p.full_name,
      (SELECT MAX(ss.created_at) FROM service_sets ss WHERE ss.created_by = p.id) as last_active_at,
      EXTRACT(DAY FROM (now() - COALESCE(
        (SELECT MAX(ss.created_at) FROM service_sets ss WHERE ss.created_by = p.id),
        p.created_at
      )))::INTEGER as days_inactive,
      NULL::text as community_name
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.id AND ur.role = 'worship_leader'
    WHERE NOT EXISTS (
      SELECT 1 FROM service_sets ss 
      WHERE ss.created_by = p.id 
        AND ss.created_at > now() - (p_trigger_days || ' days')::INTERVAL
    )
    AND p.created_at < now() - (p_trigger_days || ' days')::INTERVAL
    AND NOT EXISTS (
      SELECT 1 FROM automated_email_log ael
      WHERE ael.user_id = p.id
        AND ael.email_type = 'no_worship_set'
        AND ael.sent_at > now() - (p_cooldown_days || ' days')::INTERVAL
    );
  END IF;
END;
$$;