import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OAuthConfig {
  authUrl: string;
  clientId: string;
  scope: string;
  redirectUri: string;
}

// OAuth configurations for different apps
const getOAuthConfig = (appName: string, redirectUri: string): OAuthConfig | null => {
  const configs: Record<string, Omit<OAuthConfig, 'redirectUri'>> = {
    strava: {
      authUrl: 'https://www.strava.com/oauth/authorize',
      clientId: Deno.env.get('STRAVA_CLIENT_ID') || '',
      scope: 'read,activity:read_all',
    },
    fitbit: {
      authUrl: 'https://www.fitbit.com/oauth2/authorize',
      clientId: Deno.env.get('FITBIT_CLIENT_ID') || '',
      scope: 'activity heartrate location nutrition profile settings sleep social weight',
    },
    garmin: {
      authUrl: 'https://connect.garmin.com/oauthConfirm',
      clientId: Deno.env.get('GARMIN_CLIENT_ID') || '',
      scope: 'activities',
    },
  };

  const config = configs[appName.toLowerCase()];
  if (!config) return null;

  return { ...config, redirectUri };
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

    // Verify user authentication
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { appName } = await req.json();

    if (!appName) {
      throw new Error('App name is required');
    }

    // Set redirect URI to the callback edge function
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/fitness-oauth-callback`;

    const config = getOAuthConfig(appName, redirectUri);

    if (!config) {
      throw new Error(`OAuth configuration not found for ${appName}`);
    }

    if (!config.clientId) {
      throw new Error(`${appName} client ID not configured. Please add the API credentials.`);
    }

    // Generate state parameter for security
    const state = crypto.randomUUID();

    // Clean up any old pending connections for this user and app
    await supabaseClient
      .from('fitness_app_connections')
      .delete()
      .eq('user_id', user.id)
      .eq('app_name', appName)
      .eq('sync_status', 'pending');

    // Store state in database for validation during callback
    const origin = req.headers.get('origin') || '';
    const { error: insertError } = await supabaseClient
      .from('fitness_app_connections')
      .insert({
        user_id: user.id,
        app_name: appName,
        sync_status: 'pending',
        metadata: { state, redirect_uri: redirectUri, frontend_origin: origin },
      });

    if (insertError) {
      console.error('Error storing OAuth state:', insertError);
      throw new Error('Failed to initialize OAuth flow');
    }

    // Build authorization URL
    const authUrl = new URL(config.authUrl);
    authUrl.searchParams.set('client_id', config.clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', config.scope);
    authUrl.searchParams.set('state', state);

    console.log(`Initiating OAuth for ${appName}, user: ${user.id}`);

    return new Response(
      JSON.stringify({
        authUrl: authUrl.toString(),
        state,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('OAuth init error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
