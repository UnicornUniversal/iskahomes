# 🎯 Complete Agent Invitation & Sign-Up Flow

## Overview
This document outlines the complete process from when an agency invites an agent to when the agent can sign in and start working.

---

## 📋 Step-by-Step Flow

### **STEP 1: Agency Invites Agent**

#### **Frontend: AddAgentModal Component**
**Location:** `src/app/components/agency/AddAgentModal.jsx`

**What Happens:**
1. Agency fills out form:
   - Full Name (required)
   - Email Address (required)
   - Phone Number (required)
   - Location (optional - from agency's `company_locations`)

2. Form validation:
   - Name, email, and phone are required
   - Email format validation
   - Phone validation

3. Submits to: `POST /api/agencies/agents/invite`

#### **Backend: Invitation API**
**Location:** `src/app/api/agencies/agents/invite/route.js`

**Process:**
1. **Authentication Check:**
   - Verifies JWT token from `Authorization: Bearer <token>`
   - Ensures `user_type === 'agency'`

2. **Validation:**
   - Validates name and email are provided
   - Validates email format
   - Checks if agent with same email already exists for this agency
   - If exists and already accepted → Error
   - Validates `location_id` against agency's `company_locations` array

3. **Generate Invitation:**
   - Creates unique invitation token (32-byte hex string)
   - Sets expiration: 7 days from now
   - Generates unique slug from agent name

4. **Send Email FIRST:**
   - Calls `sendAgentInvitationEmail()` from SendGrid
   - Email includes:
     - Agency name
     - Agent name
     - Invitation link: `${FRONTEND_LINK}/agent/invitation/accept?token=${invitationToken}`
     - Expiration notice (7 days)
   - **CRITICAL:** Only creates database record if email sends successfully

5. **Create/Update Agent Record:**
   ```javascript
   {
     agency_id: agency.user_id,
     name: name.trim(),
     email: email.toLowerCase().trim(),
     phone: phone?.trim() || null,
     location_id: validLocationId, // From agency's company_locations
     invitation_token: invitationToken,
     invitation_expires_at: expiresAt.toISOString(),
     invitation_status: 'pending', // Updated to 'sent' after email
     invitation_sent_at: new Date().toISOString(),
     account_status: 'pending',
     agent_status: 'invited',
     slug: finalSlug
   }
   ```

6. **Update Agency Stats:**
   - Increments `total_agents` count

**Response:**
```json
{
  "success": true,
  "message": "Agent invitation sent successfully",
  "data": { /* agent record */ }
}
```

---

### **STEP 2: Agent Receives Email**

#### **Email Content** (SendGrid Template)
**Location:** `src/lib/sendgrid.js` → `sendAgentInvitationEmail()`

**Email Includes:**
- Subject: "You've been invited to join {Agency Name} on Iska Homes"
- Greeting with agent name
- Agency name
- Benefits of being an agent:
  - List and manage properties
  - Track leads and appointments
  - View analytics and performance metrics
  - Earn commissions on sales
  - Connect with property seekers
- **Invitation Link:** `{FRONTEND_LINK}/agent/invitation/accept?token={token}`
- Expiration notice (7 days)
- Fallback text link if button doesn't work

---

### **STEP 3: Agent Clicks Invitation Link**

#### **Frontend: Invitation Acceptance Page**
**Location:** `src/app/agent/invitation/accept/page.jsx`

**Initial Load (GET Request):**
1. Extracts `token` from URL query params
2. Calls: `GET /api/agencies/agents/invite/accept?token={token}`

#### **Backend: Verify Token**
**Location:** `src/app/api/agencies/agents/invite/accept/route.js` (GET handler)

**Validation:**
1. Checks token exists
2. Finds agent by `invitation_token`
3. Validates:
   - Token exists in database
   - Not expired (`invitation_expires_at > now`)
   - Not already accepted (`invitation_status !== 'accepted'`)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "agent-uuid",
    "name": "Agent Name",
    "email": "agent@example.com",
    "agency_name": "Agency Name",
    "agency_id": "agency-uuid"
  }
}
```

**Frontend Displays:**
- Agency name
- Agent email (read-only)
- Form fields:
  - Full Name (pre-filled from invitation, editable)
  - Password (with strength requirements)
  - Confirm Password

---

### **STEP 4: Agent Submits Form**

#### **Frontend: Form Submission**
**Location:** `src/app/agent/invitation/accept/page.jsx`

**Validation:**
1. Password requirements:
   - At least 8 characters
   - One uppercase letter
   - One lowercase letter
   - One number
   - One special character
2. Passwords must match
3. Full name is required

**Submits to:** `POST /api/agencies/agents/invite/accept`

#### **Backend: Accept Invitation**
**Location:** `src/app/api/agencies/agents/invite/accept/route.js` (POST handler)

**Process:**

1. **Validate Token:**
   - Finds agent by `invitation_token`
   - Checks not expired
   - Checks not already accepted

2. **Check Existing User:**
   - Checks if user with agent's email already exists in Supabase Auth
   - If exists → Uses existing user ID
   - If not → Creates new user

3. **Create User Account:**
   ```javascript
   supabase.auth.signUp({
     email: agent.email,
     password: password,
     options: {
       emailRedirectTo: `${FRONTEND_LINK}/agent/invitation/accept?token=${token}`,
       data: {
         user_type: 'agent',
         full_name: agentName // From agency invitation or form
       }
     }
   })
   ```

4. **Auto-Confirm Email:**
   ```javascript
   supabaseAdmin.auth.admin.updateUserById(userId, {
     email_confirm: true, // Auto-confirm for invited agents
     user_metadata: {
       user_type: 'agent',
       full_name: agentName // Sets display name
     }
   })
   ```
   - **Note:** If Supabase settings require email confirmation, returns `email_confirmation_required: true`

5. **Generate Slug:**
   - Creates unique slug from agent name
   - Ensures uniqueness across all agents

6. **Update Agent Record:**
   ```javascript
   {
     agent_id: userId, // Links to Supabase Auth user
     invitation_status: 'accepted',
     invitation_accepted_at: new Date().toISOString(),
     account_status: 'active',
     agent_status: 'active',
     slug: slug,
     invitation_token: null, // Clear token
     invitation_expires_at: null, // Clear expiry
     name: fullName || agent.name // Update if changed
   }
   ```

7. **Update Agency Stats:**
   - Increments `active_agents` count

8. **Check Email Confirmation:**
   - Verifies if email was actually confirmed
   - Returns `email_confirmation_required: true/false`

**Response:**
```json
{
  "success": true,
  "message": "Invitation accepted successfully",
  "data": {
    "agent_id": "user-uuid",
    "email": "agent@example.com",
    "name": "Agent Name",
    "email_confirmation_required": false // or true
  }
}
```

---

### **STEP 5: Success Screen**

#### **Frontend: Success State**
**Location:** `src/app/agent/invitation/accept/page.jsx`

**Two Possible States:**

**A. Email Confirmed (Auto-confirmed):**
- ✅ Success message
- "Your account has been created successfully"
- Auto-redirects to sign-in after 3 seconds
- "Go to Sign In Now" button

**B. Email Confirmation Required:**
- ✅ Success message
- 📧 **Blue info box with:**
  - "Check Your Email"
  - Email address displayed
  - Instructions: "We've sent a confirmation email. Please click the confirmation link to activate your account."
  - "Once you've confirmed your email, you can sign in."
- "Go to Sign In" button (doesn't auto-redirect)
- "Didn't receive the email?" link

---

### **STEP 6: Agent Signs In**

#### **Frontend: Sign In Page**
**Location:** `src/app/home/signin/page.jsx`

**User Actions:**
1. Selects "Agent" from user type dropdown
2. Enters email and password
3. Clicks "Sign In"

#### **Backend: Sign In API**
**Location:** `src/app/api/auth/signin/route.js`

**Process:**

1. **Supabase Auth:**
   ```javascript
   signIn(email, password)
   ```
   - Validates credentials
   - Returns user and session

2. **Detect User Type:**
   - Priority:
     1. Provided `user_type` from dropdown
     2. User metadata (`user_metadata.user_type`)
     3. Auto-detect from profile tables:
        - Check `developers` table
        - Check `agencies` table
        - Check `agents` table ← **For agents**
        - Check `property_seekers` table

3. **Fetch Agent Profile:**
   ```javascript
   agentDB.getByUserId(user.id)
   // Queries: agents WHERE agent_id = user.id
   ```

4. **Generate JWT Token:**
   ```javascript
   generateToken({
     id: user.id,
     user_id: user.id,
     agent_id: profile.agent_id,
     email: user.email,
     user_type: 'agent'
   })
   ```

5. **Response:**
   ```json
   {
     "success": true,
     "message": "Signed in successfully",
     "user": {
       "id": "user-uuid",
       "email": "agent@example.com",
       "user_type": "agent",
       "profile": {
         "id": "agent-record-uuid",
         "agent_id": "user-uuid",
         "name": "Agent Name",
         "slug": "agent-slug",
         "account_status": "active",
         "agency_id": "agency-uuid"
       }
     },
     "token": "jwt-token",
     "session": {
       "access_token": "supabase-access-token",
       "refresh_token": "supabase-refresh-token",
       "expires_at": timestamp
     }
   }
   ```

6. **Frontend Stores:**
   - `agent_token` in localStorage
   - User object in AuthContext
   - Redirects to agent dashboard

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Agency Invites Agent                                │
├─────────────────────────────────────────────────────────────┤
│ Agency Dashboard → AddAgentModal                            │
│   ↓                                                          │
│ POST /api/agencies/agents/invite                            │
│   ├─ Validate agency JWT token                              │
│   ├─ Validate form data (name, email, phone, location)      │
│   ├─ Check for existing agent                                │
│   ├─ Generate invitation token (7 days expiry)              │
│   ├─ Send email via SendGrid ← CRITICAL: Email first        │
│   ├─ Create agent record in database                        │
│   └─ Update agency.total_agents count                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Agent Receives Email                                │
├─────────────────────────────────────────────────────────────┤
│ Email contains:                                              │
│   ├─ Agency name                                             │
│   ├─ Agent name                                              │
│   ├─ Invitation link: /agent/invitation/accept?token=xxx    │
│   └─ Expiration notice (7 days)                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Agent Clicks Link                                   │
├─────────────────────────────────────────────────────────────┤
│ GET /api/agencies/agents/invite/accept?token=xxx            │
│   ├─ Verify token exists                                     │
│   ├─ Check not expired                                       │
│   ├─ Check not already accepted                              │
│   └─ Return agent details                                    │
│                                                              │
│ Frontend displays form with:                                 │
│   ├─ Agency name                                             │
│   ├─ Email (read-only)                                       │
│   ├─ Full Name (pre-filled, editable)                       │
│   ├─ Password field                                          │
│   └─ Confirm Password field                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Agent Submits Form                                  │
├─────────────────────────────────────────────────────────────┤
│ POST /api/agencies/agents/invite/accept                      │
│   ├─ Validate token again                                    │
│   ├─ Check/create Supabase Auth user                         │
│   ├─ Create user account with password                       │
│   ├─ Auto-confirm email (attempt)                            │
│   ├─ Set display name from agency invitation                │
│   ├─ Generate unique slug                                    │
│   ├─ Update agent record:                                    │
│   │   ├─ agent_id = user.id                                 │
│   │   ├─ invitation_status = 'accepted'                    │
│   │   ├─ account_status = 'active'                          │
│   │   ├─ agent_status = 'active'                            │
│   │   └─ Clear invitation_token                              │
│   └─ Update agency.active_agents count                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Success Screen                                      │
├─────────────────────────────────────────────────────────────┤
│ IF email_confirmation_required = false:                      │
│   ├─ Show success message                                    │
│   └─ Auto-redirect to sign-in (3 seconds)                   │
│                                                              │
│ IF email_confirmation_required = true:                      │
│   ├─ Show success message                                    │
│   ├─ Show email confirmation instructions                   │
│   ├─ Display agent email address                            │
│   └─ "Go to Sign In" button (no auto-redirect)              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: Agent Signs In                                      │
├─────────────────────────────────────────────────────────────┤
│ POST /api/auth/signin                                        │
│   ├─ Supabase Auth sign in                                   │
│   ├─ Detect user_type = 'agent'                              │
│   ├─ Fetch agent profile from agents table                  │
│   ├─ Generate JWT token with agent_id                        │
│   └─ Return user + token + session                           │
│                                                              │
│ Frontend:                                                     │
│   ├─ Store agent_token in localStorage                       │
│   ├─ Set user in AuthContext                                 │
│   └─ Redirect to agent dashboard                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Features

### **1. Email-First Approach**
- Email is sent **BEFORE** creating database record
- Ensures we only create agents if email delivery succeeds
- Prevents orphaned records

### **2. Auto-Email Confirmation**
- Agents are auto-confirmed when accepting invitation
- Display name is set from agency invitation
- Falls back gracefully if Supabase requires manual confirmation

### **3. Token Security**
- Unique 32-byte hex token per invitation
- 7-day expiration
- Token cleared after acceptance
- Cannot reuse same invitation link

### **4. Duplicate Prevention**
- Checks for existing agent with same email + agency
- Prevents duplicate invitations if already accepted
- Allows re-inviting if previous invitation expired

### **5. Location Assignment**
- Agents can be assigned to specific agency location
- References `agency.company_locations` array
- If not specified, uses agency's primary location

### **6. Status Tracking**
- `invitation_status`: `pending` → `sent` → `accepted` / `expired`
- `account_status`: `pending` → `active`
- `agent_status`: `invited` → `active`

---

## 📊 Database Changes

### **Agents Table Updates:**
```sql
- agent_id: NULL → user.id (after acceptance)
- invitation_status: 'pending' → 'sent' → 'accepted'
- invitation_token: generated → NULL (after acceptance)
- invitation_expires_at: 7 days from now → NULL
- account_status: 'pending' → 'active'
- agent_status: 'invited' → 'active'
```

### **Agencies Table Updates:**
```sql
- total_agents: incremented (when invitation sent)
- active_agents: incremented (when invitation accepted)
```

---

## 🚨 Error Handling

### **Common Errors:**

1. **"Invalid or expired invitation token"**
   - Token doesn't exist
   - Token expired (>7 days)
   - Token already used

2. **"An agent with this email has already accepted an invitation"**
   - Trying to invite same email again
   - Solution: Use different email or contact support

3. **"Email not confirmed"** (during sign-in)
   - Email confirmation required by Supabase
   - Solution: Check email and click confirmation link

4. **"Failed to send invitation email"**
   - SendGrid error
   - Solution: Check SendGrid configuration

---

## ✅ Success Criteria

An agent invitation is successful when:
1. ✅ Email is sent successfully
2. ✅ Agent record created in database
3. ✅ Agent clicks invitation link
4. ✅ Agent creates account with password
5. ✅ Email is auto-confirmed (or manual confirmation completed)
6. ✅ Agent can sign in successfully
7. ✅ Agent appears in agency's agent list as "active"

---

## 🔧 Configuration Required

### **Environment Variables:**
- `FRONTEND_LINK` - Base URL for invitation links
- `SENDGRID_FROM_EMAIL` - Email sender address
- `SENDGRID_FROM_NAME` - Email sender name
- `SENDGRID_API_KEY` - SendGrid API key

### **Supabase Settings:**
- Email confirmation can be enabled/disabled
- If enabled, agents will need to confirm email manually
- If disabled, auto-confirmation works seamlessly

---

## 📝 Notes

- **Display Name:** Set from agency invitation name, can be updated during acceptance
- **Slug:** Auto-generated from name, ensures uniqueness
- **Location:** Optional, inherits agency primary location if not specified
- **Token Expiry:** 7 days (configurable in code)
- **Re-invitation:** Can re-invite if previous invitation expired or was cancelled

