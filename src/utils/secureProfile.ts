import { supabase } from "@/integrations/supabase/client";

// Sensitive fields that are encrypted server-side
export const SENSITIVE_PROFILE_FIELDS = [
  'chronic_conditions',
  'medications', 
  'allergies',
  'diet_preferences',
  'food_avoidances',
  'religious_diet'
];

interface SecureProfileReadResponse {
  profile: Record<string, unknown> | null;
  error?: string;
}

interface SecureProfileWriteResponse {
  success: boolean;
  profile_id?: string;
  error?: string;
}

/**
 * Securely read user profile with decrypted sensitive fields
 * Uses the secure-profile-read edge function which decrypts at rest
 */
export async function readSecureProfile(
  fields?: string[]
): Promise<SecureProfileReadResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return { profile: null, error: 'Not authenticated' };
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/secure-profile-read`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ fields })
    }
  );

  const result = await response.json();
  
  if (!response.ok) {
    return { profile: null, error: result.error || 'Failed to read profile' };
  }

  return { profile: result.profile };
}

/**
 * Securely write user profile with encrypted sensitive fields
 * Uses the secure-profile-write edge function which encrypts at rest
 */
export async function writeSecureProfile(
  updates: Record<string, unknown>
): Promise<SecureProfileWriteResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return { success: false, error: 'Not authenticated' };
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/secure-profile-write`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ updates })
    }
  );

  const result = await response.json();
  
  if (!response.ok) {
    return { success: false, error: result.error || 'Failed to write profile' };
  }

  return { success: true, profile_id: result.profile_id };
}

/**
 * Check if a field is sensitive and requires secure handling
 */
export function isSensitiveField(fieldName: string): boolean {
  return SENSITIVE_PROFILE_FIELDS.includes(fieldName);
}

/**
 * Split profile updates into sensitive and non-sensitive
 * Useful for hybrid updates where some fields go direct and others go encrypted
 */
export function splitProfileUpdates(updates: Record<string, unknown>): {
  sensitive: Record<string, unknown>;
  nonSensitive: Record<string, unknown>;
} {
  const sensitive: Record<string, unknown> = {};
  const nonSensitive: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(updates)) {
    if (isSensitiveField(key)) {
      sensitive[key] = value;
    } else {
      nonSensitive[key] = value;
    }
  }

  return { sensitive, nonSensitive };
}
