# Hybrid Approach Implementation Checklist

## ✅ Data Integrity Verification

### 1. Database Schema
- [x] `developers.total_unique_leads` - Aggregate unique logged-in individuals across ALL contexts
- [x] `developers.total_anonymous_leads` - Aggregate unique anonymous individuals across ALL contexts
- [x] `developers.unique_leads` - Profile-specific unique logged-in individuals (context-specific)
- [x] `developers.anonymous_leads` - Profile-specific unique anonymous individuals (context-specific)
- [x] SQL query provided to backfill aggregate values

### 2. Cron Job Updates (`src/app/api/cron/analytics/route.js`)

#### Profile-Specific Leads (Context-Specific)
- [x] Fetches profile leads: `lister_id = developer_id AND context_type = 'profile'`
- [x] Calculates `unique_leads` (logged-in) and `anonymous_leads` (anonymous) for profile only
- [x] Updates `developers.unique_leads` and `developers.anonymous_leads`

#### Aggregate Leads (All Contexts)
- [x] Fetches profile leads: `lister_id = developer_id AND context_type = 'profile'`
- [x] Fetches listing leads: `listing_id IN (developer's listings)`
- [x] Fetches development leads: `development_id IN (developer's developments)`
- [x] Deduplicates `seeker_id` across all contexts using Sets
- [x] Calculates `total_unique_leads` (logged-in) and `total_anonymous_leads` (anonymous)
- [x] Updates `developers.total_unique_leads` and `developers.total_anonymous_leads`

#### Leads Breakdown
- [x] SQL function `get_developer_leads_breakdown` updated to include ALL contexts:
  - Profile leads (lister_id = developer_id, context_type = 'profile')
  - Listing leads (where listing.user_id = developer_id)
  - Development leads (where development.developer_id = developer_id)
- [x] Maps all leads to correct developer_id regardless of context
- [x] Aggregates lead types (phone, whatsapp, direct_message, email, appointment, website)
- [x] Updates `developers.leads_breakdown` with aggregate breakdown

#### All Fields Updated in Cron Job
- [x] `total_views`
- [x] `total_listings_views`
- [x] `total_profile_views`
- [x] `total_leads`
- [x] `unique_leads` (profile-specific)
- [x] `anonymous_leads` (profile-specific)
- [x] `total_unique_leads` (aggregate) ⭐ NEW
- [x] `total_anonymous_leads` (aggregate) ⭐ NEW
- [x] `total_impressions`
- [x] `conversion_rate`
- [x] `views_change`
- [x] `leads_change`
- [x] `impressions_change`
- [x] `leads_breakdown` (includes all contexts) ⭐ UPDATED
- [x] `impressions_breakdown`

### 3. Real-Time Updates (`src/app/api/leads/create/route.js`)
- [x] Sets `is_anonymous = !is_logged_in` when creating/updating leads
- [x] Increments `unique_leads` or `anonymous_leads` for listings (context-specific)
- [x] Increments `unique_leads` or `anonymous_leads` for developers (profile-specific)
- [x] Increments `unique_leads` or `anonymous_leads` for developments (context-specific)
- ⚠️ **NOTE**: Real-time updates only increment context-specific fields
- ⚠️ **NOTE**: Aggregate `total_unique_leads` and `total_anonymous_leads` are updated by cron job only

### 4. Frontend Display
- [x] `LeadsManagement.jsx` - Uses `total_unique_leads + total_anonymous_leads` for developer-level display
- [x] `developer/[slug]/analytics/leads/page.jsx` - Uses aggregate values for developer dashboard
- [x] `ListingLeadsInsights.jsx` - Uses `unique_leads + anonymous_leads` for listing-level (context-specific)
- [x] `ListingAnalytics.jsx` - Uses `unique_leads + anonymous_leads` for listing-level (context-specific)

## ⚠️ Important Notes

### Real-Time vs Cron Job Updates
- **Real-time (`/api/leads/create`)**: Only updates context-specific fields
  - `listings.unique_leads` / `listings.anonymous_leads`
  - `developers.unique_leads` / `developers.anonymous_leads` (profile only)
  - `developments.unique_leads` / `developments.anonymous_leads`
  
- **Cron job**: Updates BOTH context-specific AND aggregate fields
  - Context-specific: `developers.unique_leads` / `developers.anonymous_leads`
  - Aggregate: `developers.total_unique_leads` / `developers.total_anonymous_leads`
  - Leads breakdown: Includes all contexts

### Data Consistency
- Aggregate fields (`total_unique_leads`, `total_anonymous_leads`) are recalculated from scratch on each cron run
- This ensures data integrity even if real-time updates miss some leads
- The cron job is the source of truth for aggregate metrics

### Leads Breakdown
- The SQL function `get_developer_leads_breakdown` now includes leads from:
  - ✅ Profile interactions
  - ✅ Listing interactions
  - ✅ Development interactions
- All lead types are properly aggregated and percentages calculated

## 🔍 Verification Steps

1. **Run the SQL query** to add `total_unique_leads` and `total_anonymous_leads` columns
2. **Run the SQL query** to backfill aggregate values
3. **Verify cron job** updates all fields correctly
4. **Test real-time lead creation** to ensure context-specific fields update
5. **Verify frontend** displays aggregate values for developer-level views
6. **Verify frontend** displays context-specific values for listing/development views

