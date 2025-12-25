-- Add missing fields to agencies table to match developer profile functionality

-- Add slogan field (for company tagline/slogan)
ALTER TABLE public.agencies
ADD COLUMN IF NOT EXISTS slogan character varying(255);

-- Add company_gallery field (for company gallery images)
ALTER TABLE public.agencies
ADD COLUMN IF NOT EXISTS company_gallery jsonb DEFAULT '[]'::jsonb;

-- Add comment for company_gallery
COMMENT ON COLUMN public.agencies.company_gallery IS 'Array of company gallery images. Maximum 7 images, 300KB per image. Structure: [{id, url, name, path, size, type, uploaded_at}]';

-- Add comment for slogan
COMMENT ON COLUMN public.agencies.slogan IS 'Company slogan or tagline';

-- Create GIN index for company_gallery for better query performance
CREATE INDEX IF NOT EXISTS idx_agencies_company_gallery_gin ON public.agencies USING gin (company_gallery);

