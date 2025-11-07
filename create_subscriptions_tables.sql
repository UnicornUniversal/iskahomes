-- =============================================
-- SUBSCRIPTIONS AND BILLING SYSTEM TABLES
-- =============================================
-- This script creates 4 tables:
-- 1. subscriptions - Current active subscriptions
-- 2. subscription_history - Audit trail of all subscription changes
-- 3. invoices - Payment transactions/invoices
-- 4. billing_information - User payment method details
-- =============================================

-- =============================================
-- 1. SUBSCRIPTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User information
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('developer', 'agent', 'agency')),
  package_id UUID NOT NULL REFERENCES subscriptions_package(id) ON DELETE RESTRICT,
  
  -- Status & Dates
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled', 'suspended', 'grace_period')),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  grace_period_end_date TIMESTAMP WITH TIME ZONE NOT NULL, -- end_date + 7 days
  activated_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  
  -- Subscription Details
  auto_renew BOOLEAN DEFAULT false,
  currency VARCHAR(10) NOT NULL CHECK (currency IN ('GHS', 'USD')),
  amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
  duration_months INTEGER NOT NULL CHECK (duration_months > 0),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  admin_notes TEXT,
  
  -- Constraints
  CONSTRAINT check_grace_period CHECK (grace_period_end_date >= end_date)
);

-- Create indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_type ON subscriptions(user_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_package_id ON subscriptions(package_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_grace_period_end_date ON subscriptions(grace_period_end_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_composite ON subscriptions(user_id, user_type, status);

-- Create unique constraint: one active subscription per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_unique_active_user 
ON subscriptions(user_id, user_type) 
WHERE status IN ('active', 'grace_period', 'pending');

-- =============================================
-- 2. SUBSCRIPTION_HISTORY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS subscription_history (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- References
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('developer', 'agent', 'agency')),
  
  -- Event Details
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'created', 
    'activated', 
    'renewed', 
    'upgraded', 
    'downgraded', 
    'cancelled', 
    'expired', 
    'suspended', 
    'reactivated', 
    'payment_received',
    'grace_period_started',
    'grace_period_ended'
  )),
  event_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  from_package_id UUID REFERENCES subscriptions_package(id) ON DELETE SET NULL,
  to_package_id UUID REFERENCES subscriptions_package(id) ON DELETE SET NULL,
  from_status VARCHAR(20),
  to_status VARCHAR(20),
  reason TEXT,
  changed_by VARCHAR(20) NOT NULL CHECK (changed_by IN ('user', 'admin', 'system')),
  changed_by_user_id UUID, -- Admin or user who made the change
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb -- Additional context about the event
);

-- Create indexes for subscription_history
CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription_id ON subscription_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_type ON subscription_history(user_type);
CREATE INDEX IF NOT EXISTS idx_subscription_history_event_type ON subscription_history(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_history_event_date ON subscription_history(event_date);
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_composite ON subscription_history(user_id, user_type, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_history_metadata_gin ON subscription_history USING GIN (metadata);

-- =============================================
-- 3. INVOICES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS invoices (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Invoice Identity
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('developer', 'agent', 'agency')),
  
  -- Invoice Details
  invoice_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  currency VARCHAR(10) NOT NULL CHECK (currency IN ('GHS', 'USD')),
  amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
  tax_amount DECIMAL(15, 2) DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount DECIMAL(15, 2) NOT NULL CHECK (total_amount >= 0),
  
  -- Payment Details
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  payment_method VARCHAR(50) CHECK (payment_method IN ('mobile_money', 'bank_transfer', 'cash', 'other')),
  payment_reference VARCHAR(255), -- Transaction reference/confirmation number
  payment_date TIMESTAMP WITH TIME ZONE,
  paid_amount DECIMAL(15, 2) CHECK (paid_amount >= 0),
  payment_notes TEXT,
  
  -- Billing Period
  billing_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  billing_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  admin_notes TEXT,
  receipt_url VARCHAR(500), -- URL to generated receipt if applicable
  
  -- Constraints
  CONSTRAINT check_billing_period CHECK (billing_period_end >= billing_period_start),
  CONSTRAINT check_total_amount CHECK (total_amount = amount + tax_amount)
);

-- Create indexes for invoices
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_type ON invoices(user_type);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_date ON invoices(payment_date);
CREATE INDEX IF NOT EXISTS idx_invoices_user_composite ON invoices(user_id, user_type, invoice_date DESC);

-- =============================================
-- 4. BILLING_INFORMATION TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS billing_information (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User information
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('developer', 'agent', 'agency')),
  
  -- Payment Method Preference
  preferred_payment_method VARCHAR(50) CHECK (preferred_payment_method IN ('mobile_money', 'bank_transfer', 'cash', 'other')),
  
  -- Mobile Money Details
  mobile_money_provider VARCHAR(50) CHECK (mobile_money_provider IN ('mtn', 'vodafone', 'airteltigo', 'other')),
  mobile_money_number VARCHAR(50),
  mobile_money_account_name VARCHAR(255),
  
  -- Bank Transfer Details
  bank_name VARCHAR(255),
  bank_account_number VARCHAR(100),
  bank_account_name VARCHAR(255),
  bank_branch VARCHAR(255),
  bank_swift_code VARCHAR(50), -- For international transfers
  
  -- Contact Details
  billing_email VARCHAR(255),
  billing_phone VARCHAR(50),
  billing_address TEXT,
  
  -- Status
  is_primary BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID, -- Admin who verified (references admin users if you have that table)
  notes TEXT -- Internal notes
);

-- Create indexes for billing_information
CREATE INDEX IF NOT EXISTS idx_billing_info_user_id ON billing_information(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_info_user_type ON billing_information(user_type);
CREATE INDEX IF NOT EXISTS idx_billing_info_is_primary ON billing_information(is_primary);
CREATE INDEX IF NOT EXISTS idx_billing_info_is_verified ON billing_information(is_verified);
CREATE INDEX IF NOT EXISTS idx_billing_info_user_composite ON billing_information(user_id, user_type, is_primary);

-- Create unique constraint: one primary billing info per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_info_unique_primary_user 
ON billing_information(user_id, user_type) 
WHERE is_primary = true;

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

-- Trigger function for subscriptions
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON subscriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_subscriptions_updated_at();

-- Trigger function for invoices
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_invoices_updated_at();

-- Trigger function for billing_information
CREATE OR REPLACE FUNCTION update_billing_information_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_billing_information_updated_at 
    BEFORE UPDATE ON billing_information 
    FOR EACH ROW 
    EXECUTE FUNCTION update_billing_information_updated_at();

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

-- Subscriptions table comments
COMMENT ON TABLE subscriptions IS 'Stores current active subscriptions for users (developers, agents, agencies)';
COMMENT ON COLUMN subscriptions.status IS 'Subscription status: pending (awaiting payment), active (currently active), expired (past end_date and grace_period), cancelled (manually cancelled), suspended (admin suspended), grace_period (past end_date but within 7-day grace period)';
COMMENT ON COLUMN subscriptions.grace_period_end_date IS 'Calculated as end_date + 7 days. User has access until this date even after end_date passes';
COMMENT ON COLUMN subscriptions.auto_renew IS 'Whether subscription should auto-renew (currently false since payments are manual)';
COMMENT ON COLUMN subscriptions.duration_months IS 'Actual subscription duration in months (e.g., 1, 3, 12)';

-- Subscription history table comments
COMMENT ON TABLE subscription_history IS 'Audit trail of all subscription changes and events';
COMMENT ON COLUMN subscription_history.event_type IS 'Type of event: created, activated, renewed, upgraded, downgraded, cancelled, expired, suspended, reactivated, payment_received, grace_period_started, grace_period_ended';
COMMENT ON COLUMN subscription_history.changed_by IS 'Who initiated the change: user (self-service), admin (manual admin action), system (automated process)';
COMMENT ON COLUMN subscription_history.metadata IS 'JSONB object storing additional context about the event (e.g., old package details, new package details, payment info)';

-- Invoices table comments
COMMENT ON TABLE invoices IS 'Stores payment transactions and invoices for subscriptions';
COMMENT ON COLUMN invoices.invoice_number IS 'Unique invoice identifier (e.g., INV-2024-001234). Should be auto-generated sequentially';
COMMENT ON COLUMN invoices.payment_status IS 'Payment status: pending (awaiting payment), paid (payment received), failed (payment failed), cancelled (invoice cancelled), refunded (payment refunded)';
COMMENT ON COLUMN invoices.payment_reference IS 'Transaction reference number from payment provider (mobile money, bank transfer, etc.)';
COMMENT ON COLUMN invoices.billing_period_start IS 'Start date of the billing period this invoice covers';
COMMENT ON COLUMN invoices.billing_period_end IS 'End date of the billing period this invoice covers';

-- Billing information table comments
COMMENT ON TABLE billing_information IS 'Stores user payment method details (bank accounts, mobile money numbers, etc.)';
COMMENT ON COLUMN billing_information.is_primary IS 'Whether this is the primary payment method for the user. Only one primary per user';
COMMENT ON COLUMN billing_information.is_verified IS 'Whether admin has verified this payment method';
COMMENT ON COLUMN billing_information.verified_by IS 'UUID of admin user who verified this payment method';

