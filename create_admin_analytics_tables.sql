-- ============================================
-- Create Admin Analytics Tables
-- Breaks down admin_analytics into 4 domain-specific tables
-- ============================================

-- ============================================
-- 1. admin_sales_analytics
-- ============================================
CREATE TABLE IF NOT EXISTS admin_sales_analytics (
  -- Primary Key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Time Dimensions
  date DATE NOT NULL,
  hour INTEGER CHECK (hour >= 0 AND hour <= 23),
  day INTEGER CHECK (day >= 1 AND day <= 7),
  week VARCHAR(10),
  month VARCHAR(7),
  quarter VARCHAR(7),
  year INTEGER,
  
  -- Sales Type Breakdown
  sales_by_type JSONB DEFAULT '{
    "sale": {
      "total_units_sold": 0,
      "total_revenue": 0,
      "total_amount": 0
    },
    "rent": {
      "total_units_sold": 0,
      "total_revenue": 0,
      "total_amount": 0
    },
    "lease": {
      "total_units_sold": 0,
      "total_revenue": 0,
      "total_amount": 0
    },
    "total": {
      "total_units_sold": 0,
      "total_revenue": 0,
      "total_amount": 0
    }
  }'::jsonb,
  
  -- Total Revenue (Sold Properties) - USD
  total_revenue DECIMAL(15, 2) DEFAULT 0,
  total_units_sold INTEGER DEFAULT 0,
  
  -- Total Estimated Revenue (Awaiting Sales) - USD
  total_estimated_revenue DECIMAL(15, 2) DEFAULT 0,
  total_units_awaiting_sales INTEGER DEFAULT 0,
  
  -- Breakdown by User Type
  developers JSONB DEFAULT '{
    "total_units_awaiting_sales": 0,
    "total_estimated_revenue": 0,
    "total_units_sold": 0,
    "total_revenue": 0,
    "sales_by_type": {
      "sale": {"total_units_sold": 0, "total_revenue": 0},
      "rent": {"total_units_sold": 0, "total_revenue": 0},
      "lease": {"total_units_sold": 0, "total_revenue": 0}
    }
  }'::jsonb,
  
  agents JSONB DEFAULT '{
    "total_units_awaiting_sales": 0,
    "total_estimated_revenue": 0,
    "total_units_sold": 0,
    "total_revenue": 0,
    "sales_by_type": {
      "sale": {"total_units_sold": 0, "total_revenue": 0},
      "rent": {"total_units_sold": 0, "total_revenue": 0},
      "lease": {"total_units_sold": 0, "total_revenue": 0}
    }
  }'::jsonb,
  
  agencies JSONB DEFAULT '{
    "total_units_awaiting_sales": 0,
    "total_estimated_revenue": 0,
    "total_units_sold": 0,
    "total_revenue": 0,
    "sales_by_type": {
      "sale": {"total_units_sold": 0, "total_revenue": 0},
      "rent": {"total_units_sold": 0, "total_revenue": 0},
      "lease": {"total_units_sold": 0, "total_revenue": 0}
    }
  }'::jsonb,
  
  -- Breakdown by Developments
  developments JSONB DEFAULT '{
    "total_developments": 0,
    "total_units_awaiting_sales": 0,
    "total_estimated_revenue": 0,
    "total_units_sold": 0,
    "total_revenue": 0
  }'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for admin_sales_analytics
CREATE INDEX IF NOT EXISTS idx_admin_sales_analytics_date ON admin_sales_analytics(date);
CREATE INDEX IF NOT EXISTS idx_admin_sales_analytics_year_month ON admin_sales_analytics(year, month);
CREATE INDEX IF NOT EXISTS idx_admin_sales_analytics_week ON admin_sales_analytics(week);
CREATE INDEX IF NOT EXISTS idx_admin_sales_analytics_year ON admin_sales_analytics(year);

-- GIN index for JSONB fields
CREATE INDEX IF NOT EXISTS idx_admin_sales_analytics_sales_by_type ON admin_sales_analytics USING GIN(sales_by_type);
CREATE INDEX IF NOT EXISTS idx_admin_sales_analytics_developers ON admin_sales_analytics USING GIN(developers);
CREATE INDEX IF NOT EXISTS idx_admin_sales_analytics_agents ON admin_sales_analytics USING GIN(agents);
CREATE INDEX IF NOT EXISTS idx_admin_sales_analytics_agencies ON admin_sales_analytics USING GIN(agencies);
CREATE INDEX IF NOT EXISTS idx_admin_sales_analytics_developments ON admin_sales_analytics USING GIN(developments);

-- Unique constraint on date (one record per day)
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_sales_analytics_date_unique ON admin_sales_analytics(date);

-- ============================================
-- 2. admin_listings_analytics
-- ============================================
CREATE TABLE IF NOT EXISTS admin_listings_analytics (
  -- Primary Key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Time Dimensions
  date DATE NOT NULL,
  hour INTEGER CHECK (hour >= 0 AND hour <= 23),
  day INTEGER CHECK (day >= 1 AND day <= 7),
  week VARCHAR(10),
  month VARCHAR(7),
  quarter VARCHAR(7),
  year INTEGER,
  
  -- Total Listings Breakdown by User Type
  total_listings JSONB DEFAULT '{
    "developers": 0,
    "agents": 0,
    "agencies": 0,
    "total": 0
  }'::jsonb,
  
  -- Listings by Status
  listings_by_status JSONB DEFAULT '{
    "active": 0,
    "inactive": 0,
    "available": 0,
    "unavailable": 0,
    "draft": 0,
    "archived": 0,
    "sold": 0,
    "rented": 0,
    "total": 0
  }'::jsonb,
  
  -- Listings by Listing Status
  listings_by_listing_status JSONB DEFAULT '{
    "draft": 0,
    "active": 0,
    "archived": 0,
    "sold": 0,
    "rented": 0,
    "total": 0
  }'::jsonb,
  
  -- Listings by Location (Arrays of Objects)
  listings_by_country JSONB DEFAULT '[]'::jsonb,
  listings_by_state JSONB DEFAULT '[]'::jsonb,
  listings_by_city JSONB DEFAULT '[]'::jsonb,
  listings_by_town JSONB DEFAULT '[]'::jsonb,
  
  -- Listings by Category (Arrays of Objects)
  listings_by_property_purpose JSONB DEFAULT '[]'::jsonb,
  listings_by_property_type JSONB DEFAULT '[]'::jsonb,
  listings_by_sub_type JSONB DEFAULT '[]'::jsonb,
  listings_by_category JSONB DEFAULT '[]'::jsonb,
  
  -- Listings by User Type
  listings_by_developers JSONB DEFAULT '{
    "total_developers": 0,
    "total_listings": 0,
    "total_estimated_revenue": 0
  }'::jsonb,
  
  listings_by_agents JSONB DEFAULT '{
    "total_agents": 0,
    "total_listings": 0,
    "total_estimated_revenue": 0
  }'::jsonb,
  
  listings_by_agencies JSONB DEFAULT '{
    "total_agencies": 0,
    "total_listings": 0,
    "total_estimated_revenue": 0
  }'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for admin_listings_analytics
CREATE INDEX IF NOT EXISTS idx_admin_listings_analytics_date ON admin_listings_analytics(date);
CREATE INDEX IF NOT EXISTS idx_admin_listings_analytics_year_month ON admin_listings_analytics(year, month);
CREATE INDEX IF NOT EXISTS idx_admin_listings_analytics_week ON admin_listings_analytics(week);
CREATE INDEX IF NOT EXISTS idx_admin_listings_analytics_year ON admin_listings_analytics(year);

-- GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_admin_listings_analytics_total_listings ON admin_listings_analytics USING GIN(total_listings);
CREATE INDEX IF NOT EXISTS idx_admin_listings_analytics_by_status ON admin_listings_analytics USING GIN(listings_by_status);
CREATE INDEX IF NOT EXISTS idx_admin_listings_analytics_by_listing_status ON admin_listings_analytics USING GIN(listings_by_listing_status);
CREATE INDEX IF NOT EXISTS idx_admin_listings_analytics_by_country ON admin_listings_analytics USING GIN(listings_by_country);
CREATE INDEX IF NOT EXISTS idx_admin_listings_analytics_by_state ON admin_listings_analytics USING GIN(listings_by_state);
CREATE INDEX IF NOT EXISTS idx_admin_listings_analytics_by_city ON admin_listings_analytics USING GIN(listings_by_city);
CREATE INDEX IF NOT EXISTS idx_admin_listings_analytics_by_town ON admin_listings_analytics USING GIN(listings_by_town);
CREATE INDEX IF NOT EXISTS idx_admin_listings_analytics_by_purpose ON admin_listings_analytics USING GIN(listings_by_property_purpose);
CREATE INDEX IF NOT EXISTS idx_admin_listings_analytics_by_type ON admin_listings_analytics USING GIN(listings_by_property_type);
CREATE INDEX IF NOT EXISTS idx_admin_listings_analytics_by_subtype ON admin_listings_analytics USING GIN(listings_by_sub_type);
CREATE INDEX IF NOT EXISTS idx_admin_listings_analytics_by_category ON admin_listings_analytics USING GIN(listings_by_category);

-- Unique constraint on date
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_listings_analytics_date_unique ON admin_listings_analytics(date);

-- ============================================
-- 3. admin_users_analytics
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users_analytics (
  -- Primary Key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Time Dimensions
  date DATE NOT NULL,
  hour INTEGER CHECK (hour >= 0 AND hour <= 23),
  day INTEGER CHECK (day >= 1 AND day <= 7),
  week VARCHAR(10),
  month VARCHAR(7),
  quarter VARCHAR(7),
  year INTEGER,
  
  -- Developers Metrics
  developers JSONB DEFAULT '{
    "new": 0,
    "total": 0,
    "active": 0,
    "inactive": 0,
    "verified": 0,
    "unverified": 0,
    "deactivated_accounts": 0
  }'::jsonb,
  
  -- Agents Metrics
  agents JSONB DEFAULT '{
    "new": 0,
    "total": 0,
    "active": 0,
    "inactive": 0,
    "verified": 0,
    "unverified": 0,
    "deactivated_accounts": 0
  }'::jsonb,
  
  -- Agencies Metrics
  agencies JSONB DEFAULT '{
    "new": 0,
    "total": 0,
    "active": 0,
    "inactive": 0,
    "verified": 0,
    "unverified": 0,
    "deactivated_accounts": 0
  }'::jsonb,
  
  -- Property Seekers Metrics
  property_seekers JSONB DEFAULT '{
    "new": 0,
    "total": 0,
    "active": 0,
    "inactive": 0,
    "verified": 0,
    "unverified": 0,
    "deactivated_accounts": 0
  }'::jsonb,
  
  -- Subscriptions Breakdown
  subscriptions JSONB DEFAULT '{
    "total_active": 0,
    "total_expired": 0,
    "total_cancelled": 0,
    "total": 0,
    "developers": {
      "active": 0,
      "expired": 0,
      "cancelled": 0,
      "total": 0
    },
    "agents": {
      "active": 0,
      "expired": 0,
      "cancelled": 0,
      "total": 0
    },
    "agencies": {
      "active": 0,
      "expired": 0,
      "cancelled": 0,
      "total": 0
    },
    "by_package": [],
    "total_revenue": 0,
    "monthly_recurring_revenue": 0,
    "annual_recurring_revenue": 0
  }'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for admin_users_analytics
CREATE INDEX IF NOT EXISTS idx_admin_users_analytics_date ON admin_users_analytics(date);
CREATE INDEX IF NOT EXISTS idx_admin_users_analytics_year_month ON admin_users_analytics(year, month);
CREATE INDEX IF NOT EXISTS idx_admin_users_analytics_week ON admin_users_analytics(week);
CREATE INDEX IF NOT EXISTS idx_admin_users_analytics_year ON admin_users_analytics(year);

-- GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_admin_users_analytics_developers ON admin_users_analytics USING GIN(developers);
CREATE INDEX IF NOT EXISTS idx_admin_users_analytics_agents ON admin_users_analytics USING GIN(agents);
CREATE INDEX IF NOT EXISTS idx_admin_users_analytics_agencies ON admin_users_analytics USING GIN(agencies);
CREATE INDEX IF NOT EXISTS idx_admin_users_analytics_property_seekers ON admin_users_analytics USING GIN(property_seekers);
CREATE INDEX IF NOT EXISTS idx_admin_users_analytics_subscriptions ON admin_users_analytics USING GIN(subscriptions);

-- Unique constraint on date
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_analytics_date_unique ON admin_users_analytics(date);

-- ============================================
-- 4. admin_developments_analytics
-- ============================================
CREATE TABLE IF NOT EXISTS admin_developments_analytics (
  -- Primary Key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Time Dimensions
  date DATE NOT NULL,
  hour INTEGER CHECK (hour >= 0 AND hour <= 23),
  day INTEGER CHECK (day >= 1 AND day <= 7),
  week VARCHAR(10),
  month VARCHAR(7),
  quarter VARCHAR(7),
  year INTEGER,
  
  -- Development Metrics
  total_developments INTEGER DEFAULT 0,
  new_developments INTEGER DEFAULT 0,
  
  -- Units Metrics
  total_units INTEGER DEFAULT 0,
  total_units_sold INTEGER DEFAULT 0,
  total_units_available INTEGER DEFAULT 0,
  
  -- Revenue Metrics (USD)
  total_estimated_revenue DECIMAL(15, 2) DEFAULT 0,
  total_revenue DECIMAL(15, 2) DEFAULT 0,
  
  -- Developments by Location (Arrays of Objects)
  developments_by_country JSONB DEFAULT '[]'::jsonb,
  developments_by_state JSONB DEFAULT '[]'::jsonb,
  developments_by_city JSONB DEFAULT '[]'::jsonb,
  developments_by_town JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for admin_developments_analytics
CREATE INDEX IF NOT EXISTS idx_admin_developments_analytics_date ON admin_developments_analytics(date);
CREATE INDEX IF NOT EXISTS idx_admin_developments_analytics_year_month ON admin_developments_analytics(year, month);
CREATE INDEX IF NOT EXISTS idx_admin_developments_analytics_week ON admin_developments_analytics(week);
CREATE INDEX IF NOT EXISTS idx_admin_developments_analytics_year ON admin_developments_analytics(year);

-- GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_admin_developments_analytics_by_country ON admin_developments_analytics USING GIN(developments_by_country);
CREATE INDEX IF NOT EXISTS idx_admin_developments_analytics_by_state ON admin_developments_analytics USING GIN(developments_by_state);
CREATE INDEX IF NOT EXISTS idx_admin_developments_analytics_by_city ON admin_developments_analytics USING GIN(developments_by_city);
CREATE INDEX IF NOT EXISTS idx_admin_developments_analytics_by_town ON admin_developments_analytics USING GIN(developments_by_town);

-- Unique constraint on date
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_developments_analytics_date_unique ON admin_developments_analytics(date);

-- ============================================
-- Comments for Documentation
-- ============================================
COMMENT ON TABLE admin_sales_analytics IS 'Aggregated sales metrics - tracks sold/rented/leased properties and revenue';
COMMENT ON TABLE admin_listings_analytics IS 'Aggregated listing metrics - tracks listings by location, category, status, and user type';
COMMENT ON TABLE admin_users_analytics IS 'Aggregated user metrics - tracks users by type, status, and subscriptions';
COMMENT ON TABLE admin_developments_analytics IS 'Aggregated development metrics - tracks developments by location with unit and revenue metrics';

COMMENT ON COLUMN admin_sales_analytics.total_revenue IS 'Total revenue from sold/rented/leased properties in USD';
COMMENT ON COLUMN admin_sales_analytics.total_estimated_revenue IS 'Total estimated revenue from unsold properties in USD';
COMMENT ON COLUMN admin_listings_analytics.listings_by_country IS 'JSONB array of country objects with id, name, total_listings, percentage, total_amount';
COMMENT ON COLUMN admin_users_analytics.subscriptions IS 'Subscription metrics including active/expired/cancelled counts and revenue (MRR/ARR)';
COMMENT ON COLUMN admin_developments_analytics.total_estimated_revenue IS 'Total estimated revenue from unsold units in USD';
COMMENT ON COLUMN admin_developments_analytics.total_revenue IS 'Total revenue from sold units in USD';

