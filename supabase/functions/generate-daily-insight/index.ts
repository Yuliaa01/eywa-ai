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

    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if we already have today's insight
    const today = new Date().toISOString().split('T')[0];
    const { data: existingInsight } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('user_id', user.id)
      .eq('kind', 'education')
      .gte('valid_from', `${today}T00:00:00`)
      .lte('valid_from', `${today}T23:59:59`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingInsight) {
      return new Response(JSON.stringify({ insight: existingInsight }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch user data
    const [profileRes, prioritiesRes, mealsRes, supplementsRes, vitalsRes] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('priorities').select('*').eq('user_id', user.id).is('deleted_at', null),
      supabase.from('meals').select('*').eq('user_id', user.id).order('timestamp', { ascending: false }).limit(10),
      supabase.from('supplements').select('*').eq('user_id', user.id).is('deleted_at', null),
      supabase.from('vitals_stream').select('*').eq('user_id', user.id).order('recorded_at', { ascending: false }).limit(20)
    ]);

    const profile = profileRes.data;
    const priorities = prioritiesRes.data || [];
    const recentMeals = mealsRes.data || [];
    const supplements = supplementsRes.data || [];
    const recentVitals = vitalsRes.data || [];

    // Build context
    const context = {
      profile: {
        name: profile?.first_name,
        goals: profile?.chronic_conditions,
        diet_preferences: profile?.diet_preferences,
        allergies: profile?.allergies
      },
      priorities: priorities.map(p => ({
        type: p.type,
        title: p.title,
        status: p.status,
        time_scope: p.time_scope
      })),
      recent_meals: recentMeals.length,
      supplements: supplements.map(s => s.name),
      recent_vitals: recentVitals.reduce((acc, v) => {
        acc[v.metric] = v.value;
        return acc;
      }, {} as Record<string, number>)
    };

    const systemPrompt = `You are a health AI assistant. Generate a personalized morning insight message for the user based on their health data. 
    
Keep the message:
- NO greetings (no "Good morning", "Hi", etc.) - start directly with the insight
- Conversational and encouraging (like a friend, not a doctor)
- Specific to their actual data (mention real metrics, goals, or trends)
- Under 100 words
- End with an engaging question that invites them to explore more

User context: ${JSON.stringify(context)}`;

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
          { role: 'user', content: 'Generate today\'s morning insight message.' }
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const message = aiData.choices[0].message.content;

    // Store the insight
    const { data: newInsight, error: insertError } = await supabase
      .from('ai_insights')
      .insert({
        user_id: user.id,
        kind: 'education',
        title: 'Daily Morning Insight',
        summary: message,
        priority: 'medium',
        valid_from: new Date().toISOString(),
        valid_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing insight:', insertError);
      throw insertError;
    }

    return new Response(JSON.stringify({ insight: newInsight }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error generating daily insight:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
