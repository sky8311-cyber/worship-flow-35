
-- AI usage log: append-only event log
CREATE TABLE public.ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage logs"
ON public.ai_usage_log FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- AI usage summary: per-user aggregate
CREATE TABLE public.ai_usage_summary (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_uses INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ
);

ALTER TABLE public.ai_usage_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage summary"
ON public.ai_usage_summary FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Index for querying by user
CREATE INDEX idx_ai_usage_log_user_id ON public.ai_usage_log(user_id);
CREATE INDEX idx_ai_usage_log_action_type ON public.ai_usage_log(action_type);
