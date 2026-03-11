# PostHog Audit Trail — How It Works

## Overview

Audit events are captured server-side via `captureAuditEvent()` and sent to PostHog. They are **not** stored in your database — only in PostHog.

---

## 1. Capture (Writing)

**File:** `src/lib/auditLogger.js`

```javascript
import { PostHog } from 'posthog-node'

// Uses NEXT_PUBLIC_POSTHOG_KEY (Project API Key) for capture
posthog.capture({
  distinctId: user_id || 'anonymous',
  event: eventName,           // e.g. 'listing_updated', 'auth_signin'
  properties: {
    user_id, user_type, timestamp,
    api_route, metadata, listing_id, ...
    $lib: 'audit-logger'      // Marks this as audit event
  }
})
```

**Where it's called:** API routes call `captureAuditEvent()` after successful mutations:

| Route | Event |
|-------|-------|
| `/api/auth/signin` | `auth_signin` |
| `/api/auth/signout` | `auth_signout` |
| `/api/auth/signup-supabase` | `auth_signup` |
| `/api/listings/[id]` PATCH | `listing_updated` |
| `/api/listings/[id]` DELETE | `listing_deleted` |
| `/api/developers/profile` PATCH | `developer_profile_updated` |
| `/api/leads/create` POST | `lead_created` |
| ... (see grep for full list) | ... |

---

## 2. Fetch (Reading)

**File:** `src/app/api/audit/events/route.js`

Uses **PostHog Query API** (HogQL):

```
POST {POSTHOG_HOST}/api/projects/{POSTHOG_PROJECT_ID}/query/
Body: { query: { kind: 'EventsQuery', select: ['*'], where: [...], ... } }
```

**Current behavior:**
- Filters by `event IN (AUDIT_EVENT_NAMES)`
- Filters by `distinct_id = userId` — **only shows events for that specific user**
- Limit 100, date range from query params

**Gap:** The API filters by `distinct_id = currentUserId`, so you only see **your own** actions. To see **all org audit events**, you need to either:
1. Remove the `distinct_id` filter and filter by org member IDs in your app, or
2. Use a HogQL query that filters by `properties.user_id IN (org_member_ids)`

---

## 3. Query to Fetch ALL Audit Events

**File:** `posthog_audit_events_query.sql`

Two options:

**A) By event names:**
```sql
SELECT event, timestamp, distinct_id, properties.user_id, properties.user_type, ...
FROM events
WHERE event NOT LIKE '$%'
  AND event IN ('auth_signup', 'auth_signin', 'listing_updated', ...)
ORDER BY timestamp DESC
LIMIT 500;
```

**B) By $lib (audit logger marker):**
```sql
SELECT ...
FROM events
WHERE event NOT LIKE '$%'
  AND properties.$lib = 'audit-logger'
ORDER BY timestamp DESC;
```

---

## 4. PostHog Query API (Programmatic)

**File:** `src/lib/posthogCron.js` — `fetchPostHogEventsByQueryAPI()`

```javascript
const queryBody = {
  kind: 'EventsQuery',
  select: ['*'],
  orderBy: ['timestamp DESC'],
  after: startTime.toISOString(),
  before: endTime.toISOString(),
  limit: 1000,
  offset: 0,
  where: [
    "event NOT LIKE '$%'",
    "event IN ('auth_signup', 'auth_signin', ...)",
    // Optional: "distinct_id = 'user-id'" or "properties.user_id = 'user-id'"
  ]
}

const response = await fetch(
  `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${POSTHOG_PERSONAL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: queryBody })
  }
)
```

**Required env vars:**
- `POSTHOG_PERSONAL_API_KEY` — for **read** (Query API)
- `POSTHOG_PROJECT_ID`
- `POSTHOG_HOST` (e.g. `https://us.i.posthog.com`)
- `NEXT_PUBLIC_POSTHOG_KEY` — for **write** (capture, used by auditLogger)

---

## 5. UI Status

| Page | Data source | Status |
|------|--------------|--------|
| `AuditTrail.jsx` (developer/agency) | `DUMMY_EVENTS` | **Not connected** — uses hardcoded data |
| `admin/audit/page.jsx` | `DUMMY_AUDIT_LOGS` | **Not connected** — uses hardcoded data |
| `/api/audit/events` | PostHog | **Works** — but filters by `distinct_id = currentUser` only |

To wire the UI to real data: call `GET /api/audit/events?dateFrom=...&dateTo=...&userId=...` and update the API to support fetching **all org members'** events (not just current user).
