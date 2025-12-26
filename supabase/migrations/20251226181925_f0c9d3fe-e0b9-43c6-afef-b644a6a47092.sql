-- Create platform_feature_flags table
CREATE TABLE public.platform_feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_feature_flags ENABLE ROW LEVEL SECURITY;

-- RLS Policy: All authenticated users can read flags
CREATE POLICY "Anyone can read feature flags"
ON public.platform_feature_flags
FOR SELECT
TO authenticated
USING (true);

-- RLS Policy: Only admins can update flags
CREATE POLICY "Admins can update feature flags"
ON public.platform_feature_flags
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_platform_feature_flags_updated_at
BEFORE UPDATE ON public.platform_feature_flags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helper function to get feature flag value
CREATE OR REPLACE FUNCTION public.get_feature_flag(_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT enabled FROM platform_feature_flags WHERE key = _key),
    false
  );
$$;

-- Insert initial feature flags with values from existing app_settings
INSERT INTO public.platform_feature_flags (key, enabled, description) VALUES
  ('seed_leaderboard_enabled', true, '대시보드에 씨앗 리더보드 표시'),
  ('church_subscription_enabled', true, '교회계정 Tier 구독 기능 활성화'),
  ('church_menu_visible', true, '네비게이션에 교회계정 메뉴 표시'),
  ('premium_enabled', false, 'Premium Account Tier 구독 기능 활성화'),
  ('premium_menu_visible', false, '네비게이션에 Premium 메뉴 표시'),
  ('scheduler_enabled', false, 'Recurring Calendar Scheduler 기능 활성화'),
  ('cross_community_enabled', false, 'Church Account Cross-Community Scheduling 활성화');