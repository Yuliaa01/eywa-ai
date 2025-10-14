-- Insert all doctors with their specialties
INSERT INTO public.doctors (name, specialty, role_group, bio_short, active) VALUES
('Dr. Cardio', 'cardiology', 'clinical', 'Cardiovascular health specialist', true),
('Dr. Endo', 'endocrinology', 'clinical', 'Endocrinology and metabolism expert', true),
('Dr. Gastro', 'gastroenterology', 'clinical', 'Digestive health specialist', true),
('Dr. Neuro', 'neurology', 'clinical', 'Neurological health expert', true),
('Dr. Pulmo', 'pulmonology', 'clinical', 'Respiratory health specialist', true),
('Dr. Psych', 'psychiatry', 'clinical', 'Mental health expert', true),
('Dr. Rheum', 'rheumatology', 'clinical', 'Autoimmune and joint health specialist', true),
('Dr. Derm', 'dermatology', 'clinical', 'Skin health expert', true),
('Dr. Allergy', 'allergy_immunology', 'clinical', 'Allergy and immune system specialist', true),
('Dr. Uro', 'urology', 'clinical', 'Urological health expert', true),
('Dr. Ophthal', 'ophthalmology', 'clinical', 'Eye health specialist', true),
('Dr. Ortho', 'orthopedics', 'clinical', 'Musculoskeletal health expert', true),
('Dr. Onco', 'oncology', 'clinical', 'Cancer prevention and screening specialist', true),
('Coach Nutrition', 'dietitian', 'lifestyle', 'Registered dietitian and nutrition expert', true),
('Coach Health', 'health_coach', 'lifestyle', 'Holistic health and wellness coach', true),
('Dr. Geri', 'geriatrics', 'research', 'Aging and longevity specialist', true),
('Dr. Functional', 'functional_integrative', 'research', 'Functional and integrative medicine expert', true),
('Dr. Bio', 'biogerontology', 'research', 'Biological aging researcher', true)
ON CONFLICT DO NOTHING;

-- Create prompt templates for each doctor
INSERT INTO public.doctor_prompts (doctor_id, prompt_template, output_schema, version)
SELECT 
  d.id,
  'You are a ' || 
  CASE d.specialty
    WHEN 'cardiology' THEN 'cardiologist'
    WHEN 'endocrinology' THEN 'endocrinologist'
    WHEN 'gastroenterology' THEN 'gastroenterologist'
    WHEN 'neurology' THEN 'neurologist'
    WHEN 'pulmonology' THEN 'pulmonologist'
    WHEN 'psychiatry' THEN 'psychiatrist'
    WHEN 'rheumatology' THEN 'rheumatologist'
    WHEN 'dermatology' THEN 'dermatologist'
    WHEN 'allergy_immunology' THEN 'allergist/immunologist'
    WHEN 'urology' THEN 'urologist'
    WHEN 'ophthalmology' THEN 'ophthalmologist'
    WHEN 'orthopedics' THEN 'orthopedic surgeon'
    WHEN 'oncology' THEN 'oncologist'
    WHEN 'dietitian' THEN 'registered dietitian'
    WHEN 'health_coach' THEN 'health coach'
    WHEN 'geriatrics' THEN 'geriatrician'
    WHEN 'functional_integrative' THEN 'functional/integrative medicine specialist'
    WHEN 'biogerontology' THEN 'biogerontologist'
    ELSE 'medical specialist'
  END || '. Using the latest vitals, top lab results (apoB, Lp(a), HbA1c, blood pressure, VO₂max, hs-CRP), medications, chronic conditions, and 3/6/12-month trends, write: (1) Current status summary; (2) 3 prioritized "risk signals" (not diagnoses - focus on concerning patterns); (3) 3-5 next best actions (lifestyle modifications, recommended tests, or topics for clinician discussion). Always quote exact data points with units and timestamps.',
  jsonb_build_object(
    'type', 'object',
    'properties', jsonb_build_object(
      'current_status', jsonb_build_object('type', 'string', 'description', 'Brief overview of current health state'),
      'risk_signals', jsonb_build_object(
        'type', 'array',
        'items', jsonb_build_object(
          'type', 'object',
          'properties', jsonb_build_object(
            'title', jsonb_build_object('type', 'string'),
            'severity', jsonb_build_object('type', 'string', 'enum', jsonb_build_array('low', 'medium', 'high')),
            'details', jsonb_build_object('type', 'string'),
            'data_points', jsonb_build_object('type', 'array', 'items', jsonb_build_object('type', 'string'))
          ),
          'required', jsonb_build_array('title', 'severity', 'details', 'data_points')
        )
      ),
      'next_actions', jsonb_build_object(
        'type', 'array',
        'items', jsonb_build_object(
          'type', 'object',
          'properties', jsonb_build_object(
            'action', jsonb_build_object('type', 'string'),
            'priority', jsonb_build_object('type', 'string', 'enum', jsonb_build_array('low', 'medium', 'high')),
            'category', jsonb_build_object('type', 'string', 'enum', jsonb_build_array('lifestyle', 'testing', 'clinical')),
            'rationale', jsonb_build_object('type', 'string')
          ),
          'required', jsonb_build_array('action', 'priority', 'category', 'rationale')
        )
      )
    ),
    'required', jsonb_build_array('current_status', 'risk_signals', 'next_actions')
  ),
  1
FROM public.doctors d
ON CONFLICT DO NOTHING;

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the unification job that runs nightly at 2 AM
SELECT cron.schedule(
  'unify-doctor-reviews',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xdzoyhzvjnumjgedwsbq.supabase.co/functions/v1/unify-feedback',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkem95aHp2am51bWpnZWR3c2JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNDM2NTgsImV4cCI6MjA3NTkxOTY1OH0.iwVVe0ERwlJB1Nf14b48TbgeRYSi_2Vc9G2BcHRiPyE"}'::jsonb
  ) as request_id;
  $$
);