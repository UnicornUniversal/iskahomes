-- Add next_due_date to client_service_charges
-- next_due_date = period_end + 1 day (the day after the billing period ends)
-- Used to determine if a service charge is overdue (next_due_date < today), not the status field
-- Run in Supabase SQL Editor

-- 1. Add the column
ALTER TABLE client_service_charges
ADD COLUMN IF NOT EXISTS next_due_date DATE;

-- 2. Backfill existing rows: next_due_date = period_end + 1 day
UPDATE client_service_charges
SET next_due_date = period_end + INTERVAL '1 day'
WHERE period_end IS NOT NULL;

-- 3. Index for filtering overdue / due soon
CREATE INDEX IF NOT EXISTS idx_client_service_charges_next_due_date ON client_service_charges(next_due_date);
