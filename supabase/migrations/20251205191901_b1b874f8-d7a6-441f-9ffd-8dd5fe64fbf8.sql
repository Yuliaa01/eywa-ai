-- Create supplement_logs table to track when supplements are taken
CREATE TABLE public.supplement_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  supplement_id UUID NOT NULL REFERENCES public.supplements(id) ON DELETE CASCADE,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supplement_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own supplement logs
CREATE POLICY "Users can manage own supplement logs"
  ON public.supplement_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);