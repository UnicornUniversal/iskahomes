-- Create agents table (similar to developers but with agency_id and total_listings)
CREATE TABLE IF NOT EXISTS public.agents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  agent_id uuid NOT NULL, -- UUID from user profile (matches user.id)
  agency_id uuid, -- ID of the agency this agent belongs to
  name character varying(255) NOT NULL,
  email character varying(255) NOT NULL,
  phone character varying(50),
  secondary_email character varying(255),
  secondary_phone character varying(50),
  tertiary_email character varying(255),
  tertiary_phone character varying(50),
  website character varying(500),
  address text,
  city character varying(100),
  region character varying(100),
  country character varying(100),
  postal_code character varying(20),
  founded date,
  employees integer,
  license character varying(255),
  description text,
  profile_image text,
  cover_image text,
  social_media jsonb DEFAULT '[]'::jsonb,
  customer_care jsonb DEFAULT '[]'::jsonb,
  registration_files jsonb DEFAULT '[]'::jsonb,
  account_status character varying(20) DEFAULT 'active',
  slug character varying(255) NOT NULL,
  last_login timestamp with time zone,
  profile_completion_percentage integer DEFAULT 0,
  total_listings integer DEFAULT 0, -- Changed from total_units to total_listings
  total_developments integer DEFAULT 0,
  specialization character varying(255),
  company_size character varying(50),
  founded_year character varying(4),
  license_number character varying(255),
  verified boolean,
  state character varying(100),
  longitude double precision DEFAULT 0,
  latitude double precision DEFAULT 0,
  total_appointments integer DEFAULT 0,
  default_currency character varying(10),
  company_statistics jsonb,
  default_location_status boolean DEFAULT false,
  company_locations jsonb,
  commission_rate numeric(5, 2) DEFAULT 100,
  estimated_revenue numeric(15, 2) DEFAULT 0,
  total_revenue numeric(15, 2) DEFAULT 0,
  total_leads integer DEFAULT 0,
  property_purposes_stats jsonb,
  property_categories_stats jsonb,
  property_types_stats jsonb,
  property_subtypes_stats jsonb,
  country_stats jsonb,
  state_stats jsonb,
  city_stats jsonb,
  town_stats jsonb,
  total_views integer DEFAULT 0,
  total_impressions integer DEFAULT 0,
  total_saved integer DEFAULT 0,
  conversion_rate numeric(5, 2) DEFAULT 0,
  leads_to_sales_rate numeric(5, 2) DEFAULT 0,
  total_sales integer DEFAULT 0,
  views_change numeric(5, 2) DEFAULT 0,
  impressions_change numeric(5, 2) DEFAULT 0,
  leads_change numeric(5, 2) DEFAULT 0,
  total_listings_views integer DEFAULT 0,
  total_profile_views integer DEFAULT 0,
  leads_breakdown jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT agents_pkey PRIMARY KEY (id),
  CONSTRAINT agents_agent_id_key UNIQUE (agent_id),
  CONSTRAINT agents_slug_key UNIQUE (slug),
  CONSTRAINT agents_email_key UNIQUE (email)
) TABLESPACE pg_default;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agents_agent_id ON public.agents USING btree (agent_id);
CREATE INDEX IF NOT EXISTS idx_agents_agency_id ON public.agents USING btree (agency_id);
CREATE INDEX IF NOT EXISTS idx_agents_slug ON public.agents USING btree (slug);
CREATE INDEX IF NOT EXISTS idx_agents_account_status ON public.agents USING btree (account_status);
CREATE INDEX IF NOT EXISTS idx_agents_email ON public.agents USING btree (email);

-- Add comments
COMMENT ON TABLE public.agents IS 'Agents table - similar to developers but with agency_id and total_listings';
COMMENT ON COLUMN public.agents.agent_id IS 'UUID from user profile (matches user.id)';
COMMENT ON COLUMN public.agents.agency_id IS 'ID of the agency this agent belongs to';
COMMENT ON COLUMN public.agents.total_listings IS 'Total number of listings (changed from total_units)';

