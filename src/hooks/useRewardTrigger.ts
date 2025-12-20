import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { triggerConfetti } from "@/utils/confetti";
import { updateStreak, checkAndAwardStreakRewards } from "@/api/rewards";

interface RewardTriggerOptions {
  streakType: string;
  countType: string;
  tableName: string;
}

export async function triggerRewardCheck(
  userId: string, 
  options: RewardTriggerOptions
): Promise<void> {
  const { streakType, countType, tableName } = options;

  try {
    // Update streak
    const updatedStreak = await updateStreak(userId, streakType);
    
    // Get total count from table
    const { count } = await supabase
      .from(tableName as any)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const totalCount = count || 0;
    const streakCount = updatedStreak?.current_count || 0;

    // Check count-based rewards
    const countRewards = await checkAndAwardStreakRewards(userId, countType, totalCount);
    
    // Check streak-based rewards
    const streakRewards = await checkAndAwardStreakRewards(userId, `${streakType}_streak`, streakCount);

    // Celebrate earned rewards
    const allRewards = [...countRewards, ...streakRewards];
    for (const reward of allRewards) {
      if (reward.rewards) {
        triggerConfetti();
        toast({
          title: `🏆 Badge Earned: ${reward.rewards.name}!`,
          description: reward.rewards.description,
        });
      }
    }
  } catch (error) {
    console.error('Error triggering reward check:', error);
  }
}

// Convenience functions for each activity type
export async function triggerWorkoutReward(userId: string): Promise<void> {
  return triggerRewardCheck(userId, {
    streakType: 'workout',
    countType: 'workout_count',
    tableName: 'workout_plans',
  });
}

export async function triggerNutritionReward(userId: string): Promise<void> {
  return triggerRewardCheck(userId, {
    streakType: 'nutrition',
    countType: 'nutrition_count',
    tableName: 'meals',
  });
}

export async function triggerLoginReward(userId: string): Promise<void> {
  return triggerRewardCheck(userId, {
    streakType: 'login',
    countType: 'login_count',
    tableName: 'user_streaks', // We'll just use streak count for login
  });
}
