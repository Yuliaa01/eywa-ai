import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReelsFeed } from "@/components/discover/ReelsFeed";
import { EducationLibrary } from "@/components/discover/EducationLibrary";
import { VideoDetailModal } from "@/components/discover/VideoDetailModal";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function Discover() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"reels" | "library">("reels");
  const [reelVideos, setReelVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    fetchReelVideos();
  }, []);

  const fetchReelVideos = async () => {
    setLoading(true);
    
    // Fetch reels first, then other content
    const { data, error } = await supabase
      .from("video_content")
      .select("*")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Prioritize reels for the reels feed
      const reels = data.filter((v) => v.content_type === "reel");
      const others = data.filter((v) => v.content_type !== "reel");
      setReelVideos([...reels, ...others] as Video[]);
    }
    
    setLoading(false);
  };

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border/30 bg-background/95 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Discover</h1>
        </div>

        {/* Tab switcher in header for mobile */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "reels" | "library")}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="reels" className="gap-2">
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">Reels</span>
            </TabsTrigger>
            <TabsTrigger value="library" className="gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Library</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-full" />
              <Skeleton className="w-32 h-4" />
            </div>
          </div>
        ) : (
          <>
            {activeTab === "reels" ? (
              <ReelsFeed videos={reelVideos} className="h-full" />
            ) : (
              <EducationLibrary 
                onVideoSelect={handleVideoSelect} 
                className="h-full" 
              />
            )}
          </>
        )}
      </div>

      {/* Video detail modal */}
      <VideoDetailModal
        video={selectedVideo}
        open={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />
    </div>
  );
}
