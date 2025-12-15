-- Add religious_diet column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN religious_diet TEXT[] DEFAULT NULL;