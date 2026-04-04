-- Allow anonymous users to read public published songs (for demo page SEO indexing)
CREATE POLICY "Anon can view public published songs"
ON public.songs
FOR SELECT
TO anon
USING (
  (is_private = false OR is_private IS NULL)
  AND status = 'published'
);