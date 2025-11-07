-- ============================================
-- PROPERTY SEEKERS TABLE SCHEMA
-- ============================================
-- This table stores property seeker profiles and preferences
-- Links to the main users table via user_id (foreign key)

-- Create the property_seekers table
CREATE TABLE IF NOT EXISTS public.property_seekers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Personal Information
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  profile_picture TEXT,
  bio TEXT,
  
  -- Location Information
  current_location JSONB DEFAULT '{}'::jsonb, -- { city, state, country, latitude, longitude }
  
  -- Property Preferences
  preferred_property_types JSONB DEFAULT '[]'::jsonb, -- Array of property type IDs or names
  preferred_property_categories JSONB DEFAULT '[]'::jsonb, -- Array of category IDs (residential, commercial, etc.)
  preferred_property_purposes JSONB DEFAULT '[]'::jsonb, -- Array: ['sale', 'rent', 'lease']
  preferred_locations JSONB DEFAULT '[]'::jsonb, -- Array of location objects: [{ city, state, country }]
  
  -- Budget Preferences
  budget_min DECIMAL(15, 2),
  budget_max DECIMAL(15, 2),
  budget_currency VARCHAR(10) DEFAULT 'GHS',
  
  -- Property Specifications Preferences
  preferred_bedrooms_min INTEGER,
  preferred_bedrooms_max INTEGER,
  preferred_bathrooms_min INTEGER,
  preferred_area_min DECIMAL(10, 2), -- Square footage/meters
  preferred_area_max DECIMAL(10, 2),
  
  -- Engagement Metrics
  total_favorites INTEGER DEFAULT 0,
  total_appointments INTEGER DEFAULT 0,
  total_inquiries INTEGER DEFAULT 0,
  total_property_views INTEGER DEFAULT 0,
  
  -- Search Preferences
  notification_preferences JSONB DEFAULT '{
    "email_notifications": true,
    "sms_notifications": false,
    "push_notifications": true,
    "new_listings": true,
    "price_drops": true,
    "saved_searches": true
  }'::jsonb,
  
  -- Account Status
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'suspended', 'deleted', 'pending'
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Metadata
  slug VARCHAR(255) UNIQUE,
  metadata JSONB DEFAULT '{}'::jsonb, -- For any additional custom fields
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_property_seekers_user_id ON public.property_seekers USING btree (user_id);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_property_seekers_email ON public.property_seekers USING btree (email);

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_property_seekers_slug ON public.property_seekers USING btree (slug);

-- Index for active seekers
CREATE INDEX IF NOT EXISTS idx_property_seekers_is_active ON public.property_seekers USING btree (is_active);

-- Index for verified seekers
CREATE INDEX IF NOT EXISTS idx_property_seekers_is_verified ON public.property_seekers USING btree (is_verified);

-- GIN indexes for JSONB columns (for fast searches)
CREATE INDEX IF NOT EXISTS idx_property_seekers_location_gin ON public.property_seekers USING gin (current_location);
CREATE INDEX IF NOT EXISTS idx_property_seekers_property_types_gin ON public.property_seekers USING gin (preferred_property_types);
CREATE INDEX IF NOT EXISTS idx_property_seekers_locations_gin ON public.property_seekers USING gin (preferred_locations);
CREATE INDEX IF NOT EXISTS idx_property_seekers_notification_prefs_gin ON public.property_seekers USING gin (notification_preferences);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE public.property_seekers ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read active and verified property seeker profiles
CREATE POLICY "Allow public read access to verified property seekers"
ON public.property_seekers FOR SELECT
USING (is_active = true AND is_verified = true);

-- Policy: Allow authenticated users to read all property seeker profiles
CREATE POLICY "Allow authenticated users to read all property seekers"
ON public.property_seekers FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow users to insert their own property seeker profile
CREATE POLICY "Allow users to insert their own property seeker profile"
ON public.property_seekers FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to update their own property seeker profile
CREATE POLICY "Allow users to update their own property seeker profile"
ON public.property_seekers FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Allow users to delete their own property seeker profile
CREATE POLICY "Allow users to delete their own property seeker profile"
ON public.property_seekers FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Allow admins to manage all property seeker profiles
CREATE POLICY "Allow admins to manage all property seekers"
ON public.property_seekers FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'user_type' = 'admin'
  )
);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Update updated_at timestamp on each update
CREATE OR REPLACE FUNCTION public.update_property_seekers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_property_seekers_updated_at
BEFORE UPDATE ON public.property_seekers
FOR EACH ROW
EXECUTE FUNCTION public.update_property_seekers_updated_at();

-- Trigger: Generate slug from name on insert
CREATE OR REPLACE FUNCTION public.generate_property_seeker_slug()
RETURNS TRIGGER AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Generate base slug from name
    base_slug := lower(trim(regexp_replace(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g')));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    -- If slug is empty, use user_id
    IF base_slug = '' OR base_slug IS NULL THEN
        base_slug := substring(NEW.user_id::text from 1 for 8);
    END IF;
    
    final_slug := base_slug;
    
    -- Check for uniqueness and append counter if needed
    WHILE EXISTS (SELECT 1 FROM public.property_seekers WHERE slug = final_slug AND id != NEW.id) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := final_slug;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_property_seeker_slug
BEFORE INSERT OR UPDATE OF name ON public.property_seekers
FOR EACH ROW
WHEN (NEW.slug IS NULL OR NEW.slug = '')
EXECUTE FUNCTION public.generate_property_seeker_slug();

-- ============================================
-- FAVORITES TABLE
-- ============================================
-- Track which properties a seeker has favorited

CREATE TABLE IF NOT EXISTS public.seeker_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seeker_id UUID NOT NULL REFERENCES public.property_seekers(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  notes TEXT, -- Optional notes about why they favorited it
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure a seeker can't favorite the same listing twice
  UNIQUE(seeker_id, listing_id)
);

-- Indexes for favorites
CREATE INDEX IF NOT EXISTS idx_seeker_favorites_seeker_id ON public.seeker_favorites USING btree (seeker_id);
CREATE INDEX IF NOT EXISTS idx_seeker_favorites_listing_id ON public.seeker_favorites USING btree (listing_id);
CREATE INDEX IF NOT EXISTS idx_seeker_favorites_created_at ON public.seeker_favorites USING btree (created_at DESC);

-- RLS for favorites
ALTER TABLE public.seeker_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow seekers to read their own favorites"
ON public.seeker_favorites FOR SELECT
TO authenticated
USING (
  seeker_id IN (
    SELECT id FROM public.property_seekers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Allow seekers to insert their own favorites"
ON public.seeker_favorites FOR INSERT
TO authenticated
WITH CHECK (
  seeker_id IN (
    SELECT id FROM public.property_seekers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Allow seekers to delete their own favorites"
ON public.seeker_favorites FOR DELETE
TO authenticated
USING (
  seeker_id IN (
    SELECT id FROM public.property_seekers WHERE user_id = auth.uid()
  )
);

-- Trigger: Increment total_favorites when a favorite is added
CREATE OR REPLACE FUNCTION public.increment_total_favorites()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.property_seekers
    SET total_favorites = total_favorites + 1
    WHERE id = NEW.seeker_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_total_favorites
AFTER INSERT ON public.seeker_favorites
FOR EACH ROW
EXECUTE FUNCTION public.increment_total_favorites();

-- Trigger: Decrement total_favorites when a favorite is removed
CREATE OR REPLACE FUNCTION public.decrement_total_favorites()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.property_seekers
    SET total_favorites = GREATEST(total_favorites - 1, 0)
    WHERE id = OLD.seeker_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_decrement_total_favorites
AFTER DELETE ON public.seeker_favorites
FOR EACH ROW
EXECUTE FUNCTION public.decrement_total_favorites();

-- ============================================
-- SAVED SEARCHES TABLE
-- ============================================
-- Allow seekers to save their search criteria

CREATE TABLE IF NOT EXISTS public.seeker_saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seeker_id UUID NOT NULL REFERENCES public.property_seekers(id) ON DELETE CASCADE,
  search_name VARCHAR(255) NOT NULL,
  search_criteria JSONB NOT NULL, -- Store all search filters
  notification_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for saved searches
CREATE INDEX IF NOT EXISTS idx_seeker_saved_searches_seeker_id ON public.seeker_saved_searches USING btree (seeker_id);
CREATE INDEX IF NOT EXISTS idx_seeker_saved_searches_criteria_gin ON public.seeker_saved_searches USING gin (search_criteria);

-- RLS for saved searches
ALTER TABLE public.seeker_saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow seekers to manage their own saved searches"
ON public.seeker_saved_searches FOR ALL
TO authenticated
USING (
  seeker_id IN (
    SELECT id FROM public.property_seekers WHERE user_id = auth.uid()
  )
);

-- ============================================
-- EXAMPLE DATA INSERTION (FOR TESTING)
-- ============================================

-- Example: Insert a property seeker profile
-- INSERT INTO public.property_seekers (
--   user_id,
--   name,
--   email,
--   phone,
--   current_location,
--   preferred_property_types,
--   preferred_property_purposes,
--   preferred_locations,
--   budget_min,
--   budget_max,
--   budget_currency,
--   preferred_bedrooms_min,
--   preferred_bedrooms_max
-- ) VALUES (
--   'your-user-uuid-here',
--   'John Doe',
--   'john.doe@example.com',
--   '+233123456789',
--   '{"city": "Accra", "state": "Greater Accra", "country": "Ghana", "latitude": 5.6037, "longitude": -0.1870}'::jsonb,
--   '["Apartment", "House", "Villa"]'::jsonb,
--   '["sale", "rent"]'::jsonb,
--   '[{"city": "Accra", "state": "Greater Accra", "country": "Ghana"}, {"city": "Tema", "state": "Greater Accra", "country": "Ghana"}]'::jsonb,
--   50000.00,
--   500000.00,
--   'GHS',
--   2,
--   4
-- );

-- ============================================
-- QUERIES FOR COMMON OPERATIONS
-- ============================================

-- Query: Get property seeker profile by user_id
-- SELECT * FROM public.property_seekers WHERE user_id = 'your-user-uuid';

-- Query: Get property seeker profile by email
-- SELECT * FROM public.property_seekers WHERE email = 'john.doe@example.com';

-- Query: Get all favorites for a seeker
-- SELECT sf.*, l.title, l.price, l.city
-- FROM public.seeker_favorites sf
-- JOIN public.listings l ON sf.listing_id = l.id
-- WHERE sf.seeker_id = 'your-seeker-uuid'
-- ORDER BY sf.created_at DESC;

-- Query: Get seekers interested in a specific location
-- SELECT * FROM public.property_seekers
-- WHERE preferred_locations @> '[{"city": "Accra"}]'::jsonb;

-- Query: Get seekers with budget in a specific range
-- SELECT * FROM public.property_seekers
-- WHERE budget_min <= 200000 AND budget_max >= 100000;

-- Query: Update total_property_views (call this from your analytics)
-- UPDATE public.property_seekers
-- SET total_property_views = total_property_views + 1,
--     last_active_at = now()
-- WHERE user_id = 'your-user-uuid';

-- ============================================
-- CLEANUP (Use with caution!)
-- ============================================

-- Drop tables (only if you need to recreate them)
-- DROP TABLE IF EXISTS public.seeker_saved_searches CASCADE;
-- DROP TABLE IF EXISTS public.seeker_favorites CASCADE;
-- DROP TABLE IF EXISTS public.property_seekers CASCADE;

-- Drop functions
-- DROP FUNCTION IF EXISTS public.update_property_seekers_updated_at() CASCADE;
-- DROP FUNCTION IF EXISTS public.generate_property_seeker_slug() CASCADE;
-- DROP FUNCTION IF EXISTS public.increment_total_favorites() CASCADE;
-- DROP FUNCTION IF EXISTS public.decrement_total_favorites() CASCADE;

