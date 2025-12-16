-- Add pediatrics to doctor_specialty enum
ALTER TYPE doctor_specialty ADD VALUE IF NOT EXISTS 'pediatrics';