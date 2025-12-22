import { Flame, Zap, Trophy, Star, Moon, Utensils, Pill, Calendar, CheckCircle2 } from "lucide-react";
import { type UserStreak } from "@/api/rewards";

interface StreakCardProps {
  streak: UserStreak;
  compact?: boolean;
}

const MILESTONES = [7, 14, 30];

const STREAK_CONFIG: Record<string, { 
  icon: React.ComponentType<any>; 
  color: string; 
  bgColor: string;
  label: string;
  description: string;
}> = {
  fasting: { 
    icon: Flame, 
    color: 'text-slate-600 dark:text-slate-300', 
    bgColor: 'bg-slate-50 dark:bg-slate-800/50', 
    label: 'Fasting',
    description: 'Days completing your fast'
  },
  workout: { 
    icon: Zap, 
    color: 'text-slate-600 dark:text-slate-300', 
    bgColor: 'bg-slate-50 dark:bg-slate-800/50', 
    label: 'Workout',
    description: 'Consecutive days exercising'
  },
  nutrition: { 
    icon: Utensils, 
    color: 'text-slate-600 dark:text-slate-300', 
    bgColor: 'bg-slate-50 dark:bg-slate-800/50', 
    label: 'Nutrition',
    description: 'Days logging your meals'
  },
  supplements: { 
    icon: Pill, 
    color: 'text-slate-600 dark:text-slate-300', 
    bgColor: 'bg-slate-50 dark:bg-slate-800/50', 
    label: 'Supplements',
    description: 'Days taking your vitamins'
  },
  sleep: { 
    icon: Moon, 
    color: 'text-slate-600 dark:text-slate-300', 
    bgColor: 'bg-slate-50 dark:bg-slate-800/50', 
    label: 'Sleep',
    description: 'Days hitting sleep goals'
  },
  login: { 
    icon: Calendar, 
    color: 'text-slate-600 dark:text-slate-300', 
    bgColor: 'bg-slate-50 dark:bg-slate-800/50', 
    label: 'Daily Login',
    description: 'Days in a row logging in'
  },
  goals: { 
    icon: Trophy, 
    color: 'text-slate-600 dark:text-slate-300', 
    bgColor: 'bg-slate-50 dark:bg-slate-800/50', 
    label: 'Goals',
    description: 'Days achieving your goals'
  },
};

export default function StreakCard({ streak, compact = false }: StreakCardProps) {
  const config = STREAK_CONFIG[streak.streak_type] || {
    icon: Star,
    color: 'text-slate-600 dark:text-slate-300',
    bgColor: 'bg-slate-50 dark:bg-slate-800/50',
    label: streak.streak_type.charAt(0).toUpperCase() + streak.streak_type.slice(1),
    description: 'Keep your streak going!',
  };

  const Icon = config.icon;
  const isHotStreak = streak.current_count >= 7;
  const isOnFire = streak.current_count >= 14;

  // Calculate next milestone
  const nextMilestone = MILESTONES.find(m => streak.current_count < m) || 30;
  const daysToNext = nextMilestone - streak.current_count;
  const progressPercent = Math.min((streak.current_count / 30) * 100, 100);

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${config.bgColor} transition-all hover:scale-105`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
        <span className="text-sm font-medium text-foreground">{streak.current_count}</span>
        {isHotStreak && <span className="text-xs">🔥</span>}
      </div>
    );
  }

  return (
    <div className={`relative p-4 rounded-2xl ${config.bgColor} border border-border/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg overflow-hidden`}>
      {/* Fire animation for hot streaks */}
      {isOnFire && (
        <div className="absolute -top-2 -right-2 text-2xl animate-bounce">
          🔥
        </div>
      )}
      
      {/* Header with icon, title, and description */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shadow-inner border border-white/20">
          <Icon className={`w-6 h-6 ${config.color}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground">{config.label} Streak</p>
            {streak.current_count > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-3 h-3" />
                Active
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>
      </div>

      {/* Current streak and record */}
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-foreground">{streak.current_count}</span>
          <span className="text-sm text-muted-foreground">
            {streak.current_count === 1 ? 'day' : 'days'}
          </span>
          {isHotStreak && !isOnFire && <span className="ml-1">🔥</span>}
        </div>

        <div className="flex items-center gap-1.5 text-sm">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="font-medium text-foreground">{streak.longest_streak}</span>
          <span className="text-xs text-muted-foreground">record</span>
        </div>
      </div>

      {/* Continuous progress bar with milestone markers */}
      <div className="relative mb-2">
        <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-accent-teal to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        
        {/* Milestone dots */}
        <div className="absolute inset-0 flex items-center">
          {MILESTONES.map((milestone) => {
            const position = (milestone / 30) * 100;
            const isReached = streak.current_count >= milestone;
            return (
              <div 
                key={milestone}
                className={`absolute w-3 h-3 rounded-full border-2 transform -translate-x-1/2 transition-all ${
                  isReached 
                    ? 'bg-accent-teal border-white shadow-sm' 
                    : 'bg-background border-muted-foreground/30'
                }`}
                style={{ left: `${position}%` }}
              />
            );
          })}
        </div>
      </div>

      {/* Milestone labels */}
      <div className="flex justify-between text-xs text-muted-foreground px-1 mb-3">
        {MILESTONES.map((milestone) => (
          <span 
            key={milestone}
            className={streak.current_count >= milestone ? 'text-accent-teal font-medium' : ''}
          >
            {milestone}d
          </span>
        ))}
      </div>

      {/* Next milestone motivation */}
      {streak.current_count < 30 && daysToNext > 0 && (
        <div className="pt-2 border-t border-border/30">
          <p className="text-xs text-center">
            <span className="text-muted-foreground">🎯</span>
            <span className="ml-1 font-medium text-foreground">{daysToNext} more {daysToNext === 1 ? 'day' : 'days'}</span>
            <span className="text-muted-foreground"> to {nextMilestone}-day milestone!</span>
          </p>
        </div>
      )}

      {/* Streak completed celebration */}
      {streak.current_count >= 30 && (
        <div className="pt-2 border-t border-border/30">
          <p className="text-xs text-center font-medium text-accent-teal">
            🏆 30-day streak achieved! Keep going!
          </p>
        </div>
      )}
    </div>
  );
}
