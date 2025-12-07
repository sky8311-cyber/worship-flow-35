-- Create app_settings table for platform-wide toggles
CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Insert initial settings
INSERT INTO public.app_settings (key, value, description) VALUES
  ('leaderboard_enabled', '{"enabled": true}', 'Seed Leaderboard visibility toggle'),
  ('church_subscription_enabled', '{"enabled": true}', 'Church Account subscription feature toggle'),
  ('church_menu_visible', '{"visible": true}', 'Church Account menu visibility toggle');

-- RLS: Anyone authenticated can read
CREATE POLICY "Authenticated users can read app settings"
  ON public.app_settings FOR SELECT
  TO authenticated
  USING (true);

-- RLS: Only admins can update
CREATE POLICY "Only admins can update app settings"
  ON public.app_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create update trigger for updated_at
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();