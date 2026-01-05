import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { encode as base64Encode } from 'https://deno.land/std@0.208.0/encoding/base64.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sensitive fields that should be encrypted at rest
const ENCRYPTED_FIELDS = ['chronic_conditions', 'medications', 'allergies', 'diet_preferences', 'food_avoidances', 'religious_diet'];

// Non-sensitive fields that can be stored directly
const ALLOWED_PLAIN_FIELDS = [
  'first_name', 'last_name', 'dob', 'sex_at_birth', 'height_cm', 'weight_kg',
  'timezone', 'locale', 'view_mode', 'push_notifications_enabled', 'avatar_url',
  'onboarding_completed', 'fasting_pref', 'cycle_preferences', 'sleep_schedule_notes'
];

// Encryption utility using AES-GCM (same as fitness-oauth-callback)
async function encryptField(plaintext: string): Promise<string> {
  const encryptionKey = Deno.env.get('TOKEN_ENCRYPTION_KEY');
  if (!encryptionKey) {
    throw new Error('TOKEN_ENCRYPTION_KEY not configured');
  }

  const encoder = new TextEncoder();
  const keyData = encoder.encode(encryptionKey.slice(0, 32).padEnd(32, '0'));

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = encoder.encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  // Combine IV + ciphertext
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return base64Encode(combined);
}

// Encrypt sensitive fields before storage
async function encryptSensitiveFields(updates: Record<string, unknown>): Promise<Record<string, unknown>> {
  const encryptedUpdates = { ...updates };

  for (const field of ENCRYPTED_FIELDS) {
    if (field in updates) {
      const value = updates[field];
      if (value !== null && value !== undefined) {
        // Serialize array/object to JSON, then encrypt
        const jsonValue = JSON.stringify(value);
        encryptedUpdates[field] = await encryptField(jsonValue);
      }
    }
  }

  return encryptedUpdates;
}

// Validate that only allowed fields are being updated
function validateFields(updates: Record<string, unknown>): void {
  const allowedFields = new Set([...ENCRYPTED_FIELDS, ...ALLOWED_PLAIN_FIELDS, 'updated_at']);
  
  for (const field of Object.keys(updates)) {
    if (!allowedFields.has(field) && field !== 'user_id' && field !== 'id') {
      throw new Error(`Field '${field}' is not allowed for update`);
    }
  }
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

    // Parse request body
    const body = await req.json();
    const { updates } = body;

    if (!updates || typeof updates !== 'object') {
      throw new Error('Invalid request: updates object required');
    }

    // Validate fields
    validateFields(updates);

    // Encrypt sensitive fields
    const encryptedUpdates = await encryptSensitiveFields(updates);

    // Use service role for the write operation
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Capture before state for audit
    const { data: beforeProfile } = await serviceClient
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Upsert the profile with encrypted fields
    const { data: profile, error: upsertError } = await serviceClient
      .from('user_profiles')
      .upsert({
        id: user.id,
        user_id: user.id,
        ...encryptedUpdates,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (upsertError) {
      throw upsertError;
    }

    // Log write for audit trail
    await serviceClient.from('audit_log').insert({
      user_id: user.id,
      actor: `user:${user.id}`,
      action: 'update',
      resource: 'user_profiles:secure_write',
      before: beforeProfile ? { existed: true } : { existed: false },
      after: { fields_updated: Object.keys(updates) }
    });

    console.log(`Secure profile write for user ${user.id}, fields: ${Object.keys(updates).join(', ')}`);

    return new Response(
      JSON.stringify({ success: true, profile_id: profile.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Secure profile write error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
