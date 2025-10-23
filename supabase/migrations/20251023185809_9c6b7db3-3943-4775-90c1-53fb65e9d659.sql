-- Change context column from enum to jsonb to store the full context object
ALTER TABLE activity_suggestions 
ALTER COLUMN context TYPE jsonb USING context::text::jsonb;