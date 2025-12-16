-- Add dermatology to doctor_specialty enum if not exists
ALTER TYPE doctor_specialty ADD VALUE IF NOT EXISTS 'dermatology';