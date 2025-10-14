-- ============================================
-- EYWA AI HEALTH PLATFORM DATABASE SCHEMA
-- ============================================

-- 1. ENUMS
CREATE TYPE public.user_status AS ENUM ('active', 'paused', 'deleted');
CREATE TYPE public.sex_at_birth AS ENUM ('male', 'female', 'intersex', 'unknown');
CREATE TYPE public.priority_type AS ENUM ('global_goal', 'temporary_goal', 'wish', 'plan_trip', 'plan_event');
CREATE TYPE public.priority_status AS ENUM ('planned', 'in_progress', 'completed', 'paused');
CREATE TYPE public.supplement_form AS ENUM ('tablet', 'capsule', 'liquid', 'powder', 'gummy');
CREATE TYPE public.supplement_source AS ENUM ('doctor', 'ai', 'user');
CREATE TYPE public.meal_source AS ENUM ('manual', 'barcode', 'photo_ai');
CREATE TYPE public.venue_type AS ENUM ('cafe', 'restaurant', 'grocery', 'delivery');
CREATE TYPE public.activity_category AS ENUM ('walk', 'mobility', 'sport', 'strength', 'cardio', 'yoga', 'hiit', 'recovery');
CREATE TYPE public.activity_context AS ENUM ('home', 'outdoor', 'gym');
CREATE TYPE public.health_issue_category AS ENUM ('anxiety', 'symptom', 'concern', 'pain', 'sleep', 'digestion', 'other');
CREATE TYPE public.vital_metric AS ENUM (
  'hr', 'hrv_rmssd', 'rhr', 'spo2', 'resp_rate', 'temp', 'steps', 'vo2max_est',
  'bp_sys', 'bp_dia', 'glucose', 'weight', 'body_fat', 'bmi', 'sleep_duration',
  'sleep_deep', 'sleep_rem', 'calories_burned', 'active_energy'
);
CREATE TYPE public.data_source AS ENUM (
  'apple_health', 'fitbit', 'oura', 'whoop', 'garmin', 'dexcom', 'withings',
  'manual', 'clinic', 'home_kit', 'fhir'
);
CREATE TYPE public.biomarker_domain AS ENUM (
  'vitamins', 'minerals', 'hormones', 'metabolic_lipids', 'inflammation_immunity',
  'organ_function', 'bone_health', 'gi_microbiome', 'cardio_resp', 'sleep_recovery',
  'neuro_cognitive', 'female_health', 'urinalysis', 'genetics'
);
CREATE TYPE public.ai_insight_kind AS ENUM (
  'meal', 'supplement', 'training', 'sleep', 'stress', 'risk_flag', 'education', 'longevity'
);
CREATE TYPE public.insight_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.ai_agent_type AS ENUM (
  'planner', 'analysis', 'meal_coach', 'fitness_coach', 'longevity_agent', 'safety_agent'
);
CREATE TYPE public.feedback_period AS ENUM ('daily', 'weekly', 'monthly');
CREATE TYPE public.doctor_specialty AS ENUM (
  'primary_care', 'cardiology', 'endocrinology', 'gastroenterology', 'neurology',
  'pulmonology', 'psychiatry', 'rheumatology', 'dermatology', 'allergy_immunology',
  'urology', 'ophthalmology', 'orthopedics', 'oncology', 'ent', 'nephrology'
);
CREATE TYPE public.doctor_role_group AS ENUM (
  'primary_care', 'specialist', 'fitness', 'longevity', 'mental_health'
);
CREATE TYPE public.specimen_type AS ENUM (
  'serum', 'plasma', 'whole_blood', 'urine', 'stool', 'saliva', 'breath', 'imaging', 'wearable'
);
CREATE TYPE public.analyte_type AS ENUM ('lab', 'sensor', 'imaging', 'questionnaire');
CREATE TYPE public.test_order_status AS ENUM ('ordered', 'collected', 'reported', 'canceled');
CREATE TYPE public.job_status AS ENUM ('queued', 'running', 'succeeded', 'failed');

-- 2. CORE USER TABLES
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  status user_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  dob DATE,
  sex_at_birth sex_at_birth,
  height_cm NUMERIC(5,2),
  weight_kg NUMERIC(5,2),
  timezone TEXT DEFAULT 'UTC',
  locale TEXT DEFAULT 'en-US',
  biological_age_estimate NUMERIC(4,1),
  chronic_conditions TEXT[],
  medications TEXT[],
  allergies TEXT[],
  diet_preferences TEXT[],
  food_avoidances TEXT[],
  sleep_schedule_notes TEXT,
  fasting_pref JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 3. PRIORITIES & GOALS
CREATE TABLE public.priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type priority_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  target_metric TEXT,
  target_value NUMERIC,
  units TEXT,
  status priority_status NOT NULL DEFAULT 'planned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 4. NUTRITION TABLES
CREATE TABLE public.nutrition_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_calories_target INTEGER,
  macros_target JSONB,
  micros_focus TEXT[],
  active_diets TEXT[],
  allergy_flags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.supplements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  form supplement_form,
  dosage TEXT,
  units TEXT,
  schedule JSONB,
  source supplement_source NOT NULL DEFAULT 'user',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  items JSONB NOT NULL,
  nutrition_totals JSONB,
  photo_url TEXT,
  source meal_source NOT NULL DEFAULT 'manual',
  confidence NUMERIC(3,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.fasting_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  protocol TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.local_venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type venue_type NOT NULL,
  geo POINT,
  address TEXT,
  menu_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. ACTIVITY TABLES
CREATE TABLE public.activity_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  category activity_category NOT NULL,
  duration_min INTEGER,
  context activity_context,
  reasoning TEXT,
  accepted BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  block_name TEXT NOT NULL,
  microcycle_week INTEGER,
  sessions JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. HEALTH ISSUES
CREATE TABLE public.health_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category health_issue_category NOT NULL,
  title TEXT NOT NULL,
  details TEXT,
  severity INTEGER CHECK (severity >= 0 AND severity <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- 7. VITALS & HEALTH DATA
CREATE TABLE public.vitals_stream (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source data_source NOT NULL,
  metric vital_metric NOT NULL,
  value NUMERIC NOT NULL,
  units TEXT,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ehr_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fhir_resource_type TEXT,
  fhir_id TEXT,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw_json JSONB NOT NULL
);

-- 8. TESTS CATALOG
CREATE TABLE public.tests_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  domain biomarker_domain NOT NULL,
  analyte_type analyte_type NOT NULL,
  specimen specimen_type,
  units TEXT,
  reference_range_low NUMERIC,
  reference_range_high NUMERIC,
  reference_notes TEXT,
  primary_purpose TEXT,
  interpretation_notes TEXT,
  suggested_cadence TEXT,
  source_api TEXT,
  ai_feature_mapping TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_code TEXT NOT NULL REFERENCES tests_catalog(code),
  specimen specimen_type,
  value_num NUMERIC,
  value_text TEXT,
  units TEXT,
  reference_low NUMERIC,
  reference_high NUMERIC,
  reference_text TEXT,
  collected_at TIMESTAMPTZ,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source data_source NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.biomarker_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain biomarker_domain NOT NULL,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  method TEXT,
  inputs JSONB,
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_test_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_code TEXT NOT NULL REFERENCES tests_catalog(code),
  ordering_context TEXT,
  status test_order_status NOT NULL DEFAULT 'ordered',
  collection_kit BOOLEAN DEFAULT false,
  lab_partner TEXT,
  shipping_tracking JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. AI INSIGHTS
CREATE TABLE public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind ai_insight_kind NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  rationale TEXT,
  actions JSONB,
  priority insight_priority NOT NULL DEFAULT 'medium',
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_to TIMESTAMPTZ,
  source_agent ai_agent_type,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. DOCTORS & PROMPTS
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialty doctor_specialty NOT NULL,
  subspecialty TEXT,
  role_group doctor_role_group NOT NULL,
  bio_short TEXT,
  focus_areas TEXT[],
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.doctor_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  prompt_template TEXT NOT NULL,
  output_schema JSONB,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.doctor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  inputs_ref JSONB,
  output_json JSONB,
  summary_md TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_feedback_unified (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period feedback_period NOT NULL,
  summary_md TEXT,
  risk_signals JSONB,
  wins JSONB,
  next_best_actions JSONB,
  version INTEGER NOT NULL DEFAULT 1,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. ORCHESTRATION & JOBS
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  params JSONB,
  status job_status NOT NULL DEFAULT 'queued',
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  error_msg TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. SECURITY & GOVERNANCE
CREATE TABLE public.consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_scope TEXT NOT NULL,
  purpose TEXT NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  before JSONB,
  after JSONB,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. INDEXES
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_priorities_user_type_status ON public.priorities(user_id, type, status);
CREATE INDEX idx_vitals_user_metric_recorded ON public.vitals_stream(user_id, metric, recorded_at DESC);
CREATE INDEX idx_lab_results_user_test_collected ON public.lab_results(user_id, test_code, collected_at DESC);
CREATE INDEX idx_tests_catalog_domain_code ON public.tests_catalog(domain, code);
CREATE INDEX idx_meals_user_timestamp ON public.meals(user_id, timestamp DESC);
CREATE INDEX idx_activity_suggestions_user_date ON public.activity_suggestions(user_id, date);
CREATE INDEX idx_ai_insights_user_valid ON public.ai_insights(user_id, valid_from, valid_to);

-- 14. ROW LEVEL SECURITY
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fasting_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vitals_stream ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ehr_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biomarker_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_test_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_feedback_unified ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own priorities" ON public.priorities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own nutrition plans" ON public.nutrition_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own supplements" ON public.supplements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own meals" ON public.meals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own fasting windows" ON public.fasting_windows FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own activity suggestions" ON public.activity_suggestions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own workout plans" ON public.workout_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own health issues" ON public.health_issues FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own vitals" ON public.vitals_stream FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own EHR records" ON public.ehr_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own lab results" ON public.lab_results FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own biomarker scores" ON public.biomarker_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own test orders" ON public.user_test_orders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own AI insights" ON public.ai_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own doctor reviews" ON public.doctor_reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own unified feedback" ON public.ai_feedback_unified FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own consents" ON public.consents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own audit log" ON public.audit_log FOR SELECT USING (auth.uid() = user_id);

-- Public read for catalog tables
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view doctors" ON public.doctors FOR SELECT USING (active = true);
CREATE POLICY "Anyone can view tests catalog" ON public.tests_catalog FOR SELECT USING (true);
CREATE POLICY "Anyone can view local venues" ON public.local_venues FOR SELECT USING (true);

-- 15. TRIGGERS FOR UPDATED_AT
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_priorities_updated_at BEFORE UPDATE ON public.priorities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_nutrition_plans_updated_at BEFORE UPDATE ON public.nutrition_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_supplements_updated_at BEFORE UPDATE ON public.supplements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workout_plans_updated_at BEFORE UPDATE ON public.workout_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_health_issues_updated_at BEFORE UPDATE ON public.health_issues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_local_venues_updated_at BEFORE UPDATE ON public.local_venues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_test_orders_updated_at BEFORE UPDATE ON public.user_test_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 16. SEED DATA: DOCTORS
INSERT INTO public.doctors (name, specialty, role_group, bio_short, focus_areas) VALUES
('AI Primary Care Physician', 'primary_care', 'primary_care', 'General health monitoring and coordination', ARRAY['preventive care', 'chronic disease management', 'health coordination']),
('AI Cardiologist', 'cardiology', 'specialist', 'Heart and cardiovascular health expert', ARRAY['apoB', 'Lp(a)', 'blood pressure', 'VO2max', 'cardiovascular risk']),
('AI Endocrinologist', 'endocrinology', 'specialist', 'Hormones, metabolism, and thyroid specialist', ARRAY['thyroid', 'diabetes', 'metabolic health', 'hormonal balance']),
('AI Gastroenterologist', 'gastroenterology', 'specialist', 'Digestive health and microbiome expert', ARRAY['gut health', 'microbiome', 'inflammation', 'nutrient absorption']),
('AI Neurologist', 'neurology', 'specialist', 'Brain health and cognitive function', ARRAY['cognitive health', 'neurodegenerative risk', 'sleep quality']),
('AI Pulmonologist', 'pulmonology', 'specialist', 'Respiratory health specialist', ARRAY['lung function', 'respiratory capacity', 'oxygen saturation']),
('AI Psychiatrist', 'psychiatry', 'mental_health', 'Mental health and wellbeing', ARRAY['stress', 'mood', 'anxiety', 'sleep patterns']),
('AI Rheumatologist', 'rheumatology', 'specialist', 'Inflammation and autoimmune conditions', ARRAY['inflammation markers', 'autoimmune markers', 'joint health']),
('AI Dermatologist', 'dermatology', 'specialist', 'Skin health specialist', ARRAY['skin health', 'aging markers', 'collagen']),
('AI Allergist/Immunologist', 'allergy_immunology', 'specialist', 'Immune system and allergies', ARRAY['immune function', 'inflammation', 'allergic responses']),
('AI Nephrologist', 'nephrology', 'specialist', 'Kidney health and function', ARRAY['kidney function', 'electrolytes', 'filtration rate']),
('AI Urologist', 'urology', 'specialist', 'Urinary and reproductive health', ARRAY['urinary health', 'hormone balance']),
('AI Ophthalmologist', 'ophthalmology', 'specialist', 'Eye and vision health', ARRAY['vision', 'ocular health', 'retinal health']),
('AI Orthopedic Specialist', 'orthopedics', 'specialist', 'Bone and musculoskeletal health', ARRAY['bone density', 'joint health', 'muscle strength']),
('AI Oncologist', 'oncology', 'specialist', 'Cancer risk assessment', ARRAY['cancer markers', 'inflammation', 'oxidative stress']),
('AI Health Coach', 'primary_care', 'fitness', 'Lifestyle and behavior change expert', ARRAY['habit formation', 'behavior change', 'wellness coaching']),
('AI Registered Dietitian', 'primary_care', 'fitness', 'Nutrition and dietary guidance', ARRAY['nutrition optimization', 'meal planning', 'macronutrients']),
('AI Strength & Conditioning Coach', 'primary_care', 'fitness', 'Exercise and performance optimization', ARRAY['training programs', 'recovery', 'performance metrics']),
('AI Geriatrics Specialist', 'primary_care', 'longevity', 'Healthy aging and longevity', ARRAY['aging biomarkers', 'frailty prevention', 'healthspan']),
('AI Functional Medicine Doctor', 'primary_care', 'longevity', 'Root cause analysis and systems biology', ARRAY['systems biology', 'nutrient optimization', 'detoxification']),
('AI Biogerontologist', 'primary_care', 'longevity', 'Biological aging mechanisms', ARRAY['biological age', 'senescence', 'longevity pathways']),
('AI Geroscience Researcher', 'primary_care', 'longevity', 'Aging science and interventions', ARRAY['aging interventions', 'cellular health', 'metabolic optimization']);

-- 17. SEED DATA: TESTS CATALOG (Key biomarkers) - Fixed analyte_type for wearable devices
INSERT INTO public.tests_catalog (code, name, domain, analyte_type, specimen, units, reference_range_low, reference_range_high, primary_purpose, suggested_cadence, ai_feature_mapping) VALUES
-- Vitamins
('VITD_25OH', 'Vitamin D (25-OH)', 'vitamins', 'lab', 'serum', 'ng/mL', 30, 80, 'Bone health, immune function, mood', 'quarterly', ARRAY['bone_health_score', 'immune_function']),
('VITB12', 'Vitamin B12', 'vitamins', 'lab', 'serum', 'pg/mL', 200, 900, 'Energy, nerve function, cognitive health', 'yearly', ARRAY['neuro_cognitive', 'metabolic_flex']),
('FOLATE', 'Folate (Vitamin B9)', 'vitamins', 'lab', 'serum', 'ng/mL', 3, 17, 'DNA synthesis, cardiovascular health', 'yearly', ARRAY['cardio_health']),
('VITA', 'Vitamin A', 'vitamins', 'lab', 'serum', 'μg/dL', 20, 80, 'Vision, immune function, skin health', '2x_year', ARRAY['immune_function']),
('VITE', 'Vitamin E', 'vitamins', 'lab', 'serum', 'mg/L', 5.5, 17, 'Antioxidant, cellular protection', '2x_year', ARRAY['antioxidant_status']),

-- Minerals
('FERRITIN', 'Ferritin', 'minerals', 'lab', 'serum', 'ng/mL', 30, 200, 'Iron storage, energy, endurance', 'quarterly', ARRAY['metabolic_flex', 'energy_score']),
('MAGNESIUM', 'Magnesium', 'minerals', 'lab', 'serum', 'mg/dL', 1.7, 2.2, 'Muscle function, heart health, sleep', '2x_year', ARRAY['sleep_recovery', 'cardio_health']),
('ZINC', 'Zinc', 'minerals', 'lab', 'serum', 'μg/dL', 60, 120, 'Immune function, wound healing', '2x_year', ARRAY['immune_function']),
('SELENIUM', 'Selenium', 'minerals', 'lab', 'serum', 'μg/L', 70, 150, 'Thyroid function, antioxidant', 'yearly', ARRAY['thyroid_health', 'antioxidant_status']),

-- Hormones
('TSH', 'Thyroid Stimulating Hormone', 'hormones', 'lab', 'serum', 'mIU/L', 0.5, 4.5, 'Thyroid function, metabolism', 'yearly', ARRAY['metabolic_flex', 'thyroid_health']),
('FREE_T4', 'Free T4', 'hormones', 'lab', 'serum', 'ng/dL', 0.8, 1.8, 'Thyroid hormone levels', 'yearly', ARRAY['thyroid_health']),
('FREE_T3', 'Free T3', 'hormones', 'lab', 'serum', 'pg/mL', 2.3, 4.2, 'Active thyroid hormone', 'yearly', ARRAY['thyroid_health', 'metabolic_flex']),
('TESTOSTERONE', 'Testosterone (Total)', 'hormones', 'lab', 'serum', 'ng/dL', 300, 1000, 'Muscle mass, energy, libido', 'yearly', ARRAY['metabolic_flex', 'vitality_score']),
('ESTRADIOL', 'Estradiol (E2)', 'female_health', 'lab', 'serum', 'pg/mL', 15, 350, 'Female hormone balance, bone health', 'yearly', ARRAY['female_health', 'bone_health_score']),
('PROGESTERONE', 'Progesterone', 'female_health', 'lab', 'serum', 'ng/mL', 0.2, 25, 'Menstrual cycle, pregnancy', 'yearly', ARRAY['female_health']),
('CORTISOL_AM', 'Cortisol (Morning)', 'hormones', 'lab', 'serum', 'μg/dL', 6, 23, 'Stress response, adrenal function', 'yearly', ARRAY['stress_score', 'recovery_index']),
('DHEA_S', 'DHEA-Sulfate', 'hormones', 'lab', 'serum', 'μg/dL', 65, 380, 'Adrenal function, aging marker', 'yearly', ARRAY['longevity_index', 'vitality_score']),

-- Metabolic & Lipids
('HBA1C', 'Hemoglobin A1c', 'metabolic_lipids', 'lab', 'whole_blood', '%', 4.0, 5.6, 'Long-term glucose control', 'quarterly', ARRAY['metabolic_flex', 'diabetes_risk']),
('FASTING_INSULIN', 'Fasting Insulin', 'metabolic_lipids', 'lab', 'serum', 'μIU/mL', 2, 20, 'Insulin sensitivity, metabolic health', 'quarterly', ARRAY['metabolic_flex', 'longevity_index']),
('APOB', 'Apolipoprotein B', 'metabolic_lipids', 'lab', 'serum', 'mg/dL', null, 90, 'Cardiovascular risk, LDL particles', 'yearly', ARRAY['cardio_health', 'longevity_index']),
('LPA', 'Lipoprotein(a)', 'metabolic_lipids', 'lab', 'serum', 'mg/dL', null, 30, 'Genetic cardiovascular risk', 'once', ARRAY['cardio_health']),
('LDL_P', 'LDL Particle Number (NMR)', 'metabolic_lipids', 'lab', 'serum', 'nmol/L', null, 1000, 'Advanced lipid particle count', 'yearly', ARRAY['cardio_health']),
('TRIGLYCERIDES', 'Triglycerides', 'metabolic_lipids', 'lab', 'serum', 'mg/dL', null, 150, 'Fat metabolism, cardiovascular risk', 'yearly', ARRAY['metabolic_flex']),
('HDL', 'HDL Cholesterol', 'metabolic_lipids', 'lab', 'serum', 'mg/dL', 40, null, 'Protective cholesterol', 'yearly', ARRAY['cardio_health']),

-- Inflammation & Immunity
('HS_CRP', 'High-Sensitivity C-Reactive Protein', 'inflammation_immunity', 'lab', 'serum', 'mg/L', null, 3.0, 'Inflammation, cardiovascular risk', 'quarterly', ARRAY['inflammation_score', 'cardio_health']),
('IL6', 'Interleukin-6', 'inflammation_immunity', 'lab', 'serum', 'pg/mL', null, 5, 'Pro-inflammatory cytokine', '2x_year', ARRAY['inflammation_score', 'immune_function']),
('GLYCA', 'GlycA', 'inflammation_immunity', 'lab', 'serum', 'μmol/L', null, 380, 'Systemic inflammation biomarker', 'yearly', ARRAY['inflammation_score']),
('HOMOCYSTEINE', 'Homocysteine', 'inflammation_immunity', 'lab', 'plasma', 'μmol/L', null, 10, 'Cardiovascular risk, B vitamin status', 'yearly', ARRAY['cardio_health', 'neuro_cognitive']),

-- Organ Function
('ALT', 'Alanine Aminotransferase', 'organ_function', 'lab', 'serum', 'U/L', 7, 56, 'Liver health', 'yearly', ARRAY['liver_health']),
('AST', 'Aspartate Aminotransferase', 'organ_function', 'lab', 'serum', 'U/L', 10, 40, 'Liver and muscle health', 'yearly', ARRAY['liver_health']),
('GGT', 'Gamma-Glutamyl Transferase', 'organ_function', 'lab', 'serum', 'U/L', 9, 48, 'Liver function, oxidative stress', 'yearly', ARRAY['liver_health']),
('EGFR', 'Estimated Glomerular Filtration Rate', 'organ_function', 'lab', 'serum', 'mL/min/1.73m²', 90, null, 'Kidney function', 'yearly', ARRAY['kidney_health']),
('CREATININE', 'Creatinine', 'organ_function', 'lab', 'serum', 'mg/dL', 0.6, 1.2, 'Kidney function, muscle mass', 'yearly', ARRAY['kidney_health']),

-- Bone Health
('DEXA_T_SCORE', 'DEXA T-Score', 'bone_health', 'imaging', 'imaging', 'SD', -1.0, null, 'Bone mineral density', '2x_year', ARRAY['bone_health_score']),
('P1NP', 'Procollagen Type 1 N-Propeptide', 'bone_health', 'lab', 'serum', 'ng/mL', 15, 60, 'Bone formation marker', 'yearly', ARRAY['bone_health_score']),
('CTX', 'C-Terminal Telopeptide', 'bone_health', 'lab', 'serum', 'pg/mL', 50, 450, 'Bone resorption marker', 'yearly', ARRAY['bone_health_score']),

-- GI & Microbiome
('CALPROTECTIN', 'Fecal Calprotectin', 'gi_microbiome', 'lab', 'stool', 'μg/g', null, 50, 'GI inflammation', 'as_needed', ARRAY['gut_health', 'inflammation_score']),

-- Cardio & Respiratory
('BNP', 'B-Type Natriuretic Peptide', 'cardio_resp', 'lab', 'plasma', 'pg/mL', null, 100, 'Heart failure marker', 'as_needed', ARRAY['cardio_health']),
('VO2MAX', 'VO2 Max (Estimated)', 'cardio_resp', 'sensor', 'wearable', 'mL/kg/min', 35, null, 'Cardiorespiratory fitness', 'continuous', ARRAY['fitness_score', 'longevity_index']),

-- Wearable Metrics (using 'sensor' as analyte_type)
('HRV_RMSSD', 'Heart Rate Variability (RMSSD)', 'sleep_recovery', 'sensor', 'wearable', 'ms', 20, null, 'Autonomic balance, recovery', 'continuous', ARRAY['recovery_index', 'stress_score']),
('RHR', 'Resting Heart Rate', 'cardio_resp', 'sensor', 'wearable', 'bpm', 40, 100, 'Cardiovascular fitness', 'continuous', ARRAY['fitness_score', 'cardio_health']),
('SLEEP_DURATION', 'Sleep Duration', 'sleep_recovery', 'sensor', 'wearable', 'hours', 7, 9, 'Total sleep time', 'continuous', ARRAY['sleep_recovery', 'recovery_index']),
('GLUCOSE_CGM', 'Continuous Glucose (CGM)', 'metabolic_lipids', 'sensor', 'wearable', 'mg/dL', 70, 140, 'Real-time glucose monitoring', 'continuous', ARRAY['metabolic_flex', 'diabetes_risk']);

-- 18. SEED DATA: DOCTOR PROMPTS (Examples)
INSERT INTO public.doctor_prompts (doctor_id, prompt_template, output_schema, version) 
SELECT d.id, 
'You are an {{specialty}} analyzing patient health data. Review: latest vitals (HR, HRV, BP, glucose), labs (apoB, Lp(a), A1c, hs-CRP), medications, conditions, and 3/6/12-month trends. Provide: (1) current cardiovascular status; (2) 3 key risk signals (NOT diagnoses); (3) 3-5 actionable steps (lifestyle, tests, clinician discussion). Cite exact data points.',
'{"type":"object","properties":{"status":{"type":"string"},"risk_signals":{"type":"array","items":{"type":"string"}},"actions":{"type":"array","items":{"type":"string"}}},"required":["status","risk_signals","actions"]}'::jsonb,
1
FROM public.doctors d WHERE d.specialty = 'cardiology';

INSERT INTO public.doctor_prompts (doctor_id, prompt_template, output_schema, version)
SELECT d.id,
'You are an {{specialty}} analyzing metabolic and hormonal health. Review: thyroid panel (TSH, Free T4/T3), HbA1c, fasting insulin, glucose trends, weight, and relevant symptoms. Provide: (1) current metabolic status; (2) 3 key risk signals; (3) 3-5 actionable recommendations. Cite exact data.',
'{"type":"object","properties":{"status":{"type":"string"},"risk_signals":{"type":"array","items":{"type":"string"}},"actions":{"type":"array","items":{"type":"string"}}},"required":["status","risk_signals","actions"]}'::jsonb,
1
FROM public.doctors d WHERE d.specialty = 'endocrinology';