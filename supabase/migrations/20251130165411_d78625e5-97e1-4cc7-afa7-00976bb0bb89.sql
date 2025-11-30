-- Add slogan and theme_config columns to church_accounts
ALTER TABLE public.church_accounts 
ADD COLUMN IF NOT EXISTS slogan text,
ADD COLUMN IF NOT EXISTS theme_config jsonb DEFAULT '{"primaryColor": "#2b4b8a", "accentColor": "#d16265"}'::jsonb;

-- Update trial period default from 14 days to 30 days
ALTER TABLE public.church_accounts 
ALTER COLUMN trial_ends_at SET DEFAULT (now() + '30 days'::interval);