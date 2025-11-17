# Troubleshooting: Function Not Visible in Supabase Dashboard

## Problem
The function `mark_conversation_as_read` exists when queried directly, but:
- Shows as "Functions: 0" in Supabase Dashboard
- PostgREST (API layer) can't find it
- Getting error: "Could not find the function in the schema cache"

## Solution Steps

### Step 1: Run the Updated SQL Script
Run the updated `fix_mark_conversation_as_read_function.sql` script. It now:
- Uses explicit `public.` schema references
- Grants permissions to all necessary roles
- Adds a comment to help PostgREST identify it
- Attempts to refresh the schema cache

### Step 2: Restart Supabase Project
After running the SQL script:

1. Go to **Supabase Dashboard** → Your Project
2. Go to **Settings** → **General**
3. Scroll down to **Restart Project**
4. Click **Restart**

This will force PostgREST to reload its schema cache and detect the function.

### Step 3: Wait 1-2 Minutes
After restarting, wait 1-2 minutes for the schema cache to refresh.

### Step 4: Verify Function is Visible
1. Go to **Database** → **Functions** in Supabase Dashboard
2. You should now see `mark_conversation_as_read` listed

### Step 5: Test the Function
Try calling the API endpoint again. It should work now.

## Alternative: Manual Schema Refresh

If restarting doesn't work, you can try manually refreshing:

```sql
-- Force PostgREST to reload schema
SELECT pg_notify('pgrst', 'reload schema');

-- Or restart PostgREST via SQL (if you have superuser access)
-- This is usually not available in Supabase hosted projects
```

## Why This Happens

PostgREST (Supabase's API layer) maintains a schema cache for performance. When you create a new function:
1. It's added to the database ✅
2. But PostgREST's cache might not update immediately ❌
3. Restarting forces PostgREST to rebuild its cache ✅

## Verification Queries

Run these to verify everything is set up correctly:

```sql
-- 1. Check function exists
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pronamespace::regnamespace as schema_name
FROM pg_proc
WHERE proname = 'mark_conversation_as_read';

-- 2. Check permissions
SELECT 
  p.proname as function_name,
  r.rolname as role_name,
  has_function_privilege(r.rolname, p.oid, 'EXECUTE') as can_execute
FROM pg_proc p
CROSS JOIN pg_roles r
WHERE p.proname = 'mark_conversation_as_read'
  AND r.rolname IN ('authenticated', 'anon', 'service_role')
ORDER BY r.rolname;
```

Both queries should return results showing the function exists and has proper permissions.

