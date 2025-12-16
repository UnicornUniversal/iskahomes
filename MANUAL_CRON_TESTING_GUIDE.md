# Manual Cron Testing Guide

## Quick Test Options

### Option 1: Using the Test Page (Easiest)

1. Navigate to: `https://iskahomes.vercel.app//test`
2. Find the "Test Analytics Cron" section
3. Click the "Test Cron" button
4. Wait for the response (check browser console for detailed logs)

### Option 2: Using Browser/Postman

**Test Mode (Last 24 Hours):**
```
POST https://iskahomes.vercel.app//api/cron/analytics?testMode=true&ignoreLastRun=true
Content-Type: application/json
```

**Normal Mode (From Last Successful Run):**
```
POST https://iskahomes.vercel.app//api/cron/analytics
Content-Type: application/json
```

**Ignore Last Run (Process All Historical Data):**
```
POST https://iskahomes.vercel.app//api/cron/analytics?ignoreLastRun=true
Content-Type: application/json
```

### Option 3: Using cURL

```bash
# Test mode - fetch last 24 hours
curl -X POST "https://iskahomes.vercel.app//api/cron/analytics?testMode=true&ignoreLastRun=true" \
  -H "Content-Type: application/json"

# Normal mode - from last successful run
curl -X POST "https://iskahomes.vercel.app//api/cron/analytics" \
  -H "Content-Type: application/json"

# Health check
curl -X GET "https://iskahomes.vercel.app//api/cron/analytics"
```

## What to Check After Running

### 1. Check Server Logs
Look for these key indicators:
- ✅ `📊 Starting analytics cron run`
- ✅ `🕐 Hourly tracking: Processing data for date YYYY-MM-DD, hour X`
- ✅ `📡 Fetching ALL events from PostHog`
- ✅ `✅ Fetched X total events, Y custom events from PostHog`
- ✅ `💾 Inserting X listing analytics records`
- ✅ `💾 Inserting X user analytics records`
- ✅ `💾 Inserting X development analytics records`
- ✅ `💾 Inserting X lead records`
- ✅ `✅ Run completed successfully`

### 2. Check Database Tables

**Check cron status:**
```sql
SELECT 
  run_id,
  status,
  target_date,
  target_hour,
  events_processed,
  listings_inserted,
  users_inserted,
  developments_inserted,
  leads_inserted,
  started_at,
  completed_at,
  duration_seconds
FROM analytics_cron_status
ORDER BY started_at DESC
LIMIT 5;
```

**Check listing analytics:**
```sql
SELECT 
  listing_id,
  date,
  hour,
  total_views,
  total_impressions,
  total_leads,
  appointment_leads,
  phone_leads,
  message_leads
FROM listing_analytics
ORDER BY date DESC, hour DESC
LIMIT 10;
```

**Check user analytics:**
```sql
SELECT 
  user_id,
  user_type,
  date,
  hour,
  profile_views,
  total_listing_views,
  total_listing_leads,
  leads_initiated,
  appointments_booked
FROM user_analytics
ORDER BY date DESC, hour DESC
LIMIT 10;
```

**Check development analytics:**
```sql
SELECT 
  development_id,
  date,
  hour,
  total_views,
  total_leads,
  appointment_leads
FROM development_analytics
ORDER BY date DESC, hour DESC
LIMIT 10;
```

**Check leads:**
```sql
SELECT 
  listing_id,
  lister_id,
  seeker_id,
  date,
  hour,
  total_actions,
  first_action_date,
  last_action_date
FROM leads
ORDER BY created_at DESC
LIMIT 10;
```

**Check admin analytics:**
```sql
SELECT 
  date,
  hour,
  total_listings,
  total_users,
  platform_engagement->>'total_views' as total_views,
  platform_engagement->>'total_leads' as total_leads
FROM admin_analytics
ORDER BY date DESC, hour DESC
LIMIT 5;
```

### 3. Verify Hourly Tracking

Check that records are being created with the correct hour:
```sql
-- Check current hour's data
SELECT 
  'listing_analytics' as table_name,
  COUNT(*) as records,
  MIN(hour) as min_hour,
  MAX(hour) as max_hour
FROM listing_analytics
WHERE date = CURRENT_DATE

UNION ALL

SELECT 
  'user_analytics' as table_name,
  COUNT(*) as records,
  MIN(hour) as min_hour,
  MAX(hour) as max_hour
FROM user_analytics
WHERE date = CURRENT_DATE

UNION ALL

SELECT 
  'development_analytics' as table_name,
  COUNT(*) as records,
  MIN(hour) as min_hour,
  MAX(hour) as max_hour
FROM development_analytics
WHERE date = CURRENT_DATE;
```

## Common Issues & Solutions

### Issue: No events fetched from PostHog
**Check:**
- PostHog API key is set in environment variables
- PostHog project ID is correct
- Network connectivity to PostHog

### Issue: No data inserted
**Check:**
- Database connection is working
- Tables exist and have correct schema
- Check server logs for error messages
- Verify `hour` column exists in all analytics tables

### Issue: Duplicate key errors
**Check:**
- Ensure `hour` column is included in unique constraints
- Verify upsert is using correct conflict resolution

### Issue: Missing lister_id
**Check:**
- Verify listings have `user_id` and `account_type` set
- Check logs for `[LISTER_ID_FALLBACK]` messages

## Expected Response Format

```json
{
  "success": true,
  "message": "Analytics processing completed",
  "timestamp": "2025-11-09T10:00:00.000Z",
  "run_id": "uuid-here",
  "result": {
    "success": true,
    "date": "2025-11-09",
    "hour": 10,
    "timeRange": {
      "start": "2025-11-08T10:00:00.000Z",
      "end": "2025-11-09T10:00:00.000Z"
    },
    "events": {
      "total": 150,
      "custom": 120,
      "lead_events": 25
    },
    "inserted": {
      "listings": {
        "inserted": 50,
        "errors": []
      },
      "users": {
        "inserted": 20,
        "errors": []
      },
      "developments": {
        "inserted": 5,
        "errors": []
      },
      "leads": {
        "inserted": 25,
        "errors": []
      }
    }
  }
}
```

## Testing Checklist

- [ ] Cron runs without errors
- [ ] Events are fetched from PostHog
- [ ] Records are inserted into `listing_analytics` with correct `date` and `hour`
- [ ] Records are inserted into `user_analytics` with correct `date` and `hour`
- [ ] Records are inserted into `development_analytics` with correct `date` and `hour`
- [ ] Records are inserted into `leads` with correct `date` and `hour`
- [ ] Records are inserted into `admin_analytics` with correct `date` and `hour`
- [ ] `analytics_cron_status` shows `status: 'completed'` with `target_hour` set
- [ ] No duplicate records for the same `listing_id + date + hour`
- [ ] Lead events are properly categorized (phone, message, appointment)
- [ ] `lister_id` and `seeker_id` are correctly populated
- [ ] Hourly tracking works (multiple runs in same hour update existing records)

## Next Steps After Testing

1. **Verify data accuracy**: Compare PostHog events with database records
2. **Check hourly aggregation**: Run cron multiple times in same hour, verify upsert works
3. **Test failure recovery**: Simulate a failure, verify next run retries correctly
4. **Monitor performance**: Check execution time and database load

