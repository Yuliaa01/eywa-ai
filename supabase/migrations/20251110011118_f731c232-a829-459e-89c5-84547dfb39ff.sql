-- Add RLS policies for doctor_prompts table
-- Allow admins to manage prompts
CREATE POLICY "Admins can manage doctor prompts"
ON doctor_prompts FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Allow system role to read prompts for generating reviews
CREATE POLICY "System can read doctor prompts"
ON doctor_prompts FOR SELECT
USING (has_role(auth.uid(), 'system'));
