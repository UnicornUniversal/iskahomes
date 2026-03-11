-- Client Service Charges Table for Iska Homes
-- Run in Supabase SQL Editor
-- Service charges are SEPARATE from client_transactions (which handles rent, documents, etc.)

CREATE TABLE IF NOT EXISTS client_service_charges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  amount DECIMAL(15, 2) NOT NULL,
  period_start DATE,
  period_end DATE,
  status TEXT DEFAULT 'Pending',
  paid_at DATE,
  billing_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_service_charges_client ON client_service_charges(client_id);
CREATE INDEX IF NOT EXISTS idx_client_service_charges_unit ON client_service_charges(unit_id);
CREATE INDEX IF NOT EXISTS idx_client_service_charges_created ON client_service_charges(created_at);
