-- Enable realtime for user_rewards table
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_rewards;

-- Enable realtime for user_streaks table
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_streaks;