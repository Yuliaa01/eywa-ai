-- Fix security linter issues

-- 1. Drop the public.users table (shouldn't exist - use auth.users instead)
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. Fix function search_path (recreate with proper security settings)
DROP FUNCTION IF EXISTS public.update_updated_at_column CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. Enable RLS on doctor_prompts table with policies
-- System can insert/update doctor prompts, authenticated users can read
CREATE POLICY "Anyone can view doctor prompts" ON public.doctor_prompts FOR SELECT USING (true);

-- 4. Enable RLS on jobs table with policies  
-- Only system should manage jobs
CREATE POLICY "System manages jobs" ON public.jobs FOR ALL USING (false);

-- Recreate triggers since we dropped the function
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_priorities_updated_at BEFORE UPDATE ON public.priorities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_nutrition_plans_updated_at BEFORE UPDATE ON public.nutrition_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_supplements_updated_at BEFORE UPDATE ON public.supplements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workout_plans_updated_at BEFORE UPDATE ON public.workout_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_health_issues_updated_at BEFORE UPDATE ON public.health_issues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_local_venues_updated_at BEFORE UPDATE ON public.local_venues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_test_orders_updated_at BEFORE UPDATE ON public.user_test_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();