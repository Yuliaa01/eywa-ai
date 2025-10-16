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

  let fileId: string | undefined;

  try {
    const { fileId: fId, filePath, fileName } = await req.json();
    fileId = fId;

    if (!filePath) {
      throw new Error('File path is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Analyzing file:', fileName, 'for user:', user.id);

    // Update status to parsing
    if (fileId) {
      await supabase
        .from('uploaded_files')
        .update({ status: 'parsing' })
        .eq('id', fileId);
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('user-files')
      .download(filePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw new Error('Failed to download file');
    }

    // Convert file to base64 for AI analysis
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    // Determine file type
    const fileType = fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';

    console.log('Calling AI for analysis...');

    // Call Lovable AI to analyze the health document
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a medical data extraction expert. Analyze health documents and extract:
1. Lab test results (test name, value, units, reference range)
2. Biomarker insights (domain, score, explanation)
3. Medical summary and key findings
4. Health improvement suggestions

Format your response as JSON with this structure:
{
  "summary": "Brief medical summary",
  "lab_results": [{"test_code": "TSH", "value_num": 2.5, "units": "mIU/L", "reference_low": 0.5, "reference_high": 5.0}],
  "biomarkers": [{"domain": "hormonal", "score": 85, "explanation": "Thyroid function is optimal"}],
  "suggestions": ["Specific actionable health improvements"]
}`
          },
          {
            role: 'user',
            content: `Analyze this health document (${fileName}) and extract all medical data, lab results, and provide health insights.`,
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI response error:', aiResponse.status, errorText);
      throw new Error(`AI analysis failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI analysis complete');

    const analysisText = aiData.choices[0]?.message?.content || '';
    
    // Try to parse JSON from the response
    let parsedAnalysis;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/) || 
                        analysisText.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, analysisText];
      parsedAnalysis = JSON.parse(jsonMatch[1] || analysisText);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      parsedAnalysis = {
        summary: analysisText.substring(0, 500),
        lab_results: [],
        biomarkers: [],
        suggestions: []
      };
    }

    console.log('Storing extracted data...');

    // Store lab results with provenance
    if (parsedAnalysis.lab_results && Array.isArray(parsedAnalysis.lab_results)) {
      for (const lab of parsedAnalysis.lab_results) {
        await supabase.from('lab_results').insert({
          user_id: user.id,
          test_code: lab.test_code,
          value_num: lab.value_num,
          value_text: lab.value_text,
          units: lab.units,
          reference_low: lab.reference_low,
          reference_high: lab.reference_high,
          source: 'manual',
          reported_at: new Date().toISOString(),
          provenance: fileId ? {
            file_id: fileId,
            file_name: fileName,
            parsed_at: new Date().toISOString()
          } : null,
        });
      }
    }

    // Store biomarker scores
    if (parsedAnalysis.biomarkers && Array.isArray(parsedAnalysis.biomarkers)) {
      for (const biomarker of parsedAnalysis.biomarkers) {
        await supabase.from('biomarker_scores').insert({
          user_id: user.id,
          domain: biomarker.domain,
          score: biomarker.score,
          explanation: biomarker.explanation,
          method: 'ai_analysis',
        });
      }
    }

    // Store AI feedback
    await supabase.from('ai_feedback_unified').insert({
      user_id: user.id,
      period: 'instant',
      summary_md: parsedAnalysis.summary,
      next_best_actions: parsedAnalysis.suggestions ? JSON.stringify(parsedAnalysis.suggestions) : null,
    });

    console.log('Analysis complete and data stored');

    // Update file status to parsed
    if (fileId) {
      await supabase
        .from('uploaded_files')
        .update({ 
          status: 'parsed',
          parsed_at: new Date().toISOString()
        })
        .eq('id', fileId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: parsedAnalysis.summary,
        lab_results_count: parsedAnalysis.lab_results?.length || 0,
        biomarkers_count: parsedAnalysis.biomarkers?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in analyze-health-file:', error);
    
    // Update file status to error if fileId exists
    if (fileId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase
          .from('uploaded_files')
          .update({ 
            status: 'error',
            error_message: error.message
          })
          .eq('id', fileId);
      } catch (e) {
        console.error('Failed to update error status:', e);
      }
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
