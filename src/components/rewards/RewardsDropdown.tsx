import { useEffect, useState } from "react";
import { Star, Trophy, Flame, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { fetchUserRewards, fetchUserStreaks, calculateTotalXP, type UserReward, type UserStreak } from "@/api/rewards";

interface RewardsDropdownProps {
  userId: string;
}

export default function RewardsDropdown({ userId }: RewardsDropdownProps) {
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [userStreaks, setUserStreaks] = useState<UserStreak[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  const [loading, setLoading] = useState(true);

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

  const recentRewards = userRewards.slice(0, 6);

  const getStreakIcon = (type: string) => {
    switch (type) {
      case 'fasting':
        return <Flame className="w-4 h-4 text-orange-500" />;
      case 'workout':
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'goals':
        return <Trophy className="w-4 h-4 text-accent-teal" />;
      default:
        return <Star className="w-4 h-4 text-yellow-500" />;
    }
  };

  const formatStreakType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-xl hover:bg-accent-teal/10 hover:shadow-[0_0_20px_rgba(18,175,203,0.3)] hover:scale-110 active:scale-95 transition-all duration-200 focus:outline-none relative"
        >
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          {userRewards.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-teal text-white text-xs font-bold rounded-full flex items-center justify-center">
              {userRewards.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 bg-card/95 backdrop-blur-xl border-border shadow-lg z-50"
      >
        {loading ? (
          <div className="p-4">
            <p className="text-sm text-muted-foreground">Loading rewards...</p>
          </div>
        ) : (
          <>
            {/* Total XP Section */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span className="font-rounded font-semibold text-foreground">Total XP</span>
                </div>
                <span className="text-lg font-bold text-accent-teal">{totalXP}</span>
              </div>
            </div>

            {/* Current Streaks Section */}
            {userStreaks.length > 0 && (
              <div className="p-4 border-b border-border">
                <p className="text-sm font-rounded font-medium text-foreground mb-2">Current Streaks</p>
                <div className="space-y-2">
                  {userStreaks.map((streak) => (
                    <div key={streak.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStreakIcon(streak.streak_type)}
                        <span className="text-sm text-muted-foreground">
                          {formatStreakType(streak.streak_type)}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {streak.current_count} {streak.current_count === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Badges Section */}
            {recentRewards.length > 0 ? (
              <div className="p-4">
                <p className="text-sm font-rounded font-medium text-foreground mb-3">Recent Badges</p>
                <div className="flex flex-wrap gap-2">
                  {recentRewards.map((userReward) => (
                    <Badge
                      key={userReward.id}
                      variant="secondary"
                      className="bg-accent-teal/10 text-accent-teal hover:bg-accent-teal/20 transition-colors"
                      title={userReward.rewards?.description}
                    >
                      <span className="mr-1">{userReward.rewards?.icon}</span>
                      {userReward.rewards?.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4">
                <p className="text-sm text-muted-foreground text-center">
                  No rewards yet. Complete activities to earn badges!
                </p>
              </div>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
