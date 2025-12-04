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
    <div className="group p-5 rounded-2xl bg-white/80 border border-[#12AFCB]/10 hover:border-[#12AFCB]/30 hover:shadow-[0_4px_20px_rgba(18,175,203,0.12)] transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Icon Badge */}
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            {isDaily ? (
              <Clock className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Calendar className="w-5 h-5 text-muted-foreground" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-foreground truncate">{title}</h4>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
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
            className="h-8 w-8 p-0 hover:bg-muted"
            onClick={onEdit}
          >
            <Edit className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
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
                  ? 'bg-accent/70 text-accent-foreground'
                  : 'bg-muted text-muted-foreground'
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
          <span className="font-medium text-accent">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-accent/70 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
