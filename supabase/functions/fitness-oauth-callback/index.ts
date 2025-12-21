import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { encode as base64Encode } from 'https://deno.land/std@0.208.0/encoding/base64.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}

// Encryption utility using AES-GCM
async function encryptToken(plaintext: string): Promise<string> {
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
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );

  // Combine IV and encrypted data, then base64 encode
  const combined = new Uint8Array(iv.length + new Uint8Array(encryptedData).length);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedData), iv.length);
  
  return base64Encode(combined);
}

const exchangeCodeForToken = async (
  appName: string,
  code: string,
  redirectUri: string
): Promise<TokenResponse> => {
  const configs: Record<string, { tokenUrl: string; clientId: string; clientSecret: string }> = {
    strava: {
      tokenUrl: 'https://www.strava.com/oauth/token',
      clientId: Deno.env.get('STRAVA_CLIENT_ID') || '',
      clientSecret: Deno.env.get('STRAVA_CLIENT_SECRET') || '',
    },
    fitbit: {
      tokenUrl: 'https://api.fitbit.com/oauth2/token',
      clientId: Deno.env.get('FITBIT_CLIENT_ID') || '',
      clientSecret: Deno.env.get('FITBIT_CLIENT_SECRET') || '',
    },
    garmin: {
      tokenUrl: 'https://connectapi.garmin.com/oauth-service/oauth/access_token',
      clientId: Deno.env.get('GARMIN_CLIENT_ID') || '',
      clientSecret: Deno.env.get('GARMIN_CLIENT_SECRET') || '',
    },
  };

  const config = configs[appName.toLowerCase()];
  if (!config) {
    throw new Error(`Token exchange configuration not found for ${appName}`);
  }

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Token exchange failed for ${appName}:`, errorText);
    throw new Error(`Failed to exchange code for token: ${response.status}`);
  }

  return await response.json();
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse query parameters from the URL (OAuth redirect from provider)
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    console.log('OAuth callback received:', { code: !!code, state, error, errorDescription });

    // Handle OAuth errors from the provider
    if (error) {
      const errorMsg = errorDescription || error;
      console.error('OAuth provider error:', errorMsg);
      
      // Try to find the frontend origin from any pending connection
      const adminClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      const { data: connections } = await adminClient
        .from('fitness_app_connections')
        .select('metadata')
        .eq('sync_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);
      
      const origin = connections?.[0]?.metadata?.frontend_origin || '';
      const redirectUrl = `${origin}/dashboard?oauth_error=${encodeURIComponent(errorMsg)}`;
      
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': redirectUrl,
        },
      });
    }

    if (!code || !state) {
      throw new Error('Missing required parameters: code or state');
    }

    // Use service role key to access the database without user auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find the connection record by state to get user_id and app_name
    // First, try to find by exact state match
    const { data: connectionByState, error: stateError } = await supabaseClient
      .from('fitness_app_connections')
      .select('*')
      .eq('sync_status', 'pending')
      .order('created_at', { ascending: false });

    console.log('Found pending connections:', connectionByState?.length || 0);

    // Find the connection that matches our state
    const connection = connectionByState?.find(
      (conn) => conn.metadata?.state === state
    );

    const fetchError = !connection ? new Error('No matching connection found') : null;

    if (!connection) {
      console.error('Connection not found with matching state');
      throw new Error('Invalid OAuth state - connection not found');
    }

    console.log('Found matching connection for state:', state.substring(0, 8) + '...');

    const appName = connection.app_name;
    const userId = connection.user_id;
    console.log(`Processing OAuth callback for ${appName}, user: ${userId}`);

    const redirectUri = connection.metadata?.redirect_uri;
    if (!redirectUri) {
      throw new Error('Redirect URI not found');
    }

    // Exchange code for token
    const tokenData = await exchangeCodeForToken(appName, code, redirectUri);

    // Calculate token expiration
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    // Encrypt tokens before storing
    console.log('Encrypting tokens before storage...');
    const encryptedAccessToken = await encryptToken(tokenData.access_token);
    const encryptedRefreshToken = tokenData.refresh_token 
      ? await encryptToken(tokenData.refresh_token) 
      : null;

    // Update connection with encrypted tokens
    const { error: updateError } = await supabaseClient
      .from('fitness_app_connections')
      .update({
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        token_expires_at: expiresAt,
        scope: tokenData.scope,
        sync_status: 'connected',
        metadata: { 
          ...connection.metadata, 
          last_token_refresh: new Date().toISOString(),
          tokens_encrypted: true 
        },
      })
      .eq('id', connection.id);

    if (updateError) {
      console.error('Error updating connection:', updateError);
      throw new Error('Failed to save connection');
    }

    console.log(`OAuth callback successful for ${appName}, user: ${userId}`);

    // Redirect back to frontend with success indicator
    const frontendOrigin = connection.metadata?.frontend_origin || '';
    const redirectUrl = `${frontendOrigin}/dashboard?oauth_success=${appName}`;
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl,
      },
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Try to find the frontend origin from any pending connection
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const { data: connections } = await adminClient
      .from('fitness_app_connections')
      .select('metadata')
      .eq('sync_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);
    
    const origin = connections?.[0]?.metadata?.frontend_origin || 'https://034ca980-c764-4c06-baa4-3030e6e0a201.lovableproject.com';
    const redirectUrl = `${origin}/dashboard?oauth_error=${encodeURIComponent(errorMessage)}`;
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl,
      },
    });
  }
});
