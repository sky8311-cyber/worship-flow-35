-- Create storage bucket for component images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('component-images', 'component-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view component images
CREATE POLICY "Anyone can view component images"
ON storage.objects FOR SELECT
USING (bucket_id = 'component-images');

-- Allow authenticated users to upload component images
CREATE POLICY "Authenticated users can upload component images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'component-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their own component images
CREATE POLICY "Authenticated users can delete component images"
ON storage.objects FOR DELETE
USING (bucket_id = 'component-images' AND auth.role() = 'authenticated');