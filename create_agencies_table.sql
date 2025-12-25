-- Create agencies table
-- Agencies are organizations that can manage multiple agents
-- Similar structure to developers but tailored for agency operations

CREATE TABLE IF NOT EXISTS public.agencies (
  -- Primary identifiers
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  agency_id uuid NOT NULL, -- UUID from user profile (matches auth.users.id)
  
  -- Basic information
  name character varying(255) NOT NULL,
  email character varying(255) NOT NULL,
  phone character varying(50),
  secondary_email character varying(255),
  secondary_phone character varying(50),
  tertiary_email character varying(255),
  tertiary_phone character varying(50),
  website character varying(500),
  
  -- Location information
  address text,
  city character varying(100),
  region character varying(100),
  state character varying(100),
  country character varying(100),
  postal_code character varying(20),
  longitude double precision DEFAULT 0,
  latitude double precision DEFAULT 0,
  
  -- Company details
  description text,
  founded date,
  founded_year character varying(4),
  employees integer,
  company_size character varying(50),
  license character varying(255),
  license_number character varying(255),
  verified boolean DEFAULT false,
  
  -- Media
  profile_image text,
  cover_image text,
  
  -- Social & contact
  social_media jsonb DEFAULT '[]'::jsonb, -- {facebook, instagram, linkedin, tiktok, twitter, youtube}
  customer_care jsonb DEFAULT '[]'::jsonb, -- [{name, phone, email}]
  registration_files jsonb DEFAULT '[]'::jsonb, -- [{url, name, type}]
  
  -- Company locations (multiple offices)
  company_locations jsonb DEFAULT '[]'::jsonb, -- [{id, place_id, description, address, country, region, city, latitude, longitude, currency, currency_name, primary_location}]
  default_location_status boolean DEFAULT false,
  default_currency character varying(10),
  
  -- Company statistics
  company_statistics jsonb, -- [{label, value}] e.g., [{label: "Agents", value: "50+"}, {label: "Properties Sold", value: "1000+"}]
  
  -- Account status
  account_status character varying(20) DEFAULT 'active', -- active, inactive, suspended, pending
  slug character varying(255) NOT NULL,
  last_login timestamp with time zone,
  profile_completion_percentage integer DEFAULT 0,
  
  -- Agency-specific metrics (aggregated from agents)
  total_agents integer DEFAULT 0, -- Number of agents in the agency
  active_agents integer DEFAULT 0, -- Number of active agents
  total_listings integer DEFAULT 0, -- Total listings across all agents
  total_views integer DEFAULT 0, -- Total views across all agents
  total_impressions integer DEFAULT 0, -- Total impressions across all agents
  total_leads integer DEFAULT 0, -- Total leads across all agents
  total_appointments integer DEFAULT 0, -- Total appointments across all agents
  total_sales integer DEFAULT 0, -- Total sales across all agents
  total_revenue numeric(15, 2) DEFAULT 0, -- Total revenue across all agents
  estimated_revenue numeric(15, 2) DEFAULT 0, -- Estimated revenue
  
  -- Analytics & statistics
  total_listings_views integer DEFAULT 0,
  total_profile_views integer DEFAULT 0,
  total_saved integer DEFAULT 0, -- Properties saved by users
  conversion_rate numeric(5, 2) DEFAULT 0, -- View to lead conversion rate
  leads_to_sales_rate numeric(5, 2) DEFAULT 0, -- Lead to sale conversion rate
  
  -- Change tracking (period-over-period)
  views_change numeric(5, 2) DEFAULT 0,
  impressions_change numeric(5, 2) DEFAULT 0,
  leads_change numeric(5, 2) DEFAULT 0,
  
  -- Property statistics breakdown
  property_purposes_stats jsonb, -- Breakdown by purpose (sale, rent, etc.)
  property_categories_stats jsonb, -- Breakdown by category
  property_types_stats jsonb, -- Breakdown by type
  property_subtypes_stats jsonb, -- Breakdown by subtype
  
  -- Location statistics breakdown
  country_stats jsonb, -- Breakdown by country
  state_stats jsonb, -- Breakdown by state/region
  city_stats jsonb, -- Breakdown by city
  town_stats jsonb, -- Breakdown by town/neighborhood
  
  -- Leads breakdown
  leads_breakdown jsonb DEFAULT '{}'::jsonb, -- {phone: count, message: count, email: count, appointment: count}
  
  -- Commission & pricing (JSONB for commission rates)
  commission_rate jsonb DEFAULT '{"default": 3.0}'::jsonb, -- Commission rates - "default" is required. Can add rates by purpose (Rent, Sale) with property types/subtypes. Structure: {"default": 3.0, "Rent": [{"category": "property_type", "id": "type-id", "percentage": 10.0}], "Sale": [{"category": "property_subtype", "id": "subtype-id", "percentage": 5.0}]}
  
  -- Signup & invitation status
  invitation_status character varying(20), -- sent, accepted, expired
  signup_status character varying(20) DEFAULT 'pending', -- pending, verified, rejected
  invitation_sent_at timestamp with time zone,
  
  -- Constraints
  CONSTRAINT agencies_pkey PRIMARY KEY (id),
  CONSTRAINT agencies_agency_id_key UNIQUE (agency_id),
  CONSTRAINT agencies_slug_key UNIQUE (slug),
  CONSTRAINT agencies_email_key UNIQUE (email)
) TABLESPACE pg_default;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agencies_agency_id ON public.agencies USING btree (agency_id);
CREATE INDEX IF NOT EXISTS idx_agencies_slug ON public.agencies USING btree (slug);
CREATE INDEX IF NOT EXISTS idx_agencies_account_status ON public.agencies USING btree (account_status);
CREATE INDEX IF NOT EXISTS idx_agencies_email ON public.agencies USING btree (email);
CREATE INDEX IF NOT EXISTS idx_agencies_country ON public.agencies USING btree (country);
CREATE INDEX IF NOT EXISTS idx_agencies_city ON public.agencies USING btree (city);
CREATE INDEX IF NOT EXISTS idx_agencies_verified ON public.agencies USING btree (verified);

-- GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_agencies_company_locations_gin ON public.agencies USING gin (company_locations);
CREATE INDEX IF NOT EXISTS idx_agencies_social_media_gin ON public.agencies USING gin (social_media);
CREATE INDEX IF NOT EXISTS idx_agencies_customer_care_gin ON public.agencies USING gin (customer_care);
CREATE INDEX IF NOT EXISTS idx_agencies_company_statistics_gin ON public.agencies USING gin (company_statistics);
CREATE INDEX IF NOT EXISTS idx_agencies_commission_rate_gin ON public.agencies USING gin (commission_rate);

-- Add comments
COMMENT ON TABLE public.agencies IS 'Agencies table - organizations that manage multiple agents';
COMMENT ON COLUMN public.agencies.agency_id IS 'UUID from user profile (matches auth.users.id)';
COMMENT ON COLUMN public.agencies.total_agents IS 'Total number of agents in the agency';
COMMENT ON COLUMN public.agencies.active_agents IS 'Number of active agents';
COMMENT ON COLUMN public.agencies.total_listings IS 'Total listings across all agents in the agency';
COMMENT ON COLUMN public.agencies.company_locations IS 'Array of company locations/offices with currency support';
COMMENT ON COLUMN public.agencies.commission_rate IS 'Commission rates - "default" is required. Can add rates by purpose (Rent, Sale) with property types/subtypes. Structure: {"default": 3.0, "Rent": [{"category": "property_type", "id": "type-id", "percentage": 10.0}, {"category": "property_subtype", "id": "subtype-id", "percentage": 8.0}], "Sale": [{"category": "property_type", "id": "type-id", "percentage": 5.0}]}';

