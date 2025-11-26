import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { doctorId, messages, userId } = await req.json();
    
    console.log('AI Doctor Chat request:', { doctorId, messageCount: messages?.length, userId });

    if (!doctorId || !messages) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch doctor information
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('name, specialty, role_group, bio_short')
      .eq('id', doctorId)
      .single();

    if (doctorError || !doctor) {
      console.error('Error fetching doctor:', doctorError);
      return new Response(
        JSON.stringify({ error: 'Doctor not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isPrimaryCare = doctor.specialty === 'primary_care';
    let userDataContext = '';

    // For Primary Care doctors, fetch comprehensive user health data
    if (isPrimaryCare && userId) {
      console.log('Fetching comprehensive user data for Primary Care consultation');
      
      // Fetch user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Fetch recent lab results
      const { data: labResults } = await supabase
        .from('lab_results')
        .select('*')
        .eq('user_id', userId)
        .order('reported_at', { ascending: false })
        .limit(20);

      // Fetch recent vitals
      const { data: vitals } = await supabase
        .from('vitals_stream')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false })
        .limit(30);

      // Fetch active health issues
      const { data: healthIssues } = await supabase
        .from('health_issues')
        .select('*')
        .eq('user_id', userId)
        .is('resolved_at', null)
        .order('created_at', { ascending: false });

      // Fetch current priorities/goals
      const { data: priorities } = await supabase
        .from('priorities')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent AI insights
      const { data: insights } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      // Build comprehensive context
      userDataContext = `

=== USER HEALTH DATA ===
${profile ? `
Profile:
- Age: ${profile.dob ? new Date().getFullYear() - new Date(profile.dob).getFullYear() : 'Unknown'}
- Sex: ${profile.sex_at_birth || 'Unknown'}
- Height: ${profile.height_cm ? profile.height_cm + ' cm' : 'Unknown'}
- Weight: ${profile.weight_kg ? profile.weight_kg + ' kg' : 'Unknown'}
- Chronic Conditions: ${profile.chronic_conditions?.join(', ') || 'None reported'}
- Medications: ${profile.medications?.join(', ') || 'None reported'}
- Allergies: ${profile.allergies?.join(', ') || 'None reported'}
` : ''}
${labResults && labResults.length > 0 ? `
Recent Lab Results (last 20):
${labResults.map(r => `- ${r.test_code}: ${r.value_num || r.value_text} ${r.units || ''} (ref: ${r.reference_low || ''}-${r.reference_high || ''}) [${new Date(r.reported_at).toLocaleDateString()}]`).join('\n')}
` : ''}
${vitals && vitals.length > 0 ? `
Recent Vitals (last 30):
${vitals.map(v => `- ${v.metric}: ${v.value} ${v.units || ''} [${new Date(v.recorded_at).toLocaleDateString()}]`).join('\n')}
` : ''}
${healthIssues && healthIssues.length > 0 ? `
Active Health Issues:
${healthIssues.map(h => `- ${h.title} (${h.category}, severity: ${h.severity || 'unspecified'}): ${h.details || ''}`).join('\n')}
` : ''}
${priorities && priorities.length > 0 ? `
Current Health Goals/Priorities:
${priorities.map(p => `- ${p.title} (${p.type}, ${p.status}): ${p.description || ''}`).join('\n')}
` : ''}
${insights && insights.length > 0 ? `
Recent AI Insights:
${insights.map(i => `- [${i.kind}] ${i.title}: ${i.summary || ''}`).join('\n')}
` : ''}
=== END USER HEALTH DATA ===
`;
    }

    // Fetch doctor's prompt template
    const { data: promptData, error: promptError } = await supabase
      .from('doctor_prompts')
      .select('prompt_template')
      .eq('doctor_id', doctorId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    let systemPrompt = '';

    if (isPrimaryCare) {
      systemPrompt = `You are ${doctor.name}, the PRIMARY CARE AI PHYSICIAN - the main healthcare coordinator for this user. ${doctor.bio_short || ''}

CRITICAL ROLE: As the Primary Care doctor, you are the CENTRAL HUB of the user's healthcare journey. You have access to ALL user health data and must:

1. COMPREHENSIVE ANALYSIS: Review all available health data including lab results, vitals, health issues, medications, and goals
2. HOLISTIC COORDINATION: Understand the complete health picture before making recommendations
3. SPECIALIST REFERRALS: When you identify issues requiring specialized care, actively recommend consulting with specific specialist doctors available in the system:
   - Cardiology: Heart and cardiovascular issues
   - Endocrinology: Hormonal and metabolic concerns
   - Gastroenterology: Digestive system issues
   - Neurology: Neurological conditions
   - Mental Health: Psychiatry, anxiety, depression
   - And other specialists as needed

4. PROACTIVE GUIDANCE: Don't wait for the user to ask - if you see patterns or concerns in their data, bring them up and suggest appropriate specialist consultations

5. DATA-DRIVEN DECISIONS: Base all recommendations on the comprehensive health data provided

6. CONTINUITY OF CARE: Track ongoing issues and follow up on previous recommendations

${userDataContext}

Respond in a warm, professional manner while maintaining medical accuracy. Always recommend consulting with in-person healthcare professionals for urgent or serious concerns.`;
    } else {
      systemPrompt = `You are ${doctor.name}, a specialized AI ${doctor.specialty.replace(/_/g, ' ')} doctor. ${doctor.bio_short || ''}

Your role is to:
- Provide professional medical insights and recommendations in your specialty area
- Analyze health data and test results relevant to your field
- Offer personalized health advice based on the user's information
- Be empathetic, clear, and patient-focused
- Always recommend consulting with healthcare professionals for serious concerns

Respond in a warm, professional manner while maintaining medical accuracy.`;
    }

    // Use custom prompt if available
    if (promptData?.prompt_template) {
      systemPrompt = promptData.prompt_template;
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Calling Lovable AI with system prompt length:', systemPrompt.length);

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
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response.';

    console.log('AI response generated successfully');

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-doctor-chat:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
