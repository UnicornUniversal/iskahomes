-- Create transaction_records table for Iska Homes
-- This table stores transaction records for properties (payments, check-ins, check-outs, rent due dates, etc.)

CREATE TABLE IF NOT EXISTS transaction_records (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Core identification
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Registered user (property seeker/tenant)
  sale_listing_id UUID, -- FK to sales_listings if linked to a sale/rental (nullable)
  
  -- Transaction type and category
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
    'payment', 'rental_period', 'rent_due', 'deposit', 'security_deposit', 
    'refund', 'penalty', 'maintenance', 'utility', 'other'
  )),
  category UUID REFERENCES property_purposes(id) ON DELETE SET NULL, -- Property purpose (rent, sale, lease, etc.)
  subcategory VARCHAR(100), -- Optional subcategory
  
  -- Payment information
  amount NUMERIC(15, 2),
  currency VARCHAR(10) DEFAULT 'USD',
  payment_method VARCHAR(50) CHECK (payment_method IN (
    'cash', 'bank_transfer', 'mobile_money', 'check', 'card', 'other'
  )),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'completed', 'failed', 'refunded', 'cancelled'
  )),
  transaction_reference VARCHAR(255), -- Bank reference, check number, mobile money ref, etc.
  payment_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  
  -- Dates and scheduling
  check_in_date DATE, -- Rental period start
  check_out_date DATE, -- Rental period end
  rent_due_date DATE,
  period_start DATE, -- Billing period start
  period_end DATE, -- Billing period end
  
  -- Recurring payments
  is_recurring BOOLEAN DEFAULT false,
  recurring_period VARCHAR(20) CHECK (recurring_period IN ('monthly', 'quarterly', 'yearly', 'weekly')),
  recurring_frequency INTEGER, -- Every N periods
  parent_transaction_id UUID REFERENCES transaction_records(id) ON DELETE SET NULL, -- For recurring series
  
  -- Customer/Party Information (for non-registered users or additional info)
  customer_name VARCHAR(255),
  customer_first_name VARCHAR(100),
  customer_last_name VARCHAR(100),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  customer_secondary_phone VARCHAR(50),
  customer_address TEXT,
  customer_id_type VARCHAR(50) CHECK (customer_id_type IN (
    'national_id', 'passport', 'drivers_license', 'other'
  )),
  customer_id_number VARCHAR(100),
  customer_id_document JSONB, -- {id, url, path, name, uploaded_at}
  
  -- Documentation (flexible array of files - images and documents)
  receipt_images JSONB DEFAULT '[]'::jsonb, -- Array of image objects: [{id, url, path, name, size, type, uploaded_at}]
  additional_documents JSONB DEFAULT '[]'::jsonb, -- Array of document objects: [{id, url, path, name, size, type, uploaded_at}]
  
  -- Notes and descriptions
  notes TEXT,
  description TEXT,
  internal_notes TEXT, -- Agent/agency only notes
  
  -- Status and tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'completed', 'overdue', 'cancelled', 'disputed'
  )),
  is_overdue BOOLEAN DEFAULT false,
  overdue_days INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES agents(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional financial fields
  exchange_rate NUMERIC(10, 6), -- If payment in different currency
  converted_amount NUMERIC(15, 2), -- Amount in agency's base currency
  late_fee NUMERIC(15, 2),
  discount NUMERIC(15, 2),
  net_amount NUMERIC(15, 2), -- Amount after discount/fees
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES agents(id) ON DELETE SET NULL,
  last_modified_by UUID REFERENCES agents(id) ON DELETE SET NULL,
  tags JSONB DEFAULT '[]'::jsonb -- Array of strings for categorization
  
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transaction_records_listing_id ON transaction_records(listing_id);
CREATE INDEX IF NOT EXISTS idx_transaction_records_agent_id ON transaction_records(agent_id);
CREATE INDEX IF NOT EXISTS idx_transaction_records_agency_id ON transaction_records(agency_id);
CREATE INDEX IF NOT EXISTS idx_transaction_records_user_id ON transaction_records(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_records_transaction_type ON transaction_records(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transaction_records_category ON transaction_records(category);
CREATE INDEX IF NOT EXISTS idx_transaction_records_status ON transaction_records(status);
CREATE INDEX IF NOT EXISTS idx_transaction_records_payment_status ON transaction_records(payment_status);
CREATE INDEX IF NOT EXISTS idx_transaction_records_payment_date ON transaction_records(payment_date);
CREATE INDEX IF NOT EXISTS idx_transaction_records_due_date ON transaction_records(due_date);
CREATE INDEX IF NOT EXISTS idx_transaction_records_check_in_date ON transaction_records(check_in_date);
CREATE INDEX IF NOT EXISTS idx_transaction_records_check_out_date ON transaction_records(check_out_date);
CREATE INDEX IF NOT EXISTS idx_transaction_records_rent_due_date ON transaction_records(rent_due_date);
CREATE INDEX IF NOT EXISTS idx_transaction_records_created_at ON transaction_records(created_at);
CREATE INDEX IF NOT EXISTS idx_transaction_records_customer_name ON transaction_records(customer_name);
CREATE INDEX IF NOT EXISTS idx_transaction_records_customer_phone ON transaction_records(customer_phone);

-- GIN indexes for JSONB fields (for efficient searching)
CREATE INDEX IF NOT EXISTS idx_transaction_records_receipt_images_gin ON transaction_records USING GIN(receipt_images);
CREATE INDEX IF NOT EXISTS idx_transaction_records_additional_documents_gin ON transaction_records USING GIN(additional_documents);
CREATE INDEX IF NOT EXISTS idx_transaction_records_tags_gin ON transaction_records USING GIN(tags);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transaction_records_listing_status ON transaction_records(listing_id, status);
CREATE INDEX IF NOT EXISTS idx_transaction_records_agent_status ON transaction_records(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_transaction_records_agency_status ON transaction_records(agency_id, status);
CREATE INDEX IF NOT EXISTS idx_transaction_records_type_status ON transaction_records(transaction_type, status);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_transaction_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_transaction_records_updated_at
  BEFORE UPDATE ON transaction_records
  FOR EACH ROW
  EXECUTE FUNCTION update_transaction_records_updated_at();

-- Function to calculate overdue days (can be used in queries or computed columns)
CREATE OR REPLACE FUNCTION calculate_overdue_days(due_date_val DATE, payment_date_val TIMESTAMP WITH TIME ZONE)
RETURNS INTEGER AS $$
BEGIN
  IF due_date_val IS NULL THEN
    RETURN 0;
  END IF;
  
  IF payment_date_val IS NOT NULL THEN
    RETURN 0; -- Already paid
  END IF;
  
  RETURN GREATEST(0, CURRENT_DATE - due_date_val);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add comment to table
COMMENT ON TABLE transaction_records IS 'Stores transaction records for properties including payments, check-ins, check-outs, rent due dates, and related information';

-- Add comments to key columns
COMMENT ON COLUMN transaction_records.transaction_type IS 'Type of transaction: payment, rental_period, rent_due, deposit, etc.';
COMMENT ON COLUMN transaction_records.category IS 'Property purpose (rent, sale, lease) - references property_purposes table';
COMMENT ON COLUMN transaction_records.receipt_images IS 'Array of receipt image objects: [{id, url, path, name, size, type, uploaded_at}]';
COMMENT ON COLUMN transaction_records.additional_documents IS 'Array of document objects (images or PDFs): [{id, url, path, name, size, type, uploaded_at}]';
COMMENT ON COLUMN transaction_records.customer_id_document IS 'ID document image object: {id, url, path, name, uploaded_at}';
COMMENT ON COLUMN transaction_records.check_in_date IS 'Rental period start date (check-in)';
COMMENT ON COLUMN transaction_records.check_out_date IS 'Rental period end date (check-out)';

