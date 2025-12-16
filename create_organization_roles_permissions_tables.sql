-- Create organization roles and permissions tables
-- Supports both developers and agencies with unified role-based access control

-- ============================================
-- 1. organization_roles Table
-- ============================================
-- Defines role templates for organizations (developers and agencies)
-- This is a reference/template table

CREATE TABLE IF NOT EXISTS organization_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_type character varying(20) NOT NULL CHECK (organization_type IN ('developer', 'agency')),
  organization_id uuid NOT NULL,
  name character varying(100) NOT NULL,
  description text,
  is_system_role boolean DEFAULT false,
  is_default boolean DEFAULT false,
  permissions jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  CONSTRAINT organization_roles_pkey PRIMARY KEY (id),
  CONSTRAINT organization_roles_org_name_unique UNIQUE (organization_type, organization_id, name)
) TABLESPACE pg_default;

-- Indexes for organization_roles
CREATE INDEX IF NOT EXISTS idx_org_roles_org ON organization_roles(organization_type, organization_id);
CREATE INDEX IF NOT EXISTS idx_org_roles_type ON organization_roles(organization_type);
CREATE INDEX IF NOT EXISTS idx_org_roles_created_by ON organization_roles(created_by);

-- GIN index for JSONB permissions queries
CREATE INDEX IF NOT EXISTS idx_org_roles_permissions_gin ON organization_roles USING gin (permissions);

-- Comments
COMMENT ON TABLE organization_roles IS 'Role templates/definitions for organizations (developers and agencies)';
COMMENT ON COLUMN organization_roles.organization_type IS 'Type of organization: developer or agency';
COMMENT ON COLUMN organization_roles.organization_id IS 'ID of the organization (developers.id or agents.id)';
COMMENT ON COLUMN organization_roles.name IS 'Role name (e.g., Owner, Admin, Manager, Editor, Viewer)';
COMMENT ON COLUMN organization_roles.is_system_role IS 'Whether this is a system-defined role (Owner) that cannot be deleted';
COMMENT ON COLUMN organization_roles.is_default IS 'Whether this is the default role for new team members';
COMMENT ON COLUMN organization_roles.permissions IS 'JSONB object containing default permissions for this role (template)';
COMMENT ON COLUMN organization_roles.created_by IS 'UUID from auth.users(id) - who created this role';

-- ============================================
-- 2. organization_team_members Table
-- ============================================
-- Stores team members with role assignment, permissions, and invitation data all in one table

CREATE TABLE IF NOT EXISTS organization_team_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_type character varying(20) NOT NULL CHECK (organization_type IN ('developer', 'agency')),
  organization_id uuid NOT NULL,
  user_id uuid, -- NULL until invitation accepted
  email character varying(255) NOT NULL,
  password_hash character varying(255),
  role_id uuid NOT NULL,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  first_name character varying(100),
  last_name character varying(100),
  phone character varying(50),
  status character varying(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'suspended','deactivated','deleted')),
  -- Invitation fields
  invitation_token character varying(255),
  invited_by uuid,
  invited_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  accepted_at timestamp with time zone,
  invitation_message text,
  -- Activity fields
  last_active timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT organization_team_members_pkey PRIMARY KEY (id),
  CONSTRAINT organization_team_members_role_id_fkey FOREIGN KEY (role_id) 
    REFERENCES organization_roles(id) ON DELETE RESTRICT,
  CONSTRAINT organization_team_members_invitation_token_unique UNIQUE (invitation_token)
) TABLESPACE pg_default;

-- Indexes for organization_team_members
CREATE INDEX IF NOT EXISTS idx_team_members_org ON organization_team_members(organization_type, organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON organization_team_members(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_team_members_email ON organization_team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON organization_team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_members_role_id ON organization_team_members(role_id);
CREATE INDEX IF NOT EXISTS idx_team_members_token ON organization_team_members(invitation_token) WHERE invitation_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_team_members_expires_at ON organization_team_members(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_team_members_invited_by ON organization_team_members(invited_by);

-- Partial unique indexes (for conditional uniqueness)
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_org_user_unique ON organization_team_members(organization_type, organization_id, user_id) 
  WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_org_email_unique ON organization_team_members(organization_type, organization_id, email) 
  WHERE status != 'inactive';

-- GIN index for JSONB permissions queries
CREATE INDEX IF NOT EXISTS idx_team_members_permissions_gin ON organization_team_members USING gin (permissions);

-- Composite index for common queries (organization + status)
CREATE INDEX IF NOT EXISTS idx_team_members_org_status ON organization_team_members(organization_type, organization_id, status);

-- Comments
COMMENT ON TABLE organization_team_members IS 'Team members with role assignment, permissions, and invitation data';
COMMENT ON COLUMN organization_team_members.organization_type IS 'Type of organization: developer or agency';
COMMENT ON COLUMN organization_team_members.organization_id IS 'ID of the organization (developers.id or agents.id)';
COMMENT ON COLUMN organization_team_members.user_id IS 'UUID from auth.users(id) - NULL until invitation accepted';
COMMENT ON COLUMN organization_team_members.email IS 'Email address (unique identifier for invitations)';
COMMENT ON COLUMN organization_team_members.password_hash IS 'Hashed password (set when user accepts invitation)';
COMMENT ON COLUMN organization_team_members.role_id IS 'Foreign key to organization_roles(id)';
COMMENT ON COLUMN organization_team_members.permissions IS 'JSONB object containing all permissions for this user (copied from role, can be customized)';
COMMENT ON COLUMN organization_team_members.status IS 'Status: pending (invitation sent), active (accepted), inactive, suspended';
COMMENT ON COLUMN organization_team_members.invitation_token IS 'Invitation token (for email link) - NULL after acceptance';
COMMENT ON COLUMN organization_team_members.invited_by IS 'UUID from auth.users(id) - who invited this team member';
COMMENT ON COLUMN organization_team_members.expires_at IS 'Expiration timestamp (e.g., 7 days) - NULL after acceptance';

-- ============================================
-- Trigger: Update updated_at timestamp
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for organization_roles
CREATE TRIGGER update_organization_roles_updated_at
  BEFORE UPDATE ON organization_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for organization_team_members
CREATE TRIGGER update_organization_team_members_updated_at
  BEFORE UPDATE ON organization_team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Notes:
-- ============================================
-- 1. Polymorphic Design: Uses organization_type + organization_id to reference either developers or agents
-- 2. Foreign Keys: Cannot use traditional FK constraints for polymorphic relationships (organization_id)
--    - Application-level validation required to ensure organization_id matches organization_type
-- 3. Permissions: Stored as JSONB for flexibility and fast queries (no joins needed for permission checks)
-- 4. Invitation Flow:
--    - Create record with status='pending', invitation_token set, user_id=NULL
--    - User accepts → set password_hash, user_id, status='active', accepted_at, clear invitation_token
-- 5. Role Assignment: When assigning role, copy permissions from organization_roles.permissions to team_members.permissions
-- 6. Indexes: GIN indexes on JSONB permissions fields for efficient permission queries

