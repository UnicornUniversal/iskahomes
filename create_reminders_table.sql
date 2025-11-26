-- =====================================================
-- REMINDERS TABLE
-- Stores reminders/tasks associated with leads
-- Supports grouped leads via grouped_lead_key
-- =====================================================

CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  grouped_lead_key TEXT NOT NULL,  -- Format: "seeker_id_listing_id" for grouping
  note_text TEXT NOT NULL,
  reminder_date DATE NOT NULL,
  reminder_time TIME,
  status TEXT DEFAULT 'incomplete' CHECK (status IN ('incomplete', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID  -- Optional: track who created it (user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reminders_grouped_key ON reminders(grouped_lead_key);
CREATE INDEX IF NOT EXISTS idx_reminders_date_status ON reminders(reminder_date, status);
CREATE INDEX IF NOT EXISTS idx_reminders_lead_id ON reminders(lead_id);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);
CREATE INDEX IF NOT EXISTS idx_reminders_date_time ON reminders(reminder_date, reminder_time) WHERE status = 'incomplete';

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_reminders_updated_at();

-- Add comment to table
COMMENT ON TABLE reminders IS 'Stores reminders and tasks associated with leads. Supports grouped leads via grouped_lead_key.';
COMMENT ON COLUMN reminders.grouped_lead_key IS 'Format: seeker_id_listing_id - used to group reminders for merged leads';
COMMENT ON COLUMN reminders.status IS 'incomplete: active reminder, completed: task done, cancelled: user cancelled';
COMMENT ON COLUMN reminders.priority IS 'Priority level: low, normal, high, urgent';

