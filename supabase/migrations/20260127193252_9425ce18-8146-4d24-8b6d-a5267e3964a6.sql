-- Create news_posts table
CREATE TABLE public.news_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_ko TEXT,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  content_ko TEXT,
  excerpt TEXT,
  excerpt_ko TEXT,
  category TEXT NOT NULL DEFAULT 'news',
  cover_image_url TEXT,
  external_url TEXT,
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  author_id UUID REFERENCES auth.users(id),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Valid category constraint
ALTER TABLE news_posts ADD CONSTRAINT valid_news_category 
  CHECK (category IN ('news', 'update', 'blog', 'press'));

-- Enable RLS
ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Published news posts are viewable by all"
  ON news_posts FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage all news posts"
  ON news_posts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Indexes for performance
CREATE INDEX idx_news_posts_published ON news_posts(is_published, published_at DESC);
CREATE INDEX idx_news_posts_category ON news_posts(category, published_at DESC);
CREATE INDEX idx_news_posts_slug ON news_posts(slug);

-- Create newsletter subscribers table
CREATE TABLE public.news_newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);

ALTER TABLE news_newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own newsletter subscription"
  ON news_newsletter_subscribers FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all newsletter subscribers"
  ON news_newsletter_subscribers FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_news_posts_updated_at
  BEFORE UPDATE ON news_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_news_view_count(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE news_posts 
  SET view_count = COALESCE(view_count, 0) + 1 
  WHERE id = post_id;
END;
$$;