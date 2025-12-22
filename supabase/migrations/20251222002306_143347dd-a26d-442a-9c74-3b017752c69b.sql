-- Fix the data_access_grants SELECT policy to prevent partners from seeing other partners' grants
-- Current policy: (auth.uid() = user_id) OR (auth.uid() = partner_id)
-- This allows Partner A to see grants for Partner B if they query the table

DROP POLICY IF EXISTS "Users can view their own access grants" ON public.data_access_grants;

-- New policy: Users can see their grants, partners can ONLY see grants where THEY are the partner
CREATE POLICY "Users can view their own access grants"
ON public.data_access_grants
FOR SELECT
USING (
  auth.uid() = user_id  -- Users can see all grants they've given
  OR 
  auth.uid() = partner_id  -- Partners can only see grants given TO THEM (not other partners' grants)
);

-- Add a comment explaining the security rationale
COMMENT ON POLICY "Users can view their own access grants" ON public.data_access_grants IS 
'Users see all grants they have given. Partners can only see grants where they are specifically the partner_id, preventing cross-partner data leakage.';