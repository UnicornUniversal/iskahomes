-- Allow soft-deleted developments (used by DELETE /api/developments/[id])
-- Run this in the Supabase SQL editor.

ALTER TABLE public.developments
  DROP CONSTRAINT IF EXISTS developments_development_status_check;

ALTER TABLE public.developments
  ADD CONSTRAINT developments_development_status_check
  CHECK (development_status IN ('active', 'inactive', 'draft', 'deleted'));
