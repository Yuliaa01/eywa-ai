import { useState, useEffect } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VideoCard } from "./VideoCard";
import { CategoryPills } from "./CategoryPills";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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
interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
}
interface EducationLibraryProps {
  onVideoSelect: (video: Video) => void;
  className?: string;
}
export function EducationLibrary({
  onVideoSelect,
  className
}: EducationLibraryProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [contentFilter, setContentFilter] = useState<string | null>(null);
  useEffect(() => {
    fetchCategories();
    fetchVideos();
  }, []);
  const fetchCategories = async () => {
    const {
      data,
      error
    } = await supabase.from("video_categories").select("id, name, slug, color").eq("is_active", true).order("sort_order");
    if (!error && data) {
      setCategories(data);
    }
  };
  const fetchVideos = async () => {
    setLoading(true);
    const {
      data,
      error
    } = await supabase.from("video_content").select("*").eq("is_active", true).order("created_at", {
      ascending: false
    });
    if (!error && data) {
      setVideos(data as Video[]);
    }
    setLoading(false);
  };
  const filteredVideos = videos.filter(video => {
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = video.title.toLowerCase().includes(query) || video.description?.toLowerCase().includes(query) || video.tags.some(tag => tag.toLowerCase().includes(query)) || video.health_domains.some(domain => domain.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Filter by category (health domain)
    if (selectedCategory) {
      const matchesCategory = video.health_domains.some(domain => domain.toLowerCase() === selectedCategory.replace("-", "_"));
      if (!matchesCategory) return false;
    }

    // Filter by content type
    if (contentFilter && video.content_type !== contentFilter) {
      return false;
    }
    return true;
  });
  const educationVideos = filteredVideos.filter(v => v.content_type !== "reel");
  const reelVideos = filteredVideos.filter(v => v.content_type === "reel");
  return <div className={cn("flex flex-col h-full", className)}>
      {/* Search and filters */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md p-4 space-y-4 border-b border-border/30 px-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Search videos..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-muted/50 border-border/30" />
          {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>}
        </div>


        {/* Content type filters */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setContentFilter(null)} className={contentFilter === null ? "bg-accent-teal text-white border-accent-teal hover:bg-accent-teal/90" : "hover:border-accent-teal/50"}>
            All
          </Button>
          <Button variant="outline" size="sm" onClick={() => setContentFilter("education")} className={contentFilter === "education" ? "bg-accent-teal text-white border-accent-teal hover:bg-accent-teal/90" : "hover:border-accent-teal/50"}>
            Education
          </Button>
          <Button variant="outline" size="sm" onClick={() => setContentFilter("tutorial")} className={contentFilter === "tutorial" ? "bg-accent-teal text-white border-accent-teal hover:bg-accent-teal/90" : "hover:border-accent-teal/50"}>
            Tutorials
          </Button>
          <Button variant="outline" size="sm" onClick={() => setContentFilter("reel")} className={contentFilter === "reel" ? "bg-accent-teal text-white border-accent-teal hover:bg-accent-teal/90" : "hover:border-accent-teal/50"}>
            Reels
          </Button>
        </div>
      </div>

      {/* Video grid */}
      <div className="flex-1 overflow-auto p-4 px-0">
        {loading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-video rounded-lg" />)}
          </div> : filteredVideos.length === 0 ? <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No videos found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or search query
            </p>
          </div> : <div className="space-y-8">
            {/* Featured / Education section */}
            {educationVideos.length > 0 && <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  {contentFilter ? `${contentFilter.charAt(0).toUpperCase() + contentFilter.slice(1)} Videos` : "Educational Content"}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {educationVideos.map(video => <VideoCard key={video.id} id={video.id} title={video.title} description={video.description || undefined} thumbnailUrl={video.thumbnail_url || undefined} duration={video.duration_seconds} creatorName={video.creator_name} creatorAvatarUrl={video.creator_avatar_url || undefined} viewsCount={video.views_count} contentType={video.content_type} healthDomains={video.health_domains} onClick={() => onVideoSelect(video)} />)}
                </div>
              </section>}

            {/* Reels section */}
            {reelVideos.length > 0 && contentFilter !== "education" && contentFilter !== "tutorial" && <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Quick Tips & Reels</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {reelVideos.map(video => <VideoCard key={video.id} id={video.id} title={video.title} thumbnailUrl={video.thumbnail_url || undefined} duration={video.duration_seconds} creatorName={video.creator_name} viewsCount={video.views_count} contentType={video.content_type} healthDomains={video.health_domains} onClick={() => onVideoSelect(video)} />)}
                </div>
              </section>}
          </div>}
      </div>
    </div>;
}