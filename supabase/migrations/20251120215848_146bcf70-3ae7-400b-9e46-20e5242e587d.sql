-- Add google_fit and samsung_health to data_source enum
ALTER TYPE data_source ADD VALUE IF NOT EXISTS 'google_fit';
ALTER TYPE data_source ADD VALUE IF NOT EXISTS 'samsung_health';