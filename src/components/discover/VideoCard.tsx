import { Play, Clock, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/glass/GlassCard";

interface VideoCardProps {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  duration: number;
  creatorName: string;
  creatorAvatarUrl?: string;
  viewsCount: number;
  contentType: string;
  healthDomains: string[];
  onClick: () => void;
  className?: string;
}

export function VideoCard({
  title,
  description,
  thumbnailUrl,
  duration,
  creatorName,
  creatorAvatarUrl,
  viewsCount,
  contentType,
  healthDomains,
  onClick,
  className,
}: VideoCardProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatViews = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <GlassCard
      className={cn("overflow-hidden cursor-pointer group", className)}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-background/50">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 rounded-full bg-accent-teal/90 flex items-center justify-center">
            <Play className="w-7 h-7 text-white ml-1" />
          </div>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-white text-xs font-medium flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDuration(duration)}
        </div>

        {/* Content type badge */}
        <div className={cn(
          "absolute top-4 right-4 px-2 py-1 rounded-xl text-xs font-medium uppercase",
          contentType === "reel" 
            ? "bg-pink-500/90 text-white" 
            : contentType === "education"
            ? "bg-blue-500/90 text-white"
            : "bg-purple-500/90 text-white"
        )}>
          {contentType}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-accent-teal transition-colors">
          {title}
        </h3>
        
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}

        {/* Creator info */}
        <div className="flex items-center gap-2">
          {creatorAvatarUrl ? (
            <img
              src={creatorAvatarUrl}
              alt={creatorName}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-accent-teal/20 flex items-center justify-center">
              <span className="text-xs font-medium text-accent-teal">
                {creatorName.charAt(0)}
              </span>
            </div>
          )}
          <span className="text-sm text-muted-foreground">{creatorName}</span>
        </div>

        {/* Stats and tags */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Eye className="w-4 h-4" />
            {formatViews(viewsCount)} views
          </div>
          <div className="flex gap-1">
            {healthDomains.slice(0, 2).map((domain) => (
              <span
                key={domain}
                className="px-2 py-0.5 rounded-full bg-accent-teal/10 text-accent-teal text-xs capitalize"
              >
                {domain.replace("_", " ")}
              </span>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
