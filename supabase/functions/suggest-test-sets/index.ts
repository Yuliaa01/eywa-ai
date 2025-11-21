import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestSet {
  id: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  recommended_for: string[];
  priority_match_keywords: string[];
  biomarker_domain_focus: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching data for user:', user.id);

    // Fetch user's biomarker scores
    const { data: biomarkers, error: bioError } = await supabaseClient
      .from('biomarker_scores')
      .select('domain, score, explanation')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Fetch user's priorities
    const { data: priorities, error: prioError } = await supabaseClient
      .from('priorities')
      .select('title, type, description, target_metric')
      .eq('user_id', user.id)
      .is('deleted_at', null);

    // Fetch user's profile for chronic conditions
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('chronic_conditions, diet_preferences')
      .eq('user_id', user.id)
      .single();

    // Fetch all active test sets
    const { data: testSets, error: setsError } = await supabaseClient
      .from('test_sets')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (setsError) {
      console.error('Error fetching test sets:', setsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch test sets' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Biomarkers:', biomarkers?.length || 0);
    console.log('Priorities:', priorities?.length || 0);
    console.log('Test sets:', testSets?.length || 0);

    // Build context for AI
    const biomarkerContext = biomarkers?.map(b => 
      `${b.domain}: score ${b.score}/100 - ${b.explanation || 'No explanation'}`
    ).join('\n') || 'No biomarker data available';

    const priorityContext = priorities?.map(p => 
      `${p.type}: ${p.title} - ${p.description || ''}`
    ).join('\n') || 'No priorities set';

    const chronicConditions = profile?.chronic_conditions?.join(', ') || 'None';

    const testSetsContext = testSets?.map(ts => 
      `ID: ${ts.id}\nName: ${ts.name}\nCategory: ${ts.category}\nFocus: ${ts.biomarker_domain_focus.join(', ')}\nKeywords: ${ts.priority_match_keywords.join(', ')}\n`
    ).join('\n---\n');

    const prompt = `You are a health optimization AI helping to recommend personalized test sets.

USER BIOMARKERS:
${biomarkerContext}

USER PRIORITIES:
${priorityContext}

CHRONIC CONDITIONS:
${chronicConditions}

AVAILABLE TEST SETS:
${testSetsContext}

Based on the user's biomarker scores (lower scores indicate areas needing attention), priorities, and health conditions, recommend the top 3 test sets that would be most valuable for this user.

For each recommended test set, provide:
1. The test set ID
2. A personalized reason (2-3 sentences) explaining why this specific set is valuable for THIS user based on their data
3. A priority level (high, medium, low) indicating urgency

Return ONLY valid JSON in this exact format:
{
  "recommendations": [
    {
      "test_set_id": "uuid-here",
      "reasoning": "Personalized explanation here",
      "priority": "high"
    }
  ]
}`;

    console.log('Calling Lovable AI...');

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a medical AI assistant. Always return valid JSON only.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      
      // Fallback to simple scoring if AI fails
      const fallbackRecs = (testSets || []).slice(0, 3).map(ts => ({
        test_set_id: ts.id,
        reasoning: `This ${ts.category} panel is recommended based on your health goals.`,
        priority: 'medium'
      }));
      
      return new Response(JSON.stringify({ recommendations: fallbackRecs }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '{}';
    
    console.log('AI response:', aiContent);
    
    let recommendations;
    try {
      const parsed = JSON.parse(aiContent);
      recommendations = parsed.recommendations || [];
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      // Fallback to simple recommendations
      recommendations = (testSets || []).slice(0, 3).map(ts => ({
        test_set_id: ts.id,
        reasoning: `This ${ts.category} panel is recommended based on your health goals.`,
        priority: 'medium'
      }));
    }

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in suggest-test-sets:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      recommendations: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});