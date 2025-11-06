-- Create grocery list items table
CREATE TABLE public.grocery_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ingredient TEXT NOT NULL,
  quantity TEXT,
  category TEXT,
  checked BOOLEAN NOT NULL DEFAULT false,
  source_meal_plan_ids UUID[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.grocery_list_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own grocery list items"
ON public.grocery_list_items
FOR ALL
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_grocery_list_user ON public.grocery_list_items(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_grocery_list_items_updated_at
BEFORE UPDATE ON public.grocery_list_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();