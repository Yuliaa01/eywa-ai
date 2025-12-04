import { Target, Edit, Trash2, Scale, Footprints, Moon, Apple, Heart, Dumbbell, Brain, Droplets } from "lucide-react";
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

// Category detection for icons
function getCategoryConfig(title: string, targetMetric?: string | null) {
  const text = `${title} ${targetMetric || ''}`.toLowerCase();
  
  if (text.includes('weight') || text.includes('body') || text.includes('bmi') || text.includes('fat')) {
    return { icon: Scale, color: '#3B82F6', bgColor: 'bg-blue-100 dark:bg-blue-900/40' };
  }
  if (text.includes('step') || text.includes('walk') || text.includes('activity') || text.includes('move')) {
    return { icon: Footprints, color: '#22C55E', bgColor: 'bg-green-100 dark:bg-green-900/40' };
  }
  if (text.includes('sleep') || text.includes('rest')) {
    return { icon: Moon, color: '#8B5CF6', bgColor: 'bg-purple-100 dark:bg-purple-900/40' };
  }
  if (text.includes('nutrition') || text.includes('diet') || text.includes('calor') || text.includes('eat') || text.includes('food')) {
    return { icon: Apple, color: '#F59E0B', bgColor: 'bg-amber-100 dark:bg-amber-900/40' };
  }
  if (text.includes('heart') || text.includes('cardio') || text.includes('bp') || text.includes('blood')) {
    return { icon: Heart, color: '#EF4444', bgColor: 'bg-red-100 dark:bg-red-900/40' };
  }
  if (text.includes('workout') || text.includes('exercise') || text.includes('strength') || text.includes('muscle')) {
    return { icon: Dumbbell, color: '#10B981', bgColor: 'bg-emerald-100 dark:bg-emerald-900/40' };
  }
  if (text.includes('mental') || text.includes('stress') || text.includes('mind') || text.includes('meditat')) {
    return { icon: Brain, color: '#EC4899', bgColor: 'bg-pink-100 dark:bg-pink-900/40' };
  }
  if (text.includes('water') || text.includes('hydrat')) {
    return { icon: Droplets, color: '#06B6D4', bgColor: 'bg-cyan-100 dark:bg-cyan-900/40' };
  }
  // Default
  return { icon: Target, color: '#12AFCB', bgColor: 'bg-teal-100 dark:bg-teal-900/40' };
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
  const { icon: CategoryIcon, color, bgColor } = getCategoryConfig(title, targetMetric);

  return (
    <div className="group p-4 bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 rounded-xl border border-emerald-200/50 dark:border-emerald-800/30 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side - Icon, Title, Target */}
        <div className="flex-1 min-w-0 flex items-start gap-3">
          {/* Category Icon */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center`}>
            <CategoryIcon className="w-5 h-5" style={{ color }} />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-foreground truncate">{title}</h4>
              {/* Edit/Delete buttons */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                  onClick={onEdit}
                >
                  <Edit className="w-3 h-3 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                  onClick={onDelete}
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </Button>
              </div>
            </div>
            
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{description}</p>
            )}
            
            {/* Target Display */}
            {targetValue && (
              <div className="mt-2">
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                  Target: {targetValue.toLocaleString()} {units || targetMetric}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Large Ring Progress */}
        <div className="flex-shrink-0 relative w-20 h-20">
          <svg width={80} height={80} className="transform -rotate-90">
            {/* Background track */}
            <circle
              cx={40}
              cy={40}
              r={34}
              fill="none"
              stroke="rgba(16, 185, 129, 0.15)"
              strokeWidth={6}
            />
            {/* Progress arc */}
            <circle
              cx={40}
              cy={40}
              r={34}
              fill="none"
              stroke="url(#emeraldGradient)"
              strokeWidth={6}
              strokeDasharray={34 * 2 * Math.PI}
              strokeDashoffset={34 * 2 * Math.PI * (1 - Math.min(progress, 100) / 100)}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
            <defs>
              <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#12AFCB" />
              </linearGradient>
            </defs>
          </svg>
          {/* Percentage inside ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
