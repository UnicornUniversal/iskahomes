# Recalculation Scripts for Aggregated Data

These SQL scripts recalculate aggregated data in `developers`, `developments`, and `admin_analytics` tables based on actual listings data. Use these when you need to sync aggregated tables with the real data.

## 📁 Scripts Overview

### 1. `recalculate_developers_from_listings.sql`
**Purpose:** Recalculates `developers` table metrics from actual listings.

**Updates:**
- `total_units` - Count of completed listings per developer
- `total_developments` - Count of developments per developer

**Run this when:**
- Developer listings count seems incorrect
- After bulk listing operations
- After fixing data inconsistencies

---

### 2. `recalculate_developments_from_listings.sql`
**Purpose:** Recalculates `developments` table metrics and stats from actual listings.

**Updates:**
- `total_units` - Count of completed listings per development
- `property_purposes_stats` - JSONB array of purpose statistics
- `property_types_stats` - JSONB array of type statistics
- `property_categories_stats` - JSONB array of category statistics
- `property_subtypes_stats` - JSONB array of subtype statistics
- `total_estimated_revenue` - Sum of estimated_revenue from all listings

**Run this when:**
- Development stats seem incorrect
- After adding/removing listings from developments
- When property_purposes_stats, property_types_stats, etc. need refreshing

**Note:** This script is complex and uses JSONB aggregation. It may take longer to run.

---

### 3. `recalculate_admin_analytics_from_listings.sql`
**Purpose:** Recalculates `admin_analytics` table for today's date based on all completed listings.

**Updates:**
- `listings_by_property_purpose` - Aggregated counts by purpose
- `listings_by_property_type` - Aggregated counts by type
- `listings_by_category` - Aggregated counts by category
- `listings_by_sub_type` - Aggregated counts by subtype
- `developers_metrics` - Developer counts and listings
- `agents_metrics` - Agent counts and listings
- `sales_metrics` - Sales totals and values

**Run this when:**
- Admin analytics dashboard shows incorrect data
- After fixing analytics tracking issues
- When you need to refresh today's analytics

**Note:** This only recalculates for TODAY's date. For historical dates, you'd need to modify the script.

---

### 4. `recalculate_all_from_listings.sql` ⭐ **MASTER SCRIPT**
**Purpose:** Runs all three recalculation scripts in order.

**What it does:**
1. Recalculates developers (total_units, total_developments)
2. Recalculates developments (total_units only - simplified)
3. Notes that full stats recalculation requires separate scripts

**Run this when:**
- You want to quickly sync all basic counts
- After major data migrations
- As a maintenance task

**Note:** For full developments stats recalculation, run `recalculate_developments_from_listings.sql` separately.

---

## 🚀 How to Use

### Quick Sync (Basic Counts Only)
```sql
-- Run in Supabase SQL Editor
\i recalculate_all_from_listings.sql
```

### Full Recalculation
```sql
-- Step 1: Developers
\i recalculate_developers_from_listings.sql

-- Step 2: Developments (with full stats)
\i recalculate_developments_from_listings.sql

-- Step 3: Admin Analytics
\i recalculate_admin_analytics_from_listings.sql
```

### Individual Scripts
Run each script individually in Supabase SQL Editor as needed.

---

## ⚠️ Important Notes

### Field Name Handling
The scripts handle both:
- `listing_condition = 'completed' AND upload_status = 'completed'` (if these columns exist)
- `listing_status IN ('active', 'sold', 'rented')` (fallback)

If your table structure differs, adjust the WHERE clauses accordingly.

### Performance
- **Developers recalculation:** Fast (~seconds)
- **Developments recalculation:** Medium (may take minutes for many developments)
- **Admin analytics recalculation:** Medium (processes all completed listings)

### Verification
Each script includes a verification query at the end to check results. Review these to ensure data is correct.

---

## 🔍 Verification Queries

After running scripts, check:

```sql
-- Check developers
SELECT id, name, total_units, total_developments 
FROM developers 
WHERE total_units > 0 
ORDER BY total_units DESC 
LIMIT 10;

-- Check developments
SELECT id, title, total_units, total_estimated_revenue
FROM developments 
WHERE total_units > 0 
ORDER BY total_units DESC 
LIMIT 10;

-- Check admin analytics
SELECT date, 
       developers_metrics->>'total_listings' as dev_listings,
       agents_metrics->>'total_listings' as agent_listings,
       sales_metrics->>'total' as sales_total
FROM admin_analytics 
WHERE date = CURRENT_DATE;
```

---

## 🐛 Troubleshooting

### Script Fails with "column does not exist"
- Check if `listing_condition` and `upload_status` columns exist in your `listings` table
- If not, modify the WHERE clauses to use `listing_status` only

### Stats arrays are empty
- Verify that listings have `purposes`, `types`, `categories`, and `listing_types` populated
- Check that JSONB fields are properly formatted

### Admin analytics not updating
- Ensure the script runs successfully (check for errors)
- Verify that `admin_analytics` table has unique constraint on `date` column
- Check that listings meet the completion criteria

---

## 📝 Next Steps

After running these scripts:
1. ✅ Verify counts match expected values
2. ✅ Check that stats arrays are populated correctly
3. ✅ Test admin analytics dashboard
4. ✅ Monitor for any discrepancies

If you need to recalculate for specific date ranges or add more metrics, modify the scripts accordingly.

