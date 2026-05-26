INSERT INTO storage.buckets (id, name, public) VALUES ('question-images', 'question-images', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read question-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'question-images');

CREATE POLICY "Service role manage question-images insert"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'question-images');

CREATE POLICY "Service role manage question-images update"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'question-images');

CREATE POLICY "Service role manage question-images delete"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'question-images');