-- Create recipes table for default recipes
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('breakfast', 'lunch', 'dinner', 'snack', 'dessert')),
  prep_time TEXT NOT NULL,
  servings INTEGER NOT NULL,
  calories INTEGER NOT NULL,
  protein NUMERIC NOT NULL,
  carbs NUMERIC NOT NULL,
  fat NUMERIC NOT NULL,
  ingredients JSONB NOT NULL,
  instructions JSONB NOT NULL,
  tags TEXT[] NOT NULL,
  image_url TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read recipes
CREATE POLICY "Anyone can view recipes"
  ON public.recipes
  FOR SELECT
  TO authenticated
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert 3 default recipes
INSERT INTO public.recipes (name, description, category, prep_time, servings, calories, protein, carbs, fat, ingredients, instructions, tags, is_default, image_url) VALUES

-- Recipe 1: Avocado Toast with Poached Egg
('Avocado Toast with Poached Egg', 'A nutritious breakfast combining healthy fats, protein, and whole grains', 'breakfast', '10 min', 1, 350, 15, 28, 18, 
'["2 slices whole grain bread", "1 ripe avocado", "2 eggs", "1 tsp lemon juice", "Salt and pepper to taste", "Cherry tomatoes (optional)", "Red pepper flakes (optional)"]'::jsonb,
'["Toast the bread until golden brown", "Mash avocado with lemon juice, salt, and pepper", "Poach eggs in simmering water for 3-4 minutes", "Spread avocado on toast", "Top with poached eggs", "Garnish with cherry tomatoes and red pepper flakes if desired"]'::jsonb,
ARRAY['high-protein', 'healthy-fats', 'vegetarian', 'quick'],
true,
'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=800&q=80'),

-- Recipe 2: Mediterranean Quinoa Bowl
('Mediterranean Quinoa Bowl', 'A colorful, protein-rich bowl packed with Mediterranean flavors', 'lunch', '25 min', 2, 420, 18, 52, 15,
'["1 cup quinoa", "1 cucumber (diced)", "1 cup cherry tomatoes (halved)", "1/2 cup feta cheese (crumbled)", "1/4 cup kalamata olives", "1/4 red onion (thinly sliced)", "2 tbsp olive oil", "1 tbsp lemon juice", "Fresh parsley", "Salt and pepper"]'::jsonb,
'["Cook quinoa according to package directions and let cool", "Dice cucumber and halve cherry tomatoes", "Combine quinoa, cucumber, tomatoes, feta, olives, and onion in a bowl", "Whisk together olive oil, lemon juice, salt, and pepper", "Pour dressing over quinoa mixture and toss", "Garnish with fresh parsley", "Serve chilled or at room temperature"]'::jsonb,
ARRAY['high-protein', 'mediterranean', 'vegetarian', 'meal-prep'],
true,
'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80'),

-- Recipe 3: Grilled Salmon with Roasted Vegetables
('Grilled Salmon with Roasted Vegetables', 'Omega-3 rich salmon paired with colorful roasted vegetables', 'dinner', '30 min', 2, 485, 38, 24, 28,
'["2 salmon fillets (6 oz each)", "2 cups broccoli florets", "1 red bell pepper (sliced)", "1 zucchini (sliced)", "2 tbsp olive oil", "2 cloves garlic (minced)", "1 lemon", "Fresh dill", "Salt and pepper"]'::jsonb,
'["Preheat oven to 425°F (220°C)", "Toss vegetables with 1 tbsp olive oil, salt, and pepper", "Spread vegetables on a baking sheet and roast for 20 minutes", "Season salmon with salt, pepper, and minced garlic", "Heat remaining olive oil in a pan over medium-high heat", "Cook salmon skin-side down for 4-5 minutes, then flip and cook 3-4 minutes more", "Serve salmon over roasted vegetables", "Garnish with lemon wedges and fresh dill"]'::jsonb,
ARRAY['high-protein', 'omega-3', 'low-carb', 'gluten-free', 'paleo'],
true,
'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80');