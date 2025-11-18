-- Add status_tracker field to leads table
-- This field tracks the history of status changes for a lead

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS status_tracker JSONB DEFAULT '[]';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_status_tracker ON leads USING GIN (status_tracker);

-- Update existing records to have empty status_tracker array
UPDATE leads 
SET status_tracker = '[]' 
WHERE status_tracker IS NULL;

-- For existing records, initialize status_tracker with their current status
-- This ensures we don't lose the initial status
UPDATE leads 
SET status_tracker = jsonb_build_array(status)
WHERE status_tracker = '[]' AND status IS NOT NULL;

-- Add lead_score field to leads table
-- This field stores the aggregated points from all lead actions
-- Scoring: Appointment=40, Phone=30, Direct Messaging=20, WhatsApp=15, Email=10

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON leads(lead_score);

-- Function to calculate lead_score from lead_actions
CREATE OR REPLACE FUNCTION calculate_lead_score(actions JSONB)
RETURNS INTEGER AS $$
DECLARE
  action JSONB;
  action_type TEXT;
  message_type TEXT;
  score INTEGER := 0;
BEGIN
  -- If actions is null or empty, return 0
  IF actions IS NULL OR jsonb_array_length(actions) = 0 THEN
    RETURN 0;
  END IF;

  -- Loop through each action and calculate points
  FOR action IN SELECT * FROM jsonb_array_elements(actions)
  LOOP
    action_type := action->>'action_type';
    
    -- Check action type and assign points
    IF action_type = 'lead_appointment' THEN
      score := score + 40;
    ELSIF action_type = 'lead_phone' THEN
      score := score + 30;
    ELSIF action_type = 'lead_message' THEN
      -- Check message_type in action_metadata
      message_type := COALESCE(
        LOWER(action->'action_metadata'->>'message_type'),
        LOWER(action->'action_metadata'->>'messageType'),
        'direct_message'
      );
      
      IF message_type = 'email' THEN
        score := score + 10;
      ELSIF message_type = 'whatsapp' THEN
        score := score + 15;
      ELSE
        -- Default to direct messaging
        score := score + 20;
      END IF;
    END IF;
  END LOOP;

  RETURN score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate lead_score for all existing records
UPDATE leads 
SET lead_score = calculate_lead_score(lead_actions)
WHERE lead_score IS NULL OR lead_score = 0;

