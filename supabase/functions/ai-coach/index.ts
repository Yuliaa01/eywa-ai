import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch user context data if userId is provided
    let userContext = "";
    if (userId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const headers = {
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
        };

        // Fetch user profile
        const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?user_id=eq.${userId}&select=*`, { headers });
        const profiles = await profileRes.json();
        const profile = profiles[0];

        // Fetch recent vitals
        const vitalsRes = await fetch(`${SUPABASE_URL}/rest/v1/vitals_stream?user_id=eq.${userId}&order=recorded_at.desc&limit=20`, { headers });
        const vitals = await vitalsRes.json();

        // Fetch recent priorities
        const prioritiesRes = await fetch(`${SUPABASE_URL}/rest/v1/priorities?user_id=eq.${userId}&deleted_at=is.null&limit=5`, { headers });
        const priorities = await prioritiesRes.json();

        // Fetch recent lab results
        const labsRes = await fetch(`${SUPABASE_URL}/rest/v1/lab_results?user_id=eq.${userId}&order=reported_at.desc&limit=10`, { headers });
        const labs = await labsRes.json();

        // Fetch recent meals
        const mealsRes = await fetch(`${SUPABASE_URL}/rest/v1/meals?user_id=eq.${userId}&order=timestamp.desc&limit=5`, { headers });
        const meals = await mealsRes.json();

        // Build context
        userContext = `\n\nUSER CONTEXT:\n`;
        
        if (profile) {
          userContext += `Profile: ${profile.first_name || 'User'}, Age: ${profile.dob ? new Date().getFullYear() - new Date(profile.dob).getFullYear() : 'N/A'}, Sex: ${profile.sex_at_birth || 'N/A'}, Height: ${profile.height_cm ? profile.height_cm + 'cm' : 'N/A'}, Weight: ${profile.weight_kg ? profile.weight_kg + 'kg' : 'N/A'}\n`;
          if (profile.chronic_conditions?.length) userContext += `Chronic conditions: ${profile.chronic_conditions.join(', ')}\n`;
          if (profile.medications?.length) userContext += `Medications: ${profile.medications.join(', ')}\n`;
          if (profile.allergies?.length) userContext += `Allergies: ${profile.allergies.join(', ')}\n`;
        }

        if (vitals?.length) {
          userContext += `\nRecent Vitals:\n`;
          vitals.forEach((v: any) => {
            userContext += `- ${v.metric}: ${v.value} ${v.units || ''} (${new Date(v.recorded_at).toLocaleDateString()})\n`;
          });
        }

        if (priorities?.length) {
          userContext += `\nCurrent Goals/Priorities:\n`;
          priorities.forEach((p: any) => {
            userContext += `- ${p.title} (${p.type}, status: ${p.status})\n`;
          });
        }

        if (labs?.length) {
          userContext += `\nRecent Lab Results:\n`;
          labs.forEach((l: any) => {
            userContext += `- ${l.test_code}: ${l.value_num || l.value_text} ${l.units || ''} (${new Date(l.reported_at).toLocaleDateString()})\n`;
          });
        }

        if (meals?.length) {
          userContext += `\nRecent Meals:\n`;
          meals.forEach((m: any) => {
            userContext += `- ${new Date(m.timestamp).toLocaleDateString()}: ${JSON.stringify(m.items)}\n`;
          });
        }

        console.log("User context fetched successfully");
      } catch (error) {
        console.error("Error fetching user context:", error);
      }
    }

    const systemPrompt = `You are Eywa, an AI health coach and medical assistant. You provide personalized health guidance, analyze user data, and offer evidence-based recommendations. Be supportive, clear, and empathetic. Always remind users that you're not replacing professional medical advice for urgent matters.${userContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: systemPrompt
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI coach error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
