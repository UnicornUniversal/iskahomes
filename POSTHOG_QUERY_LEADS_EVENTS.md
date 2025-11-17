# PostHog Query: Get Leads Events

## Using PostHog SQL Interface

### Basic Query: Get All Lead Events

```sql
SELECT 
  event,
  distinct_id,
  timestamp,
  properties.lister_id as lister_id,
  properties.lister_type as lister_type,
  properties.listing_id as listing_id,
  properties.seeker_id as seeker_id,
  properties.lead_type as lead_type,
  properties.context_type as context_type,
  properties.phone_number as phone_number,
  properties.message_type as message_type,
  properties.appointment_type as appointment_type
FROM events
WHERE 
  event IN ('lead', 'lead_phone', 'lead_message', 'lead_appointment')
  AND timestamp >= now() - INTERVAL 1 YEAR
ORDER BY timestamp DESC
LIMIT 1000
```

### Get Lead Events by Lister (Developer/Agent)

```sql
SELECT 
  properties.lister_id as lister_id,
  properties.lister_type as lister_type,
  COUNT(*) as total_leads,
  COUNT(DISTINCT properties.seeker_id) as unique_leads,
  COUNT(CASE WHEN event = 'lead_phone' OR properties.lead_type = 'phone' THEN 1 END) as phone_leads,
  COUNT(CASE WHEN event = 'lead_message' OR properties.lead_type = 'message' THEN 1 END) as message_leads,
  COUNT(CASE WHEN event = 'lead_appointment' OR properties.lead_type = 'appointment' THEN 1 END) as appointment_leads,
  MIN(timestamp) as first_lead,
  MAX(timestamp) as last_lead
FROM events
WHERE 
  event IN ('lead', 'lead_phone', 'lead_message', 'lead_appointment')
  AND timestamp >= now() - INTERVAL 1 YEAR
  AND properties.lister_id IS NOT NULL
GROUP BY properties.lister_id, properties.lister_type
ORDER BY total_leads DESC
```

### Get Lead Events by Listing

```sql
SELECT 
  properties.listing_id as listing_id,
  properties.lister_id as lister_id,
  COUNT(*) as total_leads,
  COUNT(DISTINCT properties.seeker_id) as unique_leads,
  COUNT(CASE WHEN event = 'lead_phone' OR properties.lead_type = 'phone' THEN 1 END) as phone_leads,
  COUNT(CASE WHEN event = 'lead_message' OR properties.lead_type = 'message' THEN 1 END) as message_leads,
  COUNT(CASE WHEN event = 'lead_appointment' OR properties.lead_type = 'appointment' THEN 1 END) as appointment_leads
FROM events
WHERE 
  event IN ('lead', 'lead_phone', 'lead_message', 'lead_appointment')
  AND timestamp >= now() - INTERVAL 1 YEAR
  AND properties.listing_id IS NOT NULL
GROUP BY properties.listing_id, properties.lister_id
ORDER BY total_leads DESC
```

### Get Lead Events with Date Breakdown

```sql
SELECT 
  toDate(timestamp) as date,
  properties.lister_id as lister_id,
  properties.lister_type as lister_type,
  COUNT(*) as total_leads,
  COUNT(DISTINCT properties.seeker_id) as unique_leads
FROM events
WHERE 
  event IN ('lead', 'lead_phone', 'lead_message', 'lead_appointment')
  AND timestamp >= now() - INTERVAL 1 YEAR
  AND properties.lister_id IS NOT NULL
GROUP BY toDate(timestamp), properties.lister_id, properties.lister_type
ORDER BY date DESC, total_leads DESC
```

### Get Lead Events with Hour Breakdown

```sql
SELECT 
  toDate(timestamp) as date,
  toHour(timestamp) as hour,
  properties.lister_id as lister_id,
  COUNT(*) as total_leads
FROM events
WHERE 
  event IN ('lead', 'lead_phone', 'lead_message', 'lead_appointment')
  AND timestamp >= now() - INTERVAL 1 YEAR
  AND properties.lister_id IS NOT NULL
GROUP BY toDate(timestamp), toHour(timestamp), properties.lister_id
ORDER BY date DESC, hour DESC
```

### Get All Lead Events with Full Details (for Debugging)

```sql
SELECT 
  event,
  distinct_id,
  timestamp,
  properties.lister_id as lister_id,
  properties.lister_type as lister_type,
  properties.listing_id as listing_id,
  properties.seeker_id as seeker_id,
  properties.lead_type as lead_type,
  properties.context_type as context_type,
  properties.phone_number as phone_number,
  properties.message_type as message_type,
  properties.appointment_type as appointment_type,
  properties.profile_id as profile_id,
  properties.listing_type as listing_type,
  -- Get all properties as JSON for debugging
  properties as all_properties
FROM events
WHERE 
  event IN ('lead', 'lead_phone', 'lead_message', 'lead_appointment')
  AND timestamp >= now() - INTERVAL 1 YEAR
ORDER BY timestamp DESC
LIMIT 500
```

### Get Lead Events Count by Type

```sql
SELECT 
  CASE 
    WHEN event = 'lead' THEN COALESCE(properties.lead_type, 'unknown')
    WHEN event = 'lead_phone' THEN 'phone'
    WHEN event = 'lead_message' THEN 'message'
    WHEN event = 'lead_appointment' THEN 'appointment'
    ELSE 'unknown'
  END as lead_type,
  COUNT(*) as count,
  COUNT(DISTINCT properties.seeker_id) as unique_seekers,
  COUNT(DISTINCT properties.lister_id) as unique_listers
FROM events
WHERE 
  event IN ('lead', 'lead_phone', 'lead_message', 'lead_appointment')
  AND timestamp >= now() - INTERVAL 1 YEAR
GROUP BY lead_type
ORDER BY count DESC
```

### Get Lead Events for Specific Lister

```sql
SELECT 
  event,
  distinct_id,
  timestamp,
  properties.listing_id as listing_id,
  properties.seeker_id as seeker_id,
  properties.lead_type as lead_type,
  properties.context_type as context_type
FROM events
WHERE 
  event IN ('lead', 'lead_phone', 'lead_message', 'lead_appointment')
  AND properties.lister_id = 'YOUR_LISTER_ID_HERE'
  AND timestamp >= now() - INTERVAL 1 YEAR
ORDER BY timestamp DESC
```

### Get Lead Events Summary (Quick Overview)

```sql
SELECT 
  COUNT(*) as total_lead_events,
  COUNT(DISTINCT properties.lister_id) as unique_listers,
  COUNT(DISTINCT properties.listing_id) as unique_listings,
  COUNT(DISTINCT properties.seeker_id) as unique_seekers,
  COUNT(CASE WHEN event = 'lead_phone' OR properties.lead_type = 'phone' THEN 1 END) as phone_leads,
  COUNT(CASE WHEN event = 'lead_message' OR properties.lead_type = 'message' THEN 1 END) as message_leads,
  COUNT(CASE WHEN event = 'lead_appointment' OR properties.lead_type = 'appointment' THEN 1 END) as appointment_leads,
  MIN(timestamp) as first_lead_date,
  MAX(timestamp) as last_lead_date
FROM events
WHERE 
  event IN ('lead', 'lead_phone', 'lead_message', 'lead_appointment')
  AND timestamp >= now() - INTERVAL 1 YEAR
```

## Using PostHog REST API

### Direct API Call (cURL)

```bash
# Get all lead events from last year
curl -X GET "https://us.i.posthog.com/api/projects/{PROJECT_ID}/events/?event=lead&timestamp__gte=2024-01-01T00:00:00Z&timestamp__lt=2025-01-01T23:59:59Z" \
  -H "Authorization: Bearer {PERSONAL_API_KEY}" \
  -H "Content-Type: application/json"
```

### Get All Lead Event Types

```bash
# Unified lead event
curl -X GET "https://us.i.posthog.com/api/projects/{PROJECT_ID}/events/?event=lead&timestamp__gte=2024-01-01T00:00:00Z" \
  -H "Authorization: Bearer {PERSONAL_API_KEY}"

# Legacy lead events
curl -X GET "https://us.i.posthog.com/api/projects/{PROJECT_ID}/events/?event__in=lead_phone,lead_message,lead_appointment&timestamp__gte=2024-01-01T00:00:00Z" \
  -H "Authorization: Bearer {PERSONAL_API_KEY}"
```

## Using PostHog Python SDK

```python
from posthog import Posthog
from datetime import datetime, timedelta

# Initialize PostHog
posthog = Posthog(
    project_api_key='YOUR_PROJECT_API_KEY',
    host='https://us.i.posthog.com'
)

# Calculate time range (1 year ago to now)
end_time = datetime.now()
start_time = end_time - timedelta(days=365)

# Get unified lead events
lead_events = posthog.get_events(
    event='lead',
    after=start_time.isoformat(),
    before=end_time.isoformat(),
    properties=[
        {'key': 'lister_id', 'operator': 'is_not', 'value': None},
    ]
)

print(f"Found {len(lead_events)} unified lead events")

# Get all lead event types
lead_event_types = ['lead', 'lead_phone', 'lead_message', 'lead_appointment']
all_lead_events = []

for event_name in lead_event_types:
    events = posthog.get_events(
        event=event_name,
        after=start_time.isoformat(),
        before=end_time.isoformat()
    )
    all_lead_events.extend(events)
    print(f"{event_name}: {len(events)} events")

print(f"Total lead events: {len(all_lead_events)}")

# Analyze lead events
lead_by_lister = {}
for event in all_lead_events:
    lister_id = event.get('properties', {}).get('lister_id')
    if lister_id:
        if lister_id not in lead_by_lister:
            lead_by_lister[lister_id] = []
        lead_by_lister[lister_id].append(event)

print(f"Leads by lister: {len(lead_by_lister)} listers")
for lister_id, events in list(lead_by_lister.items())[:5]:
    print(f"  {lister_id}: {len(events)} leads")
```

## Using PostHog JavaScript/Node.js

```javascript
// Using PostHog Node.js SDK
const { PostHog } = require('posthog-node')

const client = new PostHog(
  process.env.POSTHOG_PERSONAL_API_KEY,
  {
    host: 'https://us.i.posthog.com',
    projectApiKey: process.env.POSTHOG_PROJECT_ID
  }
)

// Get events using PostHog API directly
async function getLeadEvents() {
  const startTime = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // 1 year ago
  const endTime = new Date()
  
  // Note: PostHog Node SDK doesn't have direct event fetching
  // Use REST API instead (see above)
  
  const response = await fetch(
    `https://us.i.posthog.com/api/projects/${process.env.POSTHOG_PROJECT_ID}/events/?` +
    `event=lead&` +
    `timestamp__gte=${startTime.toISOString()}&` +
    `timestamp__lt=${endTime.toISOString()}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.POSTHOG_PERSONAL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  )
  
  const data = await response.json()
  return data.results || []
}
```

## Query Parameters

- `event`: Single event name (e.g., `lead`)
- `event__in`: Multiple events (comma-separated, e.g., `lead,lead_phone,lead_message`)
- `timestamp__gte`: Start time (ISO 8601 format)
- `timestamp__lt`: End time (ISO 8601 format)
- `limit`: Max results per page (default: 100, max: 1000)
- `after`: Pagination cursor (from `next` field in response)

## Response Format

```json
{
  "results": [
    {
      "id": "event_id",
      "event": "lead",
      "timestamp": "2024-01-15T10:30:00Z",
      "properties": {
        "lister_id": "developer_id",
        "lister_type": "developer",
        "listing_id": "listing_id",
        "seeker_id": "seeker_id",
        "lead_type": "phone",
        "context_type": "listing"
      },
      "distinct_id": "user_id"
    }
  ],
  "next": "https://us.i.posthog.com/api/projects/.../events/?after=cursor"
}
```

## Filtering Auto-Capture Events

To exclude auto-capture events, filter by event name:

```bash
# Only get custom events (exclude $pageview, $autocapture, etc.)
curl -X GET "https://us.i.posthog.com/api/projects/{PROJECT_ID}/events/?event__not=$pageview&event__not=$autocapture&timestamp__gte=2024-01-01T00:00:00Z" \
  -H "Authorization: Bearer {PERSONAL_API_KEY}"
```

Or use the custom event names list:

```javascript
const customEventNames = [
  'property_view',
  'profile_view',
  'lead',
  'lead_phone',
  'lead_message',
  'lead_appointment',
  'impression_social_media',
  'impression_website_visit',
  'impression_share',
  'impression_saved_listing',
  // ... etc
]

// Use event__in parameter
const eventFilter = customEventNames.join(',')
```

