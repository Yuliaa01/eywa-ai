-- Create vitamin category enum
CREATE TYPE public.vitamin_category AS ENUM (
  'vitamins',
  'minerals',
  'amino_acids',
  'herbs',
  'probiotics',
  'omega_fatty_acids',
  'specialty'
);

-- Create vitamin form enum
CREATE TYPE public.vitamin_form AS ENUM (
  'capsule',
  'tablet',
  'softgel',
  'powder',
  'liquid',
  'gummy'
);

-- Create vitamin order status enum
CREATE TYPE public.vitamin_order_status AS ENUM (
  'pending',
  'ordered',
  'shipped',
  'delivered',
  'canceled'
);

-- Create vitamins catalog table
CREATE TABLE public.vitamins_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category vitamin_category NOT NULL,
  form vitamin_form NOT NULL,
  base_price NUMERIC NOT NULL,
  dosage_options JSONB NOT NULL DEFAULT '[]'::jsonb,
  benefits TEXT[] NOT NULL DEFAULT '{}',
  suggested_for TEXT[] NOT NULL DEFAULT '{}',
  biomarker_targets TEXT[] NOT NULL DEFAULT '{}',
  brand TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vitamin bundles table
CREATE TABLE public.vitamin_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  base_price NUMERIC NOT NULL,
  recommended_for TEXT[] NOT NULL DEFAULT '{}',
  priority_match_keywords TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vitamin bundle items junction table
CREATE TABLE public.vitamin_bundle_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id UUID NOT NULL REFERENCES public.vitamin_bundles(id) ON DELETE CASCADE,
  vitamin_id UUID NOT NULL REFERENCES public.vitamins_catalog(id) ON DELETE CASCADE,
  dosage_selected TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user vitamin orders table
CREATE TABLE public.user_vitamin_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vitamin_id UUID REFERENCES public.vitamins_catalog(id),
  bundle_id UUID REFERENCES public.vitamin_bundles(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  dosage_selected TEXT,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  status vitamin_order_status NOT NULL DEFAULT 'pending',
  shipping_address JSONB,
  tracking_info JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.vitamins_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vitamin_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vitamin_bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vitamin_orders ENABLE ROW LEVEL SECURITY;

-- Vitamins catalog policies (public read)
CREATE POLICY "Anyone can view active vitamins"
ON public.vitamins_catalog
FOR SELECT
USING (is_active = true);

CREATE POLICY "Only admins can manage vitamins catalog"
ON public.vitamins_catalog
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Vitamin bundles policies (public read)
CREATE POLICY "Anyone can view active vitamin bundles"
ON public.vitamin_bundles
FOR SELECT
USING (is_active = true);

CREATE POLICY "Only admins can manage vitamin bundles"
ON public.vitamin_bundles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Vitamin bundle items policies (public read)
CREATE POLICY "Anyone can view vitamin bundle items"
ON public.vitamin_bundle_items
FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage vitamin bundle items"
ON public.vitamin_bundle_items
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- User vitamin orders policies
CREATE POLICY "Users can manage own vitamin orders"
ON public.user_vitamin_orders
FOR ALL
USING (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER update_vitamins_catalog_updated_at
BEFORE UPDATE ON public.vitamins_catalog
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vitamin_bundles_updated_at
BEFORE UPDATE ON public.vitamin_bundles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_vitamin_orders_updated_at
BEFORE UPDATE ON public.user_vitamin_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample vitamins (with explicit text[] cast for empty arrays)
INSERT INTO public.vitamins_catalog (name, description, category, form, base_price, dosage_options, benefits, suggested_for, biomarker_targets, brand) VALUES
('Vitamin D3', 'High-potency vitamin D3 for bone health, immune support, and mood regulation', 'vitamins', 'softgel', 24.99, '[{"dosage": "1000 IU", "price": 14.99}, {"dosage": "2000 IU", "price": 19.99}, {"dosage": "5000 IU", "price": 24.99}]'::jsonb, ARRAY['Bone health', 'Immune support', 'Mood regulation', 'Calcium absorption'], ARRAY['Vitamin D deficiency', 'Low sun exposure', 'Bone health concerns'], ARRAY['25-OH-D', 'vitamin_d'], 'NutriPure'),
('Vitamin B12', 'Methylcobalamin B12 for energy, nerve function, and red blood cell formation', 'vitamins', 'tablet', 19.99, '[{"dosage": "1000 mcg", "price": 14.99}, {"dosage": "2500 mcg", "price": 19.99}, {"dosage": "5000 mcg", "price": 24.99}]'::jsonb, ARRAY['Energy production', 'Nerve function', 'Red blood cell formation', 'Brain health'], ARRAY['B12 deficiency', 'Vegan/vegetarian diet', 'Fatigue', 'Anemia'], ARRAY['B12', 'vitamin_b12'], 'NutriPure'),
('Omega-3 Fish Oil', 'Triple-strength EPA/DHA for heart, brain, and joint health', 'omega_fatty_acids', 'softgel', 34.99, '[{"dosage": "1000 mg", "price": 24.99}, {"dosage": "2000 mg", "price": 34.99}, {"dosage": "3000 mg", "price": 44.99}]'::jsonb, ARRAY['Heart health', 'Brain function', 'Joint support', 'Anti-inflammatory'], ARRAY['High triglycerides', 'Heart health', 'Brain fog', 'Joint pain'], ARRAY['triglycerides', 'omega3_index'], 'NutriPure'),
('Magnesium Glycinate', 'Highly absorbable magnesium for muscle, nerve, and sleep support', 'minerals', 'capsule', 29.99, '[{"dosage": "200 mg", "price": 19.99}, {"dosage": "400 mg", "price": 29.99}, {"dosage": "600 mg", "price": 39.99}]'::jsonb, ARRAY['Muscle relaxation', 'Sleep quality', 'Stress reduction', 'Energy production'], ARRAY['Magnesium deficiency', 'Sleep issues', 'Muscle cramps', 'Stress'], ARRAY['magnesium', 'Mg'], 'NutriPure'),
('Zinc Picolinate', 'Highly bioavailable zinc for immune function and wound healing', 'minerals', 'capsule', 14.99, '[{"dosage": "15 mg", "price": 12.99}, {"dosage": "30 mg", "price": 14.99}, {"dosage": "50 mg", "price": 19.99}]'::jsonb, ARRAY['Immune function', 'Wound healing', 'Skin health', 'Testosterone support'], ARRAY['Zinc deficiency', 'Frequent illness', 'Slow healing', 'Low testosterone'], ARRAY['zinc', 'Zn'], 'NutriPure'),
('Iron Bisglycinate', 'Gentle, non-constipating iron for energy and blood health', 'minerals', 'capsule', 18.99, '[{"dosage": "18 mg", "price": 14.99}, {"dosage": "25 mg", "price": 18.99}, {"dosage": "36 mg", "price": 22.99}]'::jsonb, ARRAY['Energy production', 'Oxygen transport', 'Cognitive function', 'Immune support'], ARRAY['Iron deficiency', 'Anemia', 'Heavy periods', 'Fatigue'], ARRAY['iron', 'ferritin', 'Fe'], 'NutriPure'),
('Probiotic 50 Billion', 'Multi-strain probiotic for gut health and immune support', 'probiotics', 'capsule', 39.99, '[{"dosage": "25 Billion CFU", "price": 29.99}, {"dosage": "50 Billion CFU", "price": 39.99}, {"dosage": "100 Billion CFU", "price": 54.99}]'::jsonb, ARRAY['Digestive health', 'Immune support', 'Mood balance', 'Nutrient absorption'], ARRAY['Digestive issues', 'Antibiotic use', 'Bloating', 'IBS'], ARRAY[]::text[], 'NutriPure'),
('Ashwagandha KSM-66', 'Clinically studied adaptogen for stress, energy, and hormone balance', 'herbs', 'capsule', 29.99, '[{"dosage": "300 mg", "price": 24.99}, {"dosage": "600 mg", "price": 29.99}]'::jsonb, ARRAY['Stress reduction', 'Energy balance', 'Hormone support', 'Sleep quality'], ARRAY['Chronic stress', 'Fatigue', 'Hormone imbalance', 'Anxiety'], ARRAY['cortisol'], 'NutriPure'),
('L-Theanine', 'Amino acid for calm focus and relaxation without drowsiness', 'amino_acids', 'capsule', 22.99, '[{"dosage": "100 mg", "price": 17.99}, {"dosage": "200 mg", "price": 22.99}]'::jsonb, ARRAY['Calm focus', 'Stress relief', 'Sleep support', 'Cognitive function'], ARRAY['Anxiety', 'Sleep issues', 'Focus problems', 'Stress'], ARRAY[]::text[], 'NutriPure'),
('CoQ10 Ubiquinol', 'Active form of CoQ10 for heart health and cellular energy', 'specialty', 'softgel', 49.99, '[{"dosage": "100 mg", "price": 34.99}, {"dosage": "200 mg", "price": 49.99}, {"dosage": "400 mg", "price": 69.99}]'::jsonb, ARRAY['Heart health', 'Cellular energy', 'Antioxidant protection', 'Brain health'], ARRAY['Heart health', 'Statin use', 'Low energy', 'Aging'], ARRAY['CoQ10'], 'NutriPure');

-- Insert sample vitamin bundles
INSERT INTO public.vitamin_bundles (name, description, category, base_price, recommended_for, priority_match_keywords) VALUES
('Energy Essentials', 'Comprehensive stack for sustained energy and vitality: B12, Iron, CoQ10, and Magnesium', 'energy', 89.99, ARRAY['Low energy', 'Fatigue', 'Athletes', 'Busy professionals'], ARRAY['energy', 'fatigue', 'vitality', 'stamina']),
('Immune Defense', 'Complete immune support: Vitamin D3, Zinc, Vitamin C, and Probiotics', 'immune', 79.99, ARRAY['Frequent illness', 'Seasonal support', 'Immune weakness'], ARRAY['immune', 'cold', 'flu', 'defense', 'immunity']),
('Stress & Sleep', 'Calming stack for stress relief and better sleep: Magnesium, Ashwagandha, L-Theanine', 'stress', 69.99, ARRAY['High stress', 'Sleep issues', 'Anxiety', 'Burnout'], ARRAY['stress', 'sleep', 'anxiety', 'calm', 'relaxation']),
('Heart Health', 'Cardiovascular support: Omega-3, CoQ10, Magnesium, and Vitamin D3', 'cardiovascular', 99.99, ARRAY['Heart concerns', 'High cholesterol', 'Blood pressure'], ARRAY['heart', 'cardiovascular', 'cholesterol', 'blood pressure']),
('Foundation Daily', 'Essential daily nutrients: Vitamin D3, B12, Magnesium, Omega-3, and Zinc', 'general', 109.99, ARRAY['General wellness', 'Nutrient gaps', 'Preventive health'], ARRAY['daily', 'essential', 'foundation', 'wellness', 'general']);

-- Link vitamins to bundles
INSERT INTO public.vitamin_bundle_items (bundle_id, vitamin_id, dosage_selected)
SELECT 
  b.id,
  v.id,
  (v.dosage_options->1->>'dosage')
FROM public.vitamin_bundles b, public.vitamins_catalog v
WHERE 
  (b.name = 'Energy Essentials' AND v.name IN ('Vitamin B12', 'Iron Bisglycinate', 'CoQ10 Ubiquinol', 'Magnesium Glycinate'))
  OR (b.name = 'Immune Defense' AND v.name IN ('Vitamin D3', 'Zinc Picolinate', 'Probiotic 50 Billion'))
  OR (b.name = 'Stress & Sleep' AND v.name IN ('Magnesium Glycinate', 'Ashwagandha KSM-66', 'L-Theanine'))
  OR (b.name = 'Heart Health' AND v.name IN ('Omega-3 Fish Oil', 'CoQ10 Ubiquinol', 'Magnesium Glycinate', 'Vitamin D3'))
  OR (b.name = 'Foundation Daily' AND v.name IN ('Vitamin D3', 'Vitamin B12', 'Magnesium Glycinate', 'Omega-3 Fish Oil', 'Zinc Picolinate'));