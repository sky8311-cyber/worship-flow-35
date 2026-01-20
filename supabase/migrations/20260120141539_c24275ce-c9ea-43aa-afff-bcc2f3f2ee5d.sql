-- Create navigation_items table for dynamic menu management
CREATE TABLE public.navigation_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  location TEXT NOT NULL CHECK (location IN ('bottom', 'top', 'profile_menu')),
  label_key TEXT NOT NULL,
  icon TEXT NOT NULL,
  path TEXT,
  match_pattern TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  role_required TEXT[] DEFAULT NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;

-- Everyone can read navigation items
CREATE POLICY "Anyone can read navigation items"
ON public.navigation_items
FOR SELECT
USING (true);

-- Only admins can modify navigation items
CREATE POLICY "Admins can manage navigation items"
ON public.navigation_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create index for faster queries
CREATE INDEX idx_navigation_items_location ON public.navigation_items(location);
CREATE INDEX idx_navigation_items_enabled ON public.navigation_items(enabled);

-- Insert default bottom navigation items
INSERT INTO public.navigation_items (key, location, label_key, icon, path, match_pattern, enabled, order_index, is_system)
VALUES
  ('home', 'bottom', 'navigation.home', 'Home', '/dashboard', '/dashboard', true, 1, true),
  ('worship-sets', 'bottom', 'navigation.worshipSets', 'Calendar', '/worship-sets?continue=true', '/worship-sets,/set-builder', true, 2, true),
  ('songs', 'bottom', 'navigation.songs', 'Music', '/songs', '/songs,/favorites', true, 3, true),
  ('rooms', 'bottom', 'navigation.rooms', 'DoorOpen', '/rooms', '/rooms', false, 4, true),
  ('chat', 'bottom', 'navigation.chat', 'MessageCircle', NULL, NULL, true, 5, true);

-- Trigger for updated_at
CREATE TRIGGER update_navigation_items_updated_at
BEFORE UPDATE ON public.navigation_items
FOR EACH ROW
EXECUTE FUNCTION public.update_rewards_updated_at();