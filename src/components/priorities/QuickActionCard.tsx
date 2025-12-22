import { LucideIcon } from "lucide-react";
import { RingProgress } from "@/components/dashboard/charts/RingProgress";

interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  color: string;
  progress: number;
  subtitle?: string;
  onClick: () => void;
  isLoading?: boolean;
}

export function QuickActionCard({
  icon: Icon,
  title,
  color,
  progress,
  subtitle,
  onClick,
  isLoading = false,
}: QuickActionCardProps) {
  const isNearComplete = progress >= 80;

  return (
    <button
      onClick={onClick}
      className="rounded-2xl bg-white/80 backdrop-blur-sm border border-[#12AFCB]/10 p-4 flex flex-col items-center gap-2 hover:border-[#12AFCB]/30 hover:shadow-[0_4px_20px_rgba(18,175,203,0.15)] hover:scale-[1.02] transition-all duration-200"
    >
      {/* Ring Progress with Icon inside */}
      <div className={`relative ${isNearComplete ? "animate-pulse" : ""}`}>
        <RingProgress
          progress={progress}
          color={color}
          trackColor={`${color}20`}
          size={56}
          strokeWidth={4}
          showPercentage={false}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
        </RingProgress>
        
        {/* Small percentage badge */}
        <div 
          className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {isLoading ? "..." : `${Math.round(progress)}%`}
        </div>
      </div>

      {/* Title */}
      <span className="text-sm font-semibold text-[#0E1012]">{title}</span>

      {/* Subtitle with actual metric */}
      {subtitle && (
        <span 
          className="text-xs font-medium truncate max-w-full"
          style={{ color: `${color}` }}
        >
          {subtitle}
        </span>
      )}
    </button>
  );
}
