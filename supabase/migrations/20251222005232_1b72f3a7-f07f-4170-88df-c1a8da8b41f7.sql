-- Add avatar_url column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update the "Getting Started" reward to be about adding a profile photo
UPDATE public.rewards 
SET 
  name = 'Profile Photo',
  description = 'Add a profile photo',
  requirement_type = 'profile_photo'
WHERE name = 'Getting Started' AND requirement_type = 'onboarding';