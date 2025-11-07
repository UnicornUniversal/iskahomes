-- Create leads table to track individual lead actions and management
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL,
  lister_id UUID NOT NULL,              -- Always populated (developer_id OR agent_id OR agency_id)
  lister_type VARCHAR(20) NOT NULL,     -- 'developer', 'agent', 'agency'
  seeker_id UUID NOT NULL,              -- Property seeker who performed actions
  lead_actions JSONB DEFAULT '[]',     -- Array of all lead actions from PostHog
  total_actions INTEGER DEFAULT 0,     -- Count of total actions
  first_action_date DATE NOT NULL,
  last_action_date DATE NOT NULL,
  last_action_type VARCHAR(50),        -- Most recent action type
  status VARCHAR(50) DEFAULT 'new',    -- Overall lead status
  notes JSONB DEFAULT '[]',            -- Array of text strings (user-generated)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_listing_id ON leads(listing_id);
CREATE INDEX IF NOT EXISTS idx_leads_lister_id ON leads(lister_id);
CREATE INDEX IF NOT EXISTS idx_leads_lister_type ON leads(lister_type);
CREATE INDEX IF NOT EXISTS idx_leads_seeker_id ON leads(seeker_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_first_action_date ON leads(first_action_date);
CREATE INDEX IF NOT EXISTS idx_leads_last_action_date ON leads(last_action_date);

-- Create unique index to prevent duplicate leads for the same seeker on the same listing
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_unique_seeker_listing 
ON leads(listing_id, seeker_id);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_leads_lister_status ON leads(lister_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_lister_type_status ON leads(lister_type, status);
CREATE INDEX IF NOT EXISTS idx_leads_listing_status ON leads(listing_id, status);

-- Example queries for the leads table:

-- Get all leads for a specific developer
-- SELECT * FROM leads WHERE lister_id = 'developer_uuid' AND lister_type = 'developer';

-- Get all leads for a specific agent
-- SELECT * FROM leads WHERE lister_id = 'agent_uuid' AND lister_type = 'agent';

-- Get all leads for a specific listing
-- SELECT * FROM leads WHERE listing_id = 'listing_uuid';

-- Get leads by status
-- SELECT * FROM leads WHERE status = 'new';

-- Get leads with multiple actions (hot leads)
-- SELECT * FROM leads WHERE total_actions > 1 ORDER BY total_actions DESC;

-- Get leads by action type
-- SELECT * FROM leads WHERE last_action_type = 'lead_appointment';

-- Get leads with notes
-- SELECT * FROM leads WHERE jsonb_array_length(notes) > 0;

-- Get leads for a specific seeker across all listings
-- SELECT * FROM leads WHERE seeker_id = 'seeker_uuid';

-- Get lead statistics by lister
-- SELECT 
--   lister_id,
--   lister_type,
--   COUNT(*) as total_leads,
--   COUNT(CASE WHEN status = 'new' THEN 1 END) as new_leads,
--   COUNT(CASE WHEN status = 'contacted' THEN 1 END) as contacted_leads,
--   AVG(total_actions) as avg_actions_per_lead
-- FROM leads 
-- GROUP BY lister_id, lister_type;
