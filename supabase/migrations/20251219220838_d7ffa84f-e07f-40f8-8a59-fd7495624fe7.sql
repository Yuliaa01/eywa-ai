-- Add push notifications preference to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT true;