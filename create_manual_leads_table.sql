-- Manual Leads Table
-- Stores leads entered manually by developers/agents (not from website actions)
-- These appear alongside regular leads in the Leads Management system

CREATE TABLE IF NOT EXISTS public.manual_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contact info (no seeker_id / auth required)
  contact_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50),
  
  -- Lister (who owns this lead)
  lister_id UUID NOT NULL,
  lister_type VARCHAR(20) NOT NULL,  -- 'developer', 'agent', 'agency'
  
  -- Optional: link to listing or development of interest
  listing_id UUID,
  development_id UUID,
  context_type VARCHAR(50) DEFAULT 'profile',  -- 'listing', 'development', 'profile'
  
  -- Source: how the lead was acquired
  source VARCHAR(50) DEFAULT 'manual',  -- 'manual', 'referral', 'walk_in', 'call', 'website', 'event'
  
  -- Status (same as leads table)
  status VARCHAR(50) DEFAULT 'new',
  status_tracker JSONB DEFAULT '["new"]'::jsonb,
  
  -- Notes (same format as leads)
  notes JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_manual_leads_lister ON manual_leads(lister_id, lister_type);
CREATE INDEX IF NOT EXISTS idx_manual_leads_listing ON manual_leads(listing_id);
CREATE INDEX IF NOT EXISTS idx_manual_leads_status ON manual_leads(status);
CREATE INDEX IF NOT EXISTS idx_manual_leads_created ON manual_leads(created_at DESC);

-- Update trigger
CREATE OR REPLACE FUNCTION update_manual_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_manual_leads_updated_at ON manual_leads;
CREATE TRIGGER trigger_manual_leads_updated_at
  BEFORE UPDATE ON manual_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_manual_leads_updated_at();
