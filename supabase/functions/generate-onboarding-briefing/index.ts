import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OnboardingData {
  profile?: {
    firstName?: string;
    lastName?: string;
    dob?: string;
    sex?: string;
    height?: number;
    weight?: number;
  };
  goals?: string[];
  nutrition?: {
    diet?: string[];
    allergies?: string[];
    macroMode?: string;
  };
  connections?: any[];
}

interface Finding {
  title: string;
  severity: 'good' | 'moderate' | 'attention';
  detail: string;
  category: 'body' | 'nutrition' | 'activity' | 'goals';
}

interface Recommendation {
  text: string;
  priority: 'high' | 'medium' | 'low';
}

interface BriefingResponse {
  findings: Finding[];
  recommendations: Recommendation[];
  healthScore: number;
  summary: string;
}

function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function calculateBMI(height: number, weight: number): number {
  const heightM = height / 100;
  return weight / (heightM * heightM);
}

function getBMICategory(bmi: number): { category: string; severity: 'good' | 'moderate' | 'attention' } {
  if (bmi < 18.5) return { category: 'Underweight', severity: 'moderate' };
  if (bmi < 25) return { category: 'Healthy', severity: 'good' };
  if (bmi < 30) return { category: 'Overweight', severity: 'moderate' };
  return { category: 'Obese', severity: 'attention' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { onboardingData } = await req.json() as { onboardingData: OnboardingData };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context from onboarding data
    const profile = onboardingData.profile || {};
    const goals = onboardingData.goals || [];
    const nutrition = onboardingData.nutrition || {};
    const connections = onboardingData.connections || [];

    let contextParts: string[] = [];

    // Profile context
    if (profile.dob) {
      const age = calculateAge(profile.dob);
      contextParts.push(`Age: ${age} years old`);
    }
    if (profile.sex) {
      contextParts.push(`Sex: ${profile.sex}`);
    }
    if (profile.height && profile.weight) {
      const bmi = calculateBMI(profile.height, profile.weight);
      const bmiInfo = getBMICategory(bmi);
      contextParts.push(`Height: ${profile.height}cm, Weight: ${profile.weight}kg, BMI: ${bmi.toFixed(1)} (${bmiInfo.category})`);
    }

    // Goals context
    if (goals.length > 0) {
      contextParts.push(`Health Goals: ${goals.join(', ')}`);
    }

    // Nutrition context
    if (nutrition.diet && nutrition.diet.length > 0) {
      contextParts.push(`Diet Preferences: ${nutrition.diet.join(', ')}`);
    }
    if (nutrition.allergies && nutrition.allergies.length > 0) {
      contextParts.push(`Allergies/Avoidances: ${nutrition.allergies.join(', ')}`);
    }

    // Connections context
    if (connections.length > 0) {
      contextParts.push(`Connected Health Apps: ${connections.length} app(s) connected`);
    }

    const userContext = contextParts.length > 0 
      ? contextParts.join('\n')
      : 'New user with minimal profile data';

    const systemPrompt = `You are a health analysis AI. Generate a CONCISE personalized health briefing.

CRITICAL: Keep all text SHORT.
- Finding titles: max 5 words
- Finding details: max 15 words (one short sentence)
- Recommendations: max 10 words each
- Summary: max 20 words (one sentence)

Provide:
1. 3 findings about their health status
2. 3 actionable recommendations
3. Health score (60-95)
4. Brief summary

Be encouraging. Never diagnose. Focus on their goals.`;

    const userPrompt = `Generate a health briefing for this user:

${userContext}

Respond with a JSON object (no markdown) containing:
{
  "findings": [
    { "title": "string", "severity": "good|moderate|attention", "detail": "string", "category": "body|nutrition|activity|goals" }
  ],
  "recommendations": [
    { "text": "string", "priority": "high|medium|low" }
  ],
  "healthScore": number (0-100),
  "summary": "string"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    let briefing: BriefingResponse;
    try {
      // Clean the response (remove markdown code blocks if present)
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      briefing = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Return fallback response
      briefing = {
        findings: [
          { title: "Profile Created", severity: "good", detail: "Your health profile has been set up successfully", category: "body" },
          { title: "Goals Established", severity: "good", detail: `You've set ${goals.length || 0} health goals to work towards`, category: "goals" },
          { title: "Ready to Track", severity: "good", detail: "Start logging your activities and nutrition to get personalized insights", category: "activity" }
        ],
        recommendations: [
          { text: "Complete your first week of activity tracking", priority: "high" },
          { text: "Log your meals to understand your nutrition patterns", priority: "medium" },
          { text: "Connect additional health apps for comprehensive tracking", priority: "low" }
        ],
        healthScore: 75,
        summary: "Welcome! Your health journey begins now. We'll provide personalized insights as you use the app."
      };
    }

    return new Response(JSON.stringify(briefing), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-onboarding-briefing:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      // Fallback response
      findings: [
        { title: "Welcome to Your Health Journey", severity: "good", detail: "Your profile is set up and ready to go", category: "body" }
      ],
      recommendations: [
        { text: "Start tracking your daily activities", priority: "high" }
      ],
      healthScore: 75,
      summary: "Your personalized health analysis will improve as you use the app."
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
