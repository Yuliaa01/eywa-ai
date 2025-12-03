import { Target, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RingProgress } from "../charts/RingProgress";

interface LongevityGoalCardProps {
  id: string;
  title: string;
  description?: string | null;
  targetValue?: number | null;
  targetMetric?: string | null;
  units?: string | null;
  progress?: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function LongevityGoalCard({
  title,
  description,
  targetValue,
  targetMetric,
  units,
  progress = Math.random() * 40 + 40,
  onEdit,
  onDelete,
}: LongevityGoalCardProps) {
  return (
    <div className="group p-4 bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 rounded-xl border border-emerald-200/50 dark:border-emerald-800/30 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
      <div className="flex items-start gap-4">
        {/* Ring Progress */}
        <div className="relative flex-shrink-0">
          <RingProgress
            progress={progress}
            color="#10B981"
            trackColor="rgba(16, 185, 129, 0.15)"
            size={56}
            strokeWidth={5}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Target className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground truncate">{title}</h4>
              {description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{description}</p>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                onClick={onEdit}
              >
                <Edit className="w-4 h-4 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </div>

          {/* Target Display */}
          {targetValue && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                Target: {targetValue} {units || targetMetric}
              </span>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
