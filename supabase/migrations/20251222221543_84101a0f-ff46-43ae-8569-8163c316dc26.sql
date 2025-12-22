-- Make the user-files bucket public so avatar images can be displayed
UPDATE storage.buckets 
SET public = true 
WHERE id = 'user-files';

-- Add RLS policy to allow authenticated users to upload their own files
CREATE POLICY "Users can upload their own avatar files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Add RLS policy to allow authenticated users to update their own files
CREATE POLICY "Users can update their own avatar files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Add RLS policy to allow public read access for avatar files
CREATE POLICY "Public read access for user files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'user-files');