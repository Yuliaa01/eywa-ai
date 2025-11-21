-- Enable Realtime for ai_insights table
ALTER TABLE public.ai_insights REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_insights;