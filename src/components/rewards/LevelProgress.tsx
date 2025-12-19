import { getUserLevel, getLevelProgress, LEVELS, type UserLevel } from "@/api/rewards";
import { Progress } from "@/components/ui/progress";

interface LevelProgressProps {
  totalXP: number;
  compact?: boolean;
}

export default function LevelProgress({ totalXP, compact = false }: LevelProgressProps) {
  const currentLevel = getUserLevel(totalXP);
  const progress = getLevelProgress(totalXP);
  const nextLevelIndex = LEVELS.findIndex(l => l.level === currentLevel.level) + 1;
  const nextLevel = nextLevelIndex < LEVELS.length ? LEVELS[nextLevelIndex] : null;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xl">{currentLevel.icon}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-foreground">
              Level {currentLevel.level} - {currentLevel.name}
            </span>
            <span className="text-xs text-muted-foreground">{totalXP} XP</span>
          </div>
          <Progress value={progress.percentage} className="h-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative p-6 rounded-2xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 backdrop-blur-xl border border-accent-teal/20 shadow-lg overflow-hidden">
      {/* Background decoration */}
      <div className={`absolute inset-0 bg-gradient-to-r ${currentLevel.color} opacity-5`} />
      
      <div className="relative z-10">
        {/* Level Badge */}
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentLevel.color} flex items-center justify-center shadow-lg`}>
            <span className="text-3xl">{currentLevel.icon}</span>
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Current Level</p>
            <h3 className="text-2xl font-bold font-rounded text-foreground">
              {currentLevel.name}
            </h3>
            <p className="text-accent-teal font-semibold">{totalXP.toLocaleString()} XP</p>
          </div>
        </div>

        {/* Progress to Next Level */}
        {nextLevel && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress to {nextLevel.name}</span>
              <span className="font-medium text-foreground">
                {progress.current.toLocaleString()} / {progress.max.toLocaleString()} XP
              </span>
            </div>
            <div className="relative h-4 rounded-full bg-muted overflow-hidden">
              <div 
                className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${currentLevel.color} transition-all duration-500`}
                style={{ width: `${progress.percentage}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-foreground/80 drop-shadow-sm">
                  {Math.round(progress.percentage)}%
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {(progress.max - progress.current).toLocaleString()} XP until {nextLevel.icon} {nextLevel.name}
            </p>
          </div>
        )}

        {!nextLevel && (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">
              🎉 You've reached the highest level!
            </p>
          </div>
        )}

        {/* Level Preview */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex justify-between items-center">
            {LEVELS.map((level, idx) => (
              <div 
                key={level.level}
                className={`flex flex-col items-center transition-all duration-300 ${
                  level.level <= currentLevel.level 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-40 scale-90'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  level.level <= currentLevel.level 
                    ? `bg-gradient-to-br ${level.color} shadow-md` 
                    : 'bg-muted'
                }`}>
                  <span className="text-sm">{level.icon}</span>
                </div>
                <span className="text-xs mt-1 text-muted-foreground hidden sm:block">
                  {level.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
