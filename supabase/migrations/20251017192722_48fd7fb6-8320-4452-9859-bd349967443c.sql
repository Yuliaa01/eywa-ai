-- Add location fields to priorities table
ALTER TABLE priorities 
ADD COLUMN IF NOT EXISTS location_name TEXT,
ADD COLUMN IF NOT EXISTS location_coords POINT;