import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { code, state, appName } = await req.json();

    if (!code || !state || !appName) {
      throw new Error('Missing required parameters');
    }

    // Verify state and get connection record
    const { data: connection, error: fetchError } = await supabaseClient
      .from('fitness_app_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('app_name', appName)
      .eq('sync_status', 'pending')
      .single();

    if (fetchError || !connection) {
      console.error('Connection not found or error:', fetchError);
      throw new Error('Invalid OAuth state');
    }

    const storedState = connection.metadata?.state;
    if (storedState !== state) {
      throw new Error('State mismatch - potential CSRF attack');
    }

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

    // Update connection with tokens
    const { error: updateError } = await supabaseClient
      .from('fitness_app_connections')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: expiresAt,
        scope: tokenData.scope,
        sync_status: 'connected',
        metadata: { ...connection.metadata, last_token_refresh: new Date().toISOString() },
      })
      .eq('id', connection.id);

    if (updateError) {
      console.error('Error updating connection:', updateError);
      throw new Error('Failed to save connection');
    }

    console.log(`OAuth callback successful for ${appName}, user: ${user.id}`);

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
    
    // Try to get the frontend origin from the request or use a fallback
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || '';
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
