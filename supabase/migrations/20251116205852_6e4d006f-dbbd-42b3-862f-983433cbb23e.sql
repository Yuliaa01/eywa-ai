-- Create table for storing fitness app connections
CREATE TABLE IF NOT EXISTS public.fitness_app_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  app_name TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for storing synced fitness activities
CREATE TABLE IF NOT EXISTS public.synced_fitness_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connection_id UUID NOT NULL REFERENCES public.fitness_app_connections(id) ON DELETE CASCADE,
  app_name TEXT NOT NULL,
  external_id TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  activity_name TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_seconds INTEGER,
  distance_meters NUMERIC,
  calories_burned INTEGER,
  avg_heart_rate INTEGER,
  max_heart_rate INTEGER,
  elevation_gain_meters NUMERIC,
  raw_data JSONB,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, app_name, external_id)
);

-- Enable RLS
ALTER TABLE public.fitness_app_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synced_fitness_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fitness_app_connections
CREATE POLICY "Users can view their own fitness app connections"
  ON public.fitness_app_connections
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own fitness app connections"
  ON public.fitness_app_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fitness app connections"
  ON public.fitness_app_connections
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fitness app connections"
  ON public.fitness_app_connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for synced_fitness_activities
CREATE POLICY "Users can view their own synced activities"
  ON public.synced_fitness_activities
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own synced activities"
  ON public.synced_fitness_activities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_fitness_app_connections_user_id ON public.fitness_app_connections(user_id);
CREATE INDEX idx_fitness_app_connections_app_name ON public.fitness_app_connections(app_name);
CREATE INDEX idx_synced_fitness_activities_user_id ON public.synced_fitness_activities(user_id);
CREATE INDEX idx_synced_fitness_activities_connection_id ON public.synced_fitness_activities(connection_id);
CREATE INDEX idx_synced_fitness_activities_start_time ON public.synced_fitness_activities(start_time);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fitness_app_connections_updated_at
  BEFORE UPDATE ON public.fitness_app_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_synced_fitness_activities_updated_at
  BEFORE UPDATE ON public.synced_fitness_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();