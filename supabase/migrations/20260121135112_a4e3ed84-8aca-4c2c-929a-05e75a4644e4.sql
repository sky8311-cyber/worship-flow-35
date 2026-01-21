-- Add google_login_enabled feature flag
INSERT INTO public.platform_feature_flags (key, enabled, description)
VALUES ('google_login_enabled', true, 'Controls whether Google OAuth login is available')
ON CONFLICT (key) DO NOTHING;