# Missing Events Analysis

## Problem Summary
Events from 7 dates (2025-11-06, 2025-11-11, 2025-11-12, 2025-11-14, 2025-11-18, 2025-11-19, 2025-11-20) have PostHog events but no corresponding `user_analytics` database entries.

## Primary Key Constraint
`user_analytics` table has composite PRIMARY KEY: `(user_id, user_type, date, hour)`

This means:
- Each unique combination of these 4 fields = 1 row
- If a row doesn't exist for a combination, it means the cron never created it

## Root Cause Analysis

### 1. **Date Range Processing Issue** ⚠️ CRITICAL

**The Problem:**
- Normal mode cron only processes **current day** or **since last run**
- These events are from **past dates** (Nov 6-20)
- If cron didn't run on those dates, OR only processed current hour, those dates were skipped

**Evidence from Code:**
```javascript
// Line 1280-1290: Normal mode only processes current day or since last run
if (lastRun && !ignoreLastRun) {
  startTime = new Date(lastRun.end_time)
} else {
  const twentyFourHoursAgo = 24 * 60 * 60 * 1000
  startTime = new Date(Date.now() - twentyFourHoursAgo)
}
endTimeForFetch = new Date()
endTime = new Date() // Use current time for normal mode
```

**Impact:**
- Events from Nov 6-20 were never fetched from PostHog
- No `user_analytics` rows created for those dates

### 2. **User Identification Flow** ✅ WORKING

**How it works:**
1. Events are processed in `processEventChunk()`
2. `listerId` is extracted from event properties: `lister_id`, `listerId`, `developer_id`, `developerId`, etc.
3. If `listerId` is missing but `listingId` exists, cron fetches `lister_id` from `listings` table
4. User is added to `aggregates.users` Map with `listerId` as key
5. `allUserIds` is created from: `[...user_ids, ...Array.from(usersMap.keys())]`
   - `user_ids` = active users from database (via `getAllActiveEntities()`)
   - `usersMap.keys()` = users found in events

**From CSV Analysis:**
- ✅ Events HAVE `lister_id` = "2110cf0f-11c5-40a9-9a00-97bc581d2cee"
- ✅ Events HAVE `lister_type` = "developer"
- ✅ Events HAVE `listing_id` values
- ✅ User identification should work correctly

### 3. **User Processing Logic** ✅ WORKING

**How it works:**
```javascript
// Line 2188: Loop through allUserIds
for (const userId of allUserIds) {
  const user = usersMap.get(userId) || { user_type: 'unknown', ... }
  
  // Line 2207: Skip if user_type is unknown or property_seeker
  if (!user_type || user_type === 'unknown' || user_type === 'property_seeker') {
    continue
  }
  
  // ... calculate metrics ...
  
  // Line 2464: Create user_analytics row
  userRows.push({
    user_id: userId,
    user_type,
    date: cal.date,
    hour: cal.hour,
    // ... metrics ...
  })
}
```

**Potential Issue:**
- If `user_type` is not set correctly, user is skipped
- From CSV: `lister_type` = "developer" ✅ Should work

### 4. **Hour Processing** ⚠️ POTENTIAL ISSUE

**Recent Fix:**
- Code now groups events by hour and processes each hour separately
- But this was a recent change - may not have been active when these dates were processed

**Old Behavior (likely what happened):**
- Only processed `cal.hour` (current hour)
- If cron ran at hour 10, it only processed hour 10 events
- Hours 8, 9, 11, etc. were skipped

## Expected vs Actual

### Expected `user_analytics` Rows

Based on CSV data, these rows SHOULD exist:

| date | hour | user_id | user_type | events_count |
|------|------|---------|-----------|--------------|
| 2025-11-06 | 8 | 2110cf0f-... | developer | 28 |
| 2025-11-06 | 9 | 2110cf0f-... | developer | 47 |
| 2025-11-06 | 10 | 2110cf0f-... | developer | 29 |
| 2025-11-11 | 6 | 2110cf0f-... | developer | 6 |
| 2025-11-12 | 20 | 2110cf0f-... | developer | 6 |
| 2025-11-14 | 3 | 2110cf0f-... | developer | 6 |
| 2025-11-14 | 4 | 2110cf0f-... | developer | 21 |
| 2025-11-14 | 13 | 2110cf0f-... | developer | 15 |
| 2025-11-14 | 14 | 2110cf0f-... | developer | 15 |
| 2025-11-18 | 12 | 2110cf0f-... | developer | 10 |
| 2025-11-18 | 13 | 2110cf0f-... | developer | 2 |
| 2025-11-18 | 14 | 2110cf0f-... | developer | 14 |
| 2025-11-18 | 16 | 2110cf0f-... | developer | 12 |
| 2025-11-19 | 14 | 2110cf0f-... | developer | 11 |
| 2025-11-20 | 14 | 2110cf0f-... | developer | 16 |
| 2025-11-20 | 17 | 2110cf0f-... | developer | 25 |

**Total: ~21 unique (date, hour) combinations missing**

### Actual Database Rows

From comparison results:
- Only 3 dates have data: 2025-11-08, 2025-11-09, 2025-11-17
- Only 10 total rows (10 hours across 3 dates)
- Missing: 7 dates, 21 hours

## Why These Events Weren't Processed

### Scenario 1: Cron Didn't Run on Those Dates ❌ MOST LIKELY
- Cron only runs when triggered (scheduled or manual)
- If cron didn't run on Nov 6, 11, 12, 14, 18, 19, 20 → no processing
- **Solution:** Need to backfill these dates

### Scenario 2: Cron Ran But Only Processed Current Hour ❌ LIKELY
- Old behavior: Only processed `cal.hour` (current hour)
- If cron ran at hour 10, only hour 10 events processed
- Hours 8, 9, 11, etc. were skipped
- **Solution:** Recent fix should handle this, but past dates still need backfill

### Scenario 3: Events Filtered Out ❌ UNLIKELY
- Events have correct `lister_id` and `lister_type`
- User should be in `allUserIds` (either from active entities or events)
- **Unlikely** to be the issue

### Scenario 4: Database Insert Failed ❌ UNLIKELY
- No errors reported in cron logs
- Other dates (Nov 8, 9, 17) were inserted successfully
- **Unlikely** to be the issue

## Recommendations

### Immediate Actions

1. **Verify Cron Run History**
   - Check `analytics_cron_status` table
   - See if cron ran on missing dates
   - Check `target_date` and `events_processed` fields

2. **Backfill Missing Dates**
   - Use `testTimeSeries=true` mode
   - Process dates: 2025-11-06, 2025-11-11, 2025-11-12, 2025-11-14, 2025-11-18, 2025-11-19, 2025-11-20
   - Or create a backfill script

3. **Verify Hour Processing**
   - Ensure recent fix is working
   - Check if cron processes ALL hours with events, not just current hour

### Long-term Fixes

1. **Automatic Backfill Detection**
   - Detect missing dates/hours
   - Automatically backfill when cron runs

2. **Better Date Range Handling**
   - Process all dates with events, not just current day
   - Or ensure cron runs daily for all dates

3. **Enhanced Error Tracking**
   - Track which dates/hours were skipped
   - Report in cron response

## CSV Data Summary

From the CSV export:
- **Total events:** 264 (excluding header)
- **Dates:** 2025-11-06, 2025-11-11, 2025-11-12, 2025-11-14, 2025-11-18, 2025-11-19, 2025-11-20
- **User ID:** 2110cf0f-11c5-40a9-9a00-97bc581d2cee ✅ Present in all events
- **User Type:** developer ✅ Present in all events
- **Listing IDs:** Present ✅ All events have listing_id
- **Lister IDs:** Present ✅ All events have lister_id matching target user

**Conclusion:** Events are correctly formatted and should be processable. The issue is that the cron never processed these dates/hours.

