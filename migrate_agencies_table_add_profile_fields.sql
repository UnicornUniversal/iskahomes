-- Migration: Add missing profile fields to agencies table
-- This migration adds fields needed for the ProfileForm component
-- Run this in your Supabase SQL editor

-- ============================================
-- Add missing fields for profile functionality
-- ============================================

-- 1. Add slogan field (for company tagline/slogan)
ALTER TABLE public.agencies
ADD COLUMN IF NOT EXISTS slogan character varying(255);

-- 2. Add company_gallery field (for company gallery images)
-- Maximum 7 images, 300KB per image
ALTER TABLE public.agencies
ADD COLUMN IF NOT EXISTS company_gallery jsonb DEFAULT '[]'::jsonb;

-- ============================================
-- Add comments for documentation
-- ============================================

COMMENT ON COLUMN public.agencies.slogan IS 'Company slogan or tagline';
COMMENT ON COLUMN public.agencies.company_gallery IS 'Array of company gallery images. Maximum 7 images, 300KB per image. Structure: [{id, url, name, path, size, type, uploaded_at}]';

-- ============================================
-- Create indexes for better query performance
-- ============================================

-- GIN index for company_gallery (JSONB field)
CREATE INDEX IF NOT EXISTS idx_agencies_company_gallery_gin 
ON public.agencies USING gin (company_gallery);

-- ============================================
-- Verification queries (optional - run to verify)
-- ============================================

-- Check if columns were added successfully
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' 
--   AND table_name = 'agencies'
--   AND column_name IN ('slogan', 'company_gallery');

-- Check if index was created
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'agencies'
--   AND indexname = 'idx_agencies_company_gallery_gin';

