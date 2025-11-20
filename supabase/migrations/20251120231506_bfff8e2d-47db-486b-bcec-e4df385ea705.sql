-- Add Row-Level Security policies for user-files storage bucket
-- Users can only upload files to their own folder
CREATE POLICY "Users can upload to their folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'user-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can only read their own files
CREATE POLICY "Users can read their files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'user-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own files
CREATE POLICY "Users can update their files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'user-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own files
CREATE POLICY "Users can delete their files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'user-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);