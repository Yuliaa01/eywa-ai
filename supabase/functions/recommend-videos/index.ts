import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get authenticated user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Authentication failed" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's health priorities
    const { data: priorities } = await supabaseClient
      .from("priorities")
      .select("title, description, type")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .limit(10);

    // Get user's profile for health context
    const { data: profile } = await supabaseClient
      .from("user_profiles")
      .select("diet_preferences, chronic_conditions, allergies")
      .eq("user_id", user.id)
      .single();

    // Get user's watch history
    const { data: watchHistory } = await supabaseClient
      .from("user_video_interactions")
      .select("video_id, liked, completed, watched_seconds")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(20);

    // Build health domains to prioritize based on user context
    const prioritizedDomains: string[] = [];
    
    // Analyze priorities for health domains
    if (priorities) {
      priorities.forEach((p) => {
        const text = `${p.title} ${p.description || ""}`.toLowerCase();
        if (text.includes("weight") || text.includes("diet") || text.includes("eat")) {
          prioritizedDomains.push("nutrition");
        }
        if (text.includes("sleep") || text.includes("rest")) {
          prioritizedDomains.push("sleep");
        }
        if (text.includes("exercise") || text.includes("workout") || text.includes("fitness") || text.includes("run") || text.includes("gym")) {
          prioritizedDomains.push("fitness");
        }
        if (text.includes("stress") || text.includes("anxiety") || text.includes("mental") || text.includes("meditation")) {
          prioritizedDomains.push("mental_health");
        }
        if (text.includes("longevity") || text.includes("age") || text.includes("lifespan")) {
          prioritizedDomains.push("longevity");
        }
      });
    }

    // Add domains from profile
    if (profile?.diet_preferences?.length) {
      prioritizedDomains.push("nutrition");
    }
    if (profile?.chronic_conditions?.length) {
      prioritizedDomains.push("longevity");
    }

    // Get videos with scoring
    const { data: allVideos, error: videosError } = await supabaseClient
      .from("video_content")
      .select("*")
      .eq("is_active", true);

    if (videosError) {
      throw videosError;
    }

    // Score and sort videos
    const watchedVideoIds = new Set(watchHistory?.map((w) => w.video_id) || []);
    const likedVideoIds = new Set(
      watchHistory?.filter((w) => w.liked).map((w) => w.video_id) || []
    );

    const scoredVideos = allVideos.map((video) => {
      let score = 0;

      // Boost featured videos
      if (video.is_featured) score += 20;

      // Boost videos matching user's health domains
      const matchingDomains = video.health_domains.filter((d: string) =>
        prioritizedDomains.includes(d)
      );
      score += matchingDomains.length * 15;

      // Penalize already watched videos (but not completely)
      if (watchedVideoIds.has(video.id)) {
        score -= 30;
      }

      // Boost videos similar to liked videos
      if (likedVideoIds.size > 0) {
        const likedDomains = watchHistory
          ?.filter((w) => w.liked)
          .map((w) => {
            const v = allVideos.find((av) => av.id === w.video_id);
            return v?.health_domains || [];
          })
          .flat();

        const likedDomainMatches = video.health_domains.filter((d: string) =>
          likedDomains?.includes(d)
        );
        score += likedDomainMatches.length * 10;
      }

      // Factor in popularity
      score += Math.min(video.likes_count / 10, 10);
      score += Math.min(video.views_count / 100, 5);

      return { ...video, _score: score };
    });

    // Sort by score and return top recommendations
    const recommendations = scoredVideos
      .sort((a, b) => b._score - a._score)
      .slice(0, 20)
      .map(({ _score, ...video }) => video);

    console.log(`Generated ${recommendations.length} recommendations for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        recommendations,
        prioritized_domains: [...new Set(prioritizedDomains)],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in recommend-videos:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
