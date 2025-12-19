-- Insert new reward badges for expanded gamification system

-- Nutrition Category Rewards
INSERT INTO public.rewards (name, description, icon, category, tier, requirement_type, requirement_value, xp_value, is_active)
VALUES 
  ('Nutrition Novice', 'Log your first meal', '🥗', 'nutrition', 'bronze', 'meal_count', 1, 50, true),
  ('Week of Wellness', 'Log meals for 7 consecutive days', '🍽️', 'nutrition', 'silver', 'nutrition_streak', 7, 150, true),
  ('Month of Mindful Eating', 'Log meals for 30 consecutive days', '🏅', 'nutrition', 'gold', 'nutrition_streak', 30, 500, true);

-- Workout Category Rewards (expanding existing)
INSERT INTO public.rewards (name, description, icon, category, tier, requirement_type, requirement_value, xp_value, is_active)
VALUES 
  ('First Steps', 'Complete your first workout', '👟', 'workout', 'bronze', 'workout_count', 1, 50, true),
  ('Workout Warrior', 'Maintain a 7-day workout streak', '⚡', 'workout', 'silver', 'workout_streak', 7, 200, true),
  ('Iron Will', 'Maintain a 14-day workout streak', '🦾', 'workout', 'gold', 'workout_streak', 14, 400, true),
  ('Unstoppable Force', 'Maintain a 30-day workout streak', '🌟', 'workout', 'platinum', 'workout_streak', 30, 1000, true);

-- Supplements Category Rewards
INSERT INTO public.rewards (name, description, icon, category, tier, requirement_type, requirement_value, xp_value, is_active)
VALUES 
  ('Supplement Starter', 'Log your first supplement', '💊', 'supplements', 'bronze', 'supplement_count', 1, 50, true),
  ('Daily Dose', 'Take supplements for 7 consecutive days', '💚', 'supplements', 'silver', 'supplements_streak', 7, 150, true),
  ('Supplement Master', 'Take supplements for 30 consecutive days', '🧬', 'supplements', 'gold', 'supplements_streak', 30, 500, true);

-- Fasting Category Rewards
INSERT INTO public.rewards (name, description, icon, category, tier, requirement_type, requirement_value, xp_value, is_active)
VALUES 
  ('Fasting Initiate', 'Complete your first fast', '🕐', 'fasting', 'bronze', 'fasting_count', 1, 50, true),
  ('Fasting Focused', 'Complete 7 fasts', '⏰', 'fasting', 'silver', 'fasting_count', 7, 150, true),
  ('Fasting Champion', 'Complete a 7-day fasting streak', '🏆', 'fasting', 'gold', 'fasting_streak', 7, 300, true),
  ('Fasting Master', 'Complete a 30-day fasting streak', '🔥', 'fasting', 'platinum', 'fasting_streak', 30, 800, true);

-- Sleep & Recovery Rewards
INSERT INTO public.rewards (name, description, icon, category, tier, requirement_type, requirement_value, xp_value, is_active)
VALUES 
  ('Sleep Tracker', 'Log your first sleep data', '😴', 'sleep', 'bronze', 'sleep_count', 1, 50, true),
  ('Well Rested', 'Log sleep for 7 consecutive days', '🌙', 'sleep', 'silver', 'sleep_streak', 7, 150, true),
  ('Sleep Champion', 'Log sleep for 30 consecutive days', '✨', 'sleep', 'gold', 'sleep_streak', 30, 500, true);

-- XP Milestone Rewards
INSERT INTO public.rewards (name, description, icon, category, tier, requirement_type, requirement_value, xp_value, is_active)
VALUES 
  ('Rising Star', 'Earn 500 total XP', '⭐', 'milestone', 'bronze', 'total_xp', 500, 100, true),
  ('Health Champion', 'Earn 2000 total XP', '🏆', 'milestone', 'silver', 'total_xp', 2000, 250, true),
  ('Longevity Legend', 'Earn 5000 total XP', '👑', 'milestone', 'gold', 'total_xp', 5000, 500, true),
  ('Wellness Titan', 'Earn 10000 total XP', '💎', 'milestone', 'platinum', 'total_xp', 10000, 1000, true);

-- General Engagement Rewards
INSERT INTO public.rewards (name, description, icon, category, tier, requirement_type, requirement_value, xp_value, is_active)
VALUES 
  ('Getting Started', 'Complete onboarding', '🚀', 'engagement', 'bronze', 'onboarding', 1, 100, true),
  ('Health Explorer', 'Use 3 different app features', '🧭', 'engagement', 'bronze', 'features_used', 3, 75, true),
  ('Consistent Champion', 'Log in 7 days in a row', '📅', 'engagement', 'silver', 'login_streak', 7, 150, true),
  ('Dedicated User', 'Log in 30 days in a row', '🎯', 'engagement', 'gold', 'login_streak', 30, 400, true);