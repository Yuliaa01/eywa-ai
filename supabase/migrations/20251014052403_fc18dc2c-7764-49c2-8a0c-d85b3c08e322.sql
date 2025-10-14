-- Enable RLS on tables that need it
ALTER TABLE public.doctor_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;