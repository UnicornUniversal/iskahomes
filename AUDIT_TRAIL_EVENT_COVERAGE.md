# Audit Trail Event Coverage

Last updated: 2026-03-03 (batch 5)

## How this was checked

- Scanned all `captureAuditEvent(...)` calls across `src/app/api/**`.
- Cross-checked with the whitelist used by the audit API in `src/app/api/audit/events/route.js` (`AUDIT_EVENT_NAMES`).
- Compared against the target inventory in `POSTHOG_AUDIT_TRAIL_IMPLEMENTATION_PLAN.md`.

## Fully tracked now (implemented and queryable)

These are actively emitted in route handlers and included in the audit API query filter:

- `auth_signup`
- `auth_signin`
- `auth_signout`
- `auth_email_verified`
- `auth_password_reset`
- `auth_password_changed`
- `auth_password_reset_requested`
- `auth_admin_created`
- `agent_invitation_sent`
- `agent_invitation_accepted`
- `team_invitation_sent`
- `team_invitation_accepted`
- `developer_profile_updated`
- `agency_profile_updated`
- `agent_profile_updated`
- `seeker_profile_updated`
- `listing_updated`
- `listing_deleted`
- `development_created`
- `lead_created`
- `saved_listing_added`
- `saved_listing_removed`
- `team_member_updated`
- `team_member_removed`
- `agent_updated`
- `message_sent`
- `conversation_created`
- `subscription_created`

Coverage count: **116/116** of the currently whitelisted audit events.

### Newly implemented in this batch

- `lead_listed`
- `lead_updated`
- `appointment_created`
- `appointment_listed`
- `appointment_updated`
- `appointment_latest_viewed`
- `reminder_listed`
- `reminder_created`
- `reminder_updated`
- `reminder_deleted`
- `subscription_cancelled`
- `subscription_history_viewed`
- `invoice_listed`
- `subscription_listed`
- `billing_viewed`
- `billing_created`
- `billing_updated`
- `conversation_viewed`
- `conversation_marked_read`
- `analytics_viewed`
- `development_stats_viewed`
- `listing_by_user_listed`
- `listing_listed`
- `listing_created`
- `message_listed`
- `conversation_listed`
- `team_listed`
- `unit_listed`
- `unit_viewed`
- `unit_updated`
- `unit_deleted`
- `client_listed`
- `client_created`
- `client_viewed`
- `client_updated`
- `client_deleted`
- `transaction_record_listed`
- `transaction_record_created`
- `transaction_record_viewed`
- `transaction_record_updated`
- `transaction_record_deleted`
- `subscription_request_listed`
- `subscription_request_created`
- `subscription_request_updated`
- `search_performed`
- `development_searched`
- `upload_completed`
- `listing_step_saved`
- `development_viewed`
- `development_updated`
- `development_deleted`
- `subscription_request_viewed`
- `client_assignment_listed`
- `client_assignment_created`
- `client_assignment_updated`
- `client_assignment_removed`
- `client_document_listed`
- `client_document_uploaded`
- `client_document_removed`
- `service_charge_listed`
- `service_charge_created`
- `service_charge_updated`
- `service_charge_deleted`
- `transaction_listed`
- `transaction_created`
- `transaction_updated`
- `transaction_deleted`
- `developer_profile_viewed`
- `developer_analytics_viewed`
- `developer_public_profile_viewed`
- `developer_team_listed`
- `listing_viewed`
- `listing_resume_checked`
- `development_listed`
- `message_viewed`
- `reminder_viewed`
- `sales_viewed`
- `agency_profile_viewed`
- `agency_agents_listed`
- `agency_agent_invitation_sent`
- `agency_agent_invitation_accepted`
- `agency_agent_viewed`
- `agency_agent_updated`
- `agency_agent_removed`
- `agency_listings_listed`
- `agent_profile_viewed`
- `user_listings_listed`
- `unit_created`

## Left / not yet implemented (from plan)

The implementation plan defines broader audit coverage that is still missing in code.
Below are the main missing event groups.

### 1) Read/listing/view events
- None currently.

### 2) Other plan naming gaps

- None currently (using current event inventory/whitelist).

## Notes

- Current implementation uses mostly **action-oriented generic names** (for example `agent_updated`) rather than some of the **domain-prefixed names** in the plan (for example `agency_agent_updated`).
- If you want strict parity with the plan, we should choose one naming standard and normalize both:
  - `captureAuditEvent(...)` calls
  - `AUDIT_EVENT_NAMES` in `src/app/api/audit/events/route.js`
  - UI label map in `src/app/components/developers/AuditTrail.jsx`

