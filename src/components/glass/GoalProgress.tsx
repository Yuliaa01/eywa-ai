import { cn } from "@/lib/utils";

interface GoalProgressProps {
  title: string;
  current: number;
  target: number;
  unit: string;
  className?: string;
}

export function GoalProgress({ title, current, target, unit, className }: GoalProgressProps) {
  const percentage = Math.min((current / target) * 100, 100);
  const isComplete = current >= target;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between">
        <h4 className="text-body font-medium text-foreground">{title}</h4>
        <span className="text-caption text-ink-muted">
          {current.toLocaleString()} / {target.toLocaleString()} {unit}
        </span>
      </div>

      <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-chart",
            isComplete ? "bg-green-500" : "bg-accent-teal",
            isComplete && "animate-glow-pulse"
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={target}
          aria-label={`${title} progress: ${percentage.toFixed(0)}%`}
        />
      </div>

      <p className="text-caption text-ink-muted">
        {percentage.toFixed(0)}% complete
      </p>
    </div>
  );
}
