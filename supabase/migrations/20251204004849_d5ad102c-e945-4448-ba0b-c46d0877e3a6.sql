-- Add new vital metrics to the enum
ALTER TYPE vital_metric ADD VALUE IF NOT EXISTS 'body_water';
ALTER TYPE vital_metric ADD VALUE IF NOT EXISTS 'body_protein';
ALTER TYPE vital_metric ADD VALUE IF NOT EXISTS 'minerals';
ALTER TYPE vital_metric ADD VALUE IF NOT EXISTS 'metabolic_rate';