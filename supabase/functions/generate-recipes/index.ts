import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body for user preferences
    let userPreferences: {
      description?: string;
      ingredients?: string;
      mealType?: string;
    } = {};
    
    try {
      const body = await req.json();
      userPreferences = body || {};
    } catch {
      // No body provided, use defaults
    }

    // Fetch user profile data
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('diet_preferences, allergies, chronic_conditions, food_avoidances')
      .eq('user_id', user.id)
      .single();

    const dietPreferences = profile?.diet_preferences || [];
    const allergies = profile?.allergies || [];
    const foodAvoidances = profile?.food_avoidances || [];
    const chronicConditions = profile?.chronic_conditions || [];

    // Build personalized prompt
    let systemPrompt = `You are a nutritionist AI that creates healthy, delicious recipe suggestions. Generate 3 diverse recipes that are:
- Nutritionally balanced and healthy
- Easy to prepare (30 minutes or less)
- Include macronutrient information (protein, carbs, fat in grams)
- Include estimated calorie count
- Assign each recipe a category: breakfast, lunch, dinner, snack, or dessert based on the meal type`;

    // Add user preferences from the dialog
    if (userPreferences.description) {
      systemPrompt += `\n- User wants: ${userPreferences.description}`;
    }

    if (userPreferences.ingredients) {
      systemPrompt += `\n- Try to use these available ingredients: ${userPreferences.ingredients}`;
    }

    if (userPreferences.mealType) {
      systemPrompt += `\n- Focus on ${userPreferences.mealType} recipes`;
    }

    if (dietPreferences.length > 0) {
      systemPrompt += `\n- Follow these dietary preferences: ${dietPreferences.join(', ')}`;
    }

    if (allergies.length > 0) {
      systemPrompt += `\n- MUST avoid these allergens: ${allergies.join(', ')}`;
    }

    if (foodAvoidances.length > 0) {
      systemPrompt += `\n- Avoid these foods: ${foodAvoidances.join(', ')}`;
    }

    if (chronicConditions.length > 0) {
      systemPrompt += `\n- Consider these health conditions: ${chronicConditions.join(', ')}`;
    }

    // Call Lovable AI with tool calling for structured output
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate 3 personalized recipe suggestions for today.' }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_recipes',
              description: 'Return 3 healthy recipe suggestions with nutritional information',
              parameters: {
                type: 'object',
                properties: {
                  recipes: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        description: { type: 'string' },
                        category: { 
                          type: 'string',
                          enum: ['breakfast', 'lunch', 'dinner', 'snack', 'dessert']
                        },
                        prepTime: { type: 'string' },
                        servings: { type: 'number' },
                        calories: { type: 'number' },
                        protein: { type: 'number' },
                        carbs: { type: 'number' },
                        fat: { type: 'number' },
                        ingredients: {
                          type: 'array',
                          items: { type: 'string' }
                        },
                        instructions: {
                          type: 'array',
                          items: { type: 'string' }
                        },
                        tags: {
                          type: 'array',
                          items: { type: 'string' }
                        }
                      },
                      required: ['name', 'description', 'category', 'prepTime', 'servings', 'calories', 'protein', 'carbs', 'fat', 'ingredients', 'instructions', 'tags'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['recipes'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_recipes' } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error('AI generation failed');
    }

    const aiData = await aiResponse.json();
    console.log('AI Response:', JSON.stringify(aiData, null, 2));

    // Extract recipes from tool call
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in response');
    }

    const recipes = JSON.parse(toolCall.function.arguments).recipes;

    // Generate images for each recipe
    const recipesWithImages = await Promise.all(
      recipes.map(async (recipe: any) => {
        try {
          const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-image-preview',
              messages: [
                {
                  role: 'user',
                  content: `Generate a beautiful, appetizing photo of ${recipe.name}. Professional food photography style, well-lit, on a clean plate.`
                }
              ],
              modalities: ['image', 'text']
            }),
          });

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
            return { ...recipe, imageUrl };
          }
        } catch (error) {
          console.error(`Error generating image for ${recipe.name}:`, error);
        }
        return recipe;
      })
    );

    return new Response(JSON.stringify({ recipes: recipesWithImages }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-recipes function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
