
INSERT INTO storage.buckets (id, name, public) VALUES ('news-covers', 'news-covers', true);

CREATE POLICY "News cover images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'news-covers');
