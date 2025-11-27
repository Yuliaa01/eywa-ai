import { supabase } from "@/integrations/supabase/client";

export interface Reward {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: string;
  requirement_type: string;
  requirement_value: number;
  xp_value: number;
  is_active: boolean;
  created_at: string;
}

export interface UserReward {
  id: string;
  user_id: string;
  reward_id: string;
  earned_at: string;
  trigger_data?: any;
  rewards?: Reward;
}

export interface UserStreak {
  id: string;
  user_id: string;
  streak_type: string;
  current_count: number;
  last_activity_date: string;
  longest_streak: number;
  created_at: string;
  updated_at: string;
}

export const fetchUserRewards = async (userId: string): Promise<UserReward[]> => {
  const { data, error } = await supabase
    .from('user_rewards')
    .select(`
      *,
      rewards (*)
    `)
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error) {
    console.error('Error fetching user rewards:', error);
    return [];
  }

  return data || [];
};

export const fetchUserStreaks = async (userId: string): Promise<UserStreak[]> => {
  const { data, error } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user streaks:', error);
    return [];
  }

  return data || [];
};

export const calculateTotalXP = (userRewards: UserReward[]): number => {
  return userRewards.reduce((total, ur) => {
    return total + (ur.rewards?.xp_value || 0);
  }, 0);
};
