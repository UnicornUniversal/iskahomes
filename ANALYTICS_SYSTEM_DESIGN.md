# Analytics System Design & Flow - Iska Homes

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Frontend)                         │
│  ┌────────────────┐          ┌──────────────────┐              │
│  │  React Components │──────▶│  useAnalytics Hook│              │
│  └────────────────┘          └────────┬─────────┘              │
│                                       │                          │
│                          ┌────────────┴────────────┐           │
│                          ▼                          ▼           │
│                   ┌─────────────┐        ┌─────────────────┐  │
│                   │  PostHog SDK│        │ analyticsBatcher │  │
│                   │  (External) │        │  (Local Buffer)  │  │
│                   └──────┬──────┘        └────────┬──────────┘  │
└──────────────────────────┼────────────────────────┼────────────┘
                           │                        │
                           │                        │
                    ┌──────▼──────┐        ┌───────▼──────────┐
                    │   PostHog    │        │  /api/ingest/    │
                    │   Cloud      │        │    posthog       │
                    │  (Primary)   │        │   (Secondary)    │
                    └─────────────┘        └────────┬─────────┘
                                                     │
                                                     ▼
                                    ┌────────────────────────┐
                                    │      Redis Cache       │
                                    │  (Temporary Storage)    │
                                    │  TTL: 7 days           │
                                    └──────────┬─────────────┘
                                               │
                                               │ (Cron Job)
                                               ▼
                                    ┌────────────────────────┐
                                    │    Supabase Database   │
                                    │  (Permanent Storage)   │
                                    │                        │
                                    │  - listing_analytics   │
                                    │  - user_analytics       │
                                    │  - development_analytics│
                                    │  - leads                │
                                    │  - sales_listings       │
                                    └────────────────────────┘
```

---

## 📊 Data Flow (Step-by-Step)

### **Phase 1: Event Tracking (Client-Side)**

**1. User Action Occurs**
- User views a property, clicks phone number, shares listing, etc.
- React component detects the action

**2. Analytics Hook Called**
```javascript
// Example: User views a property
analytics.trackPropertyView(listingId, {
  viewedFrom: 'home',
  lister_id: developerId,
  lister_type: 'developer'
})
```

**3. Dual-Write Strategy**
The `useAnalytics` hook implements a **dual-write** pattern:
- **Primary Path**: Sends event to PostHog Cloud (via PostHog SDK)
- **Secondary Path**: Queues event to local buffer (`analyticsBatcher`)

```javascript
const captureAndQueue = (event, properties) => {
  // 1. Send to PostHog (primary analytics)
  posthog.capture(event, properties)
  
  // 2. Queue for Redis ingestion (secondary)
  queueEvent({ event, properties, distinct_id, timestamp })
}
```

**4. Event Batching**
- Events are buffered in memory (`BUFFER` array)
- **Flush triggers**:
  - **Size threshold**: When buffer reaches 200 events → immediate flush
  - **Time threshold**: Every 3 seconds → automatic flush
  - **Page unload**: `beforeunload` event → send via `navigator.sendBeacon`

**5. HTTP Request to Ingestion Endpoint**
```javascript
POST /api/ingest/posthog
Body: { events: [event1, event2, ...] }
```

---

### **Phase 2: Event Ingestion (Server-Side)**

**1. Receive Events** (`/api/ingest/posthog/route.js`)
- Receives batch of events from client
- Validates webhook secret (if configured)
- Ensures Redis connection

**2. Process Each Event**
```javascript
async function processEvent(event) {
  // Extract properties
  const { event, properties, distinct_id, timestamp } = event
  const listingId = properties.listing_id
  const day = toDayKey(timestamp) // "20250115"
  
  // Process based on event type
  switch (event) {
    case 'property_view':
      // Increment counters in Redis
      incrWithTTL(`listing:${listingId}:day:${day}:total_views`)
      pfAddWithTTL(`listing:${listingId}:day:${day}:unique_views`, seekerId)
      break
    // ... more cases
  }
}
```

**3. Store in Redis**
Events are aggregated into Redis with specific key patterns:

**Redis Key Structure:**
```
listing:{listingId}:day:{YYYYMMDD}:{metric}
  Examples:
  - listing:abc123:day:20250115:total_views
  - listing:abc123:day:20250115:unique_views (HyperLogLog)
  - listing:abc123:day:20250115:phone_leads

user:{userId}:day:{YYYYMMDD}:{metric}
  Examples:
  - user:dev456:day:20250115:profile_views
  - user:dev456:day:20250115:total_listings

development:{devId}:day:{YYYYMMDD}:{metric}
  Examples:
  - development:dev789:day:20250115:total_views
  - development:dev789:day:20250115:total_interactions

lead:{listingId}:{seekerId}:{metric}
  Examples:
  - lead:abc123:seeker456:actions (List of lead actions)
  - lead:abc123:seeker456:metadata (Hash of lead info)
```

**Redis Data Types:**
- **Strings**: Counter values (`total_views`, `phone_leads`)
- **HyperLogLog**: Unique counts (`unique_views`, `unique_leads`)
- **Hashes**: Metadata and breakdowns (`metadata`, `breakdown`)
- **Lists**: Arrays of actions (`lead:actions`)

**4. TTL Management**
- All Redis keys have a **7-day TTL** (604,800 seconds)
- Prevents Redis from growing indefinitely
- Ensures only recent data is kept in cache

**5. Return Response**
```json
{
  "success": true,
  "ingested": 45,
  "byDay": {
    "20250115": 45
  }
}
```

---

### **Phase 3: Data Aggregation (Cron Job)**

**1. Cron Job Trigger**
- Runs periodically (typically hourly or daily)
- Calls: `POST /api/cron/analytics`

**2. Fetch Active IDs**
```javascript
// Get all listings/users/developments that had activity
const listing_ids = await client.keys('listing:*:day:*:total_views')
const user_ids = await client.keys('user:*:day:*:profile_views')
const development_ids = await client.keys('development:*:day:*:total_views')
```

**3. Aggregate Data from Redis**
For each entity (listing/user/development):
```javascript
// Read aggregated metrics
const total_views = await readInt(`listing:${id}:day:${day}:total_views`)
const unique_views = await client.pfCount(`listing:${id}:day:${day}:unique_views`)
const phone_leads = await readInt(`listing:${id}:day:${day}:phone_leads`)
// ... etc
```

**4. Calculate Derived Metrics**
```javascript
const conversion_rate = total_views > 0 
  ? (total_leads / total_views) * 100 
  : 0

const avg_sale_price = total_sales > 0 
  ? sales_value / total_sales 
  : 0
```

**5. Process Leads**
For each listing-seeker pair:
```javascript
// Fetch lead actions from Redis list
const actions = await client.lRange(`lead:${listingId}:${seekerId}:actions`, 0, -1)
const metadata = await client.hGetAll(`lead:${listingId}:${seekerId}:metadata`)

// Build lead record
const leadRow = {
  listing_id: listingId,
  lister_id: metadata.lister_id,
  lister_type: metadata.lister_type,
  seeker_id: seekerId,
  lead_actions: JSON.parse(actions), // Array of action objects
  total_actions: actions.length,
  status: metadata.status || 'new',
  notes: [] // User-generated notes
}
```

**6. Build Calendar Dimensions**
```javascript
const cal = calendarParts(date)
// Returns: {
//   date: "2025-01-15",
//   week: "2025-W03",
//   month: "2025-01",
//   quarter: "2025-Q1",
//   year: 2025
// }
```

**7. Upsert to Supabase**
```sql
-- Upsert listing analytics
INSERT INTO listing_analytics (
  listing_id, date, week, month, quarter, year,
  total_views, unique_views, total_leads, conversion_rate, ...
) VALUES (...)
ON CONFLICT (listing_id, date) DO UPDATE SET ...

-- Upsert user analytics
INSERT INTO user_analytics (
  user_id, user_type, date, week, month, quarter, year,
  profile_views, total_listings, total_leads_generated, ...
) VALUES (...)
ON CONFLICT (user_id, user_type, date) DO UPDATE SET ...

-- Upsert development analytics
INSERT INTO development_analytics (...)
ON CONFLICT (development_id, date) DO UPDATE SET ...

-- Upsert leads
INSERT INTO leads (
  listing_id, lister_id, lister_type, seeker_id,
  lead_actions, total_actions, status, notes, ...
) VALUES (...)
ON CONFLICT (listing_id, seeker_id) DO UPDATE SET ...
```

**8. Return Summary**
```json
{
  "success": true,
  "processed": {
    "listings": { "inserted": 234, "errors": [] },
    "users": { "inserted": 45, "errors": [] },
    "developments": { "inserted": 12, "errors": [] },
    "leads": { "inserted": 567, "errors": [] }
  }
}
```

---

## 🔄 Complete Flow Example: "User Views Property"

```
1. [CLIENT] User clicks on property card
   ↓
2. [CLIENT] Component calls: analytics.trackPropertyView('listing-123', {...})
   ↓
3. [CLIENT] useAnalytics hook:
   - Sends to PostHog Cloud ✅
   - Queues to local buffer ✅
   ↓
4. [CLIENT] analyticsBatcher:
   - Adds event to BUFFER array
   - After 3 seconds OR 200 events → flush
   ↓
5. [CLIENT → SERVER] POST /api/ingest/posthog
   Body: { events: [{ event: 'property_view', properties: {...} }] }
   ↓
6. [SERVER] processEvent():
   - Extracts: listingId='listing-123', seekerId='seeker-456', day='20250115'
   - Increments: Redis.incr('listing:listing-123:day:20250115:total_views')
   - Adds to HyperLogLog: Redis.pfAdd('listing:listing-123:day:20250115:unique_views', 'seeker-456')
   ↓
7. [REDIS] Data stored:
   listing:listing-123:day:20250115:total_views = 1
   listing:listing-123:day:20250115:unique_views = {HyperLogLog}
   ↓
8. [CRON] Hourly cron job runs:
   - Fetches all active listing IDs from Redis
   - For 'listing-123':
     * Reads: total_views = 1, unique_views = 1
     * Calculates: conversion_rate = 0% (no leads yet)
   - Builds row: { listing_id: 'listing-123', date: '2025-01-15', total_views: 1, ... }
   ↓
9. [DATABASE] Upsert to listing_analytics:
   INSERT INTO listing_analytics (...) VALUES (...)
   ON CONFLICT (listing_id, date) DO UPDATE SET total_views = ...
   ↓
10. [DONE] Data is now queryable from Supabase for analytics dashboards
```

---

## 🗄️ Database Schema Overview

### **1. listing_analytics**
**Purpose**: Daily aggregated metrics per listing
**Key Fields**:
- `listing_id`, `date` (composite primary key)
- `total_views`, `unique_views`, `logged_in_views`, `anonymous_views`
- `views_from_home`, `views_from_explore`, `views_from_search`, `views_from_direct`
- `total_impressions`, `impression_social_media`, `impression_website_visit`, `impression_share`, `impression_saved_listing`
- `total_leads`, `phone_leads`, `message_leads`, `email_leads`, `appointment_leads`, `unique_leads`
- `total_sales`, `sales_value`, `avg_sale_price`, `avg_days_to_sale`
- `conversion_rate`, `lead_to_sale_rate`
- `week`, `month`, `quarter`, `year` (for time-based queries)

### **2. user_analytics**
**Purpose**: Daily aggregated metrics per user (developer/agent/agency)
**Key Fields**:
- `user_id`, `user_type`, `date` (composite primary key)
- `profile_views`, `unique_profile_viewers`
- `total_listings`, `active_listings`, `sold_listings`
- `total_listing_views`, `total_listing_leads`
- `total_revenue`, `total_sales`
- `total_leads_generated`, `phone_leads_generated`, `message_leads_generated`, etc.
- `week`, `month`, `quarter`, `year`

### **3. development_analytics**
**Purpose**: Daily aggregated metrics per development
**Key Fields**:
- `development_id`, `developer_id`, `date` (composite primary key)
- `total_views`, `unique_views`, `logged_in_views`
- `views_from_home`, `views_from_listings`, `views_from_search`
- `total_leads`, `total_sales`, `sales_value`
- `total_interactions`, `engagement_rate`
- `conversion_rate`
- `week`, `month`, `quarter`, `year`

### **4. leads**
**Purpose**: Individual lead records with detailed actions
**Key Fields**:
- `id` (primary key)
- `listing_id`, `lister_id`, `lister_type`, `seeker_id`
- `lead_actions` (JSONB array) - All actions performed by seeker
- `total_actions`, `first_action_date`, `last_action_date`, `last_action_type`
- `status` (new, contacted, qualified, converted, lost)
- `notes` (JSONB array of text strings)
- `created_at`, `updated_at`

### **5. sales_listings**
**Purpose**: Individual sale transactions
**Key Fields**:
- `id` (primary key)
- `listing_id`, `user_id` (buyer)
- `buyer_name`, `sale_date`, `sale_timestamp`
- `sale_price`, `currency`
- `sale_type`, `sale_source`
- `commission_rate`, `commission_amount`
- `notes`
- `created_at`, `updated_at`

---

## 🎯 Key Design Decisions

### **1. Dual-Write Strategy**
- **Why**: Redundancy and reliability
- **How**: PostHog (primary) + Redis (secondary)
- **Benefit**: If one fails, the other maintains data integrity

### **2. Redis as Intermediate Cache**
- **Why**: High-write throughput, low latency
- **How**: Temporary storage with 7-day TTL
- **Benefit**: Handles burst traffic without overwhelming database

### **3. Batch Processing (Cron)**
- **Why**: Reduce database write load
- **How**: Aggregate in Redis → Batch upsert to Supabase
- **Benefit**: Efficient bulk operations, calculated metrics

### **4. Generic Lister System**
- **Why**: Future-proof for multiple user types
- **How**: `lister_id` + `lister_type` instead of hardcoded `developer_id`
- **Benefit**: Supports developers, agents, agencies, property managers

### **5. Calendar Dimensions**
- **Why**: Fast time-based queries
- **How**: Pre-calculate `week`, `month`, `quarter`, `year` in cron
- **Benefit**: No runtime date calculations for dashboards

### **6. HyperLogLog for Unique Counts**
- **Why**: Memory-efficient unique counting
- **How**: Redis HyperLogLog for `unique_views`, `unique_leads`
- **Benefit**: Accurate approximations with minimal memory

### **7. JSONB for Flexible Data**
- **Why**: Support varying action types
- **How**: `lead_actions` and `notes` as JSONB arrays
- **Benefit**: Schema flexibility without migrations

---

## 📈 Event Types Tracked

### **Property Events**
- `property_view` - Property/listing viewed
- `listing_impression` - Listing appeared in feed (soft view)

### **Impression Events**
- `impression_social_media` - Social media link clicked
- `impression_website_visit` - Website link clicked
- `impression_share` - Content shared
- `impression_saved_listing` - Listing saved/favorited

### **Lead Events**
- `lead_phone` - Phone number clicked/copied
- `lead_message` - Message button clicked
- `lead_email` - Email link clicked
- `lead_appointment` - Appointment booked

### **Profile Events**
- `profile_view` - Developer/agent profile viewed

### **Development Events**
- `development_view` - Development page viewed
- `development_share` - Development shared
- `development_saved` - Development saved
- `development_social_click` - Social link clicked
- `development_interaction` - General interaction

### **System Events**
- `listing_created` - New listing created
- `listing_updated` - Listing updated
- `listing_deleted` - Listing deleted
- `user_logged_in` - User logged in
- `user_logged_out` - User logged out
- `development_created` - Development created

---

## 🔒 Security & Reliability

### **Webhook Security**
- Optional `POSTHOG_WEBHOOK_SECRET` for `/api/ingest/posthog`
- Validates incoming requests

### **Error Handling**
- Graceful degradation: If Redis fails, PostHog still works
- Try-catch blocks around all Redis operations
- Failed events logged but don't crash the system

### **Data Integrity**
- Upsert operations prevent duplicates
- TTL prevents stale data accumulation
- Composite keys ensure uniqueness

### **Performance**
- Batch processing reduces database load
- Redis caching speeds up aggregations
- HyperLogLog optimizes unique counts
- Indexed database columns for fast queries

---

## 🚀 Future Enhancements

1. **Real-time Dashboard Updates**: WebSocket connection for live metrics
2. **Location Analytics**: Pre-aggregated location metrics table
3. **Machine Learning**: Predictive models for lead conversion
4. **A/B Testing**: Event tracking for feature experiments
5. **Advanced Segmentation**: Multi-dimensional analytics queries

---

## 📝 Summary

**The analytics system follows a robust 3-phase architecture:**
1. **Capture** (Client): Dual-write to PostHog + local buffer
2. **Ingest** (Server): Batch process events → Redis aggregation
3. **Aggregate** (Cron): Redis → Supabase permanent storage

**Key Benefits:**
- ✅ High performance (Redis caching)
- ✅ Reliable (dual-write redundancy)
- ✅ Scalable (batch processing)
- ✅ Flexible (generic lister system)
- ✅ Maintainable (clear separation of concerns)

This design ensures accurate, real-time analytics while maintaining system performance and reliability.

