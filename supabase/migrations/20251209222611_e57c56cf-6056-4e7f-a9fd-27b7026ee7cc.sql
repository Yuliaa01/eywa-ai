-- Add DELETE policy for fasting_logs so users can delete their own logs
CREATE POLICY "Users can delete own fasting logs"
ON public.fasting_logs
FOR DELETE
USING (auth.uid() = user_id);