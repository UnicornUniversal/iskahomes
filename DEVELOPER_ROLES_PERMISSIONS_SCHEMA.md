# Organization Roles and Permissions - Database Schema Design

## Overview
This document outlines the database schema design for implementing roles and permissions for **both developers and agencies**. The system uses a unified, polymorphic approach to support team members and permissions for any organization type.

## Two Core Tables

1. **`organization_roles`** - Role templates/definitions with default permissions (reference table)
2. **`organization_team_members`** - Team members with role assignment, permissions, and invitation data all in one table

### Key Features
- ✅ **Fast Permission Checks**: Permissions copied to team_members for single-table queries (no joins needed!)
- ✅ **FK Relationship**: `role_id` foreign key maintains referential integrity
- ✅ **Combined Invitation Data**: Invitation fields stored directly on team_members (no separate table)
- ✅ **Password Support**: Team members can set passwords when accepting invitations
- ✅ **User Creation on Invitation**: User account created when invitation email is sent
- ✅ **Password Set on Acceptance**: User sets password when accepting invitation link
- ✅ **Unified for Developers & Agencies**: Same tables work for both organization types

---

## Design Principles

1. **Unified System**: Single set of tables that work for both developers and agencies (polymorphic design)
2. **Flexible Role System**: Support predefined roles (Owner, Admin, Manager, Editor, Viewer) with customizable permissions
3. **Granular Permissions**: Fine-grained control over what each role can do
4. **Multi-User Support**: Multiple team members per organization
5. **Invitation System**: Track invitations and pending team members
6. **Audit Trail**: Track who did what and when
7. **Scalable**: Easy to extend to other organization types in the future

---

## Database Tables

### 1. `organization_roles` Table
**Purpose**: Defines role templates for organizations (developers and agencies). This is a reference/template table.

| Column Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique role identifier |
| `organization_type` | VARCHAR(20) | NOT NULL, CHECK (organization_type IN ('developer', 'agency')) | Type of organization |
| `organization_id` | UUID | NOT NULL | ID of the organization (developers.id or agents.id) |
| `name` | VARCHAR(100) | NOT NULL | Role name (e.g., "Owner", "Admin", "Manager", "Editor", "Viewer") |
| `description` | TEXT | | Description of the role |
| `is_system_role` | BOOLEAN | DEFAULT false | Whether this is a system-defined role (Owner) or custom |
| `is_default` | BOOLEAN | DEFAULT false | Whether this is the default role for new team members |
| `permissions` | JSONB | DEFAULT '{}' | JSON object containing default permissions for this role (template) |
| `created_at` | TIMESTAMP | DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT now() | Last update timestamp |
| `created_by` | UUID | FOREIGN KEY → auth.users(id) | Who created this role |

**Indexes:**
- `idx_org_roles_org` ON organization_roles(organization_type, organization_id)
- `idx_org_roles_name` ON organization_roles(organization_type, organization_id, name) UNIQUE
- `idx_org_roles_type` ON organization_roles(organization_type)

**Notes:**
- **Template Table**: This table serves as a template/definition of available roles
- When assigning a role to a team member, permissions are **copied** from this table to `organization_team_members`
- Polymorphic design: `organization_type` + `organization_id` identifies the organization
- Each organization can have custom roles
- System roles (like "Owner") are created automatically and cannot be deleted
- Permissions here are defaults/templates - actual permissions are stored on team_members
- Easy to extend: just add new values to CHECK constraint for other organization types

---

### 2. `organization_team_members` Table
**Purpose**: Stores team members with role assignment, permissions, and invitation data all in one table

| Column Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique team member identifier |
| `organization_type` | VARCHAR(20) | NOT NULL, CHECK (organization_type IN ('developer', 'agency')) | Type of organization |
| `organization_id` | UUID | NOT NULL | ID of the organization (developers.id or agents.id) |
| `user_id` | UUID | FOREIGN KEY → auth.users(id) | The user account (Supabase auth user) - NULL until invitation accepted |
| `email` | VARCHAR(255) | NOT NULL | Email address (unique identifier) |
| `password_hash` | VARCHAR(255) | | Hashed password (set when user accepts invitation) |
| `role_id` | UUID | FOREIGN KEY → organization_roles(id), NOT NULL | Role assigned (FK to organization_roles) |
| `permissions` | JSONB | NOT NULL, DEFAULT '{}' | JSON object containing all permissions for this user (copied from role, can be customized) |
| `first_name` | VARCHAR(100) | | First name |
| `last_name` | VARCHAR(100) | | Last name |
| `phone` | VARCHAR(50) | | Phone number |
| `status` | VARCHAR(20) | DEFAULT 'pending' | Status: 'pending', 'active', 'inactive', 'suspended' |
| **Invitation Fields:** | | | |
| `invitation_token` | VARCHAR(255) | UNIQUE | Invitation token (for email link) - NULL after acceptance |
| `invited_by` | UUID | FOREIGN KEY → auth.users(id) | Who invited this team member |
| `invited_at` | TIMESTAMP | DEFAULT now() | When invitation was sent |
| `expires_at` | TIMESTAMP | | Expiration timestamp (e.g., 7 days) - NULL after acceptance |
| `accepted_at` | TIMESTAMP | | When invitation was accepted (and password was set) |
| `invitation_message` | TEXT | | Optional invitation message |
| **Activity Fields:** | | | |
| `last_active` | TIMESTAMP | | Last time user was active |
| `created_at` | TIMESTAMP | DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT now() | Last update timestamp |

**Indexes:**
- `idx_team_members_org` ON organization_team_members(organization_type, organization_id)
- `idx_team_members_user_id` ON organization_team_members(user_id) WHERE user_id IS NOT NULL
- `idx_team_members_email` ON organization_team_members(email)
- `idx_team_members_status` ON organization_team_members(status)
- `idx_team_members_role_id` ON organization_team_members(role_id)
- `idx_team_members_token` ON organization_team_members(invitation_token) WHERE invitation_token IS NOT NULL
- `idx_team_members_expires_at` ON organization_team_members(expires_at) WHERE expires_at IS NOT NULL
- UNIQUE constraint on (organization_type, organization_id, user_id) WHERE user_id IS NOT NULL
- UNIQUE constraint on (organization_type, organization_id, email) WHERE status != 'inactive'

**Notes:**
- **Fast Permission Checks**: Permissions copied from role - single table query for permission checks (no joins needed!)
- **FK Relationship**: `role_id` maintains referential integrity with `organization_roles`
- **Combined Invitation Data**: All invitation fields stored here - no separate invitations table needed
- **Password Support**: `password_hash` stores hashed password (set when user accepts invitation)
- **User Creation Flow**: 
  1. Invitation sent → record created with `user_id = NULL`, `status = 'pending'`, `invitation_token` set
  2. User clicks invitation link → creates account in auth.users
  3. User sets password → `password_hash` set, `user_id` set, `status = 'active'`, `accepted_at` set, `invitation_token = NULL`
- **Permissions**: Copied from `organization_roles.permissions` when role assigned via `role_id`, but can be customized per user
- **Token Cleanup**: `invitation_token` and `expires_at` set to NULL after acceptance
- Polymorphic design: works for both developers and agencies
- A user can be a team member of multiple organizations (different developers/agencies)
- Status 'pending' means invitation sent but not yet accepted/password set

---

---

## Summary: Two Core Tables

1. **`organization_roles`** - Role templates/definitions with default permissions
2. **`organization_team_members`** - Team members with role assignment, permissions, and invitation data all in one table

### Key Design Decisions

✅ **FK Relationship**: `role_id` foreign key maintains referential integrity with `organization_roles`
✅ **Fast Permission Checks**: Permissions copied to `organization_team_members` - single table query (no joins needed!)
✅ **Combined Invitation Data**: Invitation fields stored directly on team_members - no separate table needed
✅ **Password Support**: `password_hash` field for team member authentication
✅ **User Creation on Invitation**: User account created when invitation email is sent
✅ **Password Set on Acceptance**: User sets password when accepting invitation
✅ **Simplified Data Model**: Two tables instead of three - cleaner and more efficient

---

---

## Optional: Audit Table (Future Enhancement)

### `organization_permission_audit` Table (Optional)
**Purpose**: Audit log for permission changes and sensitive actions (can be added later if needed)

This table can be added in the future for compliance and security auditing, but is not required for the core functionality.

---

## Permission Structure (JSONB Format)

Based on the developer dashboard features, permissions are structured as follows:

```json
{
  "dashboard": {
    "view": true
  },
  "units": {
    "view": true,
    "create": true,
    "edit": true,
    "delete": false,
    "publish": true,
    "unpublish": false,
    "archive": true,
    "duplicate": false
  },
  "developments": {
    "view": true,
    "create": false,
    "edit": false,
    "delete": false,
    "publish": false,
    "unpublish": false
  },
  "leads": {
    "view": true,
    "edit": true,
    "delete": false,
    "update_status": true,
    "add_notes": true,
    "export": false,
    "assign": false
  },
  "analytics": {
    "view": true,
    "view_overview": true,
    "view_properties": true,
    "view_leads": true,
    "view_sales": true,
    "view_profile_brand": true,
    "export": false,
    "configure": false
  },
  "messages": {
    "view": true,
    "send": true,
    "delete": false,
    "mark_read": true
  },
  "appointments": {
    "view": true,
    "create": false,
    "edit": false,
    "delete": false,
    "approve": false,
    "reject": false,
    "cancel": false
  },
  "profile": {
    "view": true,
    "edit": true,
    "delete": false,
    "manage_locations": false,
    "manage_gallery": false,
    "manage_documents": false
  },
  "subscription": {
    "view": true,
    "manage": false,
    "upgrade": false,
    "downgrade": false,
    "cancel": false,
    "view_billing": false
  },
  "team": {
    "view": false,
    "invite": false,
    "edit": false,
    "remove": false,
    "change_role": false,
    "suspend": false
  },
  "settings": {
    "view": false,
    "edit": false,
    "manage_integrations": false
  }
}
```

### Permission Categories Explained

#### 1. **dashboard**
- `view`: Access to dashboard overview page

#### 2. **units** (Property/Unit Listings)
- `view`: View units list and individual unit details
- `create`: Create new units
- `edit`: Edit existing units
- `delete`: Delete units (permanent removal)
- `publish`: Publish units to make them visible publicly
- `unpublish`: Unpublish units (make them draft/private)
- `archive`: Archive units (soft delete)
- `duplicate`: Create copies of existing units

#### 3. **developments** (Development Projects)
- `view`: View developments list and individual development details
- `create`: Create new developments
- `edit`: Edit existing developments
- `delete`: Delete developments
- `publish`: Publish developments
- `unpublish`: Unpublish developments

#### 4. **leads** (Lead Management)
- `view`: View leads list and individual lead details
- `edit`: Edit lead information
- `delete`: Delete leads
- `update_status`: Update lead status (new, contacted, qualified, converted, lost)
- `add_notes`: Add notes to leads
- `export`: Export leads data (CSV, Excel)
- `assign`: Assign leads to team members

#### 5. **analytics** (Analytics & Reports)
- `view`: Access analytics section
- `view_overview`: View analytics overview/dashboard
- `view_properties`: View property analytics
- `view_leads`: View leads analytics
- `view_sales`: View sales analytics
- `view_profile_brand`: View profile & brand analytics
- `export`: Export analytics data/reports
- `configure`: Configure analytics settings

#### 6. **messages** (Messaging System)
- `view`: View messages/conversations
- `send`: Send messages to property seekers
- `delete`: Delete messages/conversations
- `mark_read`: Mark messages as read

#### 7. **appointments** (Appointment Management)
- `view`: View appointments calendar and list
- `create`: Create appointments
- `edit`: Edit appointments
- `delete`: Delete appointments
- `approve`: Approve appointment requests
- `reject`: Reject appointment requests
- `cancel`: Cancel existing appointments

#### 8. **profile** (Developer Profile)
- `view`: View profile information
- `edit`: Edit profile information
- `delete`: Delete profile (account deletion)
- `manage_locations`: Manage company locations
- `manage_gallery`: Manage company gallery images
- `manage_documents`: Manage registration documents

#### 9. **subscription** (Subscription Management)
- `view`: View subscription details
- `manage`: Manage subscription settings
- `upgrade`: Upgrade subscription plan
- `downgrade`: Downgrade subscription plan
- `cancel`: Cancel subscription
- `view_billing`: View billing history and invoices

#### 10. **team** (Team Management)
- `view`: View team members list
- `invite`: Invite new team members
- `edit`: Edit team member information
- `remove`: Remove team members
- `change_role`: Change team member roles
- `suspend`: Suspend/activate team members

#### 11. **settings** (System Settings)
- `view`: View settings page
- `edit`: Edit settings
- `manage_integrations`: Manage third-party integrations

---

## Default Roles

### 1. Owner
- **System Role**: Yes (cannot be deleted)
- **Permissions**: Full access to everything (all permissions set to `true`)
- **Auto-assigned**: To the developer who created the account
- **Cannot be removed**: Owner cannot remove themselves
- **Special Permissions**: Can delete developer account, manage all team members including Owner role changes

### 2. Admin
- **System Role**: Yes (can be customized)
- **Permissions**: Full access except:
  - `profile.delete`: false (cannot delete developer account)
  - `team.remove`: false (cannot remove Owner)
  - `team.change_role`: false (cannot change Owner's role)
  - All other permissions: `true`

### 3. Manager
- **System Role**: Yes (can be customized)
- **Permissions**:
  - `dashboard.view`: true
  - `units.*`: true (full unit management)
  - `developments.*`: true (full development management)
  - `leads.*`: true (full lead management)
  - `analytics.*`: true (view all analytics, export enabled)
  - `messages.*`: true (full messaging access)
  - `appointments.*`: true (full appointment management)
  - `profile.view`: true, `profile.edit`: true (can edit profile)
  - `subscription.view`: true (can view subscription)
  - `team.*`: false (cannot manage team)
  - `subscription.manage`, `subscription.upgrade`, `subscription.downgrade`, `subscription.cancel`: false
  - `settings.*`: false

### 4. Editor
- **System Role**: Yes (can be customized)
- **Permissions**:
  - `dashboard.view`: true
  - `units.view`: true, `units.create`: true, `units.edit`: true, `units.publish`: true, `units.archive`: true
  - `units.delete`: false, `units.unpublish`: false, `units.duplicate`: false
  - `developments.view`: true (read-only)
  - `developments.*`: false (cannot create/edit/delete)
  - `leads.view`: true, `leads.edit`: true, `leads.update_status`: true, `leads.add_notes`: true
  - `leads.delete`: false, `leads.export`: false, `leads.assign`: false
  - `analytics.view`: true, `analytics.view_*`: true (all analytics views)
  - `analytics.export`: false, `analytics.configure`: false
  - `messages.view`: true, `messages.send`: true, `messages.mark_read`: true
  - `messages.delete`: false
  - `appointments.view`: true (read-only)
  - `appointments.*`: false (cannot manage appointments)
  - `profile.view`: true, `profile.edit`: true
  - `profile.delete`: false, `profile.manage_*`: false
  - `subscription.view`: true (read-only)
  - `team.*`: false
  - `settings.*`: false

### 5. Viewer
- **System Role**: Yes (can be customized)
- **Permissions**: Read-only access to most features
  - `dashboard.view`: true
  - `units.view`: true (read-only)
  - `developments.view`: true (read-only)
  - `leads.view`: true (read-only)
  - `analytics.view`: true, `analytics.view_*`: true (all analytics views, read-only)
  - `analytics.export`: false, `analytics.configure`: false
  - `messages.view`: true (read-only)
  - `appointments.view`: true (read-only)
  - `profile.view`: true (read-only)
  - `subscription.view`: true (read-only)
  - All `create`, `edit`, `delete`, `manage`, `invite`, `remove` permissions: false

---

## Relationships Diagram

### Polymorphic Relationships

```
developers (id) ──< (organization_id, organization_type='developer') organization_roles
agents (id) ──< (organization_id, organization_type='agency') organization_roles

developers (id) ──< (organization_id, organization_type='developer') organization_team_members
agents (id) ──< (organization_id, organization_type='agency') organization_team_members

organization_roles (id) ──< (role_id) organization_team_members

auth.users (id) ──< (user_id) organization_team_members
auth.users (id) ──< (invited_by) organization_team_members
auth.users (id) ──< (created_by) organization_roles
```

### Key Design Patterns
- **Polymorphic Association**: Uses `organization_type` + `organization_id` to reference either `developers` or `agents`
- **FK Relationship**: `role_id` foreign key links to `organization_roles` for referential integrity
- **Application-Level Validation**: Ensure `organization_id` matches `organization_type` in application code (for polymorphic part)
- **Fast Permission Checks**: `permissions` copied to `organization_team_members` - single table query (no joins needed!)
- **Combined Data**: Invitation data stored directly on team_members - no separate invitations table
- **Indexes**: Composite indexes on `(organization_type, organization_id)` for efficient queries

---

## Key Considerations

### 1. Data Integrity
- **Polymorphic Relationships**: Cannot use traditional foreign key constraints
  - Use application-level validation to ensure `organization_id` matches `organization_type`
  - Use database triggers or application logic to maintain referential integrity
  - Consider CHECK constraints or triggers to validate organization exists
  
- **Cascade Deletes**: When an organization is deleted, should we:
  - Delete all team members? (CASCADE via application logic)
  - Delete all roles? (CASCADE via application logic)
  - Note: Invitation data is in team_members table, so no separate cleanup needed
  - Archive audit logs? (Keep for compliance)

### 2. Security
- **Row Level Security (RLS)**: Implement RLS policies in Supabase to ensure users can only access their own organization's data
  - Policies should check both `organization_type` and `organization_id`
  - Users should only see data for organizations they belong to
  
- **Token Security**: Invitation tokens should be long, random, and expire
- **Permission Checks**: Always verify permissions at the API level, not just frontend
- **Organization Validation**: Always verify user has access to the organization they're trying to modify

### 3. Performance
- **Indexes**: All foreign keys and frequently queried columns should be indexed
- **JSONB Indexes**: If using JSONB for permissions, consider GIN indexes for complex queries
- **Pagination**: Audit logs should support pagination

### 4. Scalability
- **Partitioning**: Consider partitioning audit logs by date if volume is high
- **Archiving**: Old audit logs can be moved to archive tables

### 5. User Experience
- **Invitation Flow**: 
  1. Owner/Admin invites user via email
  2. User receives email with invitation link
  3. User clicks link, creates account (if needed) or logs in
  4. User accepts invitation
  5. User is added to team_members table
- **Role Assignment**: Easy UI to assign/change roles
- **Permission Visibility**: Show users what they can/cannot do

---

## Invitation & User Creation Flow

### Step-by-Step Process

1. **Owner/Admin Creates Invitation**
   - User account created in `auth.users` (if doesn't exist) with email
   - Record created in `organization_team_members` with:
     - `user_id = NULL` (or user_id if user already exists)
     - `status = 'pending'`
     - `role_id` = selected role ID
     - `permissions` = copied from `organization_roles.permissions` for that role_id
     - `invitation_token` = cryptographically secure random string
     - `expires_at` = NOW() + 7 days (or configured expiration)
     - `invited_by` = current user ID
     - `invited_at` = NOW()
   - Email sent with invitation link containing `invitation_token`

2. **User Clicks Invitation Link**
   - Validate `invitation_token` exists in `organization_team_members` and not expired
   - If user doesn't exist in `auth.users`, create account
   - Show password setup form

3. **User Sets Password**
   - Hash password and store in `organization_team_members.password_hash`
   - Update `organization_team_members`:
     - `user_id` = auth user ID
     - `status = 'active'`
     - `accepted_at` = NOW()
     - `invitation_token` = NULL (cleanup)
     - `expires_at` = NULL (cleanup)
   - User can now log in

## Migration Strategy

1. **Phase 1**: Create tables (organization_roles, organization_team_members)
2. **Phase 2**: Create default roles for existing developers
   - Create Owner, Admin, Manager, Editor, Viewer roles for each developer
3. **Phase 3**: Migrate existing developer accounts to have Owner role
   - For each developer: 
     - Create Owner role in `organization_roles` (get role_id)
     - Create team member record in `organization_team_members` with:
       - `user_id` = developer.developer_id
       - `role_id` = Owner role_id
       - `permissions` = full permissions (copied from Owner role template)
       - `status = 'active'`
       - `password_hash` = NULL (they use existing auth.users password)
       - `invitation_token` = NULL (already active)
4. **Phase 4**: Create default roles for existing agencies
   - For each agency (agent where agency_id IS NULL):
     - Create Owner role in `organization_roles` (get role_id)
     - Create team member record in `organization_team_members` with:
       - `user_id` = agent.agent_id
       - `role_id` = Owner role_id
       - `permissions` = full permissions
       - `status = 'active'`
5. **Phase 5**: Add RLS policies (check both organization_type and organization_id)
6. **Phase 6**: (Optional) Add audit logging

---

## Questions to Consider

1. **Can a user be a team member of multiple organizations?**
   - **Recommendation**: Yes, a user can be a team member of multiple developers AND/OR agencies
   - They need separate invitations and roles per organization

2. **Can organizations create custom roles?**
   - **Recommendation**: Yes, but system roles (Owner, Admin) should be protected

3. **What happens when Owner leaves?**
   - **Recommendation**: Transfer ownership to another Admin, or require at least one Owner

4. **Should permissions be hierarchical?**
   - **Recommendation**: Yes, but keep it simple. Higher roles inherit lower role permissions.

5. **How to handle permission conflicts?**
   - **Recommendation**: `permissions_override` in team_members takes precedence over role permissions

6. **Should we support permission groups/modules?**
   - **Recommendation**: Yes, organize by feature area (listings, developments, analytics, etc.)

7. **How to identify agencies?**
   - **Current System**: Agents where `agency_id IS NULL` are agencies
   - **Recommendation**: Use `agents.id` where `agency_id IS NULL` as `organization_id` for agencies

8. **Should we add a separate agencies table?**
   - **Current**: No separate table, agencies are agents with `agency_id IS NULL`
   - **Recommendation**: Keep current structure, use polymorphic approach with `organization_type='agency'` and `organization_id=agents.id`

---

## Advantages of Unified Approach

1. **DRY Principle**: Single set of tables instead of duplicating for developers and agencies
2. **Consistency**: Same permission system works identically for both organization types
3. **Maintainability**: One codebase to maintain instead of two
4. **Scalability**: Easy to add more organization types in the future (just update CHECK constraint)
5. **Performance**: Efficient queries with composite indexes on (organization_type, organization_id)
6. **Flexibility**: Users can belong to multiple organizations of different types

## Implementation Notes

### Identifying Organizations
- **Developers**: `organization_type='developer'`, `organization_id=developers.id`
- **Agencies**: `organization_type='agency'`, `organization_id=agents.id` WHERE `agents.agency_id IS NULL`

### Query Examples
```sql
-- Get all roles for a developer (templates)
SELECT * FROM organization_roles 
WHERE organization_type = 'developer' 
  AND organization_id = 'developer-uuid';

-- Get all team members for an agency (NO JOINS NEEDED for permissions!)
SELECT * FROM organization_team_members 
WHERE organization_type = 'agency' 
  AND organization_id = 'agency-uuid';

-- Check user permissions (SINGLE TABLE QUERY - NO JOINS!)
SELECT role_id, permissions 
FROM organization_team_members
WHERE organization_type = 'developer'
  AND organization_id = 'developer-uuid'
  AND user_id = 'user-uuid'
  AND status = 'active';

-- Get all organizations a user belongs to (with role info via join)
SELECT 
  otm.organization_type, 
  otm.organization_id, 
  otm.role_id,
  or.name as role_name,
  otm.permissions,
  otm.status
FROM organization_team_members otm
JOIN organization_roles or ON otm.role_id = or.id
WHERE otm.user_id = 'user-uuid' AND otm.status = 'active';

-- Get pending invitations (status='pending' with valid token)
SELECT * FROM organization_team_members
WHERE organization_type = 'developer'
  AND organization_id = 'developer-uuid'
  AND status = 'pending'
  AND invitation_token IS NOT NULL
  AND expires_at > NOW();

-- Validate invitation token
SELECT * FROM organization_team_members
WHERE invitation_token = 'token-value'
  AND expires_at > NOW()
  AND status = 'pending';
```

## Next Steps

1. ✅ Review and approve this unified schema design (Two tables with FK relationship)
2. ✅ JSONB approach for permissions (stored in both roles and team_members)
3. Create SQL migration files
4. Design API endpoints (with organization_type parameter)
5. Design frontend UI components (reusable for both developers and agencies)
6. Implement authentication/authorization middleware
7. Add database triggers/validation for referential integrity

