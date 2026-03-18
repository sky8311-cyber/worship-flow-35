
CREATE OR REPLACE FUNCTION public.increment_ai_usage(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO ai_usage_summary (user_id, total_uses, last_used_at)
  VALUES (p_user_id, 1, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_uses = ai_usage_summary.total_uses + 1,
    last_used_at = now();
END;
$$;
