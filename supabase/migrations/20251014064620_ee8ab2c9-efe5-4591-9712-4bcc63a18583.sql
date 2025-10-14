-- ============================================================================
-- RBAC System for Eywa AI Health Platform
-- ============================================================================
-- This migration creates a comprehensive role-based access control system
-- with support for users, healthcare providers, admins, system processes,
-- and insurance partners with delegated data access.

-- Step 1: Create role enum with all role types
CREATE TYPE public.app_role AS ENUM (
  'user',      -- Regular users (patients)
  'provider',  -- Healthcare providers
  'admin',     -- System administrators
  'system',    -- AI and automated processes
  'partner'    -- Insurance providers and partners
);

-- Step 2: Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  granted_by UUID REFERENCES auth.users(id),
  notes TEXT,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create security definer function to check roles
-- This function avoids recursive RLS issues by using SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 4: Create data access grants table for partner delegation
-- This allows users to grant partners (insurance providers) access to their health data
CREATE TABLE public.data_access_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  scope JSONB NOT NULL DEFAULT '{"tables": ["user_profiles", "vitals_stream", "lab_results"]}',
  notes TEXT,
  CONSTRAINT no_self_grant CHECK (user_id != partner_id)
);

-- Enable RLS on data_access_grants
ALTER TABLE public.data_access_grants ENABLE ROW LEVEL SECURITY;

-- Step 5: Create function to check if partner has access to user data
CREATE OR REPLACE FUNCTION public.has_partner_access(_partner_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.data_access_grants
    WHERE partner_id = _partner_id
      AND user_id = _user_id
      AND revoked_at IS NULL
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- Step 6: RLS Policies for user_roles table

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can manage roles
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Step 7: RLS Policies for data_access_grants table

-- Users can view grants they've created or received
CREATE POLICY "Users can view their own access grants"
ON public.data_access_grants
FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = partner_id);

-- Users can create grants for their own data
CREATE POLICY "Users can grant access to their data"
ON public.data_access_grants
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can revoke grants for their own data
CREATE POLICY "Users can revoke their own grants"
ON public.data_access_grants
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete grants for their own data
CREATE POLICY "Users can delete their own grants"
ON public.data_access_grants
FOR DELETE
USING (auth.uid() = user_id);

-- Step 8: Apply role-based policies to AI-generated tables

-- AI Insights: Only system can insert, users and partners with access can read
CREATE POLICY "Only system can insert AI insights"
ON public.ai_insights
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'system'));

CREATE POLICY "Partners with access can view AI insights"
ON public.ai_insights
FOR SELECT
USING (
  auth.uid() = user_id 
  OR (public.has_role(auth.uid(), 'partner') AND public.has_partner_access(auth.uid(), user_id))
);

-- Biomarker Scores: Only system can insert, users and partners with access can read
CREATE POLICY "Only system can insert biomarker scores"
ON public.biomarker_scores
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'system'));

CREATE POLICY "Partners with access can view biomarker scores"
ON public.biomarker_scores
FOR SELECT
USING (
  auth.uid() = user_id 
  OR (public.has_role(auth.uid(), 'partner') AND public.has_partner_access(auth.uid(), user_id))
);

-- Doctor Reviews: Only system can insert, users and partners with access can read
CREATE POLICY "Only system can insert doctor reviews"
ON public.doctor_reviews
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'system'));

CREATE POLICY "Partners with access can view doctor reviews"
ON public.doctor_reviews
FOR SELECT
USING (
  auth.uid() = user_id 
  OR (public.has_role(auth.uid(), 'partner') AND public.has_partner_access(auth.uid(), user_id))
);

-- AI Feedback Unified: Only system can insert, users and partners with access can read
CREATE POLICY "Only system can insert unified feedback"
ON public.ai_feedback_unified
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'system'));

CREATE POLICY "Partners with access can view unified feedback"
ON public.ai_feedback_unified
FOR SELECT
USING (
  auth.uid() = user_id 
  OR (public.has_role(auth.uid(), 'partner') AND public.has_partner_access(auth.uid(), user_id))
);

-- Step 9: Update existing policies for partner access on user health data

-- Update user_profiles to allow partner access
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users and partners can view profiles"
ON public.user_profiles
FOR SELECT
USING (
  auth.uid() = user_id 
  OR (public.has_role(auth.uid(), 'partner') AND public.has_partner_access(auth.uid(), user_id))
);

-- Update vitals_stream to allow partner access
DROP POLICY IF EXISTS "Users can manage own vitals" ON public.vitals_stream;
CREATE POLICY "Users can manage own vitals"
ON public.vitals_stream
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Partners with access can view vitals"
ON public.vitals_stream
FOR SELECT
USING (
  auth.uid() = user_id 
  OR (public.has_role(auth.uid(), 'partner') AND public.has_partner_access(auth.uid(), user_id))
);

-- Update lab_results to allow partner access
DROP POLICY IF EXISTS "Users can manage own lab results" ON public.lab_results;
CREATE POLICY "Users can manage own lab results"
ON public.lab_results
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Partners with access can view lab results"
ON public.lab_results
FOR SELECT
USING (
  auth.uid() = user_id 
  OR (public.has_role(auth.uid(), 'partner') AND public.has_partner_access(auth.uid(), user_id))
);

-- Step 10: Protect administrative tables

-- Doctors table: Only admins can modify
CREATE POLICY "Only admins can insert doctors"
ON public.doctors
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update doctors"
ON public.doctors
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete doctors"
ON public.doctors
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Tests catalog: Only admins can modify
CREATE POLICY "Only admins can insert tests"
ON public.tests_catalog
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update tests"
ON public.tests_catalog
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete tests"
ON public.tests_catalog
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Jobs table: Only system and admins can manage
CREATE POLICY "System and admins can manage jobs"
ON public.jobs
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin') 
  OR public.has_role(auth.uid(), 'system')
);

-- Step 11: Create trigger to auto-assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Automatically assign 'user' role to new users
  INSERT INTO public.user_roles (user_id, role, notes)
  VALUES (NEW.id, 'user', 'Auto-assigned on signup');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Step 12: Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_data_access_grants_user_id ON public.data_access_grants(user_id);
CREATE INDEX idx_data_access_grants_partner_id ON public.data_access_grants(partner_id);
-- Index for active grants (removed now() check to avoid immutability issue)
CREATE INDEX idx_data_access_grants_active ON public.data_access_grants(partner_id, user_id) 
  WHERE revoked_at IS NULL;