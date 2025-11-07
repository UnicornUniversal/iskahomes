-- =============================================
-- SUBSCRIPTIONS REQUEST TABLE
-- =============================================
-- This table stores manual payment requests from users
-- When a user selects manual payment, a request is created here
-- Admins can view, approve, or reject these requests
-- =============================================

CREATE TABLE IF NOT EXISTS subscriptions_request (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- References
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('developer', 'agent', 'agency')),
  package_id UUID NOT NULL REFERENCES subscriptions_package(id) ON DELETE RESTRICT,
  billing_information_id UUID REFERENCES billing_information(id) ON DELETE SET NULL,
  
  -- Request Details
  currency VARCHAR(10) NOT NULL CHECK (currency IN ('GHS', 'USD')),
  amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
  payment_method VARCHAR(50) CHECK (payment_method IN ('mobile_money', 'bank_transfer', 'cash', 'other')),
  
  -- Status & Workflow
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',                    -- Request created, waiting for payment proof
    'payment_proof_submitted',   -- User submitted payment proof, waiting for admin review
    'approved',                   -- Admin approved, subscription activated
    'rejected',                   -- Admin rejected the request
    'cancelled'                   -- Request cancelled (by user or admin)
  )),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Payment Proof (submitted by user)
  payment_reference VARCHAR(255), -- Transaction reference number
  payment_proof_url VARCHAR(500), -- URL to uploaded proof document/image
  payment_proof_submitted_at TIMESTAMP WITH TIME ZONE,
  user_notes TEXT, -- Notes from user when submitting payment proof
  
  -- Admin Actions
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID, -- Admin user ID who approved
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID, -- Admin user ID who rejected
  rejection_reason TEXT, -- Why the request was rejected
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_by UUID, -- Who cancelled it (user_id or admin_id)
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  admin_notes TEXT -- Internal admin notes
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_request_subscription_id ON subscriptions_request(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_request_invoice_id ON subscriptions_request(invoice_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_request_user_id ON subscriptions_request(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_request_user_type ON subscriptions_request(user_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_request_status ON subscriptions_request(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_request_requested_at ON subscriptions_request(requested_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_request_user_composite ON subscriptions_request(user_id, user_type, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_request_status_created ON subscriptions_request(status, created_at DESC);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscriptions_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscriptions_request_updated_at 
    BEFORE UPDATE ON subscriptions_request 
    FOR EACH ROW 
    EXECUTE FUNCTION update_subscriptions_request_updated_at();

-- Add comments for documentation
COMMENT ON TABLE subscriptions_request IS 'Stores manual payment requests from users. Tracks payment proof submission and admin approval workflow.';
COMMENT ON COLUMN subscriptions_request.status IS 'Request status: pending (awaiting payment proof), payment_proof_submitted (proof submitted, awaiting admin review), approved (admin approved, subscription activated), rejected (admin rejected), cancelled (request cancelled)';
COMMENT ON COLUMN subscriptions_request.payment_reference IS 'Transaction reference number provided by user (mobile money, bank transfer, etc.)';
COMMENT ON COLUMN subscriptions_request.payment_proof_url IS 'URL to uploaded payment proof document or image';
COMMENT ON COLUMN subscriptions_request.user_notes IS 'Notes from user when submitting payment proof';
COMMENT ON COLUMN subscriptions_request.rejection_reason IS 'Reason provided by admin when rejecting the request';
COMMENT ON COLUMN subscriptions_request.admin_notes IS 'Internal notes for admins (not visible to user)';

