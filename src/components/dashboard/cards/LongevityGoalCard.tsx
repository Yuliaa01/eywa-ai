import { Target, Edit, Trash2, Scale, Footprints, Moon, Apple, Heart, Dumbbell, Brain, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";

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

// Category detection for icons - muted colors
function getCategoryConfig(title: string, targetMetric?: string | null) {
  const text = `${title} ${targetMetric || ''}`.toLowerCase();
  
  if (text.includes('weight') || text.includes('body') || text.includes('bmi') || text.includes('fat')) {
    return { icon: Scale, color: 'hsl(var(--muted-foreground))' };
  }
  if (text.includes('step') || text.includes('walk') || text.includes('activity') || text.includes('move')) {
    return { icon: Footprints, color: 'hsl(var(--muted-foreground))' };
  }
  if (text.includes('sleep') || text.includes('rest')) {
    return { icon: Moon, color: 'hsl(var(--muted-foreground))' };
  }
  if (text.includes('nutrition') || text.includes('diet') || text.includes('calor') || text.includes('eat') || text.includes('food')) {
    return { icon: Apple, color: 'hsl(var(--muted-foreground))' };
  }
  if (text.includes('heart') || text.includes('cardio') || text.includes('bp') || text.includes('blood')) {
    return { icon: Heart, color: 'hsl(var(--muted-foreground))' };
  }
  if (text.includes('workout') || text.includes('exercise') || text.includes('strength') || text.includes('muscle')) {
    return { icon: Dumbbell, color: 'hsl(var(--muted-foreground))' };
  }
  if (text.includes('mental') || text.includes('stress') || text.includes('mind') || text.includes('meditat')) {
    return { icon: Brain, color: 'hsl(var(--muted-foreground))' };
  }
  if (text.includes('water') || text.includes('hydrat')) {
    return { icon: Droplets, color: 'hsl(var(--muted-foreground))' };
  }
  // Default
  return { icon: Target, color: 'hsl(var(--muted-foreground))' };
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
  const { icon: CategoryIcon, color } = getCategoryConfig(title, targetMetric);

  return (
    <div className="group p-5 rounded-2xl bg-white/80 border border-[#12AFCB]/10 hover:border-[#12AFCB]/30 hover:shadow-[0_4px_20px_rgba(18,175,203,0.12)] transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side - Icon, Title, Target */}
        <div className="flex-1 min-w-0 flex items-start gap-3">
          {/* Category Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <CategoryIcon className="w-5 h-5 text-muted-foreground" />
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
                  className="h-6 w-6 p-0 hover:bg-muted"
                  onClick={onEdit}
                >
                  <Edit className="w-3 h-3 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-destructive/10"
                  onClick={onDelete}
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            </div>
            
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{description}</p>
            )}
            
            {/* Target Display */}
            {targetValue && (
              <div className="mt-2">
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
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
              stroke="hsl(var(--muted))"
              strokeWidth={6}
            />
            {/* Progress arc */}
            <circle
              cx={40}
              cy={40}
              r={34}
              fill="none"
              stroke="hsl(var(--accent))"
              strokeWidth={6}
              strokeDasharray={34 * 2 * Math.PI}
              strokeDashoffset={34 * 2 * Math.PI * (1 - Math.min(progress, 100) / 100)}
              strokeLinecap="round"
              className="transition-all duration-500"
              style={{ opacity: 0.7 }}
            />
          </svg>
          {/* Percentage inside ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-accent">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
