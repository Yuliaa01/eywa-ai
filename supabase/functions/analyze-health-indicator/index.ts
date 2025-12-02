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
    const { indicatorType, bioAge, actualAge } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let prompt = "";
    let systemPrompt = "You are a health and longevity expert. Provide clear, encouraging, and scientifically-informed explanations about health metrics. Keep your response under 300 words.";

    switch (indicatorType) {
      case "bio-age":
        const ageDifference = actualAge !== null && bioAge !== null ? actualAge - bioAge : 0;
        prompt = `Explain the user's biological age of ${bioAge !== null ? bioAge : actualAge} compared to their chronological age of ${actualAge}. ${
          ageDifference > 0 
            ? `Their biological age is ${ageDifference} years younger than their chronological age, which is excellent.` 
            : ageDifference < 0 
            ? `Their biological age is ${Math.abs(ageDifference)} years older than their chronological age.`
            : "Their biological and chronological ages are the same."
        } Explain what biological age means, what factors contribute to it, and provide 3-4 actionable recommendations to improve or maintain it.`;
        break;

      case "health-score":
        prompt = `Explain a health score of 88/100. This is a composite metric based on various health indicators including vitals, biomarkers, lifestyle factors, and fitness metrics. Explain what this score means, what it measures, which factors likely contribute to this good score, and provide 2-3 specific recommendations to improve it further to reach the 90+ range.`;
        break;

      case "vitals":
        prompt = `Explain the key vital signs: Heart Rate (72 bpm), Heart Rate Variability (58 ms), Blood Pressure (120/80), and BMI (22.5). For each vital, briefly explain what it means, whether these values are optimal, and how they impact overall health and longevity. Provide 2-3 actionable tips for maintaining or improving these vitals.`;
        break;

      default:
        throw new Error("Invalid indicator type");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const explanation = data.choices?.[0]?.message?.content || "Unable to generate explanation.";

    return new Response(
      JSON.stringify({ explanation }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        explanation: "Unable to generate explanation at this time. Please try again later.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
