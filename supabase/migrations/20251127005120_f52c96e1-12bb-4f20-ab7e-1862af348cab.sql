-- Create rewards catalog table
CREATE TABLE public.rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  tier TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  xp_value INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user rewards table
CREATE TABLE public.user_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  trigger_data JSONB,
  UNIQUE(user_id, reward_id)
);

-- Create user streaks table
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  streak_type TEXT NOT NULL,
  current_count INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, streak_type)
);

-- Enable RLS
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rewards (public read)
CREATE POLICY "Anyone can view active rewards"
  ON public.rewards
  FOR SELECT
  USING (is_active = true);

-- RLS Policies for user_rewards
CREATE POLICY "Users can view own rewards"
  ON public.user_rewards
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rewards"
  ON public.user_rewards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_streaks
CREATE POLICY "Users can view own streaks"
  ON public.user_streaks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own streaks"
  ON public.user_streaks
  FOR ALL
  USING (auth.uid() = user_id);

-- Create trigger for user_streaks updated_at
CREATE TRIGGER update_user_streaks_updated_at
  BEFORE UPDATE ON public.user_streaks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial rewards
INSERT INTO public.rewards (name, description, icon, category, tier, requirement_type, requirement_value, xp_value) VALUES
('First Fast', 'Complete your first fasting window', '🥇', 'fasting', 'bronze', 'first', 1, 50),
('3-Day Streak', 'Fast for 3 consecutive days', '🔥', 'fasting', 'bronze', 'streak', 3, 100),
('7-Day Warrior', 'Fast for 7 consecutive days', '⚡', 'fasting', 'silver', 'streak', 7, 250),
('30-Day Legend', 'Fast for 30 consecutive days', '👑', 'fasting', 'gold', 'streak', 30, 1000),
('Goal Getter', 'Complete your first goal', '🎯', 'goals', 'bronze', 'first', 1, 50),
('Goal Master', 'Complete 10 goals', '🏆', 'goals', 'silver', 'count', 10, 300),
('Health Explorer', 'Order your first lab test', '🧪', 'tests', 'bronze', 'first', 1, 75),
('Lab Veteran', 'Complete 5 lab tests', '🔬', 'tests', 'silver', 'count', 5, 400),
('Fitness Starter', 'Complete your first workout', '💪', 'fitness', 'bronze', 'first', 1, 50),
('Consistent', 'Log activities for 7 days straight', '⭐', 'milestone', 'silver', 'streak', 7, 200);