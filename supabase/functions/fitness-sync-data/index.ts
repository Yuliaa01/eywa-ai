import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Activity {
  id: string;
  name: string;
  type: string;
  start_date: string;
  distance?: number;
  moving_time?: number;
  elapsed_time?: number;
  total_elevation_gain?: number;
  calories?: number;
  average_heartrate?: number;
  max_heartrate?: number;
}

const fetchStravaActivities = async (accessToken: string): Promise<Activity[]> => {
  const response = await fetch(
    'https://www.strava.com/api/v3/athlete/activities?per_page=30',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Strava API error: ${response.status}`);
  }

  return await response.json();
};

const fetchFitbitActivities = async (accessToken: string): Promise<any[]> => {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const response = await fetch(
    `https://api.fitbit.com/1/user/-/activities/list.json?afterDate=${thirtyDaysAgo}&sort=desc&limit=30`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Fitbit API error: ${response.status}`);
  }

  const data = await response.json();
  return data.activities || [];
};

const syncActivities = async (
  supabaseClient: any,
  userId: string,
  connectionId: string,
  appName: string,
  accessToken: string
) => {
  let activities: any[] = [];

  // Fetch activities based on app
  if (appName.toLowerCase() === 'strava') {
    activities = await fetchStravaActivities(accessToken);
  } else if (appName.toLowerCase() === 'fitbit') {
    activities = await fetchFitbitActivities(accessToken);
  } else {
    throw new Error(`Syncing not implemented for ${appName}`);
  }

  console.log(`Fetched ${activities.length} activities from ${appName}`);

  // Transform and insert activities
  const transformedActivities = activities.map((activity) => ({
    user_id: userId,
    connection_id: connectionId,
    app_name: appName,
    external_id: activity.id || activity.logId,
    activity_type: activity.type || activity.activityName,
    activity_name: activity.name || activity.activityName,
    start_time: activity.start_date || activity.startTime,
    duration_seconds: activity.moving_time || activity.duration || activity.activeDuration,
    distance_meters: activity.distance || activity.distance?.value,
    calories_burned: activity.calories,
    avg_heart_rate: activity.average_heartrate || activity.averageHeartRate,
    max_heart_rate: activity.max_heartrate || activity.heartRateZones?.[0]?.max,
    elevation_gain_meters: activity.total_elevation_gain,
    raw_data: activity,
  }));

  // Use upsert to avoid duplicates
  const { error: insertError } = await supabaseClient
    .from('synced_fitness_activities')
    .upsert(transformedActivities, {
      onConflict: 'user_id,app_name,external_id',
      ignoreDuplicates: false,
    });

  if (insertError) {
    console.error('Error inserting activities:', insertError);
    throw new Error('Failed to save activities');
  }

  return transformedActivities.length;
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

    const { appName } = await req.json();

    if (!appName) {
      throw new Error('App name is required');
    }

    // Get connection
    const { data: connection, error: fetchError } = await supabaseClient
      .from('fitness_app_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('app_name', appName)
      .eq('sync_status', 'connected')
      .single();

    if (fetchError || !connection) {
      throw new Error('No active connection found for this app');
    }

    if (!connection.access_token) {
      throw new Error('No access token available');
    }

    // Check if token is expired and needs refresh
    if (connection.token_expires_at) {
      const expiresAt = new Date(connection.token_expires_at);
      if (expiresAt < new Date()) {
        throw new Error('Access token expired. Please reconnect the app.');
      }
    }

    // Update sync status
    await supabaseClient
      .from('fitness_app_connections')
      .update({ sync_status: 'syncing' })
      .eq('id', connection.id);

    // Sync activities
    const activityCount = await syncActivities(
      supabaseClient,
      user.id,
      connection.id,
      appName,
      connection.access_token
    );

    // Update connection
    await supabaseClient
      .from('fitness_app_connections')
      .update({
        sync_status: 'connected',
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', connection.id);

    console.log(`Synced ${activityCount} activities for ${appName}, user: ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        activityCount,
        appName,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Sync error:', error);
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
