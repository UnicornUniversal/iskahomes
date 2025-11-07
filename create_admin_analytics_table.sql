CREATE TABLE admin_analytics (
  -- Primary Key
  date DATE PRIMARY KEY,
  
  -- Time Dimensions
  week VARCHAR(10),
  month VARCHAR(7),
  quarter VARCHAR(7),
  year INTEGER,
  
  -- Location Arrays (JSONB)
  country JSONB DEFAULT '[]'::jsonb,
  state JSONB DEFAULT '[]'::jsonb,
  city JSONB DEFAULT '[]'::jsonb,
  town JSONB DEFAULT '[]'::jsonb,
  
  -- Category Breakdowns (JSONB)
  listings_by_property_purpose JSONB DEFAULT '{}'::jsonb,
  listings_by_property_type JSONB DEFAULT '{}'::jsonb,
  listings_by_sub_type JSONB DEFAULT '{}'::jsonb,
  listings_by_category JSONB DEFAULT '{}'::jsonb,
  
  -- User Type Metrics (JSONB)
  developers_metrics JSONB DEFAULT '{}'::jsonb,
  agents_metrics JSONB DEFAULT '{}'::jsonb,
  agencies_metrics JSONB DEFAULT '{}'::jsonb,
  property_seekers_metrics JSONB DEFAULT '{}'::jsonb,
  
  -- Platform Engagement (JSONB)
  platform_engagement JSONB DEFAULT '{}'::jsonb,
  platform_impressions JSONB DEFAULT '{}'::jsonb,
  
  -- Lead Metrics by Type (JSONB)
  phone_leads JSONB DEFAULT '{}'::jsonb,
  message_leads JSONB DEFAULT '{}'::jsonb,
  email_leads JSONB DEFAULT '{}'::jsonb,
  appointment_leads JSONB DEFAULT '{}'::jsonb,
  website_leads JSONB DEFAULT '{}'::jsonb,
  
  -- Sales Metrics (JSONB)
  sales_metrics JSONB DEFAULT '{}'::jsonb,
  conversion_rates JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_admin_analytics_week ON admin_analytics(week);
CREATE INDEX idx_admin_analytics_month ON admin_analytics(month);
CREATE INDEX idx_admin_analytics_quarter ON admin_analytics(quarter);
CREATE INDEX idx_admin_analytics_year ON admin_analytics(year);

-- GIN indexes for JSONB fields to enable fast JSON queries
CREATE INDEX idx_admin_analytics_country ON admin_analytics USING GIN(country);
CREATE INDEX idx_admin_analytics_state ON admin_analytics USING GIN(state);
CREATE INDEX idx_admin_analytics_city ON admin_analytics USING GIN(city);
CREATE INDEX idx_admin_analytics_town ON admin_analytics USING GIN(town);
CREATE INDEX idx_admin_analytics_listings_by_purpose ON admin_analytics USING GIN(listings_by_property_purpose);
CREATE INDEX idx_admin_analytics_listings_by_type ON admin_analytics USING GIN(listings_by_property_type);
CREATE INDEX idx_admin_analytics_listings_by_sub_type ON admin_analytics USING GIN(listings_by_sub_type);
CREATE INDEX idx_admin_analytics_listings_by_category ON admin_analytics USING GIN(listings_by_category);

-- Add comment to table
COMMENT ON TABLE admin_analytics IS 'Daily aggregated platform-wide analytics for admin dashboard';

-- Sample insert with initialized values
INSERT INTO admin_analytics (
  date,
  week,
  month,
  quarter,
  year,
  country,
  state,
  city,
  town,
  listings_by_property_purpose,
  listings_by_property_type,
  listings_by_sub_type,
  listings_by_category,
  developers_metrics,
  agents_metrics,
  agencies_metrics,
  property_seekers_metrics,
  platform_engagement,
  platform_impressions,
  phone_leads,
  message_leads,
  email_leads,
  appointment_leads,
  website_leads,
  sales_metrics,
  conversion_rates
) VALUES (
  CURRENT_DATE,
  TO_CHAR(CURRENT_DATE, 'IYYY-"W"IW'),
  TO_CHAR(CURRENT_DATE, 'YYYY-MM'),
  TO_CHAR(CURRENT_DATE, 'YYYY-"Q"Q'),
  EXTRACT(YEAR FROM CURRENT_DATE),
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb,  -- Structure: {"purpose_id": {"total_listings": 0, "total_sales": 0, ...}}
  '{}'::jsonb,  -- Structure: {"type_id": {"total_listings": 0, "total_sales": 0, ...}}
  '{}'::jsonb,  -- Structure: {"sub_type_id": {"total_listings": 0, "total_sales": 0, ...}}
  '{}'::jsonb,  -- Structure: {"category_id": {"total_listings": 0, "total_sales": 0, ...}}
  '{
    "total": 0,
    "new": 0,
    "active": 0,
    "deactivated_accounts": 0,
    "inactive": 0,
    "verified": 0,
    "unverified": 0,
    "total_listings": 0,
    "total_sales": 0,
    "total_revenue": 0,
    "total_leads_generated": 0
  }'::jsonb,
  '{
    "total": 0,
    "new": 0,
    "active": 0,
    "deactivated_accounts": 0,
    "inactive": 0,
    "verified": 0,
    "unverified": 0,
    "total_listings": 0,
    "total_sales": 0,
    "total_revenue": 0,
    "total_leads_generated": 0
  }'::jsonb,
  '{
    "total": 0,
    "new": 0,
    "active": 0,
    "deactivated_accounts": 0,
    "inactive": 0,
    "verified": 0,
    "unverified": 0,
    "total_listings": 0,
    "total_sales": 0,
    "total_revenue": 0,
    "total_leads_generated": 0
  }'::jsonb,
  '{
    "total": 0,
    "new": 0,
    "active": 0,
    "deactivated_accounts": 0,
    "inactive": 0,
    "verified": 0,
    "unverified": 0,
    "total_views": 0,
    "total_leads": 0,
    "saved_listings": 0
  }'::jsonb,
  '{
    "total_views": 0,
    "unique_views": 0,
    "logged_in_views": 0,
    "anonymous_views": 0,
    "views_by_source": {
      "home": 0,
      "explore": 0,
      "search": 0,
      "direct": 0
    }
  }'::jsonb,
  '{
    "total": 0,
    "social_media": 0,
    "website_visit": 0,
    "share": 0,
    "saved_listing": 0
  }'::jsonb,
  '{
    "total": 0,
    "unique": 0,
    "percentage": 0,
    "by_context": {}
  }'::jsonb,
  '{
    "total": 0,
    "unique": 0,
    "percentage": 0,
    "by_context": {}
  }'::jsonb,
  '{
    "total": 0,
    "unique": 0,
    "percentage": 0,
    "by_context": {}
  }'::jsonb,
  '{
    "total": 0,
    "unique": 0,
    "percentage": 0,
    "by_context": {}
  }'::jsonb,
  '{
    "total": 0,
    "unique": 0,
    "percentage": 0,
    "by_context": {}
  }'::jsonb,
  '{
    "total": 0,
    "sales_value": 0,
    "avg_sale_price": 0,
    "total_commission": 0,
    "avg_commission_rate": 0
  }'::jsonb,
  '{
    "conversion_rate": 0,
    "lead_to_sale_rate": 0
  }'::jsonb
);

-- Sample insert with test data (one entry in each array/category)
INSERT INTO admin_analytics (
  date,
  week,
  month,
  quarter,
  year,
  country,
  state,
  city,
  town,
  listings_by_property_purpose,
  listings_by_property_type,
  listings_by_sub_type,
  listings_by_category,
  developers_metrics,
  agents_metrics,
  agencies_metrics,
  property_seekers_metrics,
  platform_engagement,
  platform_impressions,
  phone_leads,
  message_leads,
  email_leads,
  appointment_leads,
  website_leads,
  sales_metrics,
  conversion_rates
) VALUES (
  '2025-01-16'::date,
  '2025-W03',
  '2025-01',
  '2025-Q1',
  2025,
  '[{
    "name": "Ghana",
    "total_listings": 234,
    "total_sales": 12,
    "total_views": 5678,
    "total_leads": 289,
    "sales_value": 3450000,
    "percentage": 32.5
  }]'::jsonb,
  '[{
    "name": "Greater Accra",
    "country": "Ghana",
    "total_listings": 156,
    "total_sales": 8,
    "total_views": 3456,
    "total_leads": 189,
    "sales_value": 2340000,
    "percentage": 21.7
  }]'::jsonb,
  '[{
    "name": "Accra",
    "state": "Greater Accra",
    "country": "Ghana",
    "total_listings": 123,
    "total_sales": 5,
    "total_views": 2345,
    "total_leads": 145,
    "sales_value": 1890000,
    "percentage": 17.1
  }]'::jsonb,
  '[{
    "name": "East Legon",
    "city": "Accra",
    "state": "Greater Accra",
    "country": "Ghana",
    "total_listings": 45,
    "total_sales": 2,
    "total_views": 890,
    "total_leads": 67,
    "sales_value": 450000,
    "percentage": 6.3
  }]'::jsonb,
  '{
    "1": {
      "total_listings": 234,
      "total_sales": 12,
      "total_views": 5678,
      "total_leads": 289,
      "sales_value": 3450000,
      "percentage": 32.5
    }
  }'::jsonb,
  '{
    "2": {
      "total_listings": 456,
      "total_sales": 23,
      "total_views": 9876,
      "total_leads": 456,
      "sales_value": 5670000,
      "percentage": 63.3
    }
  }'::jsonb,
  '{
    "5": {
      "total_listings": 298,
      "total_sales": 15,
      "total_views": 6789,
      "total_leads": 298,
      "sales_value": 2340000,
      "percentage": 41.4
    }
  }'::jsonb,
  '{
    "12": {
      "total_listings": 89,
      "total_sales": 5,
      "total_views": 2345,
      "total_leads": 123,
      "sales_value": 890000,
      "percentage": 12.4
    }
  }'::jsonb,
  '{
    "total": 156,
    "new": 5,
    "active": 98,
    "deactivated_accounts": 12,
    "inactive": 41,
    "verified": 134,
    "unverified": 22,
    "total_listings": 789,
    "total_sales": 8,
    "total_revenue": 2340000,
    "total_leads_generated": 456
  }'::jsonb,
  '{
    "total": 89,
    "new": 3,
    "active": 67,
    "deactivated_accounts": 5,
    "inactive": 12,
    "verified": 78,
    "unverified": 11,
    "total_listings": 298,
    "total_sales": 3,
    "total_revenue": 890000,
    "total_leads_generated": 234
  }'::jsonb,
  '{
    "total": 34,
    "new": 1,
    "active": 22,
    "deactivated_accounts": 2,
    "inactive": 9,
    "verified": 28,
    "unverified": 6,
    "total_listings": 123,
    "total_sales": 1,
    "total_revenue": 567000,
    "total_leads_generated": 89
  }'::jsonb,
  '{
    "total": 2568,
    "new": 36,
    "active": 1024,
    "deactivated_accounts": 234,
    "inactive": 1309,
    "verified": 2456,
    "unverified": 112,
    "total_views": 98765,
    "total_leads": 567,
    "saved_listings": 3456
  }'::jsonb,
  '{
    "total_views": 12456,
    "unique_views": 8900,
    "logged_in_views": 8456,
    "anonymous_views": 4000,
    "views_by_source": {
      "home": 4567,
      "explore": 3456,
      "search": 2890,
      "direct": 1543
    }
  }'::jsonb,
  '{
    "total": 34567,
    "social_media": 12345,
    "website_visit": 9876,
    "share": 7890,
    "saved_listing": 4456
  }'::jsonb,
  '{
    "total": 234,
    "unique": 189,
    "percentage": 41.3,
    "by_context": {
      "listing": 189,
      "profile": 45
    }
  }'::jsonb,
  '{
    "total": 189,
    "unique": 156,
    "percentage": 33.3,
    "by_context": {
      "listing": 145,
      "profile": 44
    }
  }'::jsonb,
  '{
    "total": 78,
    "unique": 67,
    "percentage": 13.8,
    "by_context": {
      "listing": 56,
      "profile": 22
    }
  }'::jsonb,
  '{
    "total": 45,
    "unique": 38,
    "percentage": 7.9,
    "by_context": {
      "listing": 38,
      "profile": 7
    }
  }'::jsonb,
  '{
    "total": 21,
    "unique": 18,
    "percentage": 3.7,
    "by_context": {
      "listing": 15,
      "profile": 6
    }
  }'::jsonb,
  '{
    "total": 12,
    "sales_value": 4280000,
    "avg_sale_price": 356667,
    "total_commission": 128400,
    "avg_commission_rate": 3.0
  }'::jsonb,
  '{
    "conversion_rate": 4.55,
    "lead_to_sale_rate": 2.12
  }'::jsonb
);

