-- Create a dedicated public bucket for user avatars (separate from sensitive files)
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Make user-files bucket private (for sensitive health documents)
UPDATE storage.buckets SET public = false WHERE id = 'user-files';

-- Remove the public read policy from user-files bucket
DROP POLICY IF EXISTS "Public read access for user files" ON storage.objects;

-- Create policy for authenticated users to read their own files from user-files bucket (using signed URLs)
CREATE POLICY "Users can read own files from user-files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policies for the new user-avatars public bucket
-- Public read access for avatars
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-avatars');

-- Users can upload their own avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);