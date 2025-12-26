-- Add explicit deny policy for unauthenticated users on fitness_app_connections table
-- This provides defense-in-depth against anonymous access attempts

CREATE POLICY "Deny anonymous access to fitness connections"
ON public.fitness_app_connections
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Add comment documenting security measures
COMMENT ON TABLE public.fitness_app_connections IS 'Stores OAuth tokens for fitness app integrations. Tokens are encrypted with AES-GCM at rest. RLS enabled with strict user-only access. Anonymous access explicitly denied.';