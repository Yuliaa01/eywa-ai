import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if suggestions already exist for today
    const { data: existing } = await supabase
      .from('activity_suggestions')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', today)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ message: 'Suggestions already generated for today' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch context data including health care data and goals
    const [prioritiesRes, profileRes, mealsRes, supplementsRes, labResultsRes, testOrdersRes] = await Promise.all([
      supabase.from('priorities').select('*').eq('user_id', user.id).is('deleted_at', null),
      supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('meals').select('*').eq('user_id', user.id).gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('supplements').select('*').eq('user_id', user.id).is('deleted_at', null),
      supabase.from('lab_results').select('*').eq('user_id', user.id).order('collected_at', { ascending: false }).limit(50),
      supabase.from('user_test_orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    ]);

    const priorities = prioritiesRes.data || [];
    const globalGoals = priorities.filter(p => p.type === 'global_goal');
    const weekGoals = priorities.filter(p => p.type === 'temporary_goal' && p.time_scope === 'week');
    const plans = priorities.filter(p => p.type === 'plan_trip' || p.type === 'plan_event');

    const context = {
      globalGoals,
      weekGoals,
      plans,
      profile: profileRes.data || {},
      recentMeals: mealsRes.data || [],
      supplements: supplementsRes.data || [],
      labResults: labResultsRes.data || [],
      testOrders: testOrdersRes.data || [],
    };

    // Call Lovable AI to generate suggestions
    const systemPrompt = `You are Eywa AI's Planner. Generate 6 concise, safe, actionable suggestions for today.
Given context about user's global goals, weekly goals, plans (trips/events), health care data (lab results, test orders), profile, nutrition, and supplements, create personalized recommendations.
Return a JSON array with exactly 6 items, each having: title (max 60 chars), reasoning (max 100 chars), category (movement/nutrition/sleep/recovery/mindset/medical), and duration_min (optional).
Prioritize actions based on:
1. Lab results that need attention or follow-up
2. Goals that can be advanced (global goals, weekly goals, upcoming plans)
3. Health patterns from recent data
Vary categories. Never suggest items conflicting with diet/allergies. Focus on actionable next steps based on health data and goals.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Context: ${JSON.stringify(context)}. Generate 6 suggestions for today.` },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_suggestions',
            description: 'Generate daily health suggestions',
            parameters: {
              type: 'object',
              properties: {
                suggestions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      reasoning: { type: 'string' },
                      category: { type: 'string', enum: ['movement', 'nutrition', 'sleep', 'recovery', 'mindset', 'medical'] },
                      duration_min: { type: 'number' },
                    },
                    required: ['title', 'category'],
                  },
                },
              },
              required: ['suggestions'],
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'generate_suggestions' } },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error('AI gateway error');
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    const suggestions = toolCall ? JSON.parse(toolCall.function.arguments).suggestions : [];

    // Insert suggestions into database
    const insertData = suggestions.map((s: any) => ({
      user_id: user.id,
      title: s.title,
      reasoning: s.reasoning || null,
      category: s.category,
      date: today,
      duration_min: s.duration_min || null,
      context: context,
    }));

    const { error: insertError } = await supabase
      .from('activity_suggestions')
      .insert(insertData);

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ success: true, count: suggestions.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating suggestions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
