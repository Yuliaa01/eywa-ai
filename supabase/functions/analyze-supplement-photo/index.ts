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
    const { image } = await req.json();
    
    if (!image) {
      throw new Error("No image provided");
    }

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

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
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
