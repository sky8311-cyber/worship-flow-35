-- Create RPC function for leaderboard aggregation (server-side)
-- This replaces fetching all transactions and aggregating in JavaScript

CREATE OR REPLACE FUNCTION public.get_seed_leaderboard(
  time_range TEXT DEFAULT 'allTime',
  excluded_user_ids UUID[] DEFAULT ARRAY[]::UUID[],
  result_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  user_id UUID,
  total_seeds BIGINT,
  user_name TEXT,
  avatar_url TEXT,
  current_level INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    st.user_id,
    SUM(st.seeds_earned)::BIGINT as total_seeds,
    COALESCE(p.full_name, 'Unknown') as user_name,
    p.avatar_url,
    COALESCE(us.current_level, 1) as current_level
  FROM seed_transactions st
  LEFT JOIN profiles p ON p.id = st.user_id
  LEFT JOIN user_seeds us ON us.user_id = st.user_id
  WHERE 
    NOT (st.user_id = ANY(excluded_user_ids))
    AND (
      time_range = 'allTime' 
      OR (time_range = 'monthly' AND st.created_at >= NOW() - INTERVAL '1 month')
    )
  GROUP BY st.user_id, p.full_name, p.avatar_url, us.current_level
  ORDER BY total_seeds DESC
  LIMIT result_limit;
$$;