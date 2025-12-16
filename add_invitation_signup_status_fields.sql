-- ============================================
-- ADD INVITATION AND SIGNUP STATUS FIELDS
-- ============================================
-- This migration adds invitation_status and signup_status fields
-- to track the signup flow: invitation sent -> email verified -> signup completed

-- Add fields to developers table
ALTER TABLE public.developers
ADD COLUMN IF NOT EXISTS invitation_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS signup_status VARCHAR(50) DEFAULT 'invited',
ADD COLUMN IF NOT EXISTS invitation_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMP WITH TIME ZONE;

-- Add fields to agents table

-- Add fields to property_seekers table
ALTER TABLE public.property_seekers
ADD COLUMN IF NOT EXISTS invitation_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS signup_status VARCHAR(50) DEFAULT 'invited',
ADD COLUMN IF NOT EXISTS invitation_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_developers_invitation_status ON public.developers(invitation_status);
CREATE INDEX IF NOT EXISTS idx_developers_signup_status ON public.developers(signup_status);
CREATE INDEX IF NOT EXISTS idx_developers_invitation_token ON public.developers(invitation_token);

CREATE INDEX IF NOT EXISTS idx_property_seekers_invitation_status ON public.property_seekers(invitation_status);
CREATE INDEX IF NOT EXISTS idx_property_seekers_signup_status ON public.property_seekers(signup_status);
CREATE INDEX IF NOT EXISTS idx_property_seekers_invitation_token ON public.property_seekers(invitation_token);

-- Add comments for documentation
COMMENT ON COLUMN public.developers.invitation_status IS 'Status of invitation email: pending, sent, failed, expired';
COMMENT ON COLUMN public.developers.signup_status IS 'Status of signup process: invited, verified, completed';
COMMENT ON COLUMN public.developers.invitation_token IS 'Unique token for email verification';
COMMENT ON COLUMN public.developers.invitation_sent_at IS 'Timestamp when invitation email was sent';
COMMENT ON COLUMN public.developers.invitation_expires_at IS 'Timestamp when invitation token expires';

COMMENT ON COLUMN public.agents.invitation_status IS 'Status of invitation email: pending, sent, failed, expired';
COMMENT ON COLUMN public.agents.signup_status IS 'Status of signup process: invited, verified, completed';
COMMENT ON COLUMN public.agents.invitation_token IS 'Unique token for email verification';
COMMENT ON COLUMN public.agents.invitation_sent_at IS 'Timestamp when invitation email was sent';
COMMENT ON COLUMN public.agents.invitation_expires_at IS 'Timestamp when invitation token expires';

COMMENT ON COLUMN public.property_seekers.invitation_status IS 'Status of invitation email: pending, sent, failed, expired';
COMMENT ON COLUMN public.property_seekers.signup_status IS 'Status of signup process: invited, verified, completed';
COMMENT ON COLUMN public.property_seekers.invitation_token IS 'Unique token for email verification';
COMMENT ON COLUMN public.property_seekers.invitation_sent_at IS 'Timestamp when invitation email was sent';
COMMENT ON COLUMN public.property_seekers.invitation_expires_at IS 'Timestamp when invitation token expires';

