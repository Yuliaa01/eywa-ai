import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Vitamin {
  id: string;
  name: string;
  category: string;
  benefits: string[];
  suggested_for: string[];
  biomarker_targets: string[];
}

interface VitaminBundle {
  id: string;
  name: string;
  category: string;
  recommended_for: string[];
  priority_match_keywords: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user context data
    const [biomarkersRes, prioritiesRes, profileRes, vitaminsRes, bundlesRes] = await Promise.all([
      supabase.from('biomarker_scores').select('domain, score, explanation').eq('user_id', user.id).order('created_at', { ascending: false }).limit(14),
      supabase.from('priorities').select('title, description, type').eq('user_id', user.id).eq('status', 'in_progress').is('deleted_at', null).limit(10),
      supabase.from('user_profiles').select('chronic_conditions, medications, allergies, diet_preferences').eq('user_id', user.id).single(),
      supabase.from('vitamins_catalog').select('id, name, category, benefits, suggested_for, biomarker_targets').eq('is_active', true),
      supabase.from('vitamin_bundles').select('id, name, category, recommended_for, priority_match_keywords').eq('is_active', true)
    ]);

    const biomarkers = biomarkersRes.data || [];
    const priorities = prioritiesRes.data || [];
    const profile = profileRes.data;
    const vitamins = vitaminsRes.data as Vitamin[] || [];
    const bundles = bundlesRes.data as VitaminBundle[] || [];

    // Build context for AI
    const userContext = {
      biomarkers: biomarkers.map(b => `${b.domain}: ${b.score}/100 - ${b.explanation || 'No explanation'}`).join('\n'),
      priorities: priorities.map(p => `${p.title}: ${p.description || ''}`).join('\n'),
      conditions: profile?.chronic_conditions?.join(', ') || 'None',
      medications: profile?.medications?.join(', ') || 'None',
      allergies: profile?.allergies?.join(', ') || 'None',
      diet: profile?.diet_preferences?.join(', ') || 'Standard'
    };

    const availableProducts = {
      vitamins: vitamins.map(v => ({
        id: v.id,
        name: v.name,
        category: v.category,
        benefits: v.benefits,
        targets: v.suggested_for,
        biomarkers: v.biomarker_targets
      })),
      bundles: bundles.map(b => ({
        id: b.id,
        name: b.name,
        category: b.category,
        for: b.recommended_for,
        keywords: b.priority_match_keywords
      }))
    };

    const prompt = `You are a health supplement recommendation AI. Based on the user's health profile, recommend the most relevant vitamins and vitamin bundles.

USER HEALTH PROFILE:
Biomarker Scores (lower scores indicate areas needing support):
${userContext.biomarkers || 'No biomarker data available'}

Current Health Goals:
${userContext.priorities || 'No specific goals set'}

Health Conditions: ${userContext.conditions}
Current Medications: ${userContext.medications}
Allergies: ${userContext.allergies}
Diet Preferences: ${userContext.diet}

AVAILABLE PRODUCTS:
${JSON.stringify(availableProducts, null, 2)}

Based on this information, recommend 3-5 products (vitamins or bundles) that would most benefit this user. Prioritize:
1. Products targeting low biomarker scores
2. Products aligned with their health goals
3. Products safe given their medications and allergies
4. Bundles that offer comprehensive support for their needs

Return a JSON array with this structure:
[
  {
    "vitamin_id": "uuid" (OR "bundle_id": "uuid"),
    "reasoning": "Brief 1-2 sentence explanation of why this is recommended",
    "priority": "high" | "medium" | "low"
  }
]

Only return the JSON array, no other text.`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    let recommendations = [];

    if (LOVABLE_API_KEY) {
      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are a health supplement recommendation expert. Always respond with valid JSON only.' },
              { role: 'user', content: prompt }
            ],
          }),
        });

        if (response.ok) {
          const aiData = await response.json();
          const content = aiData.choices?.[0]?.message?.content || '';
          
          // Parse JSON from response
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            recommendations = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (aiError) {
        console.error('AI recommendation error:', aiError);
      }
    }

    // Fallback: simple rule-based recommendations if AI fails
    if (recommendations.length === 0) {
      // Find low-scoring biomarkers
      const lowScoreDomains = biomarkers
        .filter(b => b.score && b.score < 70)
        .map(b => b.domain);

      // Match vitamins to low scores
      const matchedVitamins = vitamins
        .filter(v => 
          v.biomarker_targets.some(target => 
            lowScoreDomains.some(domain => 
              target.toLowerCase().includes(domain.toLowerCase()) ||
              domain.toLowerCase().includes(target.toLowerCase())
            )
          )
        )
        .slice(0, 3)
        .map(v => ({
          vitamin_id: v.id,
          reasoning: `May help support your ${v.category} needs based on your health profile.`,
          priority: 'medium' as const
        }));

      // Match bundles to priorities
      const priorityKeywords = priorities
        .flatMap(p => [...(p.title?.toLowerCase().split(' ') || []), ...(p.description?.toLowerCase().split(' ') || [])])
        .filter(w => w.length > 3);

      const matchedBundles = bundles
        .filter(b => 
          b.priority_match_keywords.some(kw => 
            priorityKeywords.some(pk => pk.includes(kw.toLowerCase()))
          )
        )
        .slice(0, 2)
        .map(b => ({
          bundle_id: b.id,
          reasoning: `Comprehensive support aligned with your ${b.category} health goals.`,
          priority: 'high' as const
        }));

      recommendations = [...matchedBundles, ...matchedVitamins].slice(0, 5);

      // If still empty, recommend general bundles
      if (recommendations.length === 0 && bundles.length > 0) {
        recommendations = bundles.slice(0, 2).map(b => ({
          bundle_id: b.id,
          reasoning: `Popular ${b.category} bundle for general wellness support.`,
          priority: 'medium' as const
        }));
      }
    }

    return new Response(
      JSON.stringify({ recommendations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in recommend-vitamins:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
