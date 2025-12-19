-- Create video_categories table
CREATE TABLE public.video_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT NOT NULL DEFAULT 'play',
  color TEXT NOT NULL DEFAULT '#10b981',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create video content type enum
CREATE TYPE public.video_content_type AS ENUM ('reel', 'education', 'tutorial');

-- Create video_content table
CREATE TABLE public.video_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  video_url TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  content_type video_content_type NOT NULL DEFAULT 'reel',
  category_id UUID REFERENCES public.video_categories(id) ON DELETE SET NULL,
  creator_name TEXT NOT NULL,
  creator_avatar_url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  health_domains TEXT[] NOT NULL DEFAULT '{}',
  difficulty_level TEXT NOT NULL DEFAULT 'beginner',
  views_count INTEGER NOT NULL DEFAULT 0,
  likes_count INTEGER NOT NULL DEFAULT 0,
  saves_count INTEGER NOT NULL DEFAULT 0,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_video_interactions table
CREATE TABLE public.user_video_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id UUID NOT NULL REFERENCES public.video_content(id) ON DELETE CASCADE,
  watched_seconds INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  liked BOOLEAN NOT NULL DEFAULT false,
  saved BOOLEAN NOT NULL DEFAULT false,
  shared BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- Create video_playlists table
CREATE TABLE public.video_playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  video_ids UUID[] NOT NULL DEFAULT '{}',
  health_goal TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.video_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_video_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_playlists ENABLE ROW LEVEL SECURITY;

-- video_categories policies (public read)
CREATE POLICY "Anyone can view active categories"
  ON public.video_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Only admins can manage categories"
  ON public.video_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- video_content policies (public read for active)
CREATE POLICY "Anyone can view active videos"
  ON public.video_content FOR SELECT
  USING (is_active = true);

CREATE POLICY "Only admins can manage video content"
  ON public.video_content FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- user_video_interactions policies (user-specific)
CREATE POLICY "Users can manage own video interactions"
  ON public.user_video_interactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- video_playlists policies (public read for active)
CREATE POLICY "Anyone can view active playlists"
  ON public.video_playlists FOR SELECT
  USING (is_active = true);

CREATE POLICY "Only admins can manage playlists"
  ON public.video_playlists FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_video_content_category ON public.video_content(category_id);
CREATE INDEX idx_video_content_content_type ON public.video_content(content_type);
CREATE INDEX idx_video_content_health_domains ON public.video_content USING GIN(health_domains);
CREATE INDEX idx_video_content_tags ON public.video_content USING GIN(tags);
CREATE INDEX idx_user_video_interactions_user ON public.user_video_interactions(user_id);
CREATE INDEX idx_user_video_interactions_video ON public.user_video_interactions(video_id);

-- Add update triggers
CREATE TRIGGER update_video_categories_updated_at
  BEFORE UPDATE ON public.video_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_video_content_updated_at
  BEFORE UPDATE ON public.video_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_video_interactions_updated_at
  BEFORE UPDATE ON public.user_video_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_video_playlists_updated_at
  BEFORE UPDATE ON public.video_playlists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for video content
INSERT INTO storage.buckets (id, name, public) VALUES ('video-content', 'video-content', true);

-- Storage policies for video-content bucket
CREATE POLICY "Anyone can view video content"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'video-content');

CREATE POLICY "Admins can upload video content"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'video-content' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update video content"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'video-content' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete video content"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'video-content' AND has_role(auth.uid(), 'admin'::app_role));

-- Seed sample categories
INSERT INTO public.video_categories (name, slug, description, icon_name, color, sort_order) VALUES
  ('Nutrition', 'nutrition', 'Tips and education about healthy eating', 'utensils', '#22c55e', 1),
  ('Fitness', 'fitness', 'Workouts and exercise education', 'dumbbell', '#f59e0b', 2),
  ('Sleep', 'sleep', 'Improve your sleep quality', 'moon', '#6366f1', 3),
  ('Mental Health', 'mental-health', 'Mindfulness and stress management', 'brain', '#ec4899', 4),
  ('Longevity', 'longevity', 'Science-backed longevity tips', 'heart-pulse', '#14b8a6', 5),
  ('Lab Results', 'lab-results', 'Understanding your biomarkers', 'flask-conical', '#8b5cf6', 6);

-- Seed sample video content
INSERT INTO public.video_content (title, description, video_url, thumbnail_url, duration_seconds, content_type, creator_name, tags, health_domains, is_featured) VALUES
  ('5-Minute Morning Stretch', 'Wake up your body with this quick stretch routine', 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400', 45, 'reel', 'Dr. Sarah Chen', ARRAY['stretching', 'morning', 'routine'], ARRAY['fitness', 'recovery'], true),
  ('Understanding Your Sleep Cycle', 'Learn how sleep stages affect your health', 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400', 180, 'education', 'Dr. Mike Johnson', ARRAY['sleep', 'cycles', 'health'], ARRAY['sleep'], true),
  ('Protein Myths Debunked', 'Common protein misconceptions explained', 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400', 120, 'education', 'Coach Emma Wilson', ARRAY['protein', 'nutrition', 'myths'], ARRAY['nutrition'], false),
  ('Quick HIIT Workout', 'Burn calories in just 10 minutes', 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400', 60, 'reel', 'Coach Alex Turner', ARRAY['hiit', 'cardio', 'quick'], ARRAY['fitness', 'cardio'], true),
  ('Meditation for Beginners', 'Start your mindfulness journey', 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400', 300, 'tutorial', 'Dr. Lisa Park', ARRAY['meditation', 'mindfulness', 'beginner'], ARRAY['mental_health'], false),
  ('Reading Your Lab Results', 'How to interpret common biomarkers', 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400', 420, 'education', 'Dr. James Wilson', ARRAY['labs', 'biomarkers', 'health'], ARRAY['longevity'], true),
  ('Anti-Inflammatory Foods', 'Top foods to reduce inflammation', 'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400', 90, 'reel', 'Chef Maria Santos', ARRAY['inflammation', 'food', 'diet'], ARRAY['nutrition', 'longevity'], false),
  ('Breathing Techniques for Stress', 'Calm your nervous system instantly', 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 'https://images.unsplash.com/photo-1474418397713-7ede21d49118?w=400', 75, 'reel', 'Dr. Lisa Park', ARRAY['breathing', 'stress', 'anxiety'], ARRAY['mental_health'], true);