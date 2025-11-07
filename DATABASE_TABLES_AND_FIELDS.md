# Database Tables and Fields - PostHog Migration

## Overview
This document lists **ALL tables and fields** that will be populated by the cron job after migrating from Redis to PostHog-only approach.

**Important**: The database schema **DOES NOT CHANGE**. Only the **data source** changes (Redis → PostHog API). The fields written remain **exactly the same**.

---

## 📊 Tables Affected

### 1. `listing_analytics`
**Primary Key**: `(listing_id, date)`  
**Purpose**: Daily aggregated metrics per listing/property

#### All Fields Written:

| Field Name | Type | Description | Source (PostHog) |
|-----------|------|------------|------------------|
| `listing_id` | UUID | ID of the listing | Event: `property_view`, `lead_*`, `impression_*` → `properties.listing_id` |
| `date` | DATE | Date of aggregation (YYYY-MM-DD) | Calculated from event timestamp |
| `week` | VARCHAR(10) | ISO week (YYYY-W##) | Calculated from date |
| `month` | VARCHAR(7) | Month (YYYY-MM) | Calculated from date |
| `quarter` | VARCHAR(7) | Quarter (YYYY-Q#) | Calculated from date |
| `year` | INTEGER | Year | Calculated from date |
| `total_views` | INTEGER | Total views count | Count: `property_view` events |
| `unique_views` | INTEGER | Unique users who viewed | Count unique `distinct_id` or `properties.seeker_id` |
| `logged_in_views` | INTEGER | Views from logged-in users | Count where `properties.is_logged_in = true` |
| `anonymous_views` | INTEGER | Views from anonymous users | Count where `properties.is_logged_in = false/null` |
| `views_from_home` | INTEGER | Views from home page | Count where `properties.viewed_from = 'home'` |
| `views_from_explore` | INTEGER | Views from explore page | Count where `properties.viewed_from = 'explore'` |
| `views_from_search` | INTEGER | Views from search results | Count where `properties.viewed_from = 'search'` |
| `views_from_direct` | INTEGER | Views from direct URL | Count where `properties.viewed_from = 'direct'` |
| `total_impressions` | INTEGER | Total impression events | Count: `impression_*` events |
| `impression_social_media` | INTEGER | Social media clicks | Count: `impression_social_media` events |
| `impression_website_visit` | INTEGER | Website visits | Count: `impression_website_visit` events |
| `impression_share` | INTEGER | Share actions | Count: `impression_share` events |
| `impression_saved_listing` | INTEGER | Saved listing actions | Count: `impression_saved_listing` events |
| `total_leads` | INTEGER | Total lead actions | Count: `lead_phone`, `lead_message`, `lead_appointment` events |
| `phone_leads` | INTEGER | Phone click/call leads | Count: `lead_phone` events |
| `message_leads` | INTEGER | Message leads | Count: `lead_message` events (non-email) |
| `email_leads` | INTEGER | Email leads | Count: `lead_message` where `properties.message_type = 'email'` |
| `appointment_leads` | INTEGER | Appointment leads | Count: `lead_appointment` events |
| `website_leads` | INTEGER | Website leads | Count: `lead_website` events (if exists) |
| `unique_leads` | INTEGER | Unique users who became leads | Count unique `distinct_id` or `properties.seeker_id` from lead events |
| `total_sales` | INTEGER | Total sales count | Count: `listing_sold` events OR from sales_listings table |
| `sales_value` | DECIMAL | Total sales value | Sum: `properties.price` from `listing_sold` events |
| `avg_sale_price` | DECIMAL | Average sale price | Calculated: `sales_value / total_sales` |
| `avg_days_to_sale` | INTEGER | Average days to sale | Calculated (if tracking available) |
| `conversion_rate` | DECIMAL | View to lead conversion % | Calculated: `(total_leads / total_views) * 100` |
| `lead_to_sale_rate` | DECIMAL | Lead to sale conversion % | Calculated: `(total_sales / total_leads) * 100` |

**PostHog Events Used:**
- `property_view`
- `lead_phone`
- `lead_message`
- `lead_appointment`
- `impression_social_media`
- `impression_website_visit`
- `impression_share`
- `impression_saved_listing`
- `listing_sold` (if exists)

---

### 2. `user_analytics`
**Primary Key**: `(user_id, user_type, date)`  
**Purpose**: Daily aggregated metrics per user (developers, agents, agencies, property seekers)

#### All Fields Written:

| Field Name | Type | Description | Source (PostHog) |
|-----------|------|------------|------------------|
| `user_id` | UUID | ID of the user | From event properties or database lookup |
| `user_type` | VARCHAR(20) | Type: 'developer', 'agent', 'agency', 'property_seeker' | From `properties.user_type` or database lookup |
| `date` | DATE | Date of aggregation | Calculated from event timestamp |
| `week` | VARCHAR(10) | ISO week | Calculated from date |
| `month` | VARCHAR(7) | Month | Calculated from date |
| `quarter` | VARCHAR(7) | Quarter | Calculated from date |
| `year` | INTEGER | Year | Calculated from date |
| `profile_views` | INTEGER | Profile page views | Count: `profile_view` where `properties.profile_id = user_id` |
| `unique_profile_viewers` | INTEGER | Unique users who viewed profile | Count unique `distinct_id` from `profile_view` events |
| `profile_views_from_home` | INTEGER | Profile views from home | Count where `properties.viewed_from = 'home'` |
| `profile_views_from_listings` | INTEGER | Profile views from listings | Count where `properties.viewed_from = 'listings'` |
| `profile_views_from_search` | INTEGER | Profile views from search | Count where `properties.viewed_from = 'search'` |
| `total_listings` | INTEGER | Total listings created | Count: `listing_created` events |
| `active_listings` | INTEGER | Active listings count | Count: `listing_created` - `listing_deleted` (or from DB) |
| `sold_listings` | INTEGER | Sold listings count | Count: `listing_updated` where `properties.status = 'sold'` |
| `rented_listings` | INTEGER | Rented listings count | Count: `listing_updated` where `properties.status = 'rented'` |
| `total_listing_views` | INTEGER | Total views on user's listings | Aggregate from `listing_analytics` (or from PostHog) |
| `total_listing_leads` | INTEGER | Total leads on user's listings | Aggregate from `listing_analytics` (or from PostHog) |
| `total_listing_sales` | INTEGER | Total sales from listings | Aggregate from `listing_analytics` (or from PostHog) |
| `total_revenue` | DECIMAL | Total revenue generated | Aggregate from `listing_analytics.sales_value` |
| `avg_revenue_per_listing` | DECIMAL | Average revenue per listing | Calculated: `total_revenue / total_listings` |
| `total_leads_generated` | INTEGER | Total leads generated | Aggregate from `listing_analytics.total_leads` |
| `phone_leads_generated` | INTEGER | Phone leads generated | Aggregate from `listing_analytics.phone_leads` |
| `message_leads_generated` | INTEGER | Message leads generated | Aggregate from `listing_analytics.message_leads` |
| `email_leads_generated` | INTEGER | Email leads generated | Aggregate from `listing_analytics.email_leads` |
| `appointment_leads_generated` | INTEGER | Appointment leads generated | Aggregate from `listing_analytics.appointment_leads` |
| `website_leads_generated` | INTEGER | Website leads generated | Aggregate from `listing_analytics.website_leads` |
| `total_impressions_received` | INTEGER | Total impressions on listings | Aggregate from `listing_analytics.total_impressions` |
| `impression_social_media_received` | INTEGER | Social media impressions | Aggregate from `listing_analytics.impression_social_media` |
| `impression_website_visit_received` | INTEGER | Website visit impressions | Aggregate from `listing_analytics.impression_website_visit` |
| `impression_share_received` | INTEGER | Share impressions | Aggregate from `listing_analytics.impression_share` |
| `impression_saved_listing_received` | INTEGER | Saved listing impressions | Aggregate from `listing_analytics.impression_saved_listing` |
| `properties_viewed` | INTEGER | Properties viewed (for seekers) | Count: `property_view` where `properties.seeker_id = user_id` |
| `unique_properties_viewed` | INTEGER | Unique properties viewed | Count unique `properties.listing_id` |
| `leads_initiated` | INTEGER | Leads initiated (for seekers) | Count: `lead_*` events where `properties.seeker_id = user_id` |
| `appointments_booked` | INTEGER | Appointments booked (for seekers) | Count: `lead_appointment` events |
| `properties_saved` | INTEGER | Properties saved (for seekers) | Count: `impression_saved_listing` events |
| `searches_performed` | INTEGER | Searches performed (for seekers) | Count: `property_search` events |
| `overall_conversion_rate` | DECIMAL | Overall conversion rate | Calculated: Various metrics based on user_type |
| `view_to_lead_rate` | DECIMAL | View to lead rate | Calculated: `(total_leads_generated / total_listing_views) * 100` |
| `lead_to_sale_rate` | DECIMAL | Lead to sale rate | Calculated: `(total_listing_sales / total_leads_generated) * 100` |
| `profile_to_lead_rate` | DECIMAL | Profile view to lead rate | Calculated: `(total_leads_generated / profile_views) * 100` |

**PostHog Events Used:**
- `profile_view`
- `listing_created`
- `listing_updated`
- `listing_deleted`
- `property_view` (for seekers)
- `lead_phone`, `lead_message`, `lead_appointment` (for seekers)
- `property_search`
- `impression_saved_listing` (for seekers)
- Events from `listing_analytics` (aggregated)

**Note**: Some fields require aggregation from `listing_analytics` table (e.g., `total_listing_views`). These can be calculated from PostHog events by filtering events where `properties.lister_id = user_id`.

---

### 3. `development_analytics`
**Primary Key**: `(development_id, developer_id, date)`  
**Purpose**: Daily aggregated metrics per development

#### All Fields Written:

| Field Name | Type | Description | Source (PostHog) |
|-----------|------|------------|------------------|
| `development_id` | UUID | ID of the development | Event: `development_view`, `development_*` → `properties.development_id` |
| `developer_id` | UUID | ID of the developer | From `developments` table lookup |
| `date` | DATE | Date of aggregation | Calculated from event timestamp |
| `week` | VARCHAR(10) | ISO week | Calculated from date |
| `month` | VARCHAR(7) | Month | Calculated from date |
| `quarter` | VARCHAR(7) | Quarter | Calculated from date |
| `year` | INTEGER | Year | Calculated from date |
| `total_views` | INTEGER | Total development views | Count: `development_view` events |
| `unique_views` | INTEGER | Unique users who viewed | Count unique `distinct_id` or `properties.seeker_id` |
| `logged_in_views` | INTEGER | Views from logged-in users | Count where `properties.is_logged_in = true` |
| `anonymous_views` | INTEGER | Views from anonymous users | Count where `properties.is_logged_in = false/null` |
| `views_from_home` | INTEGER | Views from home page | Count where `properties.viewed_from = 'home'` |
| `views_from_explore` | INTEGER | Views from explore page | Count where `properties.viewed_from = 'explore'` |
| `views_from_search` | INTEGER | Views from search results | Count where `properties.viewed_from = 'search'` |
| `views_from_direct` | INTEGER | Views from direct URL | Count where `properties.viewed_from = 'direct'` |
| `total_leads` | INTEGER | Total leads | Count: `development_lead` events |
| `phone_leads` | INTEGER | Phone leads | Count: `development_lead` where `properties.lead_type = 'phone'` |
| `message_leads` | INTEGER | Message leads | Count: `development_lead` where `properties.lead_type = 'message'` |
| `email_leads` | INTEGER | Email leads | Count: `development_lead` where `properties.lead_type = 'email'` |
| `appointment_leads` | INTEGER | Appointment leads | Count: `development_lead` where `properties.lead_type = 'appointment'` |
| `website_leads` | INTEGER | Website leads | Count: `development_lead` where `properties.lead_type = 'website'` |
| `unique_leads` | INTEGER | Unique users who became leads | Count unique `distinct_id` from lead events |
| `total_sales` | INTEGER | Total sales count | Count: `development_sold` events OR from sales data |
| `sales_value` | DECIMAL | Total sales value | Sum: `properties.price` from sales events |
| `avg_sale_price` | DECIMAL | Average sale price | Calculated: `sales_value / total_sales` |
| `conversion_rate` | DECIMAL | View to lead conversion % | Calculated: `(total_leads / total_views) * 100` |
| `lead_to_sale_rate` | DECIMAL | Lead to sale conversion % | Calculated: `(total_sales / total_leads) * 100` |
| `avg_days_to_sale` | INTEGER | Average days to sale | Calculated (if tracking available) |
| `total_shares` | INTEGER | Total shares | Count: `development_share` events |
| `saved_count` | INTEGER | Saved count | Count: `development_saved` events |
| `social_media_clicks` | INTEGER | Social media clicks | Count: `development_social_click` events |
| `total_interactions` | INTEGER | Total interactions | Count: `development_interaction` events |
| `engagement_rate` | DECIMAL | Engagement rate % | Calculated: `((total_shares + saved_count + social_media_clicks) / total_views) * 100` |

**PostHog Events Used:**
- `development_view`
- `development_lead`
- `development_share`
- `development_saved`
- `development_social_click`
- `development_interaction`
- `development_created`

---

### 4. `leads`
**Primary Key**: `(listing_id, seeker_id)` (unique constraint)  
**Purpose**: Individual lead records with detailed actions

#### All Fields Written:

| Field Name | Type | Description | Source (PostHog) |
|-----------|------|------------|------------------|
| `id` | UUID | Primary key (auto-generated) | Generated by database |
| `listing_id` | UUID | ID of the listing | Event: `lead_*` → `properties.listing_id` |
| `lister_id` | UUID | ID of the lister (developer/agent) | Event: `lead_*` → `properties.lister_id` |
| `lister_type` | VARCHAR(20) | Type: 'developer', 'agent', 'agency' | Event: `lead_*` → `properties.lister_type` |
| `seeker_id` | UUID | ID of the property seeker | Event: `lead_*` → `properties.seeker_id` or `distinct_id` |
| `lead_actions` | JSONB | Array of all lead actions | Collected from all `lead_*` events for this seeker+listing |
| `total_actions` | INTEGER | Count of total actions | Count: Length of `lead_actions` array |
| `first_action_date` | DATE | Date of first action | Earliest event timestamp |
| `last_action_date` | DATE | Date of most recent action | Latest event timestamp |
| `last_action_type` | VARCHAR(50) | Most recent action type | Latest event: `lead_phone`, `lead_message`, `lead_appointment` |
| `status` | VARCHAR(50) | Lead status: 'new', 'contacted', 'qualified', 'converted', 'lost' | Default: 'new' (user can update later) |
| `notes` | JSONB | Array of text notes | Empty initially, user can add notes |
| `created_at` | TIMESTAMP | Record creation time | Current timestamp |
| `updated_at` | TIMESTAMP | Record last update time | Current timestamp |

**PostHog Events Used:**
- `lead_phone`
- `lead_message`
- `lead_appointment`
- `lead_email` (if exists)

**Lead Actions JSONB Structure:**
```json
[
  {
    "action_id": "uuid",
    "action_type": "lead_phone",
    "action_date": "20250115",
    "action_timestamp": "2025-01-15T10:30:00Z",
    "action_metadata": {
      "action": "click",
      "context_type": "listing"
    }
  },
  {
    "action_id": "uuid",
    "action_type": "lead_message",
    "action_date": "20250115",
    "action_timestamp": "2025-01-15T11:00:00Z",
    "action_metadata": {
      "context_type": "listing",
      "message_type": "direct_message"
    }
  }
]
```

---

## 📝 Summary

### **No Database Schema Changes**
- All tables remain **unchanged**
- All fields remain **unchanged**
- Only the **data source** changes: Redis → PostHog API

### **Data Flow Change**

**Before (Redis):**
```
Events → Redis (counters, sets, lists) → Cron reads Redis → Aggregate → Write to DB
```

**After (PostHog):**
```
Events → PostHog (only) → Cron fetches from PostHog API → Aggregate in-memory → Write to DB
```

### **Aggregation Logic**

All aggregation that was done in Redis will now be done **in-memory** in the cron job:

1. **Counters**: Count events in JavaScript (instead of Redis INCR)
2. **Unique counts**: Use JavaScript Sets (instead of Redis HyperLogLog)
3. **Grouping**: Use JavaScript Maps/Objects (instead of Redis Hashes)
4. **Lists**: Use JavaScript Arrays (instead of Redis Lists)
5. **Derived metrics**: Calculate same formulas (conversion rates, etc.)

### **PostHog Events Required**

The cron job will need to fetch these events from PostHog:

**Listing Events:**
- `property_view`
- `lead_phone`, `lead_message`, `lead_appointment`
- `impression_social_media`, `impression_website_visit`, `impression_share`, `impression_saved_listing`
- `listing_sold` (if exists)

**User Events:**
- `profile_view`
- `listing_created`, `listing_updated`, `listing_deleted`
- `property_search` (for seekers)
- `user_logged_in`, `user_logged_out`

**Development Events:**
- `development_view`
- `development_lead`
- `development_share`, `development_saved`
- `development_social_click`, `development_interaction`
- `development_created`

---

## ✅ Verification Checklist

After migration, verify these fields are populated correctly:

- [ ] `listing_analytics` - All 30+ fields populated
- [ ] `user_analytics` - All 40+ fields populated
- [ ] `development_analytics` - All 25+ fields populated
- [ ] `leads` - All 12 fields populated with correct action arrays
- [ ] Unique counts match expected values
- [ ] Conversion rates calculated correctly
- [ ] Date/time dimensions (week, month, quarter, year) correct
- [ ] Lead actions JSONB arrays contain all events

---

## 🔄 Rollback Plan

If issues arise, can rollback by:
1. Uncommenting Redis code
2. Re-enabling `queueEvent()` in `useAnalytics.js`
3. Re-enabling `initBatcher()` in `providers.jsx`
4. Database tables remain unchanged, so no migration needed

