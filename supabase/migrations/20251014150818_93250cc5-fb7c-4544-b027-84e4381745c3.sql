-- Add missing specialties to doctor_specialty enum
ALTER TYPE public.doctor_specialty ADD VALUE IF NOT EXISTS 'dietitian';
ALTER TYPE public.doctor_specialty ADD VALUE IF NOT EXISTS 'health_coach';
ALTER TYPE public.doctor_specialty ADD VALUE IF NOT EXISTS 'geriatrics';
ALTER TYPE public.doctor_specialty ADD VALUE IF NOT EXISTS 'functional_integrative';
ALTER TYPE public.doctor_specialty ADD VALUE IF NOT EXISTS 'biogerontology';

-- Add missing role groups to doctor_role_group enum  
ALTER TYPE public.doctor_role_group ADD VALUE IF NOT EXISTS 'clinical';
ALTER TYPE public.doctor_role_group ADD VALUE IF NOT EXISTS 'lifestyle';
ALTER TYPE public.doctor_role_group ADD VALUE IF NOT EXISTS 'research';