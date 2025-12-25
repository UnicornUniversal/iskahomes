-- ============================================
-- ADD MISSING INVITATION FIELDS TO AGENCIES TABLE
-- ============================================
-- This migration adds invitation_token and invitation_expires_at fields
-- to track the signup flow: invitation sent -> email verified -> signup completed
-- 
-- Note: invitation_status, signup_status, and invitation_sent_at already exist in the table

-- Add missing invitation fields to agencies table
ALTER TABLE public.agencies
ADD COLUMN IF NOT EXISTS invitation_token character varying(255),
ADD COLUMN IF NOT EXISTS invitation_expires_at timestamp with time zone;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_agencies_invitation_token ON public.agencies(invitation_token) WHERE invitation_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agencies_invitation_status ON public.agencies(invitation_status) WHERE invitation_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agencies_signup_status ON public.agencies(signup_status) WHERE signup_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agencies_invitation_expires_at ON public.agencies(invitation_expires_at) WHERE invitation_expires_at IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.agencies.invitation_token IS 'Unique token for email verification. Generated during signup and cleared after verification.';
COMMENT ON COLUMN public.agencies.invitation_expires_at IS 'Timestamp when invitation token expires (typically 24 hours after sending). Used to track expired invitations.';
COMMENT ON COLUMN public.agencies.invitation_status IS 'Status of invitation email: pending, sent, failed, expired, accepted';
COMMENT ON COLUMN public.agencies.signup_status IS 'Status of signup process: pending, invited, verified, completed, rejected';
COMMENT ON COLUMN public.agencies.invitation_sent_at IS 'Timestamp when invitation email was sent. Used to track when the verification email was dispatched.';

