import { useState } from "react";
import { Heart, Bookmark, Share2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VideoActionsProps {
  videoId: string;
  initialLiked?: boolean;
  initialSaved?: boolean;
  likesCount: number;
  className?: string;
}

export function VideoActions({
  videoId,
  initialLiked = false,
  initialSaved = false,
  likesCount,
  className,
}: VideoActionsProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [saved, setSaved] = useState(initialSaved);
  const [likes, setLikes] = useState(likesCount);
  const { toast } = useToast();

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes(prev => newLiked ? prev + 1 : prev - 1);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Please sign in to like videos", variant: "destructive" });
        setLiked(!newLiked);
        setLikes(prev => newLiked ? prev - 1 : prev + 1);
        return;
      }

      const { error } = await supabase
        .from("user_video_interactions")
        .upsert({
          user_id: user.id,
          video_id: videoId,
          liked: newLiked,
        }, { onConflict: "user_id,video_id" });

      if (error) throw error;
    } catch (error) {
      console.error("Error liking video:", error);
      setLiked(!newLiked);
      setLikes(prev => newLiked ? prev - 1 : prev + 1);
    }
  };

  const handleSave = async () => {
    const newSaved = !saved;
    setSaved(newSaved);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Please sign in to save videos", variant: "destructive" });
        setSaved(!newSaved);
        return;
      }

      const { error } = await supabase
        .from("user_video_interactions")
        .upsert({
          user_id: user.id,
          video_id: videoId,
          saved: newSaved,
        }, { onConflict: "user_id,video_id" });

      if (error) throw error;
      
      toast({ 
        title: newSaved ? "Video saved" : "Video removed from saved",
      });
    } catch (error) {
      console.error("Error saving video:", error);
      setSaved(!newSaved);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: "Check out this health video!",
        url: window.location.href,
      });
    } catch {
      // Share not supported or cancelled
      toast({ title: "Link copied to clipboard" });
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-6", className)}>
      <button
        onClick={handleLike}
        className="flex flex-col items-center gap-1 group"
      >
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center transition-all",
          liked 
            ? "bg-red-500/20 text-red-500" 
            : "bg-white/10 text-white hover:bg-white/20"
        )}>
          <Heart className={cn("w-6 h-6", liked && "fill-current")} />
        </div>
        <span className="text-xs text-white/80">{likes}</span>
      </button>

      <button
        onClick={handleSave}
        className="flex flex-col items-center gap-1 group"
      >
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center transition-all",
          saved 
            ? "bg-accent-teal/20 text-accent-teal" 
            : "bg-white/10 text-white hover:bg-white/20"
        )}>
          <Bookmark className={cn("w-6 h-6", saved && "fill-current")} />
        </div>
        <span className="text-xs text-white/80">Save</span>
      </button>

      <button
        onClick={handleShare}
        className="flex flex-col items-center gap-1 group"
      >
        <div className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all">
          <Share2 className="w-6 h-6" />
        </div>
        <span className="text-xs text-white/80">Share</span>
      </button>

      <button className="flex flex-col items-center gap-1 group">
        <div className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all">
          <MessageCircle className="w-6 h-6" />
        </div>
        <span className="text-xs text-white/80">Ask</span>
      </button>
    </div>
  );
}
