-- =============================================
-- Worship Studio Migration
-- =============================================

-- 1. Create studio_post_categories table for dynamic post types
CREATE TABLE IF NOT EXISTS public.studio_post_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  label_en text NOT NULL,
  label_ko text NOT NULL,
  icon text NOT NULL DEFAULT 'FileText',
  color text NOT NULL DEFAULT 'gray',
  sort_order integer NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Insert default categories
INSERT INTO public.studio_post_categories (key, label_en, label_ko, icon, color, sort_order) VALUES
('prayer', 'Prayer', '기도', 'Heart', 'red', 1),
('note', 'Note', '노트', 'FileText', 'blue', 2),
('testimony', 'Testimony', '간증', 'Sparkles', 'yellow', 3),
('concern', 'Concern', '고민', 'HelpCircle', 'orange', 4),
('general', 'General', '일반', 'MessageSquare', 'gray', 5)
ON CONFLICT (key) DO NOTHING;

-- 3. Add is_active column to worship_rooms (for opt-in contract system)
ALTER TABLE public.worship_rooms 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 4. Drop auto-create trigger (opt-in based now)
DROP TRIGGER IF EXISTS on_profile_created_create_room ON public.profiles;

-- 5. Enable RLS on studio_post_categories
ALTER TABLE public.studio_post_categories ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for studio_post_categories
CREATE POLICY "Anyone can read categories" 
ON public.studio_post_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert categories" 
ON public.studio_post_categories 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update categories" 
ON public.studio_post_categories 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete categories" 
ON public.studio_post_categories 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));