import { Lock } from "lucide-react";
import { type Reward, TIER_CONFIG } from "@/api/rewards";
import RewardIcon from "./RewardIcon";

interface BadgeCardProps {
  reward: Reward;
  isEarned: boolean;
  earnedAt?: string;
  progress?: number;
  compact?: boolean;
}

export default function BadgeCard({ 
  reward, 
  isEarned, 
  earnedAt, 
  progress = 0,
  compact = false 
}: BadgeCardProps) {
  const tierConfig = TIER_CONFIG[reward.tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.bronze;
  const progressPercentage = Math.min(100, (progress / reward.requirement_value) * 100);

  if (compact) {
    return (
      <div 
        className={`relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
          isEarned 
            ? `${tierConfig.bgColor} shadow-md` 
            : 'bg-muted/50 opacity-60'
        }`}
        title={reward.description}
      >
        <RewardIcon icon={reward.icon} size="sm" className={!isEarned ? 'grayscale' : ''} />
        <span className={`text-sm font-medium ${isEarned ? 'text-foreground' : 'text-muted-foreground'}`}>
          {reward.name}
        </span>
        {!isEarned && <Lock className="w-3 h-3 text-muted-foreground ml-auto" />}
      </div>
    );
  }

  return (
    <div 
      className={`relative p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
        isEarned 
          ? `${tierConfig.bgColor} border-${tierConfig.textColor}/30 shadow-lg` 
          : 'bg-muted/30 border-border/50 opacity-70'
      }`}
    >
      {/* Tier indicator */}
      <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium ${tierConfig.bgColor} ${tierConfig.textColor}`}>
        {reward.tier}
      </div>

      {/* Badge icon */}
      <div className="flex flex-col items-center text-center">
        <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center mb-3 ${
          isEarned 
            ? `bg-gradient-to-br ${tierConfig.color} shadow-lg` 
            : 'bg-muted'
        }`}>
          <RewardIcon icon={reward.icon} size="lg" className={!isEarned ? 'grayscale opacity-50' : ''} />
          {!isEarned && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-2xl">
              <Lock className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>

        <h4 className={`font-semibold font-rounded ${isEarned ? 'text-foreground' : 'text-muted-foreground'}`}>
          {reward.name}
        </h4>
        
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {reward.description}
        </p>

        {/* XP value */}
        <div className={`mt-2 px-2 py-1 rounded-full text-xs font-medium ${
          isEarned ? 'bg-accent-teal/20 text-accent-teal' : 'bg-muted text-muted-foreground'
        }`}>
          +{reward.xp_value} XP
        </div>

        {/* Progress bar for locked badges */}
        {!isEarned && progress > 0 && (
          <div className="w-full mt-3">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-accent-teal to-emerald-400 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {progress} / {reward.requirement_value}
            </p>
          </div>
        )}

        {/* Earned date */}
        {isEarned && earnedAt && (
          <p className="text-xs text-muted-foreground mt-2">
            Earned {new Date(earnedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
