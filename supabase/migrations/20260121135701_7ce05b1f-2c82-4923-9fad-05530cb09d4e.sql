-- Allow anonymous users to read feature flags (for login page toggle)
CREATE POLICY "Anonymous users can read feature flags"
  ON public.platform_feature_flags
  FOR SELECT
  TO anon
  USING (true);