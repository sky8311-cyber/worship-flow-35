-- Create feedback_posts table for worship leaders and community leaders
CREATE TABLE public.feedback_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  image_urls TEXT[],
  post_type TEXT NOT NULL DEFAULT 'general', -- 'bug', 'feature', 'improvement', 'general'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback_posts ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is community leader
CREATE OR REPLACE FUNCTION public.is_any_community_leader(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.community_members
    WHERE user_id = _user_id 
      AND role = 'community_leader'
  )
$$;

-- SELECT: Worship Leader, Community Leader, Admin can view all feedback
CREATE POLICY "Leaders can view feedback"
  ON public.feedback_posts FOR SELECT
  USING (
    has_role(auth.uid(), 'worship_leader') 
    OR is_admin(auth.uid())
    OR is_any_community_leader(auth.uid())
  );

-- INSERT: Worship Leader, Community Leader, Admin can create feedback
CREATE POLICY "Leaders can create feedback"
  ON public.feedback_posts FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND (
      has_role(auth.uid(), 'worship_leader') 
      OR is_admin(auth.uid())
      OR is_any_community_leader(auth.uid())
    )
  );

-- UPDATE: Authors can update own feedback
CREATE POLICY "Authors can update own feedback"
  ON public.feedback_posts FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- DELETE: Authors or Admin can delete feedback
CREATE POLICY "Authors and admins can delete feedback"
  ON public.feedback_posts FOR DELETE
  USING (auth.uid() = author_id OR is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_feedback_posts_updated_at
  BEFORE UPDATE ON public.feedback_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();