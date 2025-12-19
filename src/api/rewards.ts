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

export interface UserLevel {
  level: number;
  name: string;
  minXP: number;
  maxXP: number;
  icon: string;
  color: string;
}

// Level definitions
export const LEVELS: UserLevel[] = [
  { level: 1, name: 'Beginner', minXP: 0, maxXP: 499, icon: '🌱', color: 'from-green-400 to-green-600' },
  { level: 2, name: 'Intermediate', minXP: 500, maxXP: 1999, icon: '🌿', color: 'from-blue-400 to-blue-600' },
  { level: 3, name: 'Advanced', minXP: 2000, maxXP: 4999, icon: '🌳', color: 'from-purple-400 to-purple-600' },
  { level: 4, name: 'Master', minXP: 5000, maxXP: 9999, icon: '🏆', color: 'from-yellow-400 to-yellow-600' },
  { level: 5, name: 'Legend', minXP: 10000, maxXP: Infinity, icon: '👑', color: 'from-amber-400 to-orange-600' },
];

// Get user's current level based on XP
export const getUserLevel = (totalXP: number): UserLevel => {
  return LEVELS.find(level => totalXP >= level.minXP && totalXP <= level.maxXP) || LEVELS[0];
};

// Calculate progress to next level
export const getLevelProgress = (totalXP: number): { current: number; max: number; percentage: number } => {
  const currentLevel = getUserLevel(totalXP);
  const nextLevelIndex = LEVELS.findIndex(l => l.level === currentLevel.level) + 1;
  
  if (nextLevelIndex >= LEVELS.length) {
    return { current: totalXP, max: totalXP, percentage: 100 };
  }
  
  const nextLevel = LEVELS[nextLevelIndex];
  const progressInLevel = totalXP - currentLevel.minXP;
  const levelRange = nextLevel.minXP - currentLevel.minXP;
  
  return {
    current: progressInLevel,
    max: levelRange,
    percentage: Math.min(100, (progressInLevel / levelRange) * 100),
  };
};

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

export const fetchAllRewards = async (): Promise<Reward[]> => {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('requirement_value', { ascending: true });

  if (error) {
    console.error('Error fetching all rewards:', error);
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

// Update or create a streak
export const updateStreak = async (
  userId: string, 
  streakType: string
): Promise<UserStreak | null> => {
  const today = new Date().toISOString().split('T')[0];
  
  // Check if streak exists
  const { data: existingStreak } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .eq('streak_type', streakType)
    .single();

  if (existingStreak) {
    const lastDate = existingStreak.last_activity_date;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newCount = existingStreak.current_count;
    
    if (lastDate === today) {
      // Already logged today, no change
      return existingStreak;
    } else if (lastDate === yesterdayStr) {
      // Consecutive day, increment streak
      newCount = existingStreak.current_count + 1;
    } else {
      // Streak broken, reset to 1
      newCount = 1;
    }

    const newLongest = Math.max(existingStreak.longest_streak, newCount);

    const { data, error } = await supabase
      .from('user_streaks')
      .update({
        current_count: newCount,
        last_activity_date: today,
        longest_streak: newLongest,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingStreak.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating streak:', error);
      return null;
    }
    return data;
  } else {
    // Create new streak
    const { data, error } = await supabase
      .from('user_streaks')
      .insert({
        user_id: userId,
        streak_type: streakType,
        current_count: 1,
        last_activity_date: today,
        longest_streak: 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating streak:', error);
      return null;
    }
    return data;
  }
};

// Award a reward to user
export const awardReward = async (
  userId: string, 
  rewardId: string,
  triggerData?: any
): Promise<UserReward | null> => {
  // Check if already earned
  const { data: existing } = await supabase
    .from('user_rewards')
    .select('*')
    .eq('user_id', userId)
    .eq('reward_id', rewardId)
    .single();

  if (existing) {
    return existing; // Already has this reward
  }

  const { data, error } = await supabase
    .from('user_rewards')
    .insert({
      user_id: userId,
      reward_id: rewardId,
      trigger_data: triggerData,
    })
    .select(`
      *,
      rewards (*)
    `)
    .single();

  if (error) {
    console.error('Error awarding reward:', error);
    return null;
  }

  return data;
};

// Check and award applicable streak rewards
export const checkAndAwardStreakRewards = async (
  userId: string,
  streakType: string,
  currentCount: number
): Promise<UserReward[]> => {
  const awardedRewards: UserReward[] = [];
  
  // Fetch all rewards for this streak type
  const { data: rewards } = await supabase
    .from('rewards')
    .select('*')
    .eq('is_active', true)
    .like('requirement_type', `%${streakType}%`);

  if (!rewards) return awardedRewards;

  for (const reward of rewards) {
    if (currentCount >= reward.requirement_value) {
      const awarded = await awardReward(userId, reward.id, { streak_count: currentCount });
      if (awarded && awarded.rewards) {
        awardedRewards.push(awarded);
      }
    }
  }

  return awardedRewards;
};

// Check and award milestone rewards based on total XP
export const checkAndAwardMilestoneRewards = async (
  userId: string,
  totalXP: number
): Promise<UserReward[]> => {
  const awardedRewards: UserReward[] = [];

  const { data: rewards } = await supabase
    .from('rewards')
    .select('*')
    .eq('is_active', true)
    .eq('requirement_type', 'total_xp');

  if (!rewards) return awardedRewards;

  for (const reward of rewards) {
    if (totalXP >= reward.requirement_value) {
      const awarded = await awardReward(userId, reward.id, { total_xp: totalXP });
      if (awarded && awarded.rewards) {
        awardedRewards.push(awarded);
      }
    }
  }

  return awardedRewards;
};

// Get next unlockable reward for a user
export const getNextUnlockableReward = async (
  userId: string,
  userRewards: UserReward[],
  allRewards: Reward[],
  streaks: UserStreak[],
  totalXP: number
): Promise<{ reward: Reward; progress: number; target: number } | null> => {
  const earnedIds = new Set(userRewards.map(ur => ur.reward_id));
  const lockedRewards = allRewards.filter(r => !earnedIds.has(r.id));

  for (const reward of lockedRewards) {
    let progress = 0;
    const target = reward.requirement_value;

    if (reward.requirement_type === 'total_xp') {
      progress = totalXP;
    } else if (reward.requirement_type.includes('_streak')) {
      const streakType = reward.requirement_type.replace('_streak', '');
      const streak = streaks.find(s => s.streak_type === streakType);
      progress = streak?.current_count || 0;
    } else if (reward.requirement_type.includes('_count')) {
      // For count-based rewards, we'd need to query the actual counts
      // For now, show 0 progress
      progress = 0;
    }

    if (progress < target) {
      return { reward, progress, target };
    }
  }

  return null;
};

// Get rewards grouped by category
export const getRewardsByCategory = (rewards: Reward[]): Record<string, Reward[]> => {
  return rewards.reduce((acc, reward) => {
    if (!acc[reward.category]) {
      acc[reward.category] = [];
    }
    acc[reward.category].push(reward);
    return acc;
  }, {} as Record<string, Reward[]>);
};

// Tier colors and icons
export const TIER_CONFIG = {
  bronze: { color: 'from-amber-600 to-amber-800', textColor: 'text-amber-600', bgColor: 'bg-amber-100' },
  silver: { color: 'from-slate-400 to-slate-600', textColor: 'text-slate-500', bgColor: 'bg-slate-100' },
  gold: { color: 'from-yellow-400 to-yellow-600', textColor: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  platinum: { color: 'from-purple-400 to-purple-600', textColor: 'text-purple-600', bgColor: 'bg-purple-100' },
};

// Category icons
export const CATEGORY_ICONS: Record<string, string> = {
  nutrition: '🥗',
  workout: '💪',
  supplements: '💊',
  fasting: '⏰',
  sleep: '😴',
  milestone: '🏆',
  engagement: '🎯',
};
