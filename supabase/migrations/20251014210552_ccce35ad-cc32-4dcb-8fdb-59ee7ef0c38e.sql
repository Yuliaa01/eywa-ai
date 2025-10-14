-- Create storage bucket for user files
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-files', 'user-files', false);

-- Allow users to upload their own files
CREATE POLICY "Users can upload own files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'user-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own files
CREATE POLICY "Users can view own files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'user-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'user-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);