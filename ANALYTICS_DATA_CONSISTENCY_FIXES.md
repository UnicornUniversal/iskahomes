# Analytics Data Consistency Fixes

## 🔍 Issues Found and Fixed

### 1. **`user_logged_in` Event Missing `user_id`**
   - **Problem**: `useAnalytics.js` was sending `user_type` but NOT `user_id` in the event properties
   - **Impact**: Ingest route had to fall back to `distinct_id`, which is less reliable
   - **Fix**: Added `user_id: user.id` to the event properties in `trackLogin()`
   - **Files**: `src/hooks/useAnalytics.js`

### 2. **`listing_created` Event - Confusing ID Mapping**
   - **Problem**: Code was sending `developer_id: listing.user_id`, which was confusing and might not work for agents
   - **Impact**: If an agent creates a listing, it would still be sent as `developer_id`, breaking the logic
   - **Fix**: Now sends both:
     - `user_id` (generic ID)
     - `developer_id` (only if `account_type === 'developer'`)
     - `agent_id` (only if `account_type === 'agent'`)
     - `account_type` (to determine user type)
   - **Files**: `src/hooks/useAnalytics.js`

### 3. **`impression_saved_listing` - Function Call Bug**
   - **Problem**: Line 203 had `ops.push(storeOp())` with parentheses, inconsistent with other calls
   - **Impact**: Would cause runtime error since `storeUserTypeInRedis` returns a promise, not a function
   - **Fix**: Changed to `ops.push(storeOp)` (no parentheses)
   - **Files**: `src/app/api/ingest/posthog/route.js`

### 4. **Leads Data Retrieval - HyperLogLog Limitation**
   - **Problem**: Cron job was trying to use `sMembers` on a HyperLogLog key (`lead:{listingId}:day:{day}:unique_leads`)
   - **Impact**: HyperLogLog doesn't support member retrieval - you can only count, not get members
   - **Fix**: 
     - Added a Redis Set (`lead:{listingId}:day:{day}:seekers`) alongside HyperLogLog
     - HyperLogLog is still used for efficient counting
     - Set is used for retrieving individual seeker IDs in cron job
   - **Files**: 
     - `src/app/api/ingest/posthog/route.js` (added Set storage)
     - `src/app/api/cron/analytics/route.js` (changed to read from Set)

## ✅ Data Flow Consistency Check

### Event: `user_logged_in`
- **useAnalytics.js** sends: `user_id`, `user_type`, `login_method`
- **ingest/posthog/route.js** expects: `user_id` OR `userId` OR `distinct_id`, `user_type`
- **Status**: ✅ NOW CONSISTENT

### Event: `listing_created`
- **useAnalytics.js** sends: `listing_id`, `user_id`, `developer_id`, `agent_id`, `account_type`
- **ingest/posthog/route.js** expects: `listing_id`, `developer_id` OR `agent_id` OR `user_id`, `account_type`
- **Status**: ✅ NOW CONSISTENT

### Event: Lead Events (`lead_phone`, `lead_message`, `lead_appointment`)
- **useAnalytics.js** sends: `listing_id`, `seeker_id`, `lister_id`, `lister_type`
- **ingest/posthog/route.js** expects: `listing_id`, `seeker_id`, `lister_id` OR `developer_id`/`agent_id`, `lister_type`
- **cron/analytics/route.js** reads: `lead:{listingId}:day:{day}:seekers` (Set), `lead:{listingId}:{seekerId}:actions` (List), `lead:{listingId}:{seekerId}:metadata` (Hash)
- **Status**: ✅ NOW CONSISTENT

### Event: Impression Events
- **useAnalytics.js** sends: `listing_id`, `lister_id`, `lister_type`
- **ingest/posthog/route.js** expects: `listing_id`, `lister_id`, `lister_type`
- **Status**: ✅ CONSISTENT

### Event: `profile_view`
- **useAnalytics.js** sends: `profile_id`, `profile_type`
- **ingest/posthog/route.js** expects: `profile_id`, `profile_type`
- **Status**: ✅ CONSISTENT

## 📊 Redis Key Structure (Final)

### Leads Storage
```
lead:{listingId}:{seekerId}:actions          # List of lead actions (JSON)
lead:{listingId}:{seekerId}:metadata         # Hash with lister info
lead:{listingId}:day:{day}:total_leads      # Counter
lead:{listingId}:day:{day}:phone_leads      # Counter
lead:{listingId}:day:{day}:unique_leads     # HyperLogLog (for counting)
lead:{listingId}:day:{day}:seekers           # Set (for retrieval) ← NEW
```

### User Type Storage
```
user:{userId}:user_type                      # String (stored during ingestion)
user:{userId}:day:{day}:{metric}             # User analytics metrics
```

## 🔄 Complete Data Flow

1. **Client** (`useAnalytics.js`)
   - Sends events with consistent property names
   - Uses `lister_id`/`lister_type` for generic system
   - Includes `user_id` in `user_logged_in` events

2. **Ingest** (`ingest/posthog/route.js`)
   - Extracts `lister_id`, `lister_type` from events
   - Stores `user_type` in Redis: `user:{userId}:user_type`
   - Stores lead actions in Lists and metadata in Hashes
   - Stores seeker IDs in both HyperLogLog (counting) and Set (retrieval)

3. **Cron** (`cron/analytics/route.js`)
   - Reads `user_type` from Redis (fast path)
   - Falls back to database queries if not found
   - Retrieves seeker IDs from Set (not HyperLogLog)
   - Aggregates data and writes to Supabase

## ✅ Verification Checklist

- [x] All events have consistent property names across layers
- [x] `user_type` is stored in Redis during ingestion
- [x] `user_logged_in` includes `user_id`
- [x] `listing_created` sends both generic and type-specific IDs
- [x] Lead seekers are stored in Set for retrieval
- [x] All function calls are consistent (no parentheses where not needed)
- [x] Cron job can retrieve individual seeker IDs for leads processing

## 🎯 Summary

All inconsistencies have been fixed. The data flow is now:
- **Consistent** across all three layers
- **Optimized** with Redis caching for `user_type`
- **Functional** with proper Set storage for lead retrieval
- **Complete** with all necessary IDs in events

