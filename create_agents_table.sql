-- Create agents table
-- Agents are individuals working under agencies
-- They have their own listings, leads, and analytics aggregated from their activities

CREATE TABLE IF NOT EXISTS public.agents (
  -- Primary identifiers
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  agent_id uuid, -- UUID from user profile (matches auth.users.id) - NULL until invitation accepted
  agency_id uuid NOT NULL, -- References agencies.agency_id
  
  -- Basic information
  name character varying(255) NOT NULL,
  email character varying(255) NOT NULL,
  phone character varying(50),
  secondary_email character varying(255),
  secondary_phone character varying(50),
  
  -- Location information (references agency's company_locations array)
  location_id character varying(255), -- ID of the location from agency's company_locations array. If NULL, agent uses agency's primary location.
  
  -- Profile details
  bio text,
  profile_image text,
  cover_image text,
  website character varying(500),
  
  -- Social & contact
  social_media jsonb DEFAULT '{}'::jsonb, -- {facebook, instagram, linkedin, tiktok, twitter, youtube}
  
  -- Account status
  account_status character varying(20) DEFAULT 'pending', -- pending, active, inactive, suspended
  agent_status character varying(20) DEFAULT 'invited', -- invited, active, inactive, suspended
  slug character varying(255),
  last_login timestamp with time zone,
  profile_completion_percentage integer DEFAULT 0,
  
  -- Invitation fields
  invitation_token character varying(255) UNIQUE,
  invitation_expires_at timestamp with time zone,
  invitation_status character varying(20) DEFAULT 'pending', -- pending, sent, accepted, expired, cancelled
  invitation_sent_at timestamp with time zone,
  invitation_accepted_at timestamp with time zone,
  
  -- Commission (inherits from agency but can be overridden)
  commission_rate jsonb, -- If NULL, uses agency commission_rate. Structure: {"default": 3.0, "Rent": [...], "Sale": [...]}
  
  -- Agent-specific metrics (aggregated from listings and activities)
  total_listings integer DEFAULT 0, -- Total listings by this agent
  active_listings integer DEFAULT 0, -- Active listings
  total_views integer DEFAULT 0, -- Total views on agent's listings
  total_impressions integer DEFAULT 0, -- Total impressions
  total_leads integer DEFAULT 0, -- Total leads generated
  total_appointments integer DEFAULT 0, -- Total appointments scheduled
  properties_sold integer DEFAULT 0, -- Properties sold/completed
  total_revenue numeric(15, 2) DEFAULT 0, -- Total revenue from sales
  estimated_revenue numeric(15, 2) DEFAULT 0, -- Estimated revenue from active listings
  total_commission numeric(15, 2) DEFAULT 0, -- Total commission earned
  
  -- Analytics & statistics
  total_listing_views integer DEFAULT 0,
  total_profile_views integer DEFAULT 0,
  total_saved integer DEFAULT 0, -- Properties saved by users
  conversion_rate numeric(5, 2) DEFAULT 0, -- View to lead conversion rate
  leads_to_sales_rate numeric(5, 2) DEFAULT 0, -- Lead to sale conversion rate
  
  -- Change tracking (period-over-period)
  views_change numeric(5, 2) DEFAULT 0,
  impressions_change numeric(5, 2) DEFAULT 0,
  leads_change numeric(5, 2) DEFAULT 0,
  revenue_change numeric(5, 2) DEFAULT 0,
  
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
  
  -- Performance metrics
  average_response_time numeric(10, 2), -- Average response time in hours
  client_satisfaction_score numeric(3, 2), -- Rating out of 5.00
  
  -- Constraints
  CONSTRAINT agents_pkey PRIMARY KEY (id),
  CONSTRAINT agents_agent_id_key UNIQUE (agent_id),
  CONSTRAINT agents_email_key UNIQUE (email),
  CONSTRAINT agents_invitation_token_key UNIQUE (invitation_token),
  CONSTRAINT agents_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(agency_id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agents_agent_id ON public.agents USING btree (agent_id);
CREATE INDEX IF NOT EXISTS idx_agents_agency_id ON public.agents USING btree (agency_id);
CREATE INDEX IF NOT EXISTS idx_agents_email ON public.agents USING btree (email);
CREATE INDEX IF NOT EXISTS idx_agents_account_status ON public.agents USING btree (account_status);
CREATE INDEX IF NOT EXISTS idx_agents_agent_status ON public.agents USING btree (agent_status);
CREATE INDEX IF NOT EXISTS idx_agents_invitation_status ON public.agents USING btree (invitation_status);
CREATE INDEX IF NOT EXISTS idx_agents_invitation_token ON public.agents USING btree (invitation_token);
CREATE INDEX IF NOT EXISTS idx_agents_slug ON public.agents USING btree (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agents_location_id ON public.agents USING btree (location_id);

-- GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_agents_social_media_gin ON public.agents USING gin (social_media);
CREATE INDEX IF NOT EXISTS idx_agents_commission_rate_gin ON public.agents USING gin (commission_rate);
CREATE INDEX IF NOT EXISTS idx_agents_property_purposes_stats_gin ON public.agents USING gin (property_purposes_stats);
CREATE INDEX IF NOT EXISTS idx_agents_property_categories_stats_gin ON public.agents USING gin (property_categories_stats);
CREATE INDEX IF NOT EXISTS idx_agents_property_types_stats_gin ON public.agents USING gin (property_types_stats);
CREATE INDEX IF NOT EXISTS idx_agents_property_subtypes_stats_gin ON public.agents USING gin (property_subtypes_stats);
CREATE INDEX IF NOT EXISTS idx_agents_country_stats_gin ON public.agents USING gin (country_stats);
CREATE INDEX IF NOT EXISTS idx_agents_state_stats_gin ON public.agents USING gin (state_stats);
CREATE INDEX IF NOT EXISTS idx_agents_city_stats_gin ON public.agents USING gin (city_stats);
CREATE INDEX IF NOT EXISTS idx_agents_town_stats_gin ON public.agents USING gin (town_stats);
CREATE INDEX IF NOT EXISTS idx_agents_leads_breakdown_gin ON public.agents USING gin (leads_breakdown);

-- Add comments
COMMENT ON TABLE public.agents IS 'Agents table - individuals working under agencies with their own listings and analytics';
COMMENT ON COLUMN public.agents.agent_id IS 'UUID from user profile (matches auth.users.id) - NULL until invitation accepted';
COMMENT ON COLUMN public.agents.agency_id IS 'References agencies.agency_id - the agency this agent belongs to';
COMMENT ON COLUMN public.agents.invitation_token IS 'Unique token for invitation link - expires after 7 days';
COMMENT ON COLUMN public.agents.invitation_status IS 'Status of invitation: pending, sent, accepted, expired, cancelled';
COMMENT ON COLUMN public.agents.commission_rate IS 'Commission rates - if NULL, uses agency commission_rate. Structure: {"default": 3.0, "Rent": [...], "Sale": [...]}';
COMMENT ON COLUMN public.agents.location_id IS 'ID of the location from agency company_locations array. If NULL, agent uses agency primary location. Currency is inherited from the selected location.';
COMMENT ON COLUMN public.agents.total_commission IS 'Total commission earned by agent';
COMMENT ON COLUMN public.agents.properties_sold IS 'Number of properties sold/completed by agent';
COMMENT ON COLUMN public.agents.estimated_revenue IS 'Estimated revenue from active listings';
COMMENT ON COLUMN public.agents.average_response_time IS 'Average response time to leads in hours';
COMMENT ON COLUMN public.agents.client_satisfaction_score IS 'Client satisfaction rating out of 5.00';
