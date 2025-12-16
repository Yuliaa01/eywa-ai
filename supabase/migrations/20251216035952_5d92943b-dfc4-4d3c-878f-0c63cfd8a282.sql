-- Add internal_medicine to doctor_specialty enum
ALTER TYPE doctor_specialty ADD VALUE IF NOT EXISTS 'internal_medicine';