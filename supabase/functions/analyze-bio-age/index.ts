import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { biologicalAge, chronologicalAge } = await req.json();
    
    console.log('Analyzing bio-age:', { biologicalAge, chronologicalAge });

    if (!biologicalAge || !chronologicalAge) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const difference = chronologicalAge - biologicalAge;
    const absDifference = Math.abs(difference);
    const comparison = difference > 0 ? 'younger' : difference < 0 ? 'older' : 'similar';

    const systemPrompt = `You are a health and longevity expert analyzing biological age data. Generate a single, concise sentence (max 20 words) that describes the relationship between biological and chronological age in an encouraging, professional tone.`;

    const userPrompt = `The person's biological age is ${biologicalAge} and their chronological age is ${chronologicalAge}. The biological age is ${absDifference === 0 ? 'equal to' : `${absDifference} years ${comparison} than`} their chronological age. Generate a brief, encouraging statement about this.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 100
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      // Return fallback text
      let fallbackText = 'Your biological age is ';
      if (absDifference === 0) {
        fallbackText += 'similar to your chronological age';
      } else {
        fallbackText += `${absDifference} years ${comparison} than your chronological age`;
      }
      
      return new Response(
        JSON.stringify({ analysis: fallbackText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || 'Your biological age data has been analyzed.';

    console.log('Generated analysis:', analysis);

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-bio-age:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
