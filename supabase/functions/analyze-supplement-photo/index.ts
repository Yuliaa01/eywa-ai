import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema - limit image size to ~5MB base64
const supplementPhotoSchema = z.object({
  image: z.string().min(1).max(7_000_000, "Image data too large (max ~5MB)"),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data, error: authError } = await supabase.auth.getUser(token);

    if (authError || !data?.user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    const rawBody = await req.json();
    const parseResult = supplementPhotoSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: parseResult.error.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { image } = parseResult.data;

    console.log('Analyzing supplement photo for user:', data.user.id);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this image of supplement bottles/containers. Extract the following information for each supplement visible:
- name: The supplement name (e.g., "Vitamin D3", "Omega-3 Fish Oil", "Magnesium Glycinate")
- dosage: The dosage amount with unit (e.g., "5000 IU", "1000mg", "200mg")
- form: The form of the supplement (must be one of: tablet, capsule, liquid, powder, gummy)

Return ONLY a JSON array of supplements found. If no supplements are detected, return an empty array.
Example response format:
[{"name": "Vitamin D3", "dosage": "5000 IU", "form": "capsule"}, {"name": "Omega-3", "dosage": "1000mg", "form": "capsule"}]

Important: Return ONLY the JSON array, no other text.`
              },
              {
                type: "image_url",
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "API credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error("Failed to analyze image");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";
    
    // Parse the JSON response
    let supplements = [];
    try {
      // Clean up the response in case it has markdown code blocks
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      supplements = JSON.parse(cleanedContent);
      
      // Validate and normalize the form field
      const validForms = ['tablet', 'capsule', 'liquid', 'powder', 'gummy'];
      supplements = supplements.map((s: any) => ({
        name: s.name || 'Unknown Supplement',
        dosage: s.dosage || 'Unknown',
        form: validForms.includes(s.form?.toLowerCase()) ? s.form.toLowerCase() : 'capsule'
      }));
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      supplements = [];
    }

    return new Response(
      JSON.stringify({ supplements }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-supplement-photo:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
