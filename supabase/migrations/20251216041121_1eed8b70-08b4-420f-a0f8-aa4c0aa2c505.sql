-- Add allergy_immunology to doctor_specialty enum
ALTER TYPE doctor_specialty ADD VALUE IF NOT EXISTS 'allergy_immunology';