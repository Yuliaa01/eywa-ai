import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to calculate age from DOB
function calculateAge(dob: string | null): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Helper to calculate BMI
function calculateBMI(heightCm: number | null, weightKg: number | null): string {
  if (!heightCm || !weightKg) return 'Unknown';
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return bmi.toFixed(1);
}

// Helper to format date
function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown';
  return new Date(dateStr).toLocaleDateString();
}

// Helper to get time window data (30d, 90d, 1y)
function getTimeWindowDate(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Extract user ID from authenticated JWT token, not request body
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role for data access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the JWT and extract the authenticated user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth verification failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use the authenticated user's ID - NEVER trust userId from request body
    const authenticatedUserId = user.id;
    
    const { doctorId, messages } = await req.json();
    
    console.log('AI Doctor Chat request:', { doctorId, messageCount: messages?.length, userId: authenticatedUserId });

    if (!doctorId || !messages) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch doctor information
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('name, specialty, role_group, bio_short, focus_areas')
      .eq('id', doctorId)
      .single();

    if (doctorError || !doctor) {
      console.error('Error fetching doctor:', doctorError);
      return new Response(
        JSON.stringify({ error: 'Doctor not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if this is a primary care / family medicine doctor (comprehensive data access)
    const isPrimaryCare = doctor.specialty === 'primary_care' || doctor.role_group === 'primary_care';
    let userDataContext = '';

    // For Primary Care / Family Physician, fetch comprehensive user health data
    if (isPrimaryCare) {
      console.log('Fetching comprehensive user data for Family Physician consultation');
      
      const thirtyDaysAgo = getTimeWindowDate(30).toISOString();
      const ninetyDaysAgo = getTimeWindowDate(90).toISOString();
      const oneYearAgo = getTimeWindowDate(365).toISOString();
      
      // Fetch all data in parallel for efficiency using authenticated user ID
      const [
        profileResult,
        labResultsResult,
        vitalsResult,
        healthIssuesResult,
        prioritiesResult,
        insightsResult,
        supplementsResult,
        mealsResult,
        nutritionPlanResult,
        fastingWindowsResult,
        fitnessActivitiesResult,
        workoutPlansResult,
        biomarkerScoresResult,
        streaksResult,
        feedbackResult
      ] = await Promise.all([
        // User profile
        supabase.from('user_profiles').select('*').eq('user_id', authenticatedUserId).maybeSingle(),
        // Lab results (last 30)
        supabase.from('lab_results').select('*').eq('user_id', authenticatedUserId).order('reported_at', { ascending: false }).limit(30),
        // Vitals (last 90 days)
        supabase.from('vitals_stream').select('*').eq('user_id', authenticatedUserId).gte('recorded_at', ninetyDaysAgo).order('recorded_at', { ascending: false }),
        // Active health issues
        supabase.from('health_issues').select('*').eq('user_id', authenticatedUserId).is('resolved_at', null).order('created_at', { ascending: false }),
        // Current priorities/goals
        supabase.from('priorities').select('*').eq('user_id', authenticatedUserId).is('deleted_at', null).order('created_at', { ascending: false }).limit(10),
        // Recent AI insights
        supabase.from('ai_insights').select('*').eq('user_id', authenticatedUserId).order('created_at', { ascending: false }).limit(10),
        // Supplements (active)
        supabase.from('supplements').select('*').eq('user_id', authenticatedUserId).is('deleted_at', null),
        // Recent meals (last 7 days)
        supabase.from('meals').select('*').eq('user_id', authenticatedUserId).gte('timestamp', getTimeWindowDate(7).toISOString()).order('timestamp', { ascending: false }),
        // Nutrition plan
        supabase.from('nutrition_plans').select('*').eq('user_id', authenticatedUserId).maybeSingle(),
        // Fasting windows (last 30 days)
        supabase.from('fasting_windows').select('*').eq('user_id', authenticatedUserId).gte('start_at', thirtyDaysAgo).order('start_at', { ascending: false }),
        // Fitness activities (last 30 days)
        supabase.from('synced_fitness_activities').select('*').eq('user_id', authenticatedUserId).gte('start_time', thirtyDaysAgo).order('start_time', { ascending: false }),
        // Workout plans
        supabase.from('workout_plans').select('*').eq('user_id', authenticatedUserId).order('created_at', { ascending: false }).limit(5),
        // Biomarker scores
        supabase.from('biomarker_scores').select('*').eq('user_id', authenticatedUserId).order('created_at', { ascending: false }).limit(20),
        // User streaks
        supabase.from('user_streaks').select('*').eq('user_id', authenticatedUserId),
        // AI feedback unified (latest)
        supabase.from('ai_feedback_unified').select('*').eq('user_id', authenticatedUserId).order('generated_at', { ascending: false }).limit(1)
      ]);

      const profile = profileResult.data;
      const labResults = labResultsResult.data || [];
      const vitals = vitalsResult.data || [];
      const healthIssues = healthIssuesResult.data || [];
      const priorities = prioritiesResult.data || [];
      const insights = insightsResult.data || [];
      const supplements = supplementsResult.data || [];
      const meals = mealsResult.data || [];
      const nutritionPlan = nutritionPlanResult.data;
      const fastingWindows = fastingWindowsResult.data || [];
      const fitnessActivities = fitnessActivitiesResult.data || [];
      const workoutPlans = workoutPlansResult.data || [];
      const biomarkerScores = biomarkerScoresResult.data || [];
      const streaks = streaksResult.data || [];
      const feedback = feedbackResult.data?.[0];

      // Calculate derived values
      const age = profile ? calculateAge(profile.dob) : null;
      const bmi = profile ? calculateBMI(profile.height_cm, profile.weight_kg) : 'Unknown';

      // Aggregate vitals by metric for trend analysis
      const vitalsByMetric: Record<string, any[]> = {};
      vitals.forEach(v => {
        if (!vitalsByMetric[v.metric]) vitalsByMetric[v.metric] = [];
        vitalsByMetric[v.metric].push(v);
      });

      // Calculate averages for key metrics
      const calculateAverage = (values: number[]) => values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : 'N/A';
      
      const hrValues = vitalsByMetric['hr']?.map(v => v.value) || [];
      const hrvValues = vitalsByMetric['hrv_rmssd']?.map(v => v.value) || [];
      const sleepValues = vitalsByMetric['sleep_duration']?.map(v => v.value) || [];
      const stepsValues = vitalsByMetric['steps']?.map(v => v.value) || [];

      // Build comprehensive context
      userDataContext = `
=== PATIENT PROFILE ===
Demographics:
- Age: ${age || 'Unknown'}
- Sex at Birth: ${profile?.sex_at_birth || 'Unknown'}
- Height: ${profile?.height_cm ? `${profile.height_cm} cm` : 'Unknown'}
- Weight: ${profile?.weight_kg ? `${profile.weight_kg} kg` : 'Unknown'}
- BMI: ${bmi}
- Biological Age Estimate: ${profile?.biological_age_estimate || 'Not calculated'}

Medical History:
- Chronic Conditions: ${profile?.chronic_conditions?.length ? profile.chronic_conditions.join(', ') : 'None reported'}
- Current Medications: ${profile?.medications?.length ? profile.medications.join(', ') : 'None reported'}
- Allergies: ${profile?.allergies?.length ? profile.allergies.join(', ') : 'None reported'}

Lifestyle & Preferences:
- Diet Preferences: ${profile?.diet_preferences?.length ? profile.diet_preferences.join(', ') : 'None specified'}
- Religious Diet: ${profile?.religious_diet?.length ? profile.religious_diet.join(', ') : 'None specified'}
- Food Avoidances: ${profile?.food_avoidances?.length ? profile.food_avoidances.join(', ') : 'None specified'}
- Sleep Notes: ${profile?.sleep_schedule_notes || 'None'}
- Timezone: ${profile?.timezone || 'Unknown'}

=== VITALS & WEARABLES (90-day trends) ===
Heart Rate:
- Average: ${calculateAverage(hrValues)} bpm
- Recent readings: ${hrValues.slice(0, 5).join(', ')} bpm

HRV (Heart Rate Variability):
- Average: ${calculateAverage(hrvValues)} ms
- Recent readings: ${hrvValues.slice(0, 5).join(', ')} ms

Sleep Duration:
- Average: ${calculateAverage(sleepValues)} hours
- Recent readings: ${sleepValues.slice(0, 7).map(v => `${v}h`).join(', ')}

Daily Steps:
- Average: ${calculateAverage(stepsValues)} steps
- Recent readings: ${stepsValues.slice(0, 7).join(', ')}

Blood Pressure: ${vitalsByMetric['bp_sys'] ? `${vitalsByMetric['bp_sys'][0]?.value || 'N/A'}/${vitalsByMetric['bp_dia']?.[0]?.value || 'N/A'} mmHg` : 'No data'}
SpO2: ${vitalsByMetric['spo2']?.[0]?.value ? `${vitalsByMetric['spo2'][0].value}%` : 'No data'}
Temperature: ${vitalsByMetric['temp']?.[0]?.value ? `${vitalsByMetric['temp'][0].value}°` : 'No data'}
VO2max Estimate: ${vitalsByMetric['vo2max_est']?.[0]?.value || 'No data'}
Body Fat: ${vitalsByMetric['body_fat']?.[0]?.value ? `${vitalsByMetric['body_fat'][0].value}%` : 'No data'}
${labResults.length > 0 ? `
=== LAB RESULTS (Recent) ===
${labResults.map(r => {
  const status = r.value_num !== null && r.reference_low !== null && r.reference_high !== null
    ? (r.value_num < r.reference_low ? 'LOW' : r.value_num > r.reference_high ? 'HIGH' : 'NORMAL')
    : '';
  return `- ${r.test_code}: ${r.value_num ?? r.value_text ?? 'N/A'} ${r.units || ''} ${status ? `[${status}]` : ''} (ref: ${r.reference_low ?? '?'}-${r.reference_high ?? '?'}) [${formatDate(r.reported_at)}]`;
}).join('\n')}
` : ''}
${biomarkerScores.length > 0 ? `
=== BIOMARKER SCORES ===
${biomarkerScores.map(s => `- ${s.domain}: ${s.score}/100 - ${s.explanation || 'No explanation'} [${formatDate(s.created_at)}]`).join('\n')}
` : ''}
${supplements.length > 0 ? `
=== CURRENT SUPPLEMENTS ===
${supplements.map(s => `- ${s.name}: ${s.dosage || 'Dosage unspecified'} ${s.units || ''} (${s.form || 'form unspecified'}) - Source: ${s.source}`).join('\n')}
` : ''}
${nutritionPlan ? `
=== NUTRITION PLAN ===
- Daily Calorie Target: ${nutritionPlan.daily_calories_target || 'Not set'}
- Macros Target: ${nutritionPlan.macros_target ? JSON.stringify(nutritionPlan.macros_target) : 'Not set'}
- Active Diets: ${nutritionPlan.active_diets?.join(', ') || 'None'}
- Allergy Flags: ${nutritionPlan.allergy_flags?.join(', ') || 'None'}
- Micros Focus: ${nutritionPlan.micros_focus?.join(', ') || 'None'}
` : ''}
${meals.length > 0 ? `
=== RECENT MEALS (Last 7 days) ===
${meals.slice(0, 10).map(m => {
  const totals = m.nutrition_totals as any;
  return `- ${formatDate(m.timestamp)}: ${totals?.calories || '?'} cal, P: ${totals?.protein || '?'}g, C: ${totals?.carbs || '?'}g, F: ${totals?.fat || '?'}g`;
}).join('\n')}
` : ''}
${fastingWindows.length > 0 ? `
=== FASTING HISTORY (Last 30 days) ===
${fastingWindows.map(f => {
  const startTime = new Date(f.start_at);
  const endTime = f.actual_end_at ? new Date(f.actual_end_at) : null;
  const duration = endTime ? Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)) : 'In progress';
  return `- ${f.protocol || 'Unknown'}: ${formatDate(f.start_at)} - Duration: ${duration}${typeof duration === 'number' ? 'h' : ''}`;
}).join('\n')}
` : ''}
${fitnessActivities.length > 0 ? `
=== FITNESS ACTIVITIES (Last 30 days) ===
${fitnessActivities.slice(0, 15).map(a => {
  const duration = a.duration_seconds ? Math.round(a.duration_seconds / 60) : 'N/A';
  return `- ${a.activity_type}: ${a.activity_name || ''} - ${duration} min, ${a.calories_burned || '?'} cal, HR: ${a.avg_heart_rate || '?'}/${a.max_heart_rate || '?'} bpm [${formatDate(a.start_time)}]`;
}).join('\n')}
` : ''}
${workoutPlans.length > 0 ? `
=== WORKOUT PLANS ===
${workoutPlans.map(w => `- ${w.block_name} (Week ${w.microcycle_week || '?'})`).join('\n')}
` : ''}
${streaks.length > 0 ? `
=== BEHAVIORAL STREAKS ===
${streaks.map(s => `- ${s.streak_type}: ${s.current_count} days current (longest: ${s.longest_streak})`).join('\n')}
` : ''}
${healthIssues.length > 0 ? `
=== ACTIVE HEALTH ISSUES ===
${healthIssues.map(h => `- ${h.title} (${h.category}, severity: ${h.severity || 'unspecified'}): ${h.details || 'No details'}`).join('\n')}
` : ''}
${priorities.length > 0 ? `
=== CURRENT HEALTH GOALS ===
${priorities.map(p => `- ${p.title} (${p.type}, ${p.status}): ${p.description || ''} ${p.target_value ? `Target: ${p.target_value} ${p.units || ''}` : ''}`).join('\n')}
` : ''}
${insights.length > 0 ? `
=== RECENT AI INSIGHTS ===
${insights.map(i => `- [${i.kind}/${i.priority}] ${i.title}: ${i.summary || ''}`).join('\n')}
` : ''}
${feedback ? `
=== LATEST AI FEEDBACK (${feedback.period}) ===
Summary: ${feedback.summary_md || 'None'}
Risk Signals: ${feedback.risk_signals ? JSON.stringify(feedback.risk_signals) : 'None'}
Wins: ${feedback.wins ? JSON.stringify(feedback.wins) : 'None'}
` : ''}
=== DATA QUALITY NOTES ===
- Lab results available: ${labResults.length}
- Vitals data points (90d): ${vitals.length}
- Meals logged (7d): ${meals.length}
- Fitness activities (30d): ${fitnessActivities.length}
- Fasting windows (30d): ${fastingWindows.length}

=== END USER HEALTH DATA ===
`;
    }

    // Fetch doctor's prompt template
    const { data: promptData } = await supabase
      .from('doctor_prompts')
      .select('prompt_template, output_schema')
      .eq('doctor_id', doctorId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    let systemPrompt = '';

    // Use custom prompt template if available
    if (promptData?.prompt_template) {
      // Replace placeholder with actual user data context
      systemPrompt = promptData.prompt_template.replace('{{USER_DATA_CONTEXT}}', userDataContext);
      console.log('Using custom prompt template for doctor:', doctor.name);
    } else if (isPrimaryCare) {
      // Fallback for primary care without custom prompt
      systemPrompt = `You are ${doctor.name}, a comprehensive family physician and primary care coordinator. ${doctor.bio_short || ''}

CRITICAL ROLE: As the Primary Care doctor, you are the CENTRAL HUB of the user's healthcare journey. You have access to ALL user health data and must:

1. COMPREHENSIVE ANALYSIS: Review all available health data including lab results, vitals, health issues, medications, and goals
2. HOLISTIC COORDINATION: Understand the complete health picture before making recommendations
3. SPECIALIST REFERRALS: When you identify issues requiring specialized care, actively recommend consulting with specific specialists
4. PROACTIVE GUIDANCE: If you see patterns or concerns in their data, bring them up and suggest appropriate consultations
5. DATA-DRIVEN DECISIONS: Base all recommendations on the comprehensive health data provided
6. CONTINUITY OF CARE: Track ongoing issues and follow up on previous recommendations

${userDataContext}

Respond in a warm, professional manner while maintaining medical accuracy. Always recommend consulting with in-person healthcare professionals for urgent or serious concerns.

IMPORTANT: This is educational support only—not medical advice. If you suspect an emergency, instruct the user to seek immediate care.`;
    } else {
      // Specialist prompt (limited data access)
      systemPrompt = `You are ${doctor.name}, a specialized AI ${doctor.specialty.replace(/_/g, ' ')} doctor. ${doctor.bio_short || ''}

Your role is to:
- Provide professional medical insights and recommendations in your specialty area
- Analyze health data and test results relevant to your field
- Offer personalized health advice based on the user's information
- Be empathetic, clear, and patient-focused
- Always recommend consulting with healthcare professionals for serious concerns

Respond in a warm, professional manner while maintaining medical accuracy.

IMPORTANT: This is educational support only—not medical advice.`;
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Calling Lovable AI with system prompt length:', systemPrompt.length, 'for doctor:', doctor.name);

    // Use gemini-2.5-pro for primary care (complex reasoning), flash for specialists
    const modelToUse = isPrimaryCare ? 'google/gemini-2.5-pro' : 'google/gemini-2.5-flash';
    const maxTokens = isPrimaryCare ? 4000 : 1500;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        max_tokens: maxTokens
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

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service credits exhausted. Please try again later.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response.';

    console.log('AI response generated successfully for:', doctor.name, 'Model:', modelToUse);

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
