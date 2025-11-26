-- Create table to store user's pinned metrics
CREATE TABLE IF NOT EXISTS public.pinned_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  metric_category TEXT NOT NULL,
  metric_title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, metric_category, metric_title)
);

-- Enable RLS
ALTER TABLE public.pinned_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own pinned metrics
CREATE POLICY "Users can view own pinned metrics"
  ON public.pinned_metrics
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own pinned metrics
CREATE POLICY "Users can insert own pinned metrics"
  ON public.pinned_metrics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own pinned metrics
CREATE POLICY "Users can delete own pinned metrics"
  ON public.pinned_metrics
  FOR DELETE
  USING (auth.uid() = user_id);