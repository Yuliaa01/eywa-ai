-- Fix: Move extensions from public schema to extensions schema
-- This addresses the security finding about extensions in public schema

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Drop and recreate pg_net extension in the extensions schema
DROP EXTENSION IF EXISTS pg_net CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Ensure pg_cron is in the correct schema (it should already be in pg_cron schema)
-- We just verify it exists
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_cron;