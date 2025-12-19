import { Play } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { cn } from "@/lib/utils";

interface FeaturedReelCardProps {
  title: string;
  thumbnailUrl?: string;
  creatorName: string;
  duration: number;
  onClick: () => void;
  className?: string;
}

export function FeaturedReelCard({
  title,
  thumbnailUrl,
  creatorName,
  duration,
  onClick,
  className,
}: FeaturedReelCardProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <GlassCard
      className={cn("overflow-hidden cursor-pointer group", className)}
      onClick={onClick}
    >
      <div className="relative aspect-[9/16] max-h-48 bg-background/50">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent-teal/20 to-accent-gold/20">
            <Play className="w-8 h-8 text-accent-teal" />
          </div>
        )}
        
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-5 h-5 text-background ml-0.5" />
          </div>
        </div>

        {/* Duration */}
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs">
          {formatDuration(duration)}
        </div>

        {/* Gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />

        {/* Title and creator at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
          <p className="text-xs font-medium line-clamp-2">{title}</p>
          <p className="text-[10px] text-white/70">{creatorName}</p>
        </div>
      </div>
    </GlassCard>
  );
}
