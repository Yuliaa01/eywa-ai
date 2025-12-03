import { Calendar, Clock, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WeeklyGoalCardProps {
  id: string;
  title: string;
  description?: string | null;
  timeScope?: string | null;
  progress?: number;
  onEdit: () => void;
  onDelete: () => void;
}

const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function WeeklyGoalCard({
  title,
  description,
  timeScope,
  progress = Math.random() * 30 + 50,
  onEdit,
  onDelete,
}: WeeklyGoalCardProps) {
  const isDaily = timeScope === 'day';
  const currentDay = new Date().getDay();
  const adjustedDay = currentDay === 0 ? 6 : currentDay - 1; // Convert to Mon=0
  
  return (
    <div className="group p-4 bg-gradient-to-br from-cyan-50 to-sky-50/50 dark:from-cyan-950/30 dark:to-sky-950/20 rounded-xl border-l-4 border-l-cyan-500 border border-cyan-200/50 dark:border-cyan-800/30 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Icon Badge */}
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-sky-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 flex-shrink-0">
            {isDaily ? (
              <Clock className="w-5 h-5 text-white" />
            ) : (
              <Calendar className="w-5 h-5 text-white" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-foreground truncate">{title}</h4>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                isDaily 
                  ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' 
                  : 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300'
              }`}>
                {isDaily ? 'Today' : 'This Week'}
              </span>
            </div>
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-cyan-100 dark:hover:bg-cyan-900/30"
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

      {/* Day Indicators (for weekly) */}
      {!isDaily && (
        <div className="mt-3 flex items-center gap-1.5">
          {dayLabels.map((day, index) => (
            <div
              key={index}
              className={`w-6 h-6 rounded-full text-[10px] font-medium flex items-center justify-center transition-all ${
                index <= adjustedDay
                  ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/30'
                  : 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400'
              }`}
            >
              {day}
            </div>
          ))}
        </div>
      )}

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium text-cyan-600 dark:text-cyan-400">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
