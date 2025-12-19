import { useEffect, useState } from "react";
import { Star, Trophy, Flame, Zap, ChevronRight, Moon, Utensils, Pill } from "lucide-react";
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

  useEffect(() => {
    const loadRewardsData = async () => {
      setLoading(true);
      const [rewards, streaks] = await Promise.all([
        fetchUserRewards(userId),
        fetchUserStreaks(userId)
      ]);
      
      setUserRewards(rewards);
      setUserStreaks(streaks);
      setTotalXP(calculateTotalXP(rewards));
      setLoading(false);
    };

    if (userId) {
      loadRewardsData();
    }
  }, [userId]);

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
