-- Add missing categories to activity_category enum
ALTER TYPE activity_category ADD VALUE IF NOT EXISTS 'movement';
ALTER TYPE activity_category ADD VALUE IF NOT EXISTS 'nutrition';
ALTER TYPE activity_category ADD VALUE IF NOT EXISTS 'sleep';
ALTER TYPE activity_category ADD VALUE IF NOT EXISTS 'mindset';
ALTER TYPE activity_category ADD VALUE IF NOT EXISTS 'medical';