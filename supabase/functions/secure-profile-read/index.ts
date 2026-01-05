import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { decode as base64Decode } from 'https://deno.land/std@0.208.0/encoding/base64.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sensitive fields that are encrypted at rest
const ENCRYPTED_FIELDS = ['chronic_conditions', 'medications', 'allergies', 'diet_preferences', 'food_avoidances', 'religious_diet'];

// Decryption utility using AES-GCM (same as fitness-sync-data)
async function decryptField(encryptedData: string): Promise<string> {
  const encryptionKey = Deno.env.get('TOKEN_ENCRYPTION_KEY');
  if (!encryptionKey) {
    throw new Error('TOKEN_ENCRYPTION_KEY not configured');
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const keyData = encoder.encode(encryptionKey.slice(0, 32).padEnd(32, '0'));

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const combined = base64Decode(encryptedData);
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decryptedData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return decoder.decode(decryptedData);
}

// Decrypt sensitive fields from profile
async function decryptSensitiveFields(profile: Record<string, unknown>): Promise<Record<string, unknown>> {
  const decryptedProfile = { ...profile };

  for (const field of ENCRYPTED_FIELDS) {
    const value = profile[field];

    try {
      // New format: ciphertext stored as single-element string[]
      if (Array.isArray(value) && value.length === 1 && typeof value[0] === 'string') {
        const decryptedJson = await decryptField(value[0]);
        decryptedProfile[field] = JSON.parse(decryptedJson);
        continue;
      }

      // Legacy format: ciphertext stored directly as string
      if (typeof value === 'string' && value.length > 0) {
        const decryptedJson = await decryptField(value);
        decryptedProfile[field] = JSON.parse(decryptedJson);
      }
    } catch (err) {
      // If it's not actually encrypted (or decryption fails), leave as-is
      console.error(`Failed to decrypt field ${field}:`, err);
    }
  }

  return decryptedProfile;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user authentication
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body for optional field selection
    let requestedFields: string[] | null = null;
    try {
      const body = await req.json();
      requestedFields = body.fields || null;
    } catch {
      // No body or invalid JSON, fetch all fields
    }

    // Fetch user profile using service role for decryption access
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: profile, error: profileError } = await serviceClient
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    if (!profile) {
      return new Response(
        JSON.stringify({ profile: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Decrypt sensitive fields
    const decryptedProfile = await decryptSensitiveFields(profile);

    // If specific fields requested, filter response
    let responseProfile = decryptedProfile;
    if (requestedFields && requestedFields.length > 0) {
      responseProfile = {};
      for (const field of requestedFields) {
        if (field in decryptedProfile) {
          responseProfile[field] = decryptedProfile[field];
        }
      }
    }

    // Log access for audit trail
    await serviceClient.from('audit_log').insert({
      user_id: user.id,
      actor: `user:${user.id}`,
      action: 'read',
      resource: 'user_profiles:sensitive_fields',
      after: { fields_accessed: requestedFields || 'all' }
    });

    console.log(`Secure profile read for user ${user.id}`);

    return new Response(
      JSON.stringify({ profile: responseProfile }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Secure profile read error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
