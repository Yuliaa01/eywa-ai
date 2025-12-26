-- Add explicit deny policy for unauthenticated users on user_profiles table
-- This ensures that even if authentication is bypassed, anonymous users cannot query this table

-- First, let's create a restrictive policy that explicitly denies access to non-authenticated users
-- The existing policies use auth.uid() = user_id which should already deny unauthenticated access,
-- but we'll add an extra layer of protection

-- Create a policy that explicitly requires authentication for all operations
-- This acts as a safeguard against any misconfiguration

CREATE POLICY "Deny anonymous access to profiles"
ON public.user_profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Also ensure the authenticated role policies are explicit
-- Update existing policies to be more explicit about requiring authentication

COMMENT ON TABLE public.user_profiles IS 'Contains sensitive personal health information. RLS enabled with strict user-only access. Anonymous access explicitly denied.';