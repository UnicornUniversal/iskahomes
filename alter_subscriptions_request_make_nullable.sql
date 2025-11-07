-- =============================================
-- ALTER SUBSCRIPTIONS REQUEST TABLE
-- Add previous_subscription_id and next_subscription_id
-- Make subscription_id and invoice_id nullable
-- =============================================
-- This allows creating subscription requests BEFORE
-- a subscription is created (when admin approves)
-- =============================================

-- Make subscription_id nullable (keep for backward compatibility, but we'll use previous/next)
ALTER TABLE subscriptions_request 
ALTER COLUMN subscription_id DROP NOT NULL;

-- Make invoice_id nullable
ALTER TABLE subscriptions_request 
ALTER COLUMN invoice_id DROP NOT NULL;

-- Add previous_subscription_id (current subscription user has)
ALTER TABLE subscriptions_request 
ADD COLUMN IF NOT EXISTS previous_subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL;

-- Add next_subscription_id (will be set when admin approves and creates new subscription)
ALTER TABLE subscriptions_request 
ADD COLUMN IF NOT EXISTS next_subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL;

-- Update the foreign key constraints to allow NULL
ALTER TABLE subscriptions_request 
DROP CONSTRAINT IF EXISTS subscriptions_request_subscription_id_fkey;

ALTER TABLE subscriptions_request 
ADD CONSTRAINT subscriptions_request_subscription_id_fkey 
FOREIGN KEY (subscription_id) 
REFERENCES subscriptions(id) 
ON DELETE CASCADE;

ALTER TABLE subscriptions_request 
DROP CONSTRAINT IF EXISTS subscriptions_request_invoice_id_fkey;

ALTER TABLE subscriptions_request 
ADD CONSTRAINT subscriptions_request_invoice_id_fkey 
FOREIGN KEY (invoice_id) 
REFERENCES invoices(id) 
ON DELETE CASCADE;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_subscriptions_request_previous_subscription_id ON subscriptions_request(previous_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_request_next_subscription_id ON subscriptions_request(next_subscription_id);

-- Add comments
COMMENT ON COLUMN subscriptions_request.subscription_id IS 'Subscription ID (nullable - kept for backward compatibility, use previous_subscription_id instead)';
COMMENT ON COLUMN subscriptions_request.invoice_id IS 'Invoice ID (nullable - will be set when admin approves and creates invoice)';
COMMENT ON COLUMN subscriptions_request.previous_subscription_id IS 'The current/active subscription the user has before this request';
COMMENT ON COLUMN subscriptions_request.next_subscription_id IS 'The new subscription that will be created when admin approves this request';

