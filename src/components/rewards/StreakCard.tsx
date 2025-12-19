import { Flame, Zap, Trophy, Star, Moon, Utensils, Pill, Calendar } from "lucide-react";
import { type UserStreak } from "@/api/rewards";

interface StreakCardProps {
  streak: UserStreak;
  compact?: boolean;
}

const STREAK_CONFIG: Record<string, { 
  icon: React.ComponentType<any>; 
  color: string; 
  bgColor: string;
  label: string;
}> = {
  fasting: { icon: Flame, color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/30', label: 'Fasting' },
  workout: { icon: Zap, color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Workout' },
  nutrition: { icon: Utensils, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30', label: 'Nutrition' },
  supplements: { icon: Pill, color: 'text-purple-500', bgColor: 'bg-purple-100 dark:bg-purple-900/30', label: 'Supplements' },
  sleep: { icon: Moon, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30', label: 'Sleep' },
  login: { icon: Calendar, color: 'text-teal-500', bgColor: 'bg-teal-100 dark:bg-teal-900/30', label: 'Daily Login' },
  goals: { icon: Trophy, color: 'text-accent-teal', bgColor: 'bg-accent-teal/10', label: 'Goals' },
};

export default function StreakCard({ streak, compact = false }: StreakCardProps) {
  const config = STREAK_CONFIG[streak.streak_type] || {
    icon: Star,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    label: streak.streak_type.charAt(0).toUpperCase() + streak.streak_type.slice(1),
  };

  const Icon = config.icon;
  const isHotStreak = streak.current_count >= 7;
  const isOnFire = streak.current_count >= 14;

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
      
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center shadow-inner`}>
          <Icon className={`w-6 h-6 ${config.color}`} />
        </div>
        
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium">{config.label} Streak</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-foreground">{streak.current_count}</span>
            <span className="text-sm text-muted-foreground">
              {streak.current_count === 1 ? 'day' : 'days'}
            </span>
            {isHotStreak && !isOnFire && <span className="ml-1">🔥</span>}
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-muted-foreground">Best</p>
          <p className="text-lg font-semibold text-foreground">{streak.longest_streak}</p>
        </div>
      </div>

      {/* Milestone indicators */}
      <div className="mt-3 flex gap-1">
        {[7, 14, 30].map((milestone) => (
          <div 
            key={milestone}
            className={`flex-1 h-1.5 rounded-full transition-all ${
              streak.current_count >= milestone 
                ? 'bg-gradient-to-r from-accent-teal to-emerald-400' 
                : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>7d</span>
        <span>14d</span>
        <span>30d</span>
      </div>
    </div>
  );
}
