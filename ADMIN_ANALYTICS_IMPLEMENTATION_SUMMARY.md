# Admin Analytics Enhancement - Implementation Summary

## ✅ What We're Adding

### 1. New Database Columns
- **`day`** (INTEGER, 1-7): Day of week (1=Monday, 7=Sunday)
- **`leads`** (JSONB): Consolidated leads object with totals and change tracking
- **`impressions`** (JSONB): Consolidated impressions with totals and change tracking
- **`user_signups`** (JSONB): Track new user signups by type with change tracking
- **`views`** (JSONB): Enhanced views tracking with change calculation

### 2. New Data Structure

```json
{
  "date": "2025-11-09",
  "day": 6,  // Saturday
  "hour": 14,
  
  "leads": {
    "total_leads": 150,
    "total_leads_change": 12.5,  // % change vs previous hour
    "phone_leads": { "total": 50, "unique": 45, "by_context": {}, "percentage": 33.33 },
    "message_leads": { "total": 60, "unique": 55, "by_context": {}, "percentage": 40.00 },
    "email_leads": { "total": 20, "unique": 18, "by_context": {}, "percentage": 13.33 },
    "appointment_leads": { "total": 15, "unique": 12, "by_context": {}, "percentage": 10.00 },
    "website_leads": { "total": 5, "unique": 5, "by_context": {}, "percentage": 3.33 }
  },
  
  "impressions": {
    "total_impressions": 5000,
    "total_impressions_change": 8.2,  // % change vs previous hour
    "social_media": 2000,
    "website_visit": 1500,
    "share": 1000,
    "saved_listing": 500
  },
  
  "views": {
    "total_views": 10000,
    "total_views_change": 10.5,  // % change vs previous hour
    "unique_views": 3500,
    "anonymous_views": 6500,
    "logged_in_views": 3500,
    "views_by_source": {
      "home": 2000,
      "direct": 3000,
      "search": 2500,
      "explore": 2500
    }
  },
  
  "user_signups": {
    "total_signups": 25,
    "total_signups_change": 15.0,  // % change vs previous hour
    "developers": 5,
    "agents": 3,
    "agencies": 2,
    "property_seekers": 15
  }
}
```

## 📋 Implementation Steps

### Step 1: Run SQL Migration ✅
```bash
# Run this SQL file in Supabase SQL Editor
enhance_admin_analytics_structure.sql
```

This will:
- Add all new columns
- Migrate existing data to new structure
- Create indexes for performance
- Verify migration success

### Step 2: Decision - Separate Cron vs. Same Cron

**Recommendation: Separate Cron** (see `ADMIN_ANALYTICS_CRON_ARCHITECTURE.md`)

**Benefits:**
- ✅ Cleaner separation of concerns
- ✅ Independent execution and retry
- ✅ Better performance
- ✅ Easier debugging
- ✅ More flexible scheduling

**Implementation:**
- Create `/api/cron/admin-analytics/route.js`
- Remove admin analytics logic from main cron
- Schedule admin cron to run 5 minutes after main cron

### Step 3: Update Cron Logic

**If Separate Cron:**
1. Create new route: `src/app/api/cron/admin-analytics/route.js`
2. Remove admin analytics section from `src/app/api/cron/analytics/route.js`
3. Implement:
   - Read from `listing_analytics`, `user_analytics`, `development_analytics`, `leads`
   - Calculate `day` (day of week)
   - Calculate totals and changes (vs previous hour)
   - Track user signups from `developers`, `agents`, `agencies`, `property_seekers` tables
   - Populate new JSONB fields

**If Same Cron:**
1. Update existing admin analytics section in `src/app/api/cron/analytics/route.js`
2. Add `day` calculation
3. Add change calculations (vs previous hour)
4. Add user signups tracking
5. Populate new JSONB fields

## 🔄 Change Calculation Logic

For each metric (leads, impressions, views, signups):
1. Get current hour's value
2. Get previous hour's value (same date, hour-1, or previous day hour 23 if current hour is 0)
3. Calculate percentage change:
   ```javascript
   const change = previousValue > 0 
     ? ((currentValue - previousValue) / previousValue) * 100 
     : (currentValue > 0 ? 100 : 0)
   ```

## 📊 User Signups Tracking

Query user tables for new signups in the current hour:
```sql
-- Developers
SELECT COUNT(*) FROM developers 
WHERE created_at >= :current_hour_start 
  AND created_at < :current_hour_end

-- Agents
SELECT COUNT(*) FROM agents 
WHERE created_at >= :current_hour_start 
  AND created_at < :current_hour_end

-- Property Seekers
SELECT COUNT(*) FROM property_seekers 
WHERE created_at >= :current_hour_start 
  AND created_at < :current_hour_end

-- Agencies (if table exists)
SELECT COUNT(*) FROM agencies 
WHERE created_at >= :current_hour_start 
  AND created_at < :current_hour_end
```

## ⚠️ Important Notes

1. **Backward Compatibility**: Old fields (`phone_leads`, `message_leads`, etc.) are kept for now
2. **Day Calculation**: Uses PostgreSQL `EXTRACT(DOW FROM date)` where 0=Sunday, converted to 1-7 (1=Monday, 7=Sunday)
3. **Hourly Tracking**: All changes are calculated vs previous hour (since cron runs hourly)
4. **Indexes**: Created for performance on new JSONB fields

## 🎯 Next Steps

1. ✅ Run SQL migration
2. ⏳ Decide: Separate cron or same cron?
3. ⏳ Implement cron logic updates
4. ⏳ Test with sample data
5. ⏳ Update frontend to use new fields
6. ⏳ Monitor and verify data accuracy

