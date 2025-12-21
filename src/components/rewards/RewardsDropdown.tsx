import { useEffect, useState, useCallback } from "react";
import { Star, Trophy, Flame, Zap, ChevronRight, Moon, Utensils, Pill, Target, Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  fetchUserRewards, 
  fetchUserStreaks, 
  calculateTotalXP, 
  getUserLevel,
  getLevelProgress,
  type UserReward, 
  type UserStreak 
} from "@/api/rewards";
import { supabase } from "@/integrations/supabase/client";
import RewardsModal from "./RewardsModal";

interface RewardsDropdownProps {
  userId: string;
}

export default function RewardsDropdown({ userId }: RewardsDropdownProps) {
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [userStreaks, setUserStreaks] = useState<UserStreak[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const loadRewardsData = useCallback(async () => {
    if (!userId) return;
    
    const [rewards, streaks] = await Promise.all([
      fetchUserRewards(userId),
      fetchUserStreaks(userId)
    ]);
    
    setUserRewards(rewards);
    setUserStreaks(streaks);
    setTotalXP(calculateTotalXP(rewards));
    setLoading(false);
  }, [userId]);

  // Initial load
  useEffect(() => {
    if (userId) {
      setLoading(true);
      loadRewardsData();
    }
  }, [userId, loadRewardsData]);

  // Supabase Realtime subscriptions
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('rewards-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_rewards',
        filter: `user_id=eq.${userId}`
      }, () => {
        loadRewardsData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_streaks',
        filter: `user_id=eq.${userId}`
      }, () => {
        loadRewardsData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadRewardsData]);

  // Custom event listener as fallback
  useEffect(() => {
    const handleRewardsUpdated = () => {
      loadRewardsData();
    };

    window.addEventListener('rewards-updated', handleRewardsUpdated);
    return () => {
      window.removeEventListener('rewards-updated', handleRewardsUpdated);
    };
  }, [loadRewardsData]);

  const recentRewards = userRewards.slice(0, 4);
  const currentLevel = getUserLevel(totalXP);
  const levelProgress = getLevelProgress(totalXP);

  const getStreakIcon = (type: string) => {
    switch (type) {
      case 'fasting':
        return <Flame className="w-4 h-4 text-orange-500" />;
      case 'workout':
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'nutrition':
        return <Utensils className="w-4 h-4 text-green-500" />;
      case 'supplements':
        return <Pill className="w-4 h-4 text-purple-500" />;
      case 'sleep':
        return <Moon className="w-4 h-4 text-blue-500" />;
      case 'goals':
        return <Trophy className="w-4 h-4 text-accent-teal" />;
      default:
        return <Star className="w-4 h-4 text-yellow-500" />;
    }
  };

  const formatStreakType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Get top 3 active streaks
  const topStreaks = userStreaks
    .sort((a, b) => b.current_count - a.current_count)
    .slice(0, 3);

  // Define daily goals - check if activity happened TODAY by comparing dates
  const today = new Date().toISOString().split('T')[0];
  
  const dailyGoals = [
    { 
      id: 1, 
      label: "Complete a fast", 
      achieved: userStreaks.some(s => s.streak_type === "fasting" && s.last_activity_date === today),
      icon: <Flame className="w-3.5 h-3.5" />
    },
    { 
      id: 2, 
      label: "Log a workout", 
      achieved: userStreaks.some(s => s.streak_type === "workout" && s.last_activity_date === today),
      icon: <Zap className="w-3.5 h-3.5" />
    },
    { 
      id: 3, 
      label: "Take supplements", 
      achieved: userStreaks.some(s => s.streak_type === "supplements" && s.last_activity_date === today),
      icon: <Pill className="w-3.5 h-3.5" />
    },
  ];
  
  const goalsCompleted = dailyGoals.filter(g => g.achieved).length;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-xl hover:bg-accent-teal/10 hover:shadow-[0_0_20px_rgba(18,175,203,0.3)] hover:scale-110 active:scale-95 transition-all duration-200 focus:outline-none relative"
          >
            <span className="text-lg">{currentLevel.icon}</span>
            {userRewards.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-teal text-white text-xs font-bold rounded-full flex items-center justify-center">
                {userRewards.length > 99 ? '99+' : userRewards.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-80 bg-card/95 backdrop-blur-xl border-border shadow-lg z-50 p-0"
        >
          {loading ? (
            <div className="p-4">
              <p className="text-sm text-muted-foreground">Loading rewards...</p>
            </div>
          ) : (
            <>
              {/* Level & XP Header */}
              <div className="p-4 bg-gradient-to-br from-accent-teal/10 to-emerald-500/5 border-b border-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentLevel.color} flex items-center justify-center shadow-md`}>
                    <span className="text-xl">{currentLevel.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{currentLevel.name}</span>
                      <span className="text-lg font-bold text-accent-teal">{totalXP} XP</span>
                    </div>
                    <Progress value={levelProgress.percentage} className="h-1.5 mt-1" />
                  </div>
                </div>
              </div>

              {/* Active Streaks */}
              {topStreaks.length > 0 && (
                <div className="p-3 border-b border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Streaks</p>
                  <div className="flex gap-2">
                    {topStreaks.map((streak) => (
                      <div 
                        key={streak.id} 
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/50"
                        title={`${formatStreakType(streak.streak_type)} - ${streak.current_count} days`}
                      >
                        {getStreakIcon(streak.streak_type)}
                        <span className="text-sm font-semibold text-foreground">
                          {streak.current_count}
                        </span>
                        {streak.current_count >= 7 && <span className="text-xs">🔥</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Daily Goals */}
              <div className="p-3 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    Daily Goals
                  </p>
                  <span className="text-xs font-semibold text-accent-teal">{goalsCompleted}/3</span>
                </div>
                <div className="space-y-1.5">
                  {dailyGoals.map((goal) => (
                    <div 
                      key={goal.id} 
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg transition-colors ${
                        goal.achieved 
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                          : "bg-muted/30 text-muted-foreground"
                      }`}
                    >
                      <div className={`flex-shrink-0 ${goal.achieved ? "text-emerald-500" : "text-muted-foreground/50"}`}>
                        {goal.icon}
                      </div>
                      <span className={`flex-1 text-sm ${goal.achieved ? "line-through opacity-70" : ""}`}>
                        {goal.label}
                      </span>
                      {goal.achieved ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground/30" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Badges */}
              <div className="p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Recent Badges</p>
                {recentRewards.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {recentRewards.map((userReward) => (
                      <Badge
                        key={userReward.id}
                        variant="secondary"
                        className="bg-accent-teal/10 text-accent-teal hover:bg-accent-teal/20 transition-colors text-xs"
                        title={userReward.rewards?.description}
                      >
                        <span className="mr-1">{userReward.rewards?.icon}</span>
                        {userReward.rewards?.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Complete activities to earn badges!
                  </p>
                )}
              </div>

              {/* View All Button */}
              <div className="p-3 pt-0">
                <Button 
                  variant="outline" 
                  className="w-full justify-between text-sm"
                  onClick={() => setModalOpen(true)}
                >
                  <span>View All Rewards</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <RewardsModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
        userId={userId} 
      />
    </>
  );
}
