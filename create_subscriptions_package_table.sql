-- Create subscriptions_package table for admin package management
-- This table stores subscription packages that can be assigned to developers, agents, etc.

CREATE TABLE IF NOT EXISTS subscriptions_package (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Package information
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Features (stored as JSONB array of objects with feature_name and feature_value)
  -- Example: [{"feature_name": "Rank", "feature_value": "2"}, {"feature_name": "Max Listings", "feature_value": "50"}]
  features JSONB DEFAULT '[]'::jsonb NOT NULL,
  
  -- Pricing information
  local_currency VARCHAR(10) DEFAULT 'GHS' NOT NULL CHECK (local_currency = 'GHS'),
  local_currency_price DECIMAL(15, 2) NOT NULL CHECK (local_currency_price >= 0),
  
  international_currency VARCHAR(10) DEFAULT 'USD' NOT NULL CHECK (international_currency = 'USD'),
  international_currency_price DECIMAL(15, 2) NOT NULL CHECK (international_currency_price >= 0),
  
  -- Package status
  is_active BOOLEAN DEFAULT true,
  
  -- Package metadata
  duration INTEGER, -- Duration number (e.g., 1, 3, 12)
  span VARCHAR(20) CHECK (span IN ('month', 'months', 'year', 'years')), -- Duration span: month/months or year/years
  
  -- Display text for price and duration
  display_text TEXT, -- Text to display price and duration (e.g., "GHS 100 / month" or "USD 50 / year")
  
  -- Subscription settings
  ideal_duration INTEGER, -- Minimum subscription duration in months (e.g., 3 for 3 months minimum, 12 for 1 year minimum)
  user_type VARCHAR(20) CHECK (user_type IN ('developers', 'agents', 'agencies')), -- Type of user this package is intended for (stored in lowercase)
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_positive_prices CHECK (
    local_currency_price >= 0 AND international_currency_price >= 0
  ),
  CONSTRAINT check_positive_duration CHECK (
    duration IS NULL OR duration > 0
  ),
  CONSTRAINT check_positive_ideal_duration CHECK (
    ideal_duration IS NULL OR ideal_duration > 0
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_package_name ON subscriptions_package(name);
CREATE INDEX IF NOT EXISTS idx_subscriptions_package_is_active ON subscriptions_package(is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_package_span ON subscriptions_package(span);
CREATE INDEX IF NOT EXISTS idx_subscriptions_package_user_type ON subscriptions_package(user_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_package_created_at ON subscriptions_package(created_at);

-- Create GIN index for features JSONB array for better query performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_package_features_gin ON subscriptions_package USING GIN (features);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscriptions_package_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscriptions_package_updated_at 
    BEFORE UPDATE ON subscriptions_package 
    FOR EACH ROW 
    EXECUTE FUNCTION update_subscriptions_package_updated_at();

-- Add comments for documentation
COMMENT ON TABLE subscriptions_package IS 'Stores subscription packages available for developers, agents, and other users';
COMMENT ON COLUMN subscriptions_package.name IS 'Name of the subscription package';
COMMENT ON COLUMN subscriptions_package.features IS 'JSONB array of feature objects. Each object has feature_name (string) and feature_value (string). Example: [{"feature_name": "Rank", "feature_value": "2"}, {"feature_name": "Max Listings", "feature_value": "50"}]';
COMMENT ON COLUMN subscriptions_package.local_currency IS 'Local currency code (always GHS - Ghana Cedis, non-negotiable)';
COMMENT ON COLUMN subscriptions_package.local_currency_price IS 'Price in local currency (GHS)';
COMMENT ON COLUMN subscriptions_package.international_currency IS 'International currency code (always USD, non-negotiable)';
COMMENT ON COLUMN subscriptions_package.international_currency_price IS 'Price in international currency (USD)';
COMMENT ON COLUMN subscriptions_package.duration IS 'Duration number (e.g., 1, 3, 12)';
COMMENT ON COLUMN subscriptions_package.span IS 'Duration span: month/months or year/years';
COMMENT ON COLUMN subscriptions_package.display_text IS 'Display text showing price and duration (e.g., "GHS 100 / month" or "USD 50 / year")';
COMMENT ON COLUMN subscriptions_package.ideal_duration IS 'Minimum subscription duration in months (e.g., 3 for 3 months minimum, 12 for 1 year minimum)';
COMMENT ON COLUMN subscriptions_package.user_type IS 'Type of user this package is intended for: developers, agents, or agencies (stored in lowercase)';

