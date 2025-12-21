-- Remove the overly permissive partner policy from user_profiles
DROP POLICY IF EXISTS "Partners with scoped access can view profiles" ON public.user_profiles;

-- Create a secure function that returns ONLY non-sensitive profile data for partners
-- Partners can only access: first_name, timezone, locale, view_mode
-- They CANNOT access: dob, sex_at_birth, height, weight, chronic_conditions, medications, allergies, diet_preferences, etc.
CREATE OR REPLACE FUNCTION public.get_partner_safe_profile(_partner_id uuid, _target_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  first_name text,
  timezone text,
  locale text,
  onboarding_completed boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify partner has valid, unexpired access grant for this user
  IF NOT EXISTS (
    SELECT 1
    FROM public.data_access_grants
    WHERE partner_id = _partner_id
      AND user_id = _target_user_id
      AND revoked_at IS NULL
      AND (expires_at IS NULL OR expires_at > now())
  ) THEN
    RAISE EXCEPTION 'Access denied: No valid access grant found';
  END IF;

  -- Log the access attempt for audit
  PERFORM public.log_partner_access(_partner_id, _target_user_id, 'user_profiles_safe', 'read');

  -- Return only non-sensitive columns
  RETURN QUERY
  SELECT 
    up.user_id,
    up.first_name,
    up.timezone,
    up.locale,
    up.onboarding_completed
  FROM public.user_profiles up
  WHERE up.user_id = _target_user_id;
END;
$$;

-- Grant execute permission to authenticated users (partners are authenticated)
GRANT EXECUTE ON FUNCTION public.get_partner_safe_profile(uuid, uuid) TO authenticated;

-- Add a comment explaining the security rationale
COMMENT ON FUNCTION public.get_partner_safe_profile IS 'Returns only non-PII profile data for authorized partners. Sensitive health data (dob, sex, height, weight, conditions, medications, allergies) is never exposed to partners through this function.';