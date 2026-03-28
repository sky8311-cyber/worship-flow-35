
INSERT INTO storage.buckets (id, name, public) VALUES ('block-uploads', 'block-uploads', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can read block uploads" ON storage.objects FOR SELECT USING (bucket_id = 'block-uploads');
CREATE POLICY "Authenticated users can upload block files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'block-uploads');
CREATE POLICY "Users can delete own block uploads" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'block-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
