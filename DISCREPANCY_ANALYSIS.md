# Discrepancy Analysis: PostHog vs Database

## ✅ Good News
- **All dates now have database entries!** The fix worked.
- **No missing days or hours** - all dates are processed.

## ⚠️ Remaining Discrepancies

### 1. **total_listing_leads**: PostHog 13 vs Database 25 (DB has 12 more)
**Most Critical Issue**

**Breakdown:**
- 2025-11-06: PostHog 5 vs DB 17 (DB has **12 more**)
- Other dates match or are close

**Root Cause Analysis:**
- PostHog counts: Lead events (`lead`, `lead_phone`, `lead_message`, `lead_appointment`) with `listing_id`
- Database counts: `total_listing_leads` from `listingsMap` (PostHog events aggregated by listing)

**Possible Causes:**
1. **Database has leads from `leads` table** that weren't in PostHog events for that date
2. **Duplicate counting** - leads counted multiple times
3. **Date/hour mismatch** - leads from different dates/hours being aggregated
4. **Backfilled data** - leads inserted manually or from previous runs

### 2. **profile_views**: PostHog 5 vs Database 22 (DB has 17 more)
**Breakdown:**
- 2025-11-09: PostHog 0 vs DB 16 (DB has **16 more**)
- 2025-11-08: PostHog 0 vs DB 1 (DB has 1 more)

**Root Cause Analysis:**
- PostHog counts: `profile_view` events only
- Database counts: `user.profile_views` from `aggregates.users`

**Possible Causes:**
1. **Profile views from other sources** - not just `profile_view` events
2. **Different event filtering** - database includes events PostHog comparison doesn't
3. **Aggregation difference** - database sums across hours differently

### 3. **total_views**: PostHog 160 vs Database 177 (DB has 17 more)
**Matches profile_views difference** - suggests profile_views are being counted differently

### 4. **leads_initiated**: PostHog 8 vs Database 0 (PostHog has 8, DB has 0)
**Root Cause:**
- PostHog counts: `lead_message` or `lead_phone` events
- Database: `user.leads_initiated` from `aggregates.users`
- **Issue**: `leads_initiated` is only tracked for `property_seekers`, NOT for developers/agents
- **Code**: Line 789-790 only increments for `seekerUser` (property_seeker), not for lister

### 5. **impression_share_received**: PostHog 25 vs Database 17 (PostHog has 8 more)
**Possible Causes:**
- Different counting logic
- Some share events not being processed correctly

### 6. **impression_saved_listing_received**: PostHog 3 vs Database 8 (DB has 5 more)
**Possible Causes:**
- Database has saved listing impressions from other sources
- Different event filtering

## Key Questions to Investigate

1. **Why does database have MORE leads than PostHog?**
   - Are leads being counted from `leads` table instead of just PostHog events?
   - Are there duplicate leads?
   - Are leads from other dates being included?

2. **Why does database have MORE profile_views?**
   - Are profile views being counted from other event types?
   - Is there a different aggregation method?

3. **Why is leads_initiated 0 in database?**
   - The field is only tracked for property_seekers, not developers/agents
   - This might be by design, but comparison expects it for developers too

## Recommended Next Steps

1. **Check the actual database values:**
   ```sql
   SELECT date, hour, total_listing_leads, total_leads, profile_views, total_views
   FROM user_analytics
   WHERE user_id = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
   AND user_type = 'developer'
   AND date IN ('2025-11-06', '2025-11-09')
   ORDER BY date, hour;
   ```

2. **Check leads table for 2025-11-06:**
   ```sql
   SELECT date, hour, COUNT(*) as lead_count, 
          COUNT(CASE WHEN listing_id IS NOT NULL THEN 1 END) as listing_leads,
          COUNT(CASE WHEN listing_id IS NULL THEN 1 END) as profile_leads
   FROM leads
   WHERE lister_id = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
   AND date = '2025-11-06'
   GROUP BY date, hour
   ORDER BY hour;
   ```

3. **Verify PostHog events for 2025-11-06:**
   - Check if there are lead events that the comparison isn't counting
   - Check if there are profile_view events that PostHog isn't showing

4. **Check if leads_initiated should be tracked for developers:**
   - Currently only tracked for property_seekers
   - Might need to track for developers/agents too

