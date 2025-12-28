-- Create welcome_posts table for admin announcements to new users
CREATE TABLE public.welcome_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT,
  content TEXT NOT NULL,
  image_urls TEXT[],
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.welcome_posts ENABLE ROW LEVEL SECURITY;

-- Admins can manage welcome posts
CREATE POLICY "Admin can manage welcome posts"
  ON public.welcome_posts FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- All authenticated users can view welcome posts
CREATE POLICY "Authenticated users can view welcome posts"
  ON public.welcome_posts FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Add updated_at trigger
CREATE TRIGGER update_welcome_posts_updated_at
  BEFORE UPDATE ON public.welcome_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();