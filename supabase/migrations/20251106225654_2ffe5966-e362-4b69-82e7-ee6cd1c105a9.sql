-- Create meal plans table for weekly meal planning
CREATE TABLE public.meal_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  recipe_id UUID REFERENCES public.saved_recipes(id) ON DELETE CASCADE,
  recipe_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own meal plans"
ON public.meal_plans
FOR ALL
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_meal_plans_user_date ON public.meal_plans(user_id, date);

-- Create trigger for updated_at
CREATE TRIGGER update_meal_plans_updated_at
BEFORE UPDATE ON public.meal_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();