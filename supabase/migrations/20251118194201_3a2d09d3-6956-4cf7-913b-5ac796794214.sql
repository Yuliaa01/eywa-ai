-- Drop the existing policy
DROP POLICY IF EXISTS "Users can manage own meal plans" ON meal_plans;

-- Create separate policies for better control
CREATE POLICY "Users can view own meal plans"
  ON meal_plans
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own meal plans"
  ON meal_plans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans"
  ON meal_plans
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans"
  ON meal_plans
  FOR DELETE
  USING (auth.uid() = user_id);