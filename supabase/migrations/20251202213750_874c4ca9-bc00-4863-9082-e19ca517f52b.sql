-- Add new vital metric types for body measurements
ALTER TYPE vital_metric ADD VALUE IF NOT EXISTS 'skeletal_muscle_mass';
ALTER TYPE vital_metric ADD VALUE IF NOT EXISTS 'waist_circumference';
ALTER TYPE vital_metric ADD VALUE IF NOT EXISTS 'visceral_fat';