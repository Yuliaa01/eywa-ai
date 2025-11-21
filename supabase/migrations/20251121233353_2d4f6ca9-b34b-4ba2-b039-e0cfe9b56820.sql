-- Create enum for test set categories
CREATE TYPE test_set_category AS ENUM ('metabolic', 'hormonal', 'cardiovascular', 'performance', 'preventive');

-- Create test_sets table
CREATE TABLE public.test_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category test_set_category NOT NULL,
  base_price NUMERIC NOT NULL,
  recommended_for TEXT[] NOT NULL DEFAULT '{}',
  priority_match_keywords TEXT[] NOT NULL DEFAULT '{}',
  biomarker_domain_focus TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create test_set_items junction table
CREATE TABLE public.test_set_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_set_id UUID NOT NULL REFERENCES public.test_sets(id) ON DELETE CASCADE,
  test_code TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add test set tracking to user_test_orders
ALTER TABLE public.user_test_orders 
ADD COLUMN test_set_id UUID REFERENCES public.test_sets(id),
ADD COLUMN bundle_price NUMERIC;

-- Create indexes
CREATE INDEX idx_test_set_items_set_id ON public.test_set_items(test_set_id);
CREATE INDEX idx_test_set_items_test_code ON public.test_set_items(test_code);
CREATE INDEX idx_user_test_orders_set_id ON public.user_test_orders(test_set_id);

-- Enable RLS
ALTER TABLE public.test_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_set_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for test_sets (public read)
CREATE POLICY "Anyone can view active test sets"
ON public.test_sets FOR SELECT
USING (is_active = true);

CREATE POLICY "Only admins can manage test sets"
ON public.test_sets FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for test_set_items (public read)
CREATE POLICY "Anyone can view test set items"
ON public.test_set_items FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage test set items"
ON public.test_set_items FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_test_sets_updated_at
BEFORE UPDATE ON public.test_sets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed Test Set 1: Metabolic Performance Panel (18 comprehensive tests)
INSERT INTO public.test_sets (name, description, category, base_price, recommended_for, priority_match_keywords, biomarker_domain_focus, display_order)
VALUES (
  'Metabolic Performance Panel',
  'Comprehensive metabolic health assessment covering blood sugar regulation, energy metabolism, thyroid function, and key nutrient status. Perfect for optimizing energy levels and metabolic efficiency.',
  'metabolic',
  399,
  ARRAY['Weight management', 'Energy optimization', 'Metabolic health', 'Blood sugar control', 'Thyroid health'],
  ARRAY['energy', 'weight', 'metabolism', 'fatigue', 'blood sugar', 'diabetes'],
  ARRAY['metabolic', 'endocrine'],
  1
);

-- Get the ID of the inserted test set
WITH metabolic_set AS (
  SELECT id FROM public.test_sets WHERE name = 'Metabolic Performance Panel'
)
INSERT INTO public.test_set_items (test_set_id, test_code, is_required)
SELECT 
  (SELECT id FROM metabolic_set),
  code,
  true
FROM (VALUES
  ('HBA1C'),      -- Glycated hemoglobin
  ('INSULIN'),    -- Fasting insulin
  ('GLUCOSE'),    -- Fasting glucose
  ('TG'),         -- Triglycerides
  ('HDL'),        -- HDL cholesterol
  ('LDL'),        -- LDL cholesterol
  ('CHOL'),       -- Total cholesterol
  ('TSH'),        -- Thyroid stimulating hormone
  ('FT4'),        -- Free T4
  ('FT3'),        -- Free T3
  ('VIT_D'),      -- Vitamin D
  ('MG'),         -- Magnesium
  ('FERRITIN'),   -- Ferritin
  ('B12'),        -- Vitamin B12
  ('FOLATE'),     -- Folate
  ('HOMOCYSTEINE'), -- Homocysteine
  ('URIC_ACID'),  -- Uric acid
  ('ALT')         -- Liver function
) AS tests(code);

-- Seed Test Set 2: Longevity Essentials (25 comprehensive tests)
INSERT INTO public.test_sets (name, description, category, base_price, recommended_for, priority_match_keywords, biomarker_domain_focus, display_order)
VALUES (
  'Longevity Essentials',
  'Ultimate comprehensive panel for aging optimization and longevity. Covers cardiovascular health, inflammation, oxidative stress, hormones, metabolism, and nutritional status. The most complete assessment for healthspan extension.',
  'preventive',
  599,
  ARRAY['Longevity optimization', 'Preventive health', 'Anti-aging', 'Comprehensive wellness', 'Healthspan extension'],
  ARRAY['longevity', 'aging', 'preventive', 'wellness', 'optimization', 'healthspan'],
  ARRAY['cardiovascular', 'metabolic', 'endocrine', 'inflammatory'],
  2
);

WITH longevity_set AS (
  SELECT id FROM public.test_sets WHERE name = 'Longevity Essentials'
)
INSERT INTO public.test_set_items (test_set_id, test_code, is_required)
SELECT 
  (SELECT id FROM longevity_set),
  code,
  true
FROM (VALUES
  ('HSCRP'),      -- High-sensitivity CRP
  ('APOB'),       -- ApoB
  ('LDLP'),       -- LDL particle count
  ('LPA'),        -- Lipoprotein(a)
  ('HOMOCYSTEINE'), -- Homocysteine
  ('OMEGA3'),     -- Omega-3 index
  ('VIT_D'),      -- Vitamin D
  ('B12'),        -- Vitamin B12
  ('FOLATE'),     -- Folate
  ('TSH'),        -- Thyroid stimulating hormone
  ('FT4'),        -- Free T4
  ('FT3'),        -- Free T3
  ('DHEAS'),      -- DHEA-sulfate
  ('HBA1C'),      -- Glycated hemoglobin
  ('INSULIN'),    -- Fasting insulin
  ('GLUCOSE'),    -- Fasting glucose
  ('TESTOSTERONE'), -- Total testosterone
  ('FERRITIN'),   -- Ferritin
  ('MG'),         -- Magnesium
  ('URIC_ACID'),  -- Uric acid
  ('ALT'),        -- Liver function
  ('CREATININE'), -- Kidney function
  ('ALBUMIN'),    -- Albumin
  ('IGF1'),       -- IGF-1
  ('CORTISOL')    -- Cortisol
) AS tests(code);

-- Seed Test Set 3: Cardiovascular Complete (17 comprehensive tests)
INSERT INTO public.test_sets (name, description, category, base_price, recommended_for, priority_match_keywords, biomarker_domain_focus, display_order)
VALUES (
  'Cardiovascular Complete',
  'Advanced cardiovascular risk assessment including lipid particles, inflammation markers, and vascular health indicators. Essential for comprehensive heart health evaluation and prevention.',
  'cardiovascular',
  449,
  ARRAY['Heart health', 'Cardiovascular disease prevention', 'Family history of heart disease', 'High cholesterol', 'Vascular health'],
  ARRAY['heart', 'cardiovascular', 'cholesterol', 'blood pressure', 'cardiac'],
  ARRAY['cardiovascular', 'inflammatory'],
  3
);

WITH cardio_set AS (
  SELECT id FROM public.test_sets WHERE name = 'Cardiovascular Complete'
)
INSERT INTO public.test_set_items (test_set_id, test_code, is_required)
SELECT 
  (SELECT id FROM cardio_set),
  code,
  true
FROM (VALUES
  ('APOB'),       -- ApoB
  ('LDLP'),       -- LDL particle count
  ('LPA'),        -- Lipoprotein(a)
  ('HSCRP'),      -- High-sensitivity CRP
  ('HOMOCYSTEINE'), -- Homocysteine
  ('NTPROBNP'),   -- NT-proBNP
  ('OMEGA3'),     -- Omega-3 index
  ('HDL'),        -- HDL cholesterol
  ('LDL'),        -- LDL cholesterol
  ('TG'),         -- Triglycerides
  ('CHOL'),       -- Total cholesterol
  ('APOA1'),      -- ApoA1
  ('GLUCOSE'),    -- Fasting glucose
  ('HBA1C'),      -- Glycated hemoglobin
  ('INSULIN'),    -- Fasting insulin
  ('URIC_ACID'),  -- Uric acid
  ('CREATININE')  -- Kidney function
) AS tests(code);

-- Seed Test Set 4: Performance & Recovery Panel (18 comprehensive tests)
INSERT INTO public.test_sets (name, description, category, base_price, recommended_for, priority_match_keywords, biomarker_domain_focus, display_order)
VALUES (
  'Performance & Recovery Panel',
  'Complete athletic performance and recovery optimization panel. Covers anabolic hormones, stress markers, energy systems, hydration, and key nutrients critical for training adaptation and recovery.',
  'performance',
  375,
  ARRAY['Athletic performance', 'Fitness optimization', 'Recovery enhancement', 'Training adaptation', 'Sports performance'],
  ARRAY['performance', 'fitness', 'athlete', 'training', 'recovery', 'exercise', 'workout'],
  ARRAY['endocrine', 'metabolic'],
  4
);

WITH performance_set AS (
  SELECT id FROM public.test_sets WHERE name = 'Performance & Recovery Panel'
)
INSERT INTO public.test_set_items (test_set_id, test_code, is_required)
SELECT 
  (SELECT id FROM performance_set),
  code,
  true
FROM (VALUES
  ('TESTOSTERONE'), -- Total testosterone
  ('FREE_TEST'),  -- Free testosterone
  ('CORTISOL'),   -- Cortisol (AM)
  ('DHEAS'),      -- DHEA-sulfate
  ('FERRITIN'),   -- Ferritin
  ('VIT_D'),      -- Vitamin D
  ('MG'),         -- Magnesium (serum)
  ('MG_RBC'),     -- Magnesium (RBC)
  ('CREATININE'), -- Creatinine
  ('HBA1C'),      -- Glycated hemoglobin
  ('GLUCOSE'),    -- Fasting glucose
  ('ZN'),         -- Zinc
  ('IGF1'),       -- IGF-1
  ('TSH'),        -- Thyroid stimulating hormone
  ('FT3'),        -- Free T3
  ('CK'),         -- Creatine kinase
  ('LDH'),        -- Lactate dehydrogenase
  ('URIC_ACID')   -- Uric acid
) AS tests(code);

-- Seed Test Set 5: Hormone Balance Panel (16 comprehensive tests)
INSERT INTO public.test_sets (name, description, category, base_price, recommended_for, priority_match_keywords, biomarker_domain_focus, display_order)
VALUES (
  'Hormone Balance Panel',
  'Comprehensive hormonal health assessment covering thyroid function, sex hormones, stress hormones, and supporting nutrients. Essential for optimizing energy, mood, metabolism, and overall hormonal balance.',
  'hormonal',
  425,
  ARRAY['Hormone optimization', 'Thyroid health', 'Energy balance', 'Mood optimization', 'Metabolic hormones'],
  ARRAY['hormone', 'thyroid', 'testosterone', 'estrogen', 'mood', 'energy', 'metabolism'],
  ARRAY['endocrine'],
  5
);

WITH hormone_set AS (
  SELECT id FROM public.test_sets WHERE name = 'Hormone Balance Panel'
)
INSERT INTO public.test_set_items (test_set_id, test_code, is_required)
SELECT 
  (SELECT id FROM hormone_set),
  code,
  true
FROM (VALUES
  ('TSH'),        -- Thyroid stimulating hormone
  ('FT4'),        -- Free T4
  ('FT3'),        -- Free T3
  ('TPO'),        -- Thyroid peroxidase antibodies
  ('TESTOSTERONE'), -- Total testosterone
  ('FREE_TEST'),  -- Free testosterone
  ('SHBG'),       -- Sex hormone binding globulin
  ('DHEAS'),      -- DHEA-sulfate
  ('CORTISOL'),   -- Cortisol (AM)
  ('PROGESTERONE'), -- Progesterone
  ('ESTRADIOL'),  -- Estradiol
  ('VIT_D'),      -- Vitamin D
  ('MG'),         -- Magnesium
  ('B12'),        -- Vitamin B12
  ('FERRITIN'),   -- Ferritin
  ('INSULIN')     -- Fasting insulin
) AS tests(code);