-- Step 1: Drop the old 2-parameter version (causes function overloading conflict)
DROP FUNCTION IF EXISTS get_automated_email_recipients(text, integer);

-- Step 2: Drop and recreate the 3-parameter version with correct table/column references
DROP FUNCTION IF EXISTS get_automated_email_recipients(text, integer, integer);

CREATE OR REPLACE FUNCTION get_automated_email_recipients(
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
  RETURN QUERY
  WITH users_in_global_cooldown AS (
    -- Users who received ANY automated email within cooldown period
    SELECT DISTINCT ael.user_id
    FROM automated_email_log ael
    WHERE ael.status = 'sent'
      AND ael.sent_at > NOW() - (p_cooldown_days || ' days')::INTERVAL
  )
  SELECT DISTINCT ON (p.id)
    p.id,
    p.email,
    p.full_name,
    p.last_active_at,
    EXTRACT(DAY FROM NOW() - COALESCE(p.last_active_at, p.created_at))::INTEGER AS days_inactive,
    CASE 
      WHEN p_email_type = 'no_team_invite' THEN wc.name
      ELSE NULL
    END AS community_name
  FROM profiles p
  LEFT JOIN worship_communities wc ON wc.leader_id = p.id
  WHERE 
    -- Global cooldown: exclude users who received ANY email type recently
    p.id NOT IN (SELECT user_id FROM users_in_global_cooldown)
    AND (
      -- inactive_user: users who haven't logged in for p_trigger_days
      (p_email_type = 'inactive_user' AND (
        p.last_active_at IS NULL AND p.created_at < NOW() - (p_trigger_days || ' days')::INTERVAL
        OR p.last_active_at < NOW() - (p_trigger_days || ' days')::INTERVAL
      ))
      OR
      -- no_team_invite: community owners who haven't invited anyone
      (p_email_type = 'no_team_invite' AND EXISTS (
        SELECT 1 FROM worship_communities wc2
        WHERE wc2.leader_id = p.id
          AND wc2.created_at < NOW() - (p_trigger_days || ' days')::INTERVAL
          AND NOT EXISTS (
            SELECT 1 FROM community_members cm
            WHERE cm.community_id = wc2.id
              AND cm.user_id != p.id
          )
      ))
      OR
      -- no_worship_set: users who haven't created any worship set
      (p_email_type = 'no_worship_set' AND (
        p.created_at < NOW() - (p_trigger_days || ' days')::INTERVAL
        AND NOT EXISTS (
          SELECT 1 FROM service_sets ss
          WHERE ss.created_by = p.id
        )
      ))
    )
  ORDER BY p.id, days_inactive DESC;
END;
$$;