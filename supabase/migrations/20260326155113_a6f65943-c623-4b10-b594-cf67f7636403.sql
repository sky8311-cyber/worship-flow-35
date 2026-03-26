
-- Create institute-assets storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('institute-assets', 'institute-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: anyone can read (public bucket)
CREATE POLICY "Public read access for institute assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'institute-assets');

-- RLS: authenticated users can upload
CREATE POLICY "Authenticated users can upload institute assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'institute-assets');

-- RLS: admins can delete
CREATE POLICY "Admins can delete institute assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'institute-assets'
    AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
