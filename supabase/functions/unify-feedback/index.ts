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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Starting doctor reviews unification for user:', user.id);

    // Get all users who have doctor reviews from the last 24 hours
    const { data: recentReviews, error: reviewsError } = await supabase
      .from('doctor_reviews')
      .select('user_id, doctor_id, output_json, summary_md, generated_at')
      .gte('generated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('generated_at', { ascending: false });

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      throw reviewsError;
    }

    if (!recentReviews || recentReviews.length === 0) {
      console.log('No recent reviews to process');
      return new Response(JSON.stringify({ message: 'No reviews to process' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Group reviews by user
    const reviewsByUser = recentReviews.reduce((acc, review) => {
      if (!acc[review.user_id]) {
        acc[review.user_id] = [];
      }
      acc[review.user_id].push(review);
      return acc;
    }, {} as Record<string, typeof recentReviews>);

    console.log(`Processing reviews for ${Object.keys(reviewsByUser).length} users`);

    // Process each user's reviews
    for (const [userId, reviews] of Object.entries(reviewsByUser)) {
      try {
        // Aggregate risk signals (dedupe by title)
        const allRiskSignals = reviews.flatMap(r => 
          (r.output_json as any)?.risk_signals || []
        );
        
        const uniqueRiskSignals: any[] = Object.values(
          allRiskSignals.reduce((acc: Record<string, any>, signal: any) => {
            if (!acc[signal.title]) {
              acc[signal.title] = signal;
            } else if (signal.severity === 'high' || signal.severity === 'medium') {
              acc[signal.title] = signal; // Prioritize higher severity
            }
            return acc;
          }, {} as Record<string, any>)
        );

        // Aggregate next actions (dedupe and prioritize)
        const allActions = reviews.flatMap(r => 
          (r.output_json as any)?.next_actions || []
        );
        
        const uniqueActions: any[] = Object.values(
          allActions.reduce((acc: Record<string, any>, action: any) => {
            const key = action.action;
            if (!acc[key]) {
              acc[key] = action;
            } else if (action.priority === 'high' || action.priority === 'medium') {
              acc[key] = action; // Prioritize higher priority actions
            }
            return acc;
          }, {} as Record<string, any>)
        );

        // Sort actions by priority
        const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
        uniqueActions.sort((a: any, b: any) => priorityOrder[a.priority] - priorityOrder[b.priority]);

        // Aggregate wins (positive signals from current_status)
        const wins = reviews
          .map(r => ({
            source: `Doctor ${r.doctor_id}`,
            status: (r.output_json as any)?.current_status,
          }))
          .filter(w => w.status);

        // Create unified summary
        const summaryMd = `# Weekly Health Review

## Risk Signals (${uniqueRiskSignals.length})
${uniqueRiskSignals.map(s => `- **${s.title}** (${s.severity}): ${s.details}`).join('\n')}

## Next Best Actions (Top ${Math.min(5, uniqueActions.length)})
${uniqueActions.slice(0, 5).map((a, i) => `${i + 1}. **${a.action}** (${a.priority} priority, ${a.category})
   ${a.rationale}`).join('\n\n')}

## Current Status
${wins.map(w => `- ${w.status}`).join('\n')}
`;

        // Insert or update unified feedback
        const { error: upsertError } = await supabase
          .from('ai_feedback_unified')
          .upsert({
            user_id: userId,
            period: 'daily',
            risk_signals: uniqueRiskSignals,
            next_best_actions: uniqueActions.slice(0, 10),
            wins,
            summary_md: summaryMd,
            version: 1,
          }, {
            onConflict: 'user_id,period',
          });

        if (upsertError) {
          console.error(`Error upserting unified feedback for user ${userId}:`, upsertError);
        } else {
          console.log(`Successfully unified feedback for user ${userId}`);
        }
      } catch (error) {
        console.error(`Error processing user ${userId}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Unification completed',
        usersProcessed: Object.keys(reviewsByUser).length,
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in unify-feedback:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
