# Analysis: total_listings_views Issue

## Problem Statement
- `total_listings_views` in the `developers` table is 0, even though `listing_analytics` has data
- Profile views (17) are being tracked correctly, but listing views are not aggregating properly
- This is the first time the cron is running

## Root Cause Analysis

### Issue #1: Only Current Hour Data is Used
**Location:** `src/app/api/cron/analytics/route.js` lines 1472-1488

The code queries `listing_analytics` for the CURRENT HOUR only:
```javascript
const { data: allListingAnalytics } = await supabaseAdmin
  .from('listing_analytics')
  .select('listing_id, total_views, total_leads, ...')
  .in('listing_id', allListerListingIds)
  .eq('date', cal.date)
  .eq('hour', cal.hour) // ❌ ONLY CURRENT HOUR
```

**Problem:** 
- `total_listings_views` should be the CUMULATIVE sum of ALL listing views across ALL time periods
- But the code only looks at the current hour's data
- If no events happened in the current hour, `total_listing_views` will be 0
- Even if there's historical data in `listing_analytics`, it's ignored

**Expected Behavior:**
- `total_listings_views` = SUM of ALL `total_views` from `listing_analytics` for ALL hours/dates for that developer's listings

### Issue #2: First Run Scenario
When the cron runs for the first time:
1. PostHog events are fetched (from 1 year ago)
2. Events are aggregated and inserted into `listing_analytics` (for current hour)
3. User analytics tries to read from `listing_analytics` (current hour only) - but this happens AFTER insertion
4. Developers table update uses `hourly_listing_views` which is 0 if no events in current hour

**The Fix:**
- Need to aggregate ALL `listing_analytics` data (all hours, all dates) for each developer's listings
- OR: Calculate from the aggregated events directly (before inserting to listing_analytics)

### Issue #3: Event Tracking Verification Needed
Need to verify:
1. ✅ `trackPropertyView` is called in property detail page (line 126)
2. ✅ `trackProfileView` is called in developer profile page (line 42)
3. ❓ Are events actually being sent to PostHog?
4. ❓ Are events being filtered correctly (only custom events, not auto-capture)?

## Event Tracking Verification

### Property View Events
**File:** `src/app/property/[listing_type]/[slug]/[id]/page.jsx`
- Line 126: `analytics.trackPropertyView()` ✅ Called
- Line 132: `analytics.trackListingImpression()` ✅ Called

**Expected PostHog Event:** `property_view`

### Profile View Events
**File:** `src/app/allDevelopers/[slug]/page.jsx`
- Line 42: `analytics.trackProfileView()` ✅ Called

**Expected PostHog Event:** `profile_view`

### PostHog Configuration
**File:** `src/app/providers.jsx`
- Line 16: `capture_pageviews: false` ✅ Auto-capture disabled
- Line 55: `posthog.capture('$pageview')` ⚠️ Manual pageview tracking (should be fine)

## PostHog Query for Leads Events

```javascript
// PostHog API Query to get leads events
// Use PostHog's REST API or Python SDK

// Python SDK Example:
from posthog import Posthog

posthog = Posthog(
    project_api_key='YOUR_PROJECT_API_KEY',
    host='https://us.i.posthog.com'
)

# Get all lead events from last year
events = posthog.get_events(
    event='lead',  # Unified lead event
    after='2024-01-01T00:00:00Z',  # 1 year ago
    before='2025-01-01T23:59:59Z',  # Now
    properties=[
        {'key': 'lister_id', 'operator': 'is_not', 'value': None},
    ]
)

# Or get all lead event types
lead_events = ['lead', 'lead_phone', 'lead_message', 'lead_appointment']
for event_name in lead_events:
    events = posthog.get_events(
        event=event_name,
        after='2024-01-01T00:00:00Z',
        before='2025-01-01T23:59:59Z'
    )
    print(f"{event_name}: {len(events)} events")
```

## Recommended Fixes

### Fix #1: Aggregate ALL Listing Analytics Data
Instead of querying only current hour, aggregate ALL data:

```javascript
// Get ALL listing analytics for developer's listings (all hours, all dates)
const { data: allListingAnalytics } = await supabaseAdmin
  .from('listing_analytics')
  .select('listing_id, total_views')
  .in('listing_id', allListerListingIds)
  // ❌ Remove .eq('date', cal.date) and .eq('hour', cal.hour)
  // ✅ Get ALL historical data

// Then sum up total_views for each listing
const listingViewsMap = {}
allListingAnalytics.forEach(analytics => {
  listingViewsMap[analytics.listing_id] = 
    (listingViewsMap[analytics.listing_id] || 0) + analytics.total_views
})

// Use this for total_listing_views calculation
```

### Fix #2: Calculate from Aggregated Events Directly
Alternatively, calculate from the in-memory aggregates (before DB insertion):

```javascript
// In user analytics section, use aggregates.listings directly
// This gives us ALL events from PostHog, not just current hour
for (const listing of userListings) {
  const listingAggregate = aggregates.listings[listing.id]
  if (listingAggregate) {
    total_listing_views += listingAggregate.total_views || 0
  }
}
```

### Fix #3: Ensure Only Custom Events are Fetched
**Current:** Line 988 passes empty array `[]` which fetches ALL events
**Fix:** Pass `customEventNames` to filter at PostHog level (if API supports it)

```javascript
const { success, events: allEvents } = await fetchEventsWithRetry(
  startTime,
  endTime,
  customEventNames // ✅ Filter at PostHog level
)
```

## Testing Checklist

- [ ] Verify `property_view` events are in PostHog
- [ ] Verify `profile_view` events are in PostHog
- [ ] Verify `lead` events are in PostHog
- [ ] Check if auto-capture events ($pageview, etc.) are being filtered out
- [ ] Verify `total_listings_views` calculation uses ALL historical data
- [ ] Test first run scenario (empty developers table)
- [ ] Test subsequent runs (incremental updates)

