# SQL Functions Deployment Guide

## 🚀 How to Deploy SQL Functions to Supabase

### Method 1: Supabase Dashboard SQL Editor (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - In the left sidebar, click **SQL Editor**
   - Click **New Query** (or the `+` button)

3. **Copy and Paste SQL**
   - Open `create_analytics_aggregation_functions.sql` in your project
   - Copy **ALL** the SQL code (from line 1 to the end)
   - Paste it into the SQL Editor

4. **Run the SQL**
   - Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)
   - Wait for execution to complete

5. **Verify Functions Were Created**
   - You should see: `Success. No rows returned`
   - Or check the **Database** → **Functions** section to see the new functions

---

### Method 2: Supabase CLI (Alternative)

If you have Supabase CLI installed:

```bash
# 1. Login to Supabase
supabase login

# 2. Link your project
supabase link --project-ref your-project-ref

# 3. Run the SQL file
supabase db execute -f create_analytics_aggregation_functions.sql
```

---

### Method 3: Direct Database Connection (Advanced)

If you have direct database access:

```bash
# Using psql
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f create_analytics_aggregation_functions.sql

# Or using a database client (pgAdmin, DBeaver, etc.)
# Just open the SQL file and execute it
```

---

## ✅ Verification Steps

After deploying, verify the functions exist:

### Option 1: Check in Supabase Dashboard
1. Go to **Database** → **Functions**
2. You should see these functions:
   - `get_cumulative_listing_analytics`
   - `get_cumulative_listing_views`
   - `get_listing_analytics_by_user`
   - `get_platform_analytics_aggregates`
   - `get_cumulative_user_analytics`
   - `get_unique_counts_from_analytics`

### Option 2: Test with SQL Query

Run this in SQL Editor to test:

```sql
-- Test if functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_cumulative_listing_analytics',
    'get_cumulative_listing_views',
    'get_listing_analytics_by_user',
    'get_platform_analytics_aggregates',
    'get_cumulative_user_analytics',
    'get_unique_counts_from_analytics'
  )
ORDER BY routine_name;
```

**Expected Result**: Should return 6 rows (one for each function)

---

## 🧪 Test the Functions

After deployment, test one function to make sure it works:

```sql
-- Test Function 4: Get platform analytics
-- Replace '2025-11-13' with today's date
SELECT * FROM get_platform_analytics_aggregates('2025-11-13'::DATE);
```

**Expected Result**: Should return aggregated metrics for that date (or empty if no data)

---

## ⚠️ Common Issues

### Issue 1: "Permission denied"
**Solution**: Make sure you're using the **service_role** key or have admin access

### Issue 2: "Function already exists"
**Solution**: This is OK! The `CREATE OR REPLACE` will update existing functions

### Issue 3: "Syntax error"
**Solution**: 
- Make sure you copied the ENTIRE file
- Check for any copy/paste issues
- Try running functions one at a time

### Issue 4: "Index already exists"
**Solution**: This is OK! The `CREATE INDEX IF NOT EXISTS` handles this

---

## 📋 Quick Checklist

- [ ] Opened Supabase Dashboard
- [ ] Navigated to SQL Editor
- [ ] Copied entire SQL file content
- [ ] Pasted into SQL Editor
- [ ] Clicked Run
- [ ] Saw "Success" message
- [ ] Verified functions exist (check Database → Functions)
- [ ] Tested one function to verify it works

---

## 🎯 After Deployment

Once deployed, your cron job will:
- ✅ Use SQL aggregation (10-20x faster)
- ✅ Make 10-20 queries instead of 2000+
- ✅ Complete in 5-10 seconds instead of 100+ seconds

**Check logs for**:
- `✅ Fetched cumulative views for X listings via SQL aggregation`
- `✅ Fetched aggregated totals for X listings via SQL`
- `✅ Fetched platform aggregates via SQL aggregation`

If you see these messages, the optimizations are working! 🎉

