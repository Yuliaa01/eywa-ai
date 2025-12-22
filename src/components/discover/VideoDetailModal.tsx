import { Dialog, DialogContent } from "@/components/ui/dialog";
import { VideoPlayer } from "./VideoPlayer";
import { VideoActions } from "./VideoActions";
import { X, Clock, Eye, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number;
  content_type: string;
  creator_name: string;
  creator_avatar_url: string | null;
  views_count: number;
  likes_count: number;
  health_domains: string[];
  tags: string[];
}

interface VideoDetailModalProps {
  video: Video | null;
  open: boolean;
  onClose: () => void;
}

export function VideoDetailModal({ video, open, onClose }: VideoDetailModalProps) {
  if (!video) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}:${remainingMins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatViews = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-6xl p-0 overflow-hidden bg-background border-border">

        <div className="grid md:grid-cols-[1fr,320px]">
          {/* Video player */}
          <div className="relative aspect-video md:aspect-auto md:h-[560px] bg-black">
            <VideoPlayer
              src={video.video_url}
              poster={video.thumbnail_url || undefined}
              autoPlay
              muted={false}
              loop={false}
              className="h-full"
            />
          </div>

          {/* Video info sidebar */}
          <div className="p-6 flex flex-col gap-4 overflow-auto max-h-[500px]">
            {/* Creator */}
            <div className="flex items-center gap-3">
              {video.creator_avatar_url ? (
                <img
                  src={video.creator_avatar_url}
                  alt={video.creator_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-accent-teal/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-accent-teal" />
                </div>
              )}
              <div>
                <p className="font-semibold text-foreground">{video.creator_name}</p>
                <p className="text-sm text-muted-foreground">Health Expert</p>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-foreground">{video.title}</h2>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {formatViews(video.views_count)} views
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDuration(video.duration_seconds)}
              </div>
            </div>

            {/* Description */}
            {video.description && (
              <p className="text-muted-foreground">{video.description}</p>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {video.health_domains.map((domain) => (
                <Badge key={domain} variant="secondary" className="capitalize">
                  {domain.replace("_", " ")}
                </Badge>
              ))}
              {video.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  #{tag}
                </Badge>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-auto pt-4 border-t border-border">
              <VideoActions
                videoId={video.id}
                likesCount={video.likes_count}
                className="flex-row justify-around"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
