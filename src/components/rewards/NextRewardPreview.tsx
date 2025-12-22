import { Gift, ChevronRight } from "lucide-react";
import { type Reward, TIER_CONFIG } from "@/api/rewards";
import RewardIcon from "./RewardIcon";

interface NextRewardPreviewProps {
  reward: Reward;
  progress: number;
  target: number;
  onViewAll?: () => void;
}

export default function NextRewardPreview({ 
  reward, 
  progress, 
  target,
  onViewAll 
}: NextRewardPreviewProps) {
  const tierConfig = TIER_CONFIG[reward.tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.bronze;
  const progressPercentage = Math.min(100, (progress / target) * 100);
  const remaining = target - progress;

  return (
    <div className="relative p-4 rounded-2xl bg-gradient-to-br from-accent-teal/10 to-emerald-500/10 border border-accent-teal/20 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-accent-teal/5 rounded-full blur-2xl" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-4 h-4 text-accent-teal" />
          <span className="text-sm font-medium text-accent-teal">Next Reward</span>
        </div>

        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tierConfig.color} flex items-center justify-center shadow-lg shrink-0`}>
            <RewardIcon icon={reward.icon} size="md" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-semibold font-rounded text-foreground truncate">
              {reward.name}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {reward.description}
            </p>
            
            {/* Progress bar */}
            <div className="mt-2">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-accent-teal to-emerald-400 transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">
                  {progress} / {target}
                </span>
                <span className="text-xs font-medium text-accent-teal">
                  +{reward.xp_value} XP
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Motivational message */}
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {remaining <= 1 ? (
              <span className="text-accent-teal font-medium">Almost there! 🎯</span>
            ) : remaining <= 3 ? (
              <span>Just <span className="font-medium text-foreground">{remaining} more</span> to go!</span>
            ) : (
              <span>Keep going! You've got this 💪</span>
            )}
          </p>
          
          {onViewAll && (
            <button 
              onClick={onViewAll}
              className="flex items-center gap-1 text-xs text-accent-teal hover:underline transition-colors"
            >
              View all
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
