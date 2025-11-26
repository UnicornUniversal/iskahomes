# Analytics Cron Job - Complete Logic Breakdown

## Overview
The analytics cron job (`/api/cron/analytics`) processes PostHog events and populates analytics tables (`listing_analytics`, `user_analytics`, `development_analytics`, `leads`) with hourly time-series data.

---

## Table of Contents
1. [Entry Point & Initialization](#entry-point--initialization)
2. [Time Range Calculation](#time-range-calculation)
3. [PostHog Event Fetching](#posthog-event-fetching)
4. [Event Aggregation](#event-aggregation)
5. [Database Preparation](#database-preparation)
6. [Listing Analytics](#listing-analytics)
7. [User Analytics](#user-analytics)
8. [Development Analytics](#development-analytics)
9. [Leads Processing](#leads-processing)
10. [Database Updates](#database-updates)
11. [Finalization](#finalization)

---

## 1. Entry Point & Initialization

### Function: `POST(request)`

**Location:** `src/app/api/cron/analytics/route.js:1111`

### Initial Steps:

1. **Generate Run ID**
   ```javascript
   const runId = crypto.randomUUID()
   ```
   - Unique identifier for this cron execution
   - Used to track run status in `analytics_cron_status` table

2. **Parse Query Parameters**
   - `forceRun=true`: Force execution even if last run was recent
   - `ignoreLastRun=true`: Ignore last successful run timestamp
   - `testMode=true`: Test mode (fetch last 24 hours)
   - `testTimeSeries=true`: Time series test mode (process multiple days)
   - `testDays=N`: Number of days to process in time series mode

3. **Early Exit Check**
   ```javascript
   if (!forceRun && !testMode && !testTimeSeries && !ignoreLastRun) {
     const lastRun = await getLastSuccessfulRun()
     const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
     
     if (lastRun && new Date(lastRun.end_time) > oneHourAgo) {
       return NextResponse.json({ success: true, skipped: true })
     }
   }
   ```
   - **Purpose:** Skip if last successful run was less than 1 hour ago
   - **Performance:** Prevents unnecessary processing

4. **Check for Stuck/Incomplete Runs**
   - Finds runs that started > 2 hours ago but never completed
   - Marks them as failed if found

---

## 2. Time Range Calculation

### Normal Mode (Production)
```javascript
if (lastRun && !ignoreLastRun) {
  startTime = new Date(lastRun.end_time)  // Since last successful run
} else {
  startTime = new Date(Date.now() - 24 * 60 * 60 * 1000)  // Last 24 hours
}
endTimeForFetch = new Date()  // Current time
```

**Key Point:** Fetches **full UTC day** (00:00:00 → 23:59:59) for the target date, not just since last run.

### Test Time Series Mode
```javascript
// Fetch entire day (00:00:00 to 23:59:59)
startTime = new Date(actualDateObj)
startTime.setUTCHours(0, 0, 0, 0)
endTimeForFetch = new Date(actualDateObj)
endTimeForFetch.setUTCHours(23, 59, 59, 999)
```
- Processes days from November 1-21 (configurable)
- Groups events by hour (0-23)
- Creates entries only for hours with actual events

### Calendar Parts
```javascript
cal = calendarParts(endTime)
// Returns: { date, week, month, quarter, year, hour }
```
- `date`: YYYY-MM-DD format
- `hour`: 0-23 (UTC hour)
- Used for time-series partitioning

---

## 3. PostHog Event Fetching

### Custom Events List
```javascript
const customEventNames = [
  'property_view',           // Listing views
  'listing_impression',       // Listing impressions
  'lead',                     // Unified lead event (NEW)
  'lead_phone',              // Legacy lead events
  'lead_message',
  'lead_appointment',
  'impression_social_media',  // Impression events
  'impression_website_visit',
  'impression_share',
  'impression_saved_listing',
  'profile_view',            // Profile views
  'property_search',         // Search events
  'development_view',        // Development events
  'development_share',
  'development_saved',
  'development_social_click',
  'development_interaction',
  'development_lead'
]
```

### Fetching Method
```javascript
const { success, events, apiCalls } = await fetchEventsWithRetry(
  startTime,
  endTimeForFetch,
  customEventNames
)
```

**Implementation:** Uses PostHog Query API (`/query` endpoint) with:
- `where: ["event NOT LIKE '$%'"]` - Excludes auto-capture events
- `where: ["event IN (...customEventNames...)"]` - Only custom events
- Pagination via `offset` (up to 50 pages, 1000 events/page)

**Result:** Array of event objects with:
- `event`: Event name
- `timestamp`: ISO timestamp
- `properties`: Event properties (listing_id, lister_id, seeker_id, etc.)
- `distinct_id`: PostHog user ID

### Event Grouping (Time Series Mode)
```javascript
// Group events by hour (0-23)
for (const event of events) {
  const hour = new Date(event.timestamp).getUTCHours()
  if (!eventsByHour.has(hour)) {
    eventsByHour.set(hour, [])
  }
  eventsByHour.get(hour).push(event)
}
```
- Creates `Map<hour, events[]>` for hourly processing
- Only processes hours that have events

---

## 4. Event Aggregation

### Function: `aggregateEvents(events)`

**Location:** `src/app/api/cron/analytics/route.js:176`

### Process Flow:

1. **Initialize Aggregates Structure**
   ```javascript
   const aggregates = {
     listings: new Map(),    // Map<listingId, listingData>
     users: new Map(),       // Map<userId, userData>
     developments: new Map(), // Map<developmentId, developmentData>
     leads: new Map()        // Map<leadKey, leadData>
   }
   ```

2. **Process Each Event**
   - Iterates through all events
   - Extracts properties (listing_id, lister_id, seeker_id, etc.)
   - Routes to appropriate event handler based on `event` name

### Event Handlers:

#### A. `property_view` Event
```javascript
case 'property_view': {
  // Track for property_seekers
  seekerUser.properties_viewed++
  seekerUser.unique_properties_viewed.add(listingId)
  
  // Track for listings
  listing.total_views++
  listing.unique_views.add(seekerId)
  if (isLoggedIn) listing.logged_in_views++
  else listing.anonymous_views++
  
  // Track source (home, search, etc.)
  if (viewedFrom === 'home') listing.views_from_home++
  // ... other sources
  break
}
```

#### B. `lead` Event (Unified Lead Event)
```javascript
case 'lead': {
  const leadType = properties.lead_type  // 'phone', 'message', 'appointment'
  const finalListingId = properties.listing_id || properties.listingId
  
  // PROFILE LEAD (no listing_id)
  if (!finalListingId) {
    // Track for property_seekers
    seekerUser.leads_initiated++
    
    // CRITICAL: Track for developers/agents (lister)
    listerUser.profile_leads++  // NEW: Tracks profile leads
    
    // Create lead record in aggregates.leads
    aggregates.leads.set(`profile_${listerId}_${seekerId}`, {
      listing_id: null,  // Explicitly null for profile leads
      lister_id: listerId,
      lister_type: listerType,
      seeker_id: seekerId,
      context_type: 'profile',
      actions: [/* lead actions */]
    })
    break
  }
  
  // LISTING LEAD (has listing_id)
  // Track for listings
  listing.total_leads++
  listing.phone_leads++  // or message_leads, etc.
  listing.unique_leads.add(seekerId)
  
  // Track for property_seekers
  seekerUser.leads_initiated++
  
  // Create lead record in aggregates.leads
  aggregates.leads.set(`${finalListingId}_${seekerId}`, {
    listing_id: finalListingId,
    lister_id: listerId,
    lister_type: listerType,
    seeker_id: seekerId,
    context_type: 'listing',
    actions: [/* lead actions */]
  })
  break
}
```

**Key Distinction:**
- **Profile Lead:** `listing_id = null`, tracked in `user.profile_leads`
- **Listing Lead:** `listing_id = <uuid>`, tracked in `listing.total_leads`

#### C. `profile_view` Event
```javascript
case 'profile_view': {
  const profileId = properties.profile_id  // Developer/agent ID
  
  // Track profile views for developers/agents
  user.profile_views++
  user.unique_profile_viewers.add(distinct_id)
  
  // Track source
  if (from === 'home') user.profile_views_from_home++
  else if (from === 'listings') user.profile_views_from_listings++
  else if (from === 'search') user.profile_views_from_search++
  break
}
```

#### D. Impression Events
```javascript
case 'impression_social_media':
case 'impression_website_visit':
case 'impression_share':
case 'impression_saved_listing': {
  // Track for listings
  listing.total_impressions++
  listing.impression_social_media++  // or other type
  
  // Track for developers/agents (if from profile)
  if (contextType === 'profile') {
    user.profile_impressions++
    user.profile_impression_social_media++
  }
  break
}
```

### Aggregation Result:
- **`listingsMap`**: Map of listing aggregates (views, leads, impressions per listing)
- **`usersMap`**: Map of user aggregates (profile views, profile leads, etc.)
- **`developmentsMap`**: Map of development aggregates
- **`leadsMap`**: Map of lead records (for `leads` table)

---

## 5. Database Preparation

### Fetch Existing Data

1. **Fetch Leads from Database (for current date)**
   ```javascript
   const { data: currentDateLeads } = await supabaseAdmin
     .from('leads')
     .select('seeker_id, lister_id, lister_type, listing_id, lead_actions, date, hour')
     .eq('date', cal.date)
   ```
   - Fetches ALL hours for the date (not just current hour)
   - Used to build `leadsByLister` and `profileLeadsByLister` per hour

2. **Get Active Entities**
   ```javascript
   const { listing_ids, user_ids, development_ids } = await getAllActiveEntities()
   ```
   - Fetches all active listings, users, developments from database
   - Ensures analytics rows are created even if no events occurred

3. **Fetch Previous Period Data**
   ```javascript
   const previousHour = cal.hour > 0 ? cal.hour - 1 : 23
   const previousDate = cal.hour > 0 ? cal.date : /* previous day */
   
   const { data: previousListingAnalytics } = await supabaseAdmin
     .from('listing_analytics')
     .select('...')
     .eq('date', previousDate)
     .eq('hour', previousHour)
   ```
   - Used for change calculations (views_change, leads_change, etc.)

---

## 6. Listing Analytics

### Processing Loop
```javascript
for (const listingId of allListingIds) {
  // allListingIds = active listings + listings with events
  const listing = listingsMap.get(listingId) || {/* defaults */}
  
  // Calculate metrics
  const total_views = listing.total_views
  const total_leads = listing.total_leads
  const conversion_rate = (total_leads / total_views) * 100
  
  // Build breakdowns
  const shareBreakdown = {/* platform breakdown */}
  const leadsBreakdown = {/* lead type breakdown */}
  
  // Calculate changes
  const viewsChange = ((total_views - prevViews) / prevViews) * 100
  // ... other changes
}
```

### Row Structure
```javascript
listingRows.push({
  listing_id: listingId,
  date: cal.date,
  hour: cal.hour,  // 0-23
  week: cal.week,
  month: cal.month,
  quarter: cal.quarter,
  year: cal.year,
  total_views: listing.total_views,
  unique_views: listing.unique_views.size,
  total_impressions: listing.total_impressions,
  total_leads: listing.total_leads,
  conversion_rate: conversion_rate,
  share_breakdown: shareBreakdown,
  leads_breakdown: leadsBreakdown,
  views_change: {/* change data */},
  // ... other fields
})
```

### Key Metrics:
- **Views:** `total_views`, `unique_views`, `logged_in_views`, `anonymous_views`
- **Impressions:** `total_impressions`, `impression_social_media`, etc.
- **Leads:** `total_leads`, `phone_leads`, `message_leads`, etc.
- **Conversion:** `conversion_rate = (total_leads / total_views) * 100`
- **Changes:** `views_change`, `leads_change`, `conversion_change` (vs previous hour)

---

## 7. User Analytics

### Processing Flow

1. **Get User Listings**
   ```javascript
   const userListings = listingsByUserId[userId] || []
   total_listings = userListings.length
   ```

2. **Calculate Listing Metrics (from PostHog events)**
   ```javascript
   for (const listing of userListings) {
     const listingAggregate = listingsMap.get(listing.id)
     if (listingAggregate) {
       total_listing_views += listingAggregate.total_views
       total_listing_leads += listingAggregate.total_leads
       total_impressions_received += listingAggregate.total_impressions
       // ... breakdown by type
     }
   }
   ```
   - **Source:** PostHog events (real-time, per-hour)
   - **Independent:** Doesn't depend on `listing_analytics` table

3. **Calculate Profile Metrics (from PostHog events)**
   ```javascript
   const profile_views = user.profile_views || 0
   const profile_leads = user.profile_leads || 0  // NEW: From aggregates
   const profile_impressions = user.profile_impressions || 0
   ```

4. **Calculate Profile Leads (from leads table - fallback)**
   ```javascript
   const profile_leads_from_posthog = user.profile_leads || 0
   const profile_leads_from_db = profileLeadsByLister[listerKey] || 0
   const profile_leads = profile_leads_from_posthog || profile_leads_from_db
   ```
   - **Primary:** PostHog events (`user.profile_leads`)
   - **Fallback:** Leads table (if PostHog data missing)

5. **Calculate Total Metrics**
   ```javascript
   const total_listing_views = /* sum from listingsMap */
   const profile_views = user.profile_views || 0
   const total_views = total_listing_views + profile_views
   
   const total_listing_leads = /* sum from listingsMap */
   const profile_leads = user.profile_leads || 0
   const total_leads = total_listing_leads + profile_leads
   ```

6. **Calculate Conversion Rates**
   ```javascript
   const overall_conversion_rate = (total_leads / total_views) * 100
   const view_to_lead_rate = (total_leads / total_views) * 100
   const profile_to_lead_rate = (total_leads / total_views) * 100
   ```
   - **All rates include both listing AND profile data**

7. **Calculate Changes**
   ```javascript
   const prevTotalViews = previous.total_views || 0
   const prevTotalLeads = previous.total_leads || 0
   
   const viewsChange = ((currentTotalViews - prevTotalViews) / prevTotalViews) * 100
   const leadsChange = ((currentLeads - prevLeads) / prevLeads) * 100
   ```
   - **Previous data:** From `user_analytics` table (previous hour)
   - **Includes both listing and profile data**

### Row Structure
```javascript
userRows.push({
  user_id: userId,
  user_type: 'developer' | 'agent',
  date: cal.date,
  hour: cal.hour,  // 0-23
  profile_views: user.profile_views,
  total_listing_views: total_listing_views,
  total_views: total_listing_views + profile_views,
  total_listing_leads: total_listing_leads,
  total_leads: total_listing_leads + profile_leads,  // CRITICAL: Includes profile leads
  total_impressions_received: total_impressions_received,
  overall_conversion_rate: overall_conversion_rate,
  view_to_lead_rate: view_to_lead_rate,
  profile_to_lead_rate: profile_to_lead_rate,
  views_change: {/* change data */},
  leads_change: {/* change data */},
  // ... other fields
})
```

### Key Metrics:
- **Views:** `total_listing_views` (from listings) + `profile_views` (from profile)
- **Leads:** `total_listing_leads` (from listings) + `profile_leads` (from profile)
- **Impressions:** Listing impressions + profile impressions
- **Conversion:** All rates include both listing and profile data
- **Changes:** All changes compare current vs previous (both include profile + listing)

---

## 8. Development Analytics

### Processing Flow
```javascript
for (const developmentId of allDevelopmentIds) {
  const development = developmentsMap.get(developmentId) || {/* defaults */}
  
  developmentRows.push({
    development_id: developmentId,
    date: cal.date,
    hour: cal.hour,
    total_views: development.views,
    total_leads: development.total_leads,
    // ... other metrics
  })
}
```

**Similar structure to listing analytics, but for developments.**

---

## 9. Leads Processing

### Lead Record Creation

1. **From PostHog Events (aggregates.leads)**
   ```javascript
   for (const [leadKey, lead] of leadsMap.entries()) {
     leadRows.push({
       listing_id: lead.listing_id,  // null for profile leads
       lister_id: lead.lister_id,
       lister_type: lead.lister_type,
       seeker_id: lead.seeker_id,
       context_type: lead.context_type,  // 'listing' or 'profile'
       lead_actions: lead.actions,  // Array of actions
       total_actions: lead.actions.length,
       first_action_date: /* earliest action date */,
       last_action_date: /* latest action date */,
       date: cal.date,
       hour: cal.hour
     })
   }
   ```

2. **Lead Actions Structure**
   ```javascript
   {
     action_id: 'uuid',
     action_type: 'lead_phone' | 'lead_message' | 'lead_appointment',
     action_date: '20250115',  // YYYYMMDD
     action_hour: 10,  // 0-23
     action_timestamp: '2025-01-15T10:30:00Z',
     action_metadata: {
       context_type: 'listing' | 'profile',
       lead_type: 'phone' | 'message' | 'appointment'
     }
   }
   ```

### Lead Types:
- **Listing Lead:** `listing_id = <uuid>`, `context_type = 'listing'`
- **Profile Lead:** `listing_id = null`, `context_type = 'profile'`

---

## 10. Database Updates

### Batch Inserts (Per Hour)

1. **Listing Analytics**
   ```javascript
   await supabaseAdmin
     .from('listing_analytics')
     .upsert(listingRows, { onConflict: 'listing_id,date,hour' })
   ```

2. **User Analytics**
   ```javascript
   await supabaseAdmin
     .from('user_analytics')
     .upsert(userRows, { onConflict: 'user_id,user_type,date,hour' })
   ```

3. **Development Analytics**
   ```javascript
   await supabaseAdmin
     .from('development_analytics')
     .upsert(developmentRows, { onConflict: 'development_id,date,hour' })
   ```

4. **Leads**
   ```javascript
   await supabaseAdmin
     .from('leads')
     .upsert(leadRows, { onConflict: 'id' })
   ```

### After All Hours Processed:

1. **Update Listings Table**
   ```javascript
   // Query listing_analytics for entire day (all hours)
   const { data: aggregatedTotals } = await supabaseAdmin
     .rpc('get_cumulative_listing_analytics', { listing_ids: [...] })
   
   // Update listings table with totals
   for (const listingId in listingTotals) {
     await supabaseAdmin
       .from('listings')
       .update({
         total_views: totals.total_views,
         total_leads: totals.total_leads,
         listing_share_breakdown: breakdowns.share_breakdown,
         listing_leads_breakdown: breakdowns.leads_breakdown
       })
       .eq('id', listingId)
   }
   ```

2. **Update Developers Table**
   ```javascript
   // Aggregate developer totals across all hours
   for (const developerId in allDeveloperTotals) {
     const hourly = allDeveloperTotals[developerId]
     
     // Calculate new totals
     const newTotalViews = current.total_views + hourly.hourly_views
     const newTotalLeads = current.total_leads + hourly.hourly_leads
     const conversion_rate = (newTotalLeads / newTotalViews) * 100
     
     // Update developers table
     await supabaseAdmin
       .from('developers')
       .update({
         total_views: newTotalViews,
         total_leads: newTotalLeads,
         total_listings_views: hourly.cumulative_listing_views,
         conversion_rate: conversion_rate,
         leads_breakdown: {/* breakdown */}
       })
       .eq('developer_id', developerId)
   }
   ```

---

## 11. Finalization

### Complete Run
```javascript
await completeRun(runId, {
  events_processed: totalEventsProcessed,
  listings_inserted: allListingRows.length,
  users_inserted: allUserRows.length,
  developments_inserted: allDevelopmentRows.length,
  leads_inserted: allLeadRows.length
})
```

### Response
```javascript
return NextResponse.json({
  success: true,
  run_id: runId,
  events_processed: totalEventsProcessed,
  listings_inserted: allListingRows.length,
  users_inserted: allUserRows.length,
  // ... other stats
})
```

---

## Key Design Decisions

### 1. Hourly Time-Series Data
- **Why:** Enables granular analysis (hour-by-hour trends)
- **Storage:** Each row has `date` + `hour` (0-23) as composite primary key
- **Processing:** Events grouped by hour, processed separately

### 2. Profile vs Listing Leads
- **Profile Leads:** `listing_id = null`, tracked in `user.profile_leads`
- **Listing Leads:** `listing_id = <uuid>`, tracked in `listing.total_leads`
- **Total Leads:** `total_listing_leads + profile_leads` (for user_analytics)

### 3. PostHog as Source of Truth
- **Primary:** PostHog events (real-time, per-hour)
- **Fallback:** Database (leads table) for profile leads verification
- **Rationale:** PostHog is the source of events, database is for persistence

### 4. Full-Day Fetching
- **Normal Mode:** Fetches entire UTC day (00:00 → 23:59) for target date
- **Why:** Ensures `user_analytics` has complete daily metrics even if cron runs once per day
- **Processing:** Still processes hour-by-hour, but fetches full day

### 5. Independent Aggregation
- **User Analytics:** Calculates directly from PostHog events (`listingsMap`, `usersMap`)
- **Not Dependent:** Doesn't require `listing_analytics` table to exist first
- **Benefit:** More reliable, faster (no database queries for aggregation)

### 6. Change Calculations
- **Previous Period:** Previous hour (or previous day if hour 0)
- **Includes:** Both listing and profile data in comparisons
- **Formula:** `((current - previous) / previous) * 100`

---

## Data Flow Diagram

```
PostHog Events
    ↓
[Fetch Events] (Query API, filtered by custom events)
    ↓
[Group by Hour] (0-23, only hours with events)
    ↓
[Process Each Hour]
    ├─→ [Aggregate Events] → listingsMap, usersMap, developmentsMap, leadsMap
    ├─→ [Build Listing Analytics Rows] → allListingRows
    ├─→ [Build User Analytics Rows] → allUserRows
    ├─→ [Build Development Analytics Rows] → allDevelopmentRows
    └─→ [Build Lead Rows] → allLeadRows
    ↓
[Batch Insert] (per hour)
    ├─→ listing_analytics (upsert)
    ├─→ user_analytics (upsert)
    ├─→ development_analytics (upsert)
    └─→ leads (upsert)
    ↓
[After All Hours]
    ├─→ [Update Listings Table] (aggregate daily totals)
    └─→ [Update Developers Table] (aggregate daily totals)
    ↓
[Complete Run] → analytics_cron_status
```

---

## Critical Fixes Implemented

### 1. Profile Leads Tracking
- **Before:** Profile leads (no `listing_id`) were tracked in `leads` table but NOT in `user_analytics`
- **After:** Profile leads tracked in `aggregates.users.profile_leads` → included in `total_leads`

### 2. Total Leads Calculation
- **Before:** `total_leads = leadsByLister.total_leads` (from database, all hours)
- **After:** `total_leads = total_listing_leads + profile_leads` (from PostHog, per-hour)

### 3. Hour-Based Processing
- **Before:** `leadsByLister` built once for all hours
- **After:** `leadsByLister` built per hour, filtered by `cal.hour`

### 4. Developer Totals Accumulation
- **Before:** `developerTotals` defined inside hour loop, used outside → `ReferenceError`
- **After:** `allDeveloperTotals` defined outside loop, accumulated across hours

---

## Performance Optimizations

1. **Time Range:** Fetch only last 24 hours or since last run (not 1 year)
2. **Early Exit:** Skip if last run was < 1 hour ago
3. **Batch Operations:** Batch inserts instead of individual updates
4. **Map Data Structures:** O(1) lookups instead of array searches
5. **Conditional Logging:** Reduced console output in production
6. **PostHog API Filtering:** Filter at API level (not client-side)

---

## Testing Modes

### Normal Mode
- Fetches full UTC day for current date
- Processes current hour only
- Updates database tables

### Test Mode (`testMode=true`)
- Fetches last 24 hours
- Processes current hour
- Useful for testing without affecting production data

### Time Series Test Mode (`testTimeSeries=true`)
- Processes multiple days (Nov 1-21, configurable)
- Groups events by hour
- Creates entries only for hours with events
- Useful for backfilling historical data

---

## Error Handling

1. **PostHog API Errors:** Retries with exponential backoff
2. **Database Errors:** Logs error, continues with other operations
3. **Missing Data:** Uses defaults (0 values) if data missing
4. **Stuck Runs:** Detects and marks as failed after 2 hours

---

## Summary

The cron job:
1. ✅ Fetches PostHog events (custom events only, filtered at API level)
2. ✅ Groups events by hour (for time-series data)
3. ✅ Aggregates events into Maps (listings, users, developments, leads)
4. ✅ Tracks **both profile and listing leads/views**
5. ✅ Creates analytics rows per hour
6. ✅ Calculates conversion rates (including profile data)
7. ✅ Calculates changes (vs previous hour)
8. ✅ Batch inserts into database
9. ✅ Updates parent tables (listings, developers) with aggregated totals

**All metrics account for both profile and listing data!**

