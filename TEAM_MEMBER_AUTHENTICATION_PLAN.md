# Team Member Authentication Plan

## Answers to Your Questions

### 1. **Organization Type**
✅ **YES** - `organization_type` is `'developer'` or `'agency'`

### 2. **Do we add them to auth.users?**
✅ **YES** - Team members should use Supabase Auth (auth.users table), just like other users.

### 3. **How Login Works**
Team members login the same way as other users:
- Select account type: **"Team Member"** (or detect automatically)
- Enter email and password
- System checks:
  1. Supabase Auth (auth.users) - verify email/password
  2. Check if user is in `organization_team_members` table
  3. Get their role and permissions
  4. Generate JWT token with team member info

---

## Current Problem

**Issue**: The invitation accept route stores `password_hash` in `organization_team_members`, but the signin route only uses Supabase Auth. This creates a mismatch.

**Solution**: Team members should use Supabase Auth, not `password_hash`.

---

## Recommended Authentication Flow

### Option 1: Use Supabase Auth (RECOMMENDED) ✅

**Why**: Consistent with rest of system, better security, password reset support

#### Step 1: Invitation Sent
```javascript
// When Owner/Admin invites team member
1. Create record in organization_team_members:
   - email: 'team@example.com'
   - status: 'pending'
   - invitation_token: 'random-token'
   - user_id: NULL (not created yet)
   - password_hash: NULL (not set yet)
```

#### Step 2: User Accepts Invitation
```javascript
// POST /api/developers/team/members/invite/accept
1. Validate invitation_token
2. Check if user exists in auth.users (by email)
   - If exists → use existing user_id
   - If not → CREATE account in auth.users:
     supabase.auth.signUp({
       email: teamMember.email,
       password: password,
       options: {
         emailRedirectTo: null, // Skip email verification for team members
         data: {
           user_type: 'team_member',
           organization_type: 'developer', // or 'agency'
           organization_id: developer.id
         }
       }
     })
3. Update organization_team_members:
   - user_id: authUser.id
   - status: 'active'
   - accepted_at: NOW()
   - invitation_token: NULL
   - password_hash: NULL (we don't need it - using Supabase Auth)
```

#### Step 3: Team Member Logs In
```javascript
// POST /api/auth/signin
1. User selects account type: "Team Member" (or auto-detect)
2. Sign in with Supabase Auth (email + password)
3. Check if user is in organization_team_members:
   const { data: teamMember } = await supabase
     .from('organization_team_members')
     .select('*, role:organization_roles(*)')
     .eq('user_id', authUser.id)
     .eq('status', 'active')
     .single()
4. If found, generate token with:
   {
     id: teamMember.id,
     user_id: authUser.id,
     email: authUser.email,
     user_type: 'team_member',
     organization_type: teamMember.organization_type,
     organization_id: teamMember.organization_id,
     role_id: teamMember.role_id,
     permissions: teamMember.permissions
   }
5. Store token as: 'team_member_token' (or reuse 'developer_token' / 'agency_token')
```

---

## Updated Schema Requirements

### Keep `password_hash` field?
**Option A**: Remove it (use Supabase Auth only)
**Option B**: Keep it for backup/legacy, but don't use it for login

**Recommendation**: Keep it for now (backward compatibility), but login should use Supabase Auth.

---

## Login Flow Diagram

```
User Login:
1. User goes to /home/signin
2. Selects account type: "Team Member" (or "Developer Team Member" / "Agency Team Member")
3. Enters email + password
4. System:
   a. Authenticates with Supabase Auth (auth.users)
   b. Checks organization_team_members table
   c. Gets role and permissions
   d. Generates JWT token
   e. Redirects to appropriate dashboard
```

---

## Account Type Selection

### Current Signin Page Options:
- Developer
- Agent
- Agency
- Property Seeker
- Admin

### Add New Option:
- **Team Member** (or detect automatically)

**OR** detect automatically:
- If user exists in `organization_team_members` → treat as team member
- Show organization name and role in UI

---

## Implementation Steps

### 1. Update Invitation Accept Route
- Create Supabase Auth account when accepting invitation
- Remove password_hash storage (or keep for backup)
- Set user_id from auth.users

### 2. Update Signin Route
- Add team member detection
- Check organization_team_members table
- Generate appropriate token

### 3. Update Signin UI
- Add "Team Member" option OR auto-detect
- Show organization name after login

### 4. Update AuthContext
- Handle team_member_token
- Load team member permissions
- Support multiple organizations (user can be team member of multiple devs/agencies)

---

## Multiple Organizations Support

**Question**: Can a user be a team member of multiple organizations?

**Answer**: YES - A user can be:
- Team member of Developer A
- Team member of Developer B
- Team member of Agency C

**Solution**: On login, show organization selector if user belongs to multiple organizations.

---

## Summary

✅ **organization_type**: `'developer'` or `'agency'`  
✅ **Use Supabase Auth**: Team members should have accounts in auth.users  
✅ **Login Flow**: Select account type → Email/Password → Check organization_team_members → Get permissions → Login  
✅ **password_hash**: Keep in schema but use Supabase Auth for login (password_hash is backup/legacy)

**Next Steps**: Update invitation accept route to create Supabase Auth account, update signin route to handle team members.
