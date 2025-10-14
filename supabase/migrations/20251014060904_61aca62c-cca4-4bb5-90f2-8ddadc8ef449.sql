-- Remove public access to doctor_prompts table
-- This table contains proprietary AI prompt templates and should only be
-- accessible by backend systems using the service role

DROP POLICY IF EXISTS "Anyone can view doctor prompts" ON public.doctor_prompts;

-- The table will now only be accessible via service role in edge functions
-- Regular authenticated users will not be able to read these prompts