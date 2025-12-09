
-- Create a function to log partner access attempts (for audit trail)
CREATE OR REPLACE FUNCTION public.log_partner_access(
  _partner_id uuid,
  _user_id uuid,
  _resource text,
  _action text DEFAULT 'read'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_log (user_id, actor, action, resource, before, after, at)
  VALUES (
    _user_id,
    'partner:' || _partner_id::text,
    _action,
    _resource,
    NULL,
    jsonb_build_object('partner_id', _partner_id, 'accessed_user_id', _user_id),
    now()
  );
END;
$$;

-- Create an enhanced partner access check that also validates scope
CREATE OR REPLACE FUNCTION public.has_partner_access_for_table(
  _partner_id uuid, 
  _user_id uuid,
  _table_name text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _has_access boolean;
  _scope jsonb;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.data_access_grants
    WHERE partner_id = _partner_id
      AND user_id = _user_id
      AND revoked_at IS NULL
      AND (expires_at IS NULL OR expires_at > now())
      AND (
        scope->'tables' IS NULL 
        OR scope->'tables' ? _table_name
      )
  ) INTO _has_access;
  
  RETURN _has_access;
END;
$$;

-- Update user_profiles RLS policy to use table-specific access check
DROP POLICY IF EXISTS "Users and partners can view profiles" ON public.user_profiles;

CREATE POLICY "Users can view own profile" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Partners with scoped access can view profiles" 
ON public.user_profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'partner'::app_role) 
  AND has_partner_access_for_table(auth.uid(), user_id, 'user_profiles')
);

-- Update lab_results RLS policy similarly
DROP POLICY IF EXISTS "Partners with access can view lab results" ON public.lab_results;

CREATE POLICY "Partners with scoped access can view lab results" 
ON public.lab_results 
FOR SELECT 
USING (
  has_role(auth.uid(), 'partner'::app_role) 
  AND has_partner_access_for_table(auth.uid(), user_id, 'lab_results')
);

-- Add RLS policy for audit_log to allow system/admin to manage
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_log;
CREATE POLICY "System can insert audit logs" 
ON public.audit_log 
FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_log;
CREATE POLICY "Admins can view audit logs" 
ON public.audit_log 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_log;
CREATE POLICY "Users can view own audit logs" 
ON public.audit_log 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add constraint to ensure expires_at is required and reasonable for new grants
ALTER TABLE public.data_access_grants 
ADD CONSTRAINT check_expires_at_required 
CHECK (expires_at IS NOT NULL);

-- Add constraint to limit maximum grant duration (90 days max)
ALTER TABLE public.data_access_grants 
ADD CONSTRAINT check_expires_at_max_duration 
CHECK (expires_at <= granted_at + INTERVAL '90 days');
