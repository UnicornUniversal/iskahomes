# PostHog Audit Trail & Logger — Implementation Plan

## Overview

This document outlines the plan to implement a comprehensive audit trail and logger using PostHog across all API routes for **developers**, **property_seekers**, **agencies**, and **agents**. The goal is to capture server-side events for every significant action (signup, logout, invitations, CRUD operations, etc.) to enable auditing, analytics, and compliance.

---

## 1. Architecture & Prerequisites

### 1.1 Current State
- **Client-side**: `posthog-js` is used in `useAnalytics.js` for frontend events (property views, leads, etc.)
- **Server-side**: No PostHog capture in API routes; only `fetchPostHogEvents` for reading analytics
- **Auth**: JWT-based; `verifyToken()` and `getUserFromToken()` provide user context

### 1.2 What We Need
- **`posthog-node`** — Server-side SDK for capturing events from API routes (separate from `posthog-js`)
- **Centralized audit logger** — A reusable utility that all API routes call
- **Event naming convention** — Consistent, queryable event names

### 1.3 Installation
```bash
npm install posthog-node
```

### 1.4 Environment Variables
You already have:
- `NEXT_PUBLIC_POSTHOG_KEY` (or `POSTHOG_PROJECT_API_KEY`) — For **capture**, use the **Project API Key** (not Personal API Key)
- `POSTHOG_HOST` — e.g. `https://us.i.posthog.com`

**Note**: PostHog Node SDK uses the **Project API Key** for `capture()`. The Personal API Key is for read operations (Insights, Query API). Check your PostHog project settings for the correct key.

---

## 2. Audit Logger Utility

### 2.1 Create `src/lib/auditLogger.js`

A single module that:
- Initializes a PostHog Node client (singleton)
- Exposes `captureAuditEvent(eventName, properties, distinctId?)`
- Handles unauthenticated requests (e.g. signup) with `distinctId: 'anonymous'` or email
- Never throws — failures are logged but don't break the API

**Proposed API:**
```javascript
// captureAuditEvent(eventName, properties, distinctId?)
// properties: { user_type, action, resource, success, ...metadata }
```

**Event naming convention:**
- Format: `audit_{resource}_{action}` or `audit_{category}_{action}`
- Examples:
  - `audit_auth_signup`
  - `audit_auth_signin`
  - `audit_auth_signout`
  - `audit_invitation_sent` (agent/team)
  - `audit_invitation_accepted`
  - `audit_listing_created`
  - `audit_profile_updated`
  - `audit_saved_listing_added`

---

## 3. API Routes Inventory by User Type

### 3.1 Auth (Shared — All User Types)

| Route | Method | Event Name | When to Log |
|-------|--------|------------|-------------|
| `/api/auth/signup-supabase` | POST | `audit_auth_signup` | On successful signup (user_type in body) |
| `/api/auth/signin` | POST | `audit_auth_signin` | On successful signin (user_type from profile) |
| `/api/auth/signout` | POST | `audit_auth_signout` | On successful signout |
| `/api/auth/verify-email` | GET/POST | `audit_auth_email_verified` | On successful verification |
| `/api/auth/verify-email-supabase` | POST | `audit_auth_email_verified` | Same |
| `/api/auth/reset-password` | POST | `audit_auth_password_reset_requested` | When reset email sent |
| `/api/auth/change-password` | POST | `audit_auth_password_changed` | On success |
| `/api/auth/create-admin` | POST | `audit_auth_admin_created` | On success |

---

### 3.2 Developer Routes

| Route | Method | Event Name | When to Log |
|-------|--------|------------|-------------|
| `/api/developers/profile` | GET/PATCH | `audit_developer_profile_viewed` / `audit_developer_profile_updated` | On success |
| `/api/developers/profile/analytics` | GET | `audit_developer_analytics_viewed` | On success |
| `/api/developers/[slug]` | GET | `audit_developer_public_profile_viewed` | Public; optional |
| `/api/developers/team/members` | GET/POST | `audit_developer_team_listed` / `audit_developer_team_invitation_sent` | On success |
| `/api/developers/team/members/[id]` | GET/PATCH/DELETE | `audit_developer_team_member_updated` / `audit_developer_team_member_removed` | On success |
| `/api/developers/team/members/invite/accept` | POST | `audit_developer_team_invitation_accepted` | On success |
| `/api/developers/team/roles/[id]` | GET/PATCH | `audit_developer_role_updated` | On success |
| `/api/developments` | GET/POST | `audit_development_listed` / `audit_development_created` | On success |
| `/api/developments/[id]` | GET/PATCH/DELETE | `audit_development_viewed` / `audit_development_updated` / `audit_development_deleted` | On success |
| `/api/developments/[id]/stats` | GET | `audit_development_stats_viewed` | On success |
| `/api/units` | GET/POST | `audit_unit_listed` / `audit_unit_created` | On success |
| `/api/units/[id]` | GET/PATCH/DELETE | `audit_unit_viewed` / `audit_unit_updated` / `audit_unit_deleted` | On success |
| `/api/listings` | GET/POST | `audit_listing_listed` / `audit_listing_created` | On success |
| `/api/listings/[id]` | GET/PATCH/DELETE | `audit_listing_viewed` / `audit_listing_updated` / `audit_listing_deleted` | On success |
| `/api/listings/new/step/[stepName]` | GET/POST | `audit_listing_step_saved` | On step save |
| `/api/listings/by-user` | GET | `audit_listing_by_user_listed` | On success |
| `/api/listings/check-resume` | GET | `audit_listing_resume_checked` | On success |
| `/api/clients` | GET/POST | `audit_client_listed` / `audit_client_created` | On success |
| `/api/clients/[id]` | GET/PATCH | `audit_client_viewed` / `audit_client_updated` | On success |
| `/api/clients/[id]/assignments` | GET/POST | `audit_client_assignment_listed` / `audit_client_assignment_created` | On success |
| `/api/clients/[id]/assignments/[userId]` | DELETE | `audit_client_assignment_removed` | On success |
| `/api/clients/[id]/documents` | GET/POST | `audit_client_document_listed` / `audit_client_document_uploaded` | On success |
| `/api/clients/[id]/service-charges` | GET/POST | `audit_service_charge_listed` / `audit_service_charge_created` | On success |
| `/api/clients/[id]/transactions` | GET | `audit_transaction_listed` | On success |
| `/api/transaction-records` | GET/POST | `audit_transaction_record_listed` / `audit_transaction_record_created` | On success |
| `/api/transaction-records/[id]` | GET/PATCH | `audit_transaction_record_viewed` / `audit_transaction_record_updated` | On success |
| `/api/leads` | GET | `audit_lead_listed` | On success |
| `/api/leads/create` | POST | `audit_lead_created` | On success (from seeker; may be developer context) |
| `/api/leads/[id]` | GET | `audit_lead_viewed` | On success |
| `/api/analytics/*` | GET | `audit_analytics_viewed` | On success |
| `/api/sales/*` | GET | `audit_sales_viewed` | On success |
| `/api/subscriptions` | GET/POST | `audit_subscription_listed` / `audit_subscription_created` | On success |
| `/api/subscriptions/cancel` | POST | `audit_subscription_cancelled` | On success |
| `/api/subscriptions/history` | GET | `audit_subscription_history_viewed` | On success |
| `/api/subscriptions/invoices` | GET | `audit_invoice_listed` | On success |
| `/api/subscriptions-requests` | GET/POST | `audit_subscription_request_listed` / `audit_subscription_request_created` | On success |
| `/api/subscriptions-requests/[id]` | GET/PATCH | `audit_subscription_request_viewed` / `audit_subscription_request_updated` | On success |
| `/api/billing-information` | GET/PATCH | `audit_billing_viewed` / `audit_billing_updated` | On success |
| `/api/upload` | POST | `audit_upload_completed` | On success |
| `/api/appointments` | GET/POST | `audit_appointment_listed` / `audit_appointment_created` | On success |
| `/api/appointments/latest` | GET | `audit_appointment_latest_viewed` | On success |
| `/api/reminders` | GET/POST | `audit_reminder_listed` / `audit_reminder_created` | On success |
| `/api/reminders/[id]` | GET/PATCH/DELETE | `audit_reminder_viewed` / `audit_reminder_updated` / `audit_reminder_deleted` | On success |
| `/api/messages` | GET/POST | `audit_message_listed` / `audit_message_sent` | On success |
| `/api/messages/[id]` | GET | `audit_message_viewed` | On success |
| `/api/conversations` | GET/POST | `audit_conversation_listed` / `audit_conversation_created` | On success |
| `/api/conversations/[id]` | GET | `audit_conversation_viewed` | On success |
| `/api/conversations/[id]/read` | PATCH | `audit_conversation_marked_read` | On success |
| `/api/developments/searchDevelopments` | GET | `audit_development_searched` | On success |

---

### 3.3 Property Seeker Routes

| Route | Method | Event Name | When to Log |
|-------|--------|------------|-------------|
| `/api/property-seekers/profile` | GET/PATCH | `audit_seeker_profile_viewed` / `audit_seeker_profile_updated` | On success |
| `/api/saved-listings` | GET/POST/DELETE | `audit_saved_listing_listed` / `audit_saved_listing_added` / `audit_saved_listing_removed` | On success |
| `/api/leads/create` | POST | `audit_lead_created` | On success (seeker context) |
| `/api/subscriptions` | GET/POST | `audit_subscription_listed` / `audit_subscription_created` | On success |
| `/api/subscriptions/cancel` | POST | `audit_subscription_cancelled` | On success |
| `/api/subscriptions/history` | GET | `audit_subscription_history_viewed` | On success |
| `/api/subscriptions/invoices` | GET | `audit_invoice_listed` | On success |
| `/api/subscriptions-requests` | GET/POST | `audit_subscription_request_listed` / `audit_subscription_request_created` | On success |
| `/api/billing-information` | GET/PATCH | `audit_billing_viewed` / `audit_billing_updated` | On success |
| `/api/appointments` | GET/POST | `audit_appointment_listed` / `audit_appointment_created` | On success |
| `/api/messages` | GET/POST | `audit_message_listed` / `audit_message_sent` | On success |
| `/api/conversations` | GET/POST | `audit_conversation_listed` / `audit_conversation_created` | On success |
| `/api/search` | GET | `audit_search_performed` | On success (when seeker is logged in) |

---

### 3.4 Agency Routes

| Route | Method | Event Name | When to Log |
|-------|--------|------------|-------------|
| `/api/agencies/profile` | GET/PATCH | `audit_agency_profile_viewed` / `audit_agency_profile_updated` | On success |
| `/api/agencies/agents` | GET | `audit_agency_agents_listed` | On success |
| `/api/agencies/agents/invite` | POST | `audit_agency_agent_invitation_sent` | On success (invitation email sent) |
| `/api/agencies/agents/invite/accept` | POST | `audit_agency_agent_invitation_accepted` | On success |
| `/api/agencies/agents/[agentSlug]` | GET/PATCH/DELETE | `audit_agency_agent_viewed` / `audit_agency_agent_updated` / `audit_agency_agent_removed` | On success |
| `/api/listings/by-agency` | GET | `audit_agency_listings_listed` | On success |
| `/api/listings` | GET/POST | `audit_listing_listed` / `audit_listing_created` | On success (agency context) |
| `/api/listings/[id]` | GET/PATCH/DELETE | `audit_listing_viewed` / `audit_listing_updated` / `audit_listing_deleted` | On success |
| `/api/leads` | GET | `audit_lead_listed` | On success |
| `/api/analytics/*` | GET | `audit_analytics_viewed` | On success |
| `/api/subscriptions` | GET/POST | `audit_subscription_listed` / `audit_subscription_created` | On success |
| `/api/subscriptions-requests` | GET/POST | `audit_subscription_request_listed` / `audit_subscription_request_created` | On success |
| `/api/billing-information` | GET/PATCH | `audit_billing_viewed` / `audit_billing_updated` | On success |
| `/api/upload` | POST | `audit_upload_completed` | On success |
| `/api/messages` | GET/POST | `audit_message_listed` / `audit_message_sent` | On success |
| `/api/conversations` | GET/POST | `audit_conversation_listed` / `audit_conversation_created` | On success |

---

### 3.5 Agent Routes

| Route | Method | Event Name | When to Log |
|-------|--------|------------|-------------|
| `/api/agents/profile` | GET/PATCH | `audit_agent_profile_viewed` / `audit_agent_profile_updated` | On success |
| `/api/listings` | GET/POST | `audit_listing_listed` / `audit_listing_created` | On success |
| `/api/listings/[id]` | GET/PATCH/DELETE | `audit_listing_viewed` / `audit_listing_updated` / `audit_listing_deleted` | On success |
| `/api/listings/by-user` | GET | `audit_listing_by_user_listed` | On success |
| `/api/user-listings` | GET | `audit_user_listings_listed` | On success |
| `/api/leads` | GET | `audit_lead_listed` | On success |
| `/api/leads/create` | POST | `audit_lead_created` | On success (if agent creates lead) |
| `/api/appointments` | GET/POST | `audit_appointment_listed` / `audit_appointment_created` | On success |
| `/api/appointments/latest` | GET | `audit_appointment_latest_viewed` | On success |
| `/api/messages` | GET/POST | `audit_message_listed` / `audit_message_sent` | On success |
| `/api/conversations` | GET/POST | `audit_conversation_listed` / `audit_conversation_created` | On success |
| `/api/reminders` | GET/POST | `audit_reminder_listed` / `audit_reminder_created` | On success |
| `/api/reminders/[id]` | GET/PATCH/DELETE | `audit_reminder_viewed` / `audit_reminder_updated` / `audit_reminder_deleted` | On success |
| `/api/upload` | POST | `audit_upload_completed` | On success |
| `/api/subscriptions` | GET | `audit_subscription_listed` | On success |
| `/api/billing-information` | GET | `audit_billing_viewed` | On success |

---

## 4. Standard Event Properties

Every audit event should include:

```javascript
{
  // User context (from token or request)
  user_type: 'developer' | 'property_seeker' | 'agency' | 'agent' | 'team_member',
  user_id: string,           // distinct_id for PostHog
  organization_id: string,   // if applicable (developer/agency)
  organization_type: string, // 'developer' | 'agency'

  // Action context
  action: string,            // e.g. 'create', 'update', 'delete', 'view'
  resource: string,          // e.g. 'listing', 'profile', 'invitation'
  success: boolean,

  // Request context
  http_method: string,      // GET, POST, PATCH, DELETE
  api_route: string,        // e.g. '/api/listings/[id]'

  // Resource-specific (optional)
  resource_id: string,      // e.g. listing_id, agent_id
  metadata: object          // extra context (e.g. { listing_type: 'sale' })
}
```

---

## 5. Implementation Phases

### Phase 1: Foundation (Day 1)
1. Install `posthog-node`
2. Create `src/lib/auditLogger.js` with:
   - PostHog Node client initialization
   - `captureAuditEvent(eventName, properties, distinctId?)`
   - Graceful no-op when PostHog not configured
3. Add `NEXT_PUBLIC_POSTHOG_KEY` (or `POSTHOG_PROJECT_API_KEY`) to `.env.example` if not present

### Phase 2: Auth & Invitations (Day 2)
1. **Auth routes**: signup, signin, signout, verify-email, reset-password, change-password
2. **Invitation routes**:
   - `agencies/agents/invite` → `audit_agency_agent_invitation_sent`
   - `agencies/agents/invite/accept` → `audit_agency_agent_invitation_accepted`
   - `developers/team/members` (POST) → `audit_developer_team_invitation_sent`
   - `developers/team/members/invite/accept` → `audit_developer_team_invitation_accepted`

### Phase 3: Developer Routes (Days 3–4)
1. Profile, team, developments, units, listings
2. Clients, transactions, service charges
3. Leads, analytics, sales
4. Subscriptions, billing, upload
5. Messages, conversations, appointments, reminders

### Phase 4: Property Seeker Routes (Day 5)
1. Profile, saved-listings
2. Leads, subscriptions, billing
3. Appointments, messages, conversations
4. Search

### Phase 5: Agency & Agent Routes (Day 6)
1. Agency: profile, agents, invitations, listings, leads, analytics, subscriptions, billing, messages
2. Agent: profile, listings, leads, appointments, messages, reminders, upload, subscriptions

### Phase 6: Polish & Verification (Day 7)
1. Add audit logging to any missed routes
2. Verify events in PostHog dashboard
3. Document event schema for team
4. Optional: Create PostHog dashboard for audit trail

---

## 6. Code Pattern for Each Route

### Before (example: signout)
```javascript
// ... existing logic ...
return NextResponse.json({ success: true, message: 'Signed out successfully' });
```

### After
```javascript
import { captureAuditEvent } from '@/lib/auditLogger'

// ... existing logic ...

// After successful signout, before return
if (userInfo) {
  captureAuditEvent('audit_auth_signout', {
    user_type: userInfo.user_type,
    user_id: userInfo.user_id || userInfo.id,
    action: 'signout',
    resource: 'auth',
    success: true,
    http_method: 'POST',
    api_route: '/api/auth/signout',
  }, userInfo.user_id || userInfo.id)
}

return NextResponse.json({ success: true, message: 'Signed out successfully' });
```

### For unauthenticated routes (e.g. signup)
```javascript
captureAuditEvent('audit_auth_signup', {
  user_type: userType,  // from request body
  user_id: newUser.id,  // from Supabase response
  action: 'signup',
  resource: 'auth',
  success: true,
  http_method: 'POST',
  api_route: '/api/auth/signup-supabase',
  metadata: { email: email }  // avoid PII if not needed for audit
}, newUser.id)
```

---

## 7. Invitation Email Logging

For invitation flows, log **both**:
1. **Invitation sent** — When the API sends the invitation email (e.g. `audit_agency_agent_invitation_sent`)
2. **Invitation accepted** — When the user completes the accept flow (e.g. `audit_agency_agent_invitation_accepted`)

Properties for invitation sent:
```javascript
{
  inviter_user_type: 'agency',
  inviter_user_id: agencyId,
  invitee_email: email,  // hashed or omit for privacy if required
  invitation_type: 'agent',
  resource_id: agentId,
  success: true,
  ...
}
```

---

## 8. Error Handling

- **Never block the API** — Wrap `captureAuditEvent` in try/catch inside the utility
- **Log failures** — `console.warn('Audit log failed:', error)` for debugging
- **Optional: log failed actions** — e.g. `audit_auth_signin_failed` with `success: false` for security monitoring

---

## 9. PostHog Configuration

1. **Project API Key**: Use the key from PostHog Project Settings → Project API Key (for capture)
2. **Personal API Key**: Keep for read operations (Insights, Query API)
3. **Event taxonomy**: Create a PostHog taxonomy or document event names for your team
4. **Dashboards**: Build an "Audit Trail" dashboard filtering events where `event` starts with `audit_`

---

## 10. Summary Checklist

- [x] Install `posthog-node`
- [x] Create `src/lib/auditLogger.js`
- [x] Add env var for PostHog Project API Key (uses NEXT_PUBLIC_POSTHOG_KEY)
- [x] Implement Phase 2 (Auth + Invitations)
- [x] Implement Phase 3 (Developer routes)
- [x] Implement Phase 4 (Property Seeker routes)
- [x] Implement Phase 5 (Agency + Agent routes)
- [ ] Verify events in PostHog
- [ ] Document event schema

## 11. Implemented Routes (as of implementation)

**Auth:** signup-supabase, signin, signout, verify-email, verify-email-supabase, reset-password, change-password, forgot-password, create-admin

**Invitations:** agent_invitation_sent, agent_invitation_accepted, team_invitation_sent, team_invitation_accepted

**Profiles:** developer_profile_updated, agency_profile_updated, agent_profile_updated, seeker_profile_updated

**Listings:** listing_updated, listing_deleted

**Developments:** development_created

**Leads:** lead_created

**Saved Listings:** saved_listing_added, saved_listing_removed

**Team:** team_member_updated, team_member_removed

**Agents:** agent_updated

**Messages/Conversations/Subscriptions:** message_sent, conversation_created, subscription_created

---

## Appendix: Full API Route List (Reference)

Run this to get a full list of routes:
```bash
find src/app/api -name "route.js" | sort
```

Total: ~90+ route files. Focus on the ones that modify state (POST, PATCH, DELETE) and critical reads (profile, invitations, auth) first.
