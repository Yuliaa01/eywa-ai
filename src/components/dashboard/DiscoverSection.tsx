import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Play, BookOpen } from "lucide-react";
import { ReelsFeed } from "@/components/discover/ReelsFeed";
import { EducationLibrary } from "@/components/discover/EducationLibrary";
import { VideoDetailModal } from "@/components/discover/VideoDetailModal";

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
  views_count: number;
  saves_count: number;
  health_domains: string[];
  tags: string[];
  content_type: string;
}

const DiscoverSection = () => {
  const [activeView, setActiveView] = useState<"reels" | "library">("reels");
  const [reelVideos, setReelVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    fetchReelVideos();
  }, []);

  const fetchReelVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("video_content")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const reels = (data || []).filter(
        (v) => v.content_type === "reel"
      ) as Video[];
      const others = (data || []).filter(
        (v) => v.content_type !== "reel"
      ) as Video[];
      setReelVideos([...reels, ...others]);
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
        <Skeleton className="h-[500px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={activeView === "reels" ? "default" : "outline"}
          onClick={() => setActiveView("reels")}
          className="rounded-full"
        >
          <Play className="w-4 h-4 mr-2" />
          Reels
        </Button>
        <Button
          variant={activeView === "library" ? "default" : "outline"}
          onClick={() => setActiveView("library")}
          className="rounded-full"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Education Library
        </Button>
      </div>

      {/* Content */}
      {activeView === "reels" ? (
        <div className="relative h-[600px] rounded-2xl overflow-hidden bg-card border border-border">
          <ReelsFeed videos={reelVideos} className="h-full" />
        </div>
      ) : (
        <EducationLibrary onVideoSelect={handleVideoSelect} />
      )}

      {/* Video Detail Modal */}
      <VideoDetailModal
        video={selectedVideo}
        open={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />
    </div>
  );
};

export default DiscoverSection;
