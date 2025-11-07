-- Create listings table for Iska Homes
-- This table stores both developer units and agent properties

CREATE TABLE IF NOT EXISTS listings (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Account and user information
  account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('developer', 'agent')),
  user_id UUID NOT NULL,
  
  -- Basic listing information
  listing_type VARCHAR(20) NOT NULL CHECK (listing_type IN ('unit', 'property')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  size VARCHAR(50),
  status VARCHAR(50) NOT NULL,
  development_id UUID REFERENCES developments(id) ON DELETE SET NULL,
  
  -- Categories (stored as JSONB for flexibility)
  purposes JSONB DEFAULT '[]'::jsonb,
  types JSONB DEFAULT '[]'::jsonb,
  categories JSONB DEFAULT '[]'::jsonb,
  listing_types JSONB DEFAULT '{"database": [], "inbuilt": [], "custom": []}'::jsonb,
  
  -- Specifications (stored as JSONB for flexibility)
  specifications JSONB DEFAULT '{}'::jsonb,
  
  -- Location information
  country VARCHAR(100),
  state VARCHAR(100),
  city VARCHAR(100),
  town VARCHAR(100),
  full_address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_additional_information TEXT,
  
  -- Amenities (stored as JSONB)
  amenities JSONB DEFAULT '{"database": [], "general": [], "custom": []}'::jsonb,
  
  -- Pricing information
  price DECIMAL(15, 2),
  currency VARCHAR(10) DEFAULT 'GHS',
  duration VARCHAR(20),
  price_type VARCHAR(20),
  cancellation_policy TEXT,
  is_negotiable BOOLEAN DEFAULT false,
  security_requirements TEXT,
  flexible_terms BOOLEAN DEFAULT false,
  
  -- Media information (stored as JSONB)
  media JSONB DEFAULT '{"banner": null, "video": null, "youtubeUrl": "", "virtualTourUrl": "", "mediaFiles": []}'::jsonb,
  
  -- 3D Model (for developers)
  model_3d JSONB DEFAULT null,
  
  -- Additional files (stored as JSONB)
  additional_files JSONB DEFAULT '[]'::jsonb,
  
  -- Availability information
  available_from DATE,
  available_until DATE,
  acquisition_rules TEXT,
  
  -- Additional information
  additional_information TEXT,
  
  -- Listing status and metadata
  listing_status VARCHAR(20) DEFAULT 'draft' CHECK (listing_status IN ('draft', 'active', 'archived', 'sold', 'rented')),
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit fields
  created_by UUID NOT NULL,
  last_modified_by UUID NOT NULL,
  
  -- SEO and metadata
  tags TEXT[] DEFAULT '{}',
  meta_description TEXT,
  meta_keywords TEXT,
  seo_title VARCHAR(255),
  slug VARCHAR(255) UNIQUE,
  
  -- Constraints
  CONSTRAINT check_development_for_developer CHECK (
    (account_type = 'developer' AND development_id IS NOT NULL) OR
    (account_type = 'agent' AND development_id IS NULL)
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_listings_account_type ON listings(account_type);
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_listing_type ON listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_listings_development_id ON listings(development_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_listing_status ON listings(listing_status);
CREATE INDEX IF NOT EXISTS idx_listings_city ON listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at);
CREATE INDEX IF NOT EXISTS idx_listings_slug ON listings(slug);
CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings(is_featured);
CREATE INDEX IF NOT EXISTS idx_listings_verified ON listings(is_verified);
CREATE INDEX IF NOT EXISTS idx_listings_premium ON listings(is_premium);

-- Create GIN indexes for JSONB columns for better query performance
CREATE INDEX IF NOT EXISTS idx_listings_purposes_gin ON listings USING GIN (purposes);
CREATE INDEX IF NOT EXISTS idx_listings_types_gin ON listings USING GIN (types);
CREATE INDEX IF NOT EXISTS idx_listings_categories_gin ON listings USING GIN (categories);
CREATE INDEX IF NOT EXISTS idx_listings_listing_types_gin ON listings USING GIN (listing_types);
CREATE INDEX IF NOT EXISTS idx_listings_specifications_gin ON listings USING GIN (specifications);
CREATE INDEX IF NOT EXISTS idx_listings_amenities_gin ON listings USING GIN (amenities);
CREATE INDEX IF NOT EXISTS idx_listings_media_gin ON listings USING GIN (media);
CREATE INDEX IF NOT EXISTS idx_listings_model_3d_gin ON listings USING GIN (model_3d);
CREATE INDEX IF NOT EXISTS idx_listings_additional_files_gin ON listings USING GIN (additional_files);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_listings_account_type_listing_type ON listings(account_type, listing_type);
CREATE INDEX IF NOT EXISTS idx_listings_city_status ON listings(city, status);
CREATE INDEX IF NOT EXISTS idx_listings_price_type ON listings(price_type, price);
CREATE INDEX IF NOT EXISTS idx_listings_featured_verified ON listings(is_featured, is_verified);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_listings_updated_at 
    BEFORE UPDATE ON listings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE listings IS 'Stores all property listings including developer units and agent properties';
COMMENT ON COLUMN listings.account_type IS 'Type of account: developer or agent';
COMMENT ON COLUMN listings.listing_type IS 'Type of listing: unit (for developers) or property (for agents)';
COMMENT ON COLUMN listings.development_id IS 'Reference to development (only for developer units)';
COMMENT ON COLUMN listings.purposes IS 'JSONB array of purpose objects with id, name, description';
COMMENT ON COLUMN listings.types IS 'JSONB array of type objects with id, name, description';
COMMENT ON COLUMN listings.categories IS 'JSONB array of category objects with id, name, description';
COMMENT ON COLUMN listings.listing_types IS 'JSONB object with database, inbuilt, and custom arrays';
COMMENT ON COLUMN listings.specifications IS 'JSONB object containing all property specifications';
COMMENT ON COLUMN listings.amenities IS 'JSONB object with database, general, and custom amenity arrays';
COMMENT ON COLUMN listings.media IS 'JSONB object containing media files and URLs';
COMMENT ON COLUMN listings.model_3d IS 'JSONB object containing 3D model file information (for developers)';
COMMENT ON COLUMN listings.additional_files IS 'JSONB array of additional file objects';
COMMENT ON COLUMN listings.listing_status IS 'Current status of the listing: draft, active, archived, sold, rented';
COMMENT ON COLUMN listings.slug IS 'URL-friendly slug for the listing';
