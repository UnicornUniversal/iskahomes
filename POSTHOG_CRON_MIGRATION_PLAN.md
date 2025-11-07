# PostHog-Only Analytics Migration Plan

## Overview
Migrating from Redis-based dual-write analytics to a simpler PostHog-only approach with hourly cron aggregation.

---

## Current Architecture

### **Flow:**
```
Client Event → PostHog (capture) + analyticsBatcher → /api/ingest/posthog → Redis → Cron (hourly) → Supabase
```

### **Components:**
1. **Client-side** (`useAnalytics.js`):
   - `captureAndQueue()` sends to PostHog AND queues to `analyticsBatcher`
   
2. **analyticsBatcher.js**:
   - Buffers events (max 200 or every 3s)
   - Sends batches to `/api/ingest/posthog`

3. **Ingest Endpoint** (`/api/ingest/posthog/route.js`):
   - Receives event batches
   - Processes each event → writes to Redis:
     - Counters (INCR)
     - Unique counts (HyperLogLog)
     - Lead data (Lists, Sets, Hashes)
     - User types (Strings)

4. **Cron Job** (`/api/cron/analytics/route.js`):
   - Runs hourly
   - Reads aggregated data from Redis
   - Computes derived metrics (conversion rates, etc.)
   - Writes to Supabase tables

---

## Target Architecture

### **Flow:**
```
Client Event → PostHog (capture only) → Cron (hourly) → Fetch from PostHog API → Aggregate in-memory → Supabase
```

### **Key Changes:**
1. **Client-side**: Remove Redis batching, send directly to PostHog only
2. **Ingest endpoint**: Comment out (keep for rollback)
3. **Cron job**: Rewrite to fetch from PostHog API instead of Redis
4. **Aggregation**: Move all aggregation logic from Redis to cron (in-memory processing)

---

## Migration Plan

### **Phase 1: Client-Side Changes**

#### File: `src/hooks/useAnalytics.js`
- **Change**: Remove `queueEvent()` call from `captureAndQueue()`
- **Action**: Comment out the Redis batching line
- **Result**: Events go **only** to PostHog

```javascript
// BEFORE:
const captureAndQueue = useCallback((event, properties) => {
  posthog?.capture(event, properties)
  queueEvent({ event, properties, distinct_id: getDistinctId(), timestamp: nowIso() })
}, [posthog])

// AFTER:
const captureAndQueue = useCallback((event, properties) => {
  posthog?.capture(event, properties)
  // COMMENTED OUT: Redis batching (migrated to PostHog-only)
  // queueEvent({ event, properties, distinct_id: getDistinctId(), timestamp: nowIso() })
}, [posthog])
```

#### File: `src/app/providers.jsx`
- **Change**: Comment out `initBatcher()` initialization
- **Action**: Keep code but disable batcher
- **Result**: No client-side batching

```javascript
// BEFORE:
useEffect(() => {
  // ... posthog.init ...
  const dispose = initBatcher()
  return () => { dispose && dispose() }
}, [])

// AFTER:
useEffect(() => {
  // ... posthog.init ...
  // COMMENTED OUT: Redis batcher (migrated to PostHog-only)
  // const dispose = initBatcher()
  // return () => { dispose && dispose() }
}, [])
```

---

### **Phase 2: Ingest Endpoint (Comment Out)**

#### File: `src/app/api/ingest/posthog/route.js`
- **Action**: Comment out entire file OR add early return
- **Reason**: Keep for rollback, but disable functionality
- **Note**: Can be deleted later if migration is successful

```javascript
// Add at top of POST handler:
export async function POST(request) {
  // COMMENTED OUT: Redis ingestion (migrated to PostHog-only)
  // Return success to prevent client errors
  return NextResponse.json({ 
    success: true, 
    message: 'Ingestion disabled - using PostHog-only approach',
    ingested: 0 
  })
  
  // ... rest of code commented out ...
}
```

---

### **Phase 3: Cron Job Rewrite**

#### File: `src/app/api/cron/analytics/route.js`

**Major Changes:**

1. **Remove Redis Dependencies:**
   - Remove all `client.get()`, `client.pfCount()`, `client.hGetAll()`, etc.
   - Comment out Redis connection logic
   - Keep Redis imports commented for rollback

2. **Add PostHog API Integration:**
   - Use PostHog Events API to fetch events by timestamp
   - Fetch events from last hour (or since last cron run)
   - Process events in-memory

3. **Aggregation Logic:**
   - All aggregation that was done in Redis → now done in cron
   - Use JavaScript objects/Maps for counting
   - Use Sets for unique user tracking
   - Calculate derived metrics (conversion rates, etc.)

4. **Data Structures (In-Memory):**
   ```javascript
   // Example structure for listing aggregation
   const listingAggregates = {
     [listingId]: {
       total_views: 0,
       unique_views: new Set(),
       views_by_source: { home: 0, explore: 0, search: 0, direct: 0 },
       leads: {
         phone: 0,
         message: 0,
         email: 0,
         appointment: 0,
         unique: new Set()
       },
       impressions: {
         social_media: 0,
         website_visit: 0,
         share: 0,
         saved: 0
       },
       sales: {
         count: 0,
         value: 0
       }
     }
   }
   ```

5. **PostHog API Calls:**
   - Use PostHog Events API endpoint: `/api/projects/{project_id}/events/`
   - Filter by timestamp: `timestamp__gte` and `timestamp__lt`
   - Filter by event names: `event={event_name}`
   - Paginate through results (PostHog may limit per request)

---

### **Phase 4: PostHog API Helper Functions**

#### New File: `src/lib/posthogCron.js` (or extend `src/lib/posthog.js`)

**Functions Needed:**

1. **`fetchEventsByTimeRange(startTime, endTime, eventNames = [])`**
   - Fetch all events from PostHog within time range
   - Handle pagination
   - Return array of events

2. **`fetchEventsByEventType(eventName, startTime, endTime, filters = {})`**
   - Fetch specific event type
   - Support property filters (listing_id, developer_id, etc.)
   - Return array of events

3. **`processEventsForAggregation(events)`**
   - Group events by entity (listing, user, development)
   - Aggregate counts, unique users, etc.
   - Return structured aggregates

**PostHog API Endpoints:**
- Events API: `GET /api/projects/{project_id}/events/`
- Parameters:
  - `after`: Cursor for pagination
  - `timestamp__gte`: ISO timestamp (start)
  - `timestamp__lt`: ISO timestamp (end)
  - `event`: Event name filter
  - `properties`: Property filters (JSON)

---

## Aggregation Logic Migration

### **What Was Done in Redis → Now Done in Cron:**

#### **1. Listing Analytics:**
- **Redis**: `INCR listing:{id}:day:{day}:total_views`
- **Cron**: Count events where `event = 'property_view'` and `properties.listing_id = {id}`

- **Redis**: `PFADD listing:{id}:day:{day}:unique_views {seeker_id}`
- **Cron**: Use `Set` to track unique `distinct_id` or `properties.seeker_id`

- **Redis**: `INCR listing:{id}:day:{day}:views_from_home`
- **Cron**: Count events where `properties.viewed_from = 'home'`

#### **2. Lead Analytics:**
- **Redis**: Lists for lead actions, Sets for unique seekers
- **Cron**: Group events by `listing_id` + `seeker_id`, collect all actions

#### **3. User Analytics:**
- **Redis**: User-specific counters
- **Cron**: Aggregate events by `user_id` or `lister_id`

#### **4. Development Analytics:**
- **Redis**: Development-specific counters
- **Cron**: Aggregate events by `development_id`

---

## Cron Job Structure (New)

```javascript
export async function POST(request) {
  try {
    // 1. Calculate time range (last hour)
    const endTime = new Date()
    const startTime = new Date(endTime.getTime() - 60 * 60 * 1000) // 1 hour ago
    
    // 2. Get all active entities from database
    const { listing_ids, user_ids, development_ids } = await getAllActiveEntities()
    
    // 3. Fetch events from PostHog
    const eventNames = [
      'property_view',
      'lead_phone',
      'lead_message',
      'lead_appointment',
      'impression_social_media',
      'impression_website_visit',
      'impression_share',
      'impression_saved_listing',
      'profile_view',
      'development_view',
      // ... all other events
    ]
    
    const allEvents = []
    for (const eventName of eventNames) {
      const events = await fetchEventsByTimeRange(startTime, endTime, [eventName])
      allEvents.push(...events)
    }
    
    // 4. Aggregate events in-memory
    const listingAggregates = aggregateListingEvents(allEvents, listing_ids)
    const userAggregates = aggregateUserEvents(allEvents, user_ids)
    const developmentAggregates = aggregateDevelopmentEvents(allEvents, development_ids)
    const leadsData = aggregateLeads(allEvents, listing_ids)
    
    // 5. Calculate derived metrics
    const listingRows = calculateListingMetrics(listingAggregates, date)
    const userRows = calculateUserMetrics(userAggregates, date)
    const developmentRows = calculateDevelopmentMetrics(developmentAggregates, date)
    
    // 6. Write to Supabase
    await insertIntoDatabase(listingRows, userRows, developmentRows, leadsData)
    
    return NextResponse.json({ success: true, ... })
  } catch (error) {
    // Error handling
  }
}
```

---

## Implementation Steps

### **Step 1: Prepare (No Code Changes)**
1. ✅ Review current Redis implementation
2. ✅ Document all event types being tracked
3. ✅ Document all Redis keys/structures
4. ✅ Document aggregation logic

### **Step 2: Comment Out Redis Code**
1. Comment out `queueEvent()` in `useAnalytics.js`
2. Comment out `initBatcher()` in `providers.jsx`
3. Add early return in `/api/ingest/posthog/route.js`

### **Step 3: Build PostHog API Helpers**
1. Create `fetchEventsByTimeRange()` function
2. Create `fetchEventsByEventType()` function
3. Test PostHog API connectivity
4. Handle pagination

### **Step 4: Rewrite Cron Aggregation**
1. Replace Redis reads with PostHog API calls
2. Implement in-memory aggregation logic
3. Replicate all Redis aggregation patterns
4. Test with sample data

### **Step 5: Testing**
1. Run cron manually with test data
2. Verify aggregation matches Redis approach
3. Check database writes
4. Monitor PostHog API rate limits

### **Step 6: Deployment**
1. Deploy changes
2. Monitor cron execution
3. Compare results with previous Redis approach
4. Keep Redis code commented for rollback

---

## Considerations

### **PostHog API Limits:**
- Rate limits: Check PostHog plan limits
- Pagination: May need multiple requests for large datasets
- Data retention: Ensure PostHog has data for time range

### **Performance:**
- In-memory aggregation should be fast for hourly batches
- May need to batch PostHog API calls if too many events
- Consider caching PostHog API responses during testing

### **Data Consistency:**
- PostHog events may have slight delay (1-5 minutes)
- Cron should fetch events from 1+ hour ago to ensure completeness
- Consider idempotency for cron runs

### **Rollback Plan:**
- All Redis code is commented, not deleted
- Can uncomment and redeploy if issues arise
- Keep Redis connection code intact

---

## Files to Modify

1. ✅ `src/hooks/useAnalytics.js` - Comment out `queueEvent()`
2. ✅ `src/app/providers.jsx` - Comment out `initBatcher()`
3. ✅ `src/app/api/ingest/posthog/route.js` - Add early return
4. ✅ `src/app/api/cron/analytics/route.js` - Complete rewrite
5. ✅ `src/lib/posthog.js` - Add PostHog API helper functions
6. ⚠️ `src/lib/analyticsBatcher.js` - Keep as-is (unused but available)
7. ⚠️ `src/lib/redis.js` - Keep as-is (unused but available)

---

## Success Criteria

- ✅ Events flow directly to PostHog (no Redis)
- ✅ Cron runs hourly and fetches from PostHog
- ✅ Aggregation matches previous Redis approach
- ✅ Database writes are correct
- ✅ No data loss during migration
- ✅ Can rollback if needed

---

## Next Steps

1. **Review this plan** with team
2. **Get PostHog API credentials** (Personal API Key, Project ID)
3. **Test PostHog API** with sample queries
4. **Implement Step 2** (comment out Redis code)
5. **Implement Step 3** (PostHog API helpers)
6. **Implement Step 4** (cron rewrite)
7. **Test thoroughly** before production

---

## Notes

- **Redis code is NOT deleted**, only commented out
- **Can rollback easily** by uncommenting Redis code
- **PostHog becomes single source of truth** for events
- **Cron becomes aggregation engine** (no Redis dependency)

