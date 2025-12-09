-- Add actual_end_at to track when fasting truly ends (NULL while still fasting)
ALTER TABLE public.fasting_windows ADD COLUMN IF NOT EXISTS actual_end_at timestamptz;

-- Add is_paused to track pause state
ALTER TABLE public.fasting_windows ADD COLUMN IF NOT EXISTS is_paused boolean DEFAULT false;

-- Create fasting_logs table for action tracking
CREATE TABLE public.fasting_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  fasting_window_id uuid NOT NULL REFERENCES public.fasting_windows(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.fasting_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fasting logs" 
ON public.fasting_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fasting logs" 
ON public.fasting_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);