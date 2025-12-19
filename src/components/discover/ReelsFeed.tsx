import { useState, useCallback, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { VideoPlayer } from "./VideoPlayer";
import { VideoActions } from "./VideoActions";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number;
  creator_name: string;
  creator_avatar_url: string | null;
  likes_count: number;
  health_domains: string[];
  tags: string[];
}

interface ReelsFeedProps {
  videos: Video[];
  className?: string;
}

export function ReelsFeed({ videos, className }: ReelsFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const currentVideo = videos[currentIndex];
  const hasNext = currentIndex < videos.length - 1;
  const hasPrev = currentIndex > 0;

  const goToNext = useCallback(() => {
    if (hasNext) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [hasNext]);

  const goToPrev = useCallback(() => {
    if (hasPrev) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [hasPrev]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        goToPrev();
      } else if (e.key === "ArrowDown") {
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrev]);

  // Touch handling for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    
    const touchEnd = e.changedTouches[0].clientY;
    const diff = touchStart - touchEnd;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
    
    setTouchStart(null);
  };

  // Track watch progress
  const handleProgress = async (seconds: number) => {
    if (seconds % 5 !== 0) return; // Only update every 5 seconds
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("user_video_interactions")
        .upsert({
          user_id: user.id,
          video_id: currentVideo.id,
          watched_seconds: seconds,
          completed: seconds >= currentVideo.duration_seconds * 0.9,
        }, { onConflict: "user_id,video_id" });
    } catch (error) {
      console.error("Error tracking progress:", error);
    }
  };

  if (!currentVideo) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No videos available
      </div>
    );
  }

  return (
    <div 
      className={cn("relative h-full w-full bg-black", className)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Video player */}
      <VideoPlayer
        src={currentVideo.video_url}
        poster={currentVideo.thumbnail_url || undefined}
        autoPlay
        muted
        loop
        onProgress={handleProgress}
        className="absolute inset-0"
      />

      {/* Gradient overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

      {/* Video info overlay */}
      <div className="absolute bottom-0 left-0 right-20 p-4 pb-8 text-white">
        <div className="flex items-center gap-2 mb-2">
          {currentVideo.creator_avatar_url ? (
            <img
              src={currentVideo.creator_avatar_url}
              alt={currentVideo.creator_name}
              className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-accent-teal flex items-center justify-center">
              <span className="text-sm font-bold">
                {currentVideo.creator_name.charAt(0)}
              </span>
            </div>
          )}
          <span className="font-semibold">{currentVideo.creator_name}</span>
        </div>
        
        <h3 className="font-bold text-lg mb-1">{currentVideo.title}</h3>
        
        {currentVideo.description && (
          <p className="text-sm text-white/80 line-clamp-2 mb-2">
            {currentVideo.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1">
          {currentVideo.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full bg-white/20 text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Action buttons on right */}
      <VideoActions
        videoId={currentVideo.id}
        likesCount={currentVideo.likes_count}
        className="absolute bottom-24 right-4"
      />

      {/* Navigation arrows */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
        <button
          onClick={goToPrev}
          disabled={!hasPrev}
          className={cn(
            "w-10 h-10 rounded-full bg-white/10 flex items-center justify-center transition-all",
            hasPrev ? "hover:bg-white/20 text-white" : "opacity-30 cursor-not-allowed text-white/50"
          )}
        >
          <ChevronUp className="w-6 h-6" />
        </button>
        <button
          onClick={goToNext}
          disabled={!hasNext}
          className={cn(
            "w-10 h-10 rounded-full bg-white/10 flex items-center justify-center transition-all",
            hasNext ? "hover:bg-white/20 text-white" : "opacity-30 cursor-not-allowed text-white/50"
          )}
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>

      {/* Video counter */}
      <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/50 text-white text-sm">
        {currentIndex + 1} / {videos.length}
      </div>
    </div>
  );
}
