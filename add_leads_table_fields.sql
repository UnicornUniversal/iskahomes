-- Add new columns to leads table for manual leads and lead attribution
-- lead_type: 'manual' | 'automated' - how the lead was created
-- lead_source: share medium - whatsapp, copy_link, website, facebook, twitter, email, etc.
-- lead_origin: where the lead came from - platform, their_website, referral, walk_in, phone_call, event, social_media, other
-- lead_name, lead_email, lead_phone: for manual leads when seeker_id is null

-- 1. Make seeker_id nullable (for manual leads)
ALTER TABLE leads
ALTER COLUMN seeker_id DROP NOT NULL;

-- 2. Add manual lead contact info columns
-- (If you previously added seeker_name, seeker_email, seeker_phone, run the RENAME block below first)
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS lead_name TEXT;

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS lead_email TEXT;

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS lead_phone TEXT;

-- Optional: Rename old columns if they exist (run only if you had seeker_name, seeker_email, seeker_phone)
-- ALTER TABLE leads RENAME COLUMN seeker_name TO lead_name;
-- ALTER TABLE leads RENAME COLUMN seeker_email TO lead_email;
-- ALTER TABLE leads RENAME COLUMN seeker_phone TO lead_phone;

-- 3. Add lead attribution columns
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS lead_type VARCHAR(20) DEFAULT 'automated';

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS lead_source VARCHAR(50);

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS lead_origin VARCHAR(50);

-- 3b. Add assigned_user - user ID of team member/agent assigned to the lead (admin can assign)
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS assigned_user UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. Set default lead_type and lead_origin for existing rows (automated, from platform)
UPDATE leads
SET lead_type = 'automated'
WHERE lead_type IS NULL;

UPDATE leads
SET lead_origin = 'platform'
WHERE lead_origin IS NULL AND lead_type = 'automated';

-- 5. Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_leads_lead_type ON leads(lead_type);
CREATE INDEX IF NOT EXISTS idx_leads_lead_source ON leads(lead_source);
CREATE INDEX IF NOT EXISTS idx_leads_lead_origin ON leads(lead_origin);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_user ON leads(assigned_user);

-- 6. Add comments
COMMENT ON COLUMN leads.seeker_id IS 'Property seeker user ID. NULL for manual leads.';
COMMENT ON COLUMN leads.lead_name IS 'Contact name for manual leads (when seeker_id is null).';
COMMENT ON COLUMN leads.lead_email IS 'Contact email for manual leads.';
COMMENT ON COLUMN leads.lead_phone IS 'Contact phone for manual leads.';
COMMENT ON COLUMN leads.lead_type IS 'How lead was created: manual or automated.';
COMMENT ON COLUMN leads.lead_source IS 'Share medium: whatsapp, copy_link, website, facebook, etc.';
COMMENT ON COLUMN leads.lead_origin IS 'Where lead came from: platform, their_website, referral, walk_in, etc.';
COMMENT ON COLUMN leads.assigned_user IS 'User ID of team member/agent assigned to this lead (admin assignment).';
