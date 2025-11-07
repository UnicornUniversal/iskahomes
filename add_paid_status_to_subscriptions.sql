-- =============================================
-- ADD PAID_STATUS FIELD TO SUBSCRIPTIONS TABLE
-- =============================================
-- Adds paid_status field to separate payment status from subscription status
-- This allows tracking payment state independently from subscription lifecycle
-- =============================================

-- Add paid_status column
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS paid_status VARCHAR(20) DEFAULT 'pending' CHECK (paid_status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded', 'partial'));

-- Add comment for documentation
COMMENT ON COLUMN subscriptions.paid_status IS 'Payment status for the subscription: pending (not yet paid), paid (payment received), failed (payment failed), cancelled (payment cancelled), refunded (payment refunded), partial (partial payment received)';

-- Update existing subscriptions based on their current status
-- If status is 'active' or 'grace_period', assume payment was made (set to 'paid')
-- If status is 'pending', keep as 'pending'
-- If status is 'cancelled', set to 'cancelled'
-- If status is 'expired', set to 'paid' (assuming it was paid when active)
UPDATE subscriptions
SET paid_status = CASE
  WHEN status IN ('active', 'grace_period') THEN 'paid'
  WHEN status = 'pending' THEN 'pending'
  WHEN status = 'cancelled' THEN 'cancelled'
  WHEN status = 'expired' THEN 'paid' -- Expired subscriptions were likely paid when active
  WHEN status = 'suspended' THEN 'paid' -- Suspended subscriptions were likely paid
  ELSE 'pending'
END
WHERE paid_status IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_paid_status ON subscriptions(paid_status);

-- Create composite index for common queries (status + paid_status)
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_paid_status ON subscriptions(status, paid_status);

