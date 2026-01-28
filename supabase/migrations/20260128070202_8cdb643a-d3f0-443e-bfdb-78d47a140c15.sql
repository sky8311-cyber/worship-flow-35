-- Fix page_analytics RLS policy for anonymous users
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.page_analytics;

-- New policy: Explicitly allow anon and authenticated users to insert
CREATE POLICY "Anyone can insert page analytics"
  ON public.page_analytics
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);