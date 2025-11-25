-- Add view_mode field to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS view_mode text DEFAULT 'standard' CHECK (view_mode IN ('standard', 'professional'));