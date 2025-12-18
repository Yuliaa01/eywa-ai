-- Create menstrual_cycles table for women's cycle tracking
CREATE TABLE public.menstrual_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  period_start_date DATE NOT NULL,
  period_end_date DATE,
  cycle_length INTEGER,
  flow_intensity TEXT CHECK (flow_intensity IN ('light', 'medium', 'heavy', 'spotting')),
  symptoms JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menstrual_cycles ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own cycle data
CREATE POLICY "Users can manage own cycle data" 
  ON public.menstrual_cycles FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_menstrual_cycles_updated_at
  BEFORE UPDATE ON public.menstrual_cycles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add cycle_preferences to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS cycle_preferences JSONB DEFAULT '{}'::jsonb;