-- Client Management Tables for Iska Homes
-- Run in Supabase SQL Editor
-- All enum-like fields use TEXT (frontend sends values dynamically)

-- 1. clients
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  client_code TEXT,
  client_type TEXT,
  status TEXT,
  source_channel TEXT,
  source_user_id UUID,
  emails JSONB DEFAULT '[]'::jsonb,
  phones JSONB DEFAULT '[]'::jsonb,
  address JSONB DEFAULT '{}'::jsonb,
  first_contact_date DATE,
  converted_date DATE,
  notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  clients_properties JSONB DEFAULT '[]'::jsonb,
  total_income_usd DECIMAL(15, 2) DEFAULT 0,
  developer_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_developer_id ON clients(developer_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_source_channel ON clients(source_channel);
CREATE INDEX IF NOT EXISTS idx_clients_client_code ON clients(developer_id, client_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_code_per_developer ON clients(developer_id, client_code) WHERE client_code IS NOT NULL AND client_code != '';

-- 2. client_user_assignments
CREATE TABLE IF NOT EXISTS client_user_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT,
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_client_user_assignments_client ON client_user_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_user_assignments_user ON client_user_assignments(user_id);

-- 3. client_transactions
CREATE TABLE IF NOT EXISTS client_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  amount DECIMAL(15, 2) NOT NULL,
  transaction_date TIMESTAMPTZ NOT NULL,
  transaction_type TEXT,
  payment_method TEXT,
  reference TEXT,
  status TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_transactions_client ON client_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_transactions_unit ON client_transactions(unit_id);
CREATE INDEX IF NOT EXISTS idx_client_transactions_date ON client_transactions(transaction_date);

-- 4. client_engagement_log
CREATE TABLE IF NOT EXISTS client_engagement_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  heading TEXT,
  note TEXT,
  date_time TIMESTAMPTZ NOT NULL,
  is_reminder BOOLEAN DEFAULT false,
  status TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_engagement_client ON client_engagement_log(client_id);
CREATE INDEX IF NOT EXISTS idx_client_engagement_date ON client_engagement_log(date_time);

-- 5. client_documents
CREATE TABLE IF NOT EXISTS client_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_documents_client ON client_documents(client_id);

-- Optional: updated_at trigger for clients
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_clients_updated_at ON clients;
CREATE TRIGGER trigger_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at();
