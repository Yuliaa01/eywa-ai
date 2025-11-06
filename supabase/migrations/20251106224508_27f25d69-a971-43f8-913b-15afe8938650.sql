-- Create saved_recipes table
CREATE TABLE public.saved_recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recipe_name TEXT NOT NULL,
  recipe_data JSONB NOT NULL,
  image_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_recipes ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own saved recipes
CREATE POLICY "Users can manage own saved recipes"
ON public.saved_recipes
FOR ALL
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_saved_recipes_user_id ON public.saved_recipes(user_id);