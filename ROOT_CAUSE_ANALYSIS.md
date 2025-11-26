# Root Cause Analysis: Missing user_analytics Rows

## Problem Confirmed
- ✅ Cron DID run on missing dates (confirmed by `analytics_cron_status`)
- ✅ Events WERE processed (121, 6, 6, 57, 38, 11, 41 events respectively)
- ❌ But NO `user_analytics` rows were created for those dates

## Critical Discovery

### Issue #1: Users Not Added to `aggregates.users` Map for Listing Events

**The Problem:**
When processing `property_view` and `listing_impression` events:
- ✅ Listing is tracked in `aggregates.listings` Map
- ✅ Seeker is tracked in `aggregates.users` Map (as `property_seeker`)
- ❌ **Lister (developer/agent) is NOT added to `aggregates.users` Map**

**Code Evidence:**
```javascript
// Line 923-968: property_view event handler
case 'property_view': {
  // Tracks seeker (property_seeker)
  if (seekerId && listingId) {
    aggregates.users.set(seekerId, { user_type: 'property_seeker', ... })
  }
  // Tracks listing
  const listing = aggregates.listings.get(listingId)
  listing.total_views++
  // ❌ NO CODE to add listerId to aggregates.users!
}

// Line 331-350: listing_impression event handler  
case 'listing_impression': {
  const listing = aggregates.listings.get(listingId)
  listing.total_impressions++
  // ❌ NO CODE to add listerId to aggregates.users!
}
```

**When IS the lister added to `aggregates.users`?**
Only for these event types:
1. `profile_view` events (line 863-898)
2. `impression_social_media` with `contextType === 'profile'` (line 352-372)
3. `impression_website_visit` with `contextType === 'profile'` (line 374-394)
4. `impression_share` with `contextType === 'profile'` (line 396-416)
5. Lead events without `listing_id` (profile leads) (line 577-609)

### Issue #2: User Processing Depends on `allUserIds`

**Code Flow:**
```javascript
// Line 1952: allUserIds combines two sources
const allUserIds = new Set([...user_ids, ...Array.from(usersMap.keys())])

// Line 2188: Only users in allUserIds are processed
for (const userId of allUserIds) {
  // Create user_analytics row
}
```

**Sources:**
1. `user_ids` = From `getAllActiveEntities()` - gets ALL developers/agents from database
2. `usersMap.keys()` = From `aggregates.users` Map - only users with profile events

**The Problem:**
- If developer only has `property_view`/`listing_impression` events:
  - ❌ NOT in `usersMap` (not added during event processing)
  - ✅ Should be in `user_ids` (from active entities)
  - ✅ Should still be processed

**BUT:** If developer is NOT in `user_ids` (not in developers table, or table query failed), they won't be processed!

### Issue #3: User Must Have Listings to Calculate Metrics

**Code Evidence:**
```javascript
// Line 2240-2274: For developers/agents
if (user_type === 'developer' || user_type === 'agent') {
  const userListings = listingsByUserId[userId] || []
  total_listings = userListings.length
  
  // Calculate metrics from listings
  for (const listing of userListings) {
    const listingAggregate = listingsMap.get(listing.id)
    if (listingAggregate) {
      total_listing_views += listingAggregate.total_views || 0
      // ...
    }
  }
}
```

**Potential Issue:**
- If `listingsByUserId[userId]` is empty (no listings found), metrics will be 0
- But row should still be created (no condition to skip)

### Issue #4: Listings Query Filters by Status

**Code Evidence:**
```javascript
// Line 1987-1991: Fetches listings
const { data: allListings } = await supabaseAdmin
  .from('listings')
  .select('id, user_id, listing_status')
  .in('user_id', listerUserIds)
  .eq('listing_status', 'active') // ⚠️ Only active listings
```

**Potential Issue:**
- If listings were not 'active' at the time of cron run, they won't be fetched
- User will have `userListings = []`
- Metrics will be 0, but row should still be created

## Most Likely Root Cause

### Scenario: Developer Not in `user_ids` from `getAllActiveEntities()`

**Why this could happen:**
1. Developer not in `developers` table at time of cron run
2. `getAllActiveEntities()` query failed/errored
3. Developer's `account_status` was filtered out (but code doesn't filter by status!)

**Evidence:**
- Events have `lister_id` = "2110cf0f-11c5-40a9-9a00-97bc581d2cee"
- Events have `lister_type` = "developer"
- But developer is NOT in `usersMap` (only listing events, no profile events)
- So developer MUST be in `user_ids` to be processed
- If not in `user_ids`, they won't be processed

## Verification Steps

1. **Check if developer exists in developers table:**
   ```sql
   SELECT developer_id, account_status, created_at 
   FROM developers 
   WHERE developer_id = '2110cf0f-11c5-40a9-9a00-97bc581d2cee';
   ```

2. **Check if developer was in active entities at time of cron:**
   - Look at cron run logs/errors
   - Check if `getAllActiveEntities()` returned this user

3. **Check if listings existed for this user:**
   ```sql
   SELECT id, user_id, listing_status, created_at 
   FROM listings 
   WHERE user_id = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
   AND created_at <= '2025-11-06';
   ```

4. **Check cron errors for those dates:**
   - Look at `analytics_cron_status.error_details` for those run_ids
   - Check if there were database errors

## Solution

### Immediate Fix: Ensure Users from Events Are Always Processed

**Option 1: Add lister to aggregates.users for listing events**
```javascript
case 'property_view': {
  // ... existing code ...
  
  // ADD: Track lister in aggregates.users
  if (listerId && listerType) {
    if (!aggregates.users.has(listerId)) {
      aggregates.users.set(listerId, {
        user_type: listerType,
        profile_views: 0,
        // ... initialize all fields ...
      })
    }
  }
  
  // ... rest of code ...
}
```

**Option 2: Extract user_ids from events directly**
```javascript
// After processing events, extract all unique lister_ids
const listerIdsFromEvents = new Set()
for (const event of events) {
  const listerId = event.properties?.lister_id || event.properties?.developer_id
  if (listerId) listerIdsFromEvents.add(listerId)
}

// Add to allUserIds
const allUserIds = new Set([
  ...user_ids, 
  ...Array.from(usersMap.keys()),
  ...Array.from(listerIdsFromEvents) // ADD THIS
])
```

### Long-term Fix: Always Process Users with Events

Even if user is not in active entities, if they have events, they should be processed.

