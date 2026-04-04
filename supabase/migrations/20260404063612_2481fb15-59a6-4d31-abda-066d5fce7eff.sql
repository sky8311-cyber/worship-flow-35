INSERT INTO storage.buckets (id, name, public) VALUES ('og-assets', 'og-assets', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for og-assets" ON storage.objects FOR SELECT USING (bucket_id = 'og-assets');