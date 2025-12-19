import { useEffect, useState } from "react";
import { X, Trophy, Flame, Star, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import LevelProgress from "./LevelProgress";
import StreakCard from "./StreakCard";
import BadgeCard from "./BadgeCard";
import NextRewardPreview from "./NextRewardPreview";
import {
  fetchUserRewards,
  fetchAllRewards,
  fetchUserStreaks,
  calculateTotalXP,
  getNextUnlockableReward,
  getRewardsByCategory,
  CATEGORY_ICONS,
  type UserReward,
  type UserStreak,
  type Reward,
} from "@/api/rewards";

interface RewardsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export default function RewardsModal({ open, onOpenChange, userId }: RewardsModalProps) {
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [allRewards, setAllRewards] = useState<Reward[]>([]);
  const [userStreaks, setUserStreaks] = useState<UserStreak[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  const [loading, setLoading] = useState(true);
  const [nextReward, setNextReward] = useState<{ reward: Reward; progress: number; target: number } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!open || !userId) return;
      
      setLoading(true);
      const [rewards, all, streaks] = await Promise.all([
        fetchUserRewards(userId),
        fetchAllRewards(),
        fetchUserStreaks(userId),
      ]);

      setUserRewards(rewards);
      setAllRewards(all);
      setUserStreaks(streaks);

      const xp = calculateTotalXP(rewards);
      setTotalXP(xp);

      const next = await getNextUnlockableReward(userId, rewards, all, streaks, xp);
      setNextReward(next);

      setLoading(false);
    };

    loadData();
  }, [open, userId]);

  const earnedRewardIds = new Set(userRewards.map(ur => ur.reward_id));
  const rewardsByCategory = getRewardsByCategory(allRewards);
  const categories = Object.keys(rewardsByCategory);

  const earnedCount = userRewards.length;
  const totalCount = allRewards.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden bg-background/95 backdrop-blur-xl">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold font-rounded flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Your Rewards
            </DialogTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {earnedCount} / {totalCount} earned
              </span>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(90vh-100px)]">
          <div className="p-6 pt-4 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-accent-teal border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Level Progress */}
                <LevelProgress totalXP={totalXP} />

                {/* Active Streaks */}
                {userStreaks.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold font-rounded mb-3 flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      Active Streaks
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {userStreaks.map((streak) => (
                        <StreakCard key={streak.id} streak={streak} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Next Reward Preview */}
                {nextReward && (
                  <div>
                    <h3 className="text-lg font-semibold font-rounded mb-3 flex items-center gap-2">
                      <Gift className="w-5 h-5 text-accent-teal" />
                      Up Next
                    </h3>
                    <NextRewardPreview
                      reward={nextReward.reward}
                      progress={nextReward.progress}
                      target={nextReward.target}
                    />
                  </div>
                )}

                {/* Badges by Category */}
                <div>
                  <h3 className="text-lg font-semibold font-rounded mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    All Badges
                  </h3>

                  <Tabs defaultValue={categories[0]} className="w-full">
                    <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-xl">
                      {categories.map((category) => (
                        <TabsTrigger
                          key={category}
                          value={category}
                          className="flex-1 min-w-fit px-3 py-2 text-sm capitalize rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                        >
                          <span className="mr-1">{CATEGORY_ICONS[category] || '🏅'}</span>
                          {category}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {categories.map((category) => (
                      <TabsContent key={category} value={category} className="mt-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {rewardsByCategory[category].map((reward) => {
                            const userReward = userRewards.find(ur => ur.reward_id === reward.id);
                            const isEarned = earnedRewardIds.has(reward.id);
                            
                            // Calculate progress for locked rewards
                            let progress = 0;
                            if (!isEarned) {
                              if (reward.requirement_type === 'total_xp') {
                                progress = totalXP;
                              } else if (reward.requirement_type.includes('_streak')) {
                                const streakType = reward.requirement_type.replace('_streak', '');
                                const streak = userStreaks.find(s => s.streak_type === streakType);
                                progress = streak?.current_count || 0;
                              }
                            }

                            return (
                              <BadgeCard
                                key={reward.id}
                                reward={reward}
                                isEarned={isEarned}
                                earnedAt={userReward?.earned_at}
                                progress={progress}
                              />
                            );
                          })}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>

                {/* Empty state if no rewards at all */}
                {earnedCount === 0 && userStreaks.length === 0 && (
                  <div className="text-center py-8">
                    <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Start Your Journey!
                    </h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Complete activities like logging meals, workouts, or fasting sessions to earn badges and build your streaks!
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
