# Admin Analytics Tables Design

## Overview

This document describes the design of 4 aggregated analytics tables that break down the monolithic `admin_analytics` table into domain-specific tables. These tables store aggregated metrics (not individual events) and are updated when relevant actions occur in the system.

---

## Table Structure

### 1. `admin_sales_analytics`

**Purpose:** Track aggregated sales metrics when listings are marked as sold, rented, or leased.

**Update Triggers:**
- When a listing status changes to "sold", "rented", or "leased"
- When sale price/revenue is updated
- When a listing is created/deleted (affects awaiting sales count)

**Key Metrics:**
- Total units sold vs awaiting sales
- Total revenue (sold) vs estimated revenue (awaiting)
- Breakdown by sale type: sale, rent, lease
- Breakdown by user type: developers, agents, agencies
- Breakdown by developments

**Fields:**
- `sales_by_type`: JSONB object with counts and revenue for sale/rent/lease
- `total_revenue`: DECIMAL(15,2) USD - sum of all sold/rented/leased properties
- `total_estimated_revenue`: DECIMAL(15,2) USD - sum of all unsold properties
- `total_units_sold`: INTEGER - count of sold/rented/leased units
- `total_units_awaiting_sales`: INTEGER - count of active/draft listings
- `developers`, `agents`, `agencies`: JSONB objects with metrics per user type
- `developments`: JSONB object with development-level aggregations

---

### 2. `admin_listings_analytics`

**Purpose:** Track aggregated listing metrics including location, category, and status breakdowns.

**Update Triggers:**
- When listings are created
- When listings are updated (status, location, category changes)
- When listings are deleted

**Key Metrics:**
- Total listings by user type (developers, agents, agencies)
- Listings by status (active, inactive, available, unavailable, draft, archived, sold, rented)
- Listings by location (country, state, city, town) - arrays of objects
- Listings by category (purpose, type, sub_type, category) - arrays of objects
- Listings breakdown by user type

**Fields:**
- `total_listings`: JSONB object with counts by user type
- `listings_by_status`: JSONB object with counts by status field
- `listings_by_listing_status`: JSONB object with counts by listing_status field
- `listings_by_country`, `listings_by_state`, `listings_by_city`, `listings_by_town`: JSONB arrays of location objects
- `listings_by_property_purpose`, `listings_by_property_type`, `listings_by_sub_type`, `listings_by_category`: JSONB arrays of category objects
- `listings_by_developers`, `listings_by_agents`, `listings_by_agencies`: JSONB objects with totals

**Location/Category Array Structure:**
Each object in the arrays contains:
- `id`: VARCHAR/UUID - identifier
- `name`: VARCHAR - display name
- `total_listings`: INTEGER - count
- `percentage`: DECIMAL(5,2) - percentage of total
- `total_amount`: DECIMAL(15,2) USD - total estimated_revenue

---

### 3. `admin_users_analytics`

**Purpose:** Track aggregated user metrics including signups, status, and subscriptions.

**Update Triggers:**
- When users sign up
- When user profiles are updated
- When user status changes (active/inactive, verified/unverified)
- When subscriptions are created/updated/cancelled

**Key Metrics:**
- User counts by type (developers, agents, agencies, property_seekers)
- Status breakdowns (active, inactive, verified, unverified, deactivated)
- Subscription metrics (active, expired, cancelled)
- Subscription revenue (MRR, ARR)

**Fields:**
- `developers`, `agents`, `agencies`, `property_seekers`: JSONB objects with user metrics
- `subscriptions`: JSONB object with subscription breakdowns and revenue

**User Metrics Structure:**
- `new`: INTEGER - new signups today
- `total`: INTEGER - total count
- `active`: INTEGER - active users
- `inactive`: INTEGER - inactive users
- `verified`: INTEGER - verified users
- `unverified`: INTEGER - unverified users
- `deactivated_accounts`: INTEGER - deactivated count

---

### 4. `admin_developments_analytics`

**Purpose:** Track aggregated development metrics including location breakdowns.

**Update Triggers:**
- When developments are created
- When developments are updated
- When units are added/removed
- When units are sold

**Key Metrics:**
- Total developments and units
- Units sold vs available
- Revenue metrics (estimated vs actual)
- Location breakdowns (country, state, city, town)

**Fields:**
- `total_developments`: INTEGER - total count
- `new_developments`: INTEGER - created today
- `total_units`, `total_units_sold`, `total_units_available`: INTEGER counts
- `total_estimated_revenue`, `total_revenue`: DECIMAL(15,2) USD
- `developments_by_country`, `developments_by_state`, `developments_by_city`, `developments_by_town`: JSONB arrays of location objects

**Location Array Structure:**
Each object contains:
- `id`: VARCHAR - identifier
- `name`: VARCHAR - display name
- `country`, `state`, `city`: VARCHAR - parent locations (for nested)
- `total_developments`: INTEGER
- `total_units`, `total_units_sold`, `total_units_available`: INTEGER
- `total_estimated_revenue`, `total_revenue`: DECIMAL(15,2) USD
- `percentage`: DECIMAL(5,2) - percentage of total

---

## Common Fields

All tables share these common fields:

- `id`: UUID (primary key)
- `date`: DATE (aggregation date)
- `hour`: INTEGER (0-23) for hourly tracking
- `day`: INTEGER (1-7) day of week
- `week`: VARCHAR(10) ISO week format
- `month`: VARCHAR(7) YYYY-MM format
- `quarter`: VARCHAR(7) YYYY-Q# format
- `year`: INTEGER
- `created_at`: TIMESTAMP WITH TIME ZONE
- `updated_at`: TIMESTAMP WITH TIME ZONE

---

## Currency

**All revenue and amount fields are in USD.**

The system should convert from local currencies (GHS, NGN, etc.) to USD using the `global_price.estimated_revenue` field which is always stored in USD.

---

## Update Strategy

These tables are **aggregated snapshots**, not event logs. They should be updated:

1. **On-demand**: When relevant events occur (status change, listing create/update, etc.)
2. **Via cron**: Periodic recalculation to ensure consistency
3. **Manual recalculation**: When data inconsistencies are detected

---

## Indexes

Each table should have indexes on:
- `date` (for time-based queries)
- `year`, `month`, `week` (for period-based queries)
- `timestamp` (if tracking hourly granularity)
- Composite indexes for common query patterns

---

## Notes

1. **JSONB Fields**: All breakdown fields use JSONB for flexibility and efficient querying
2. **Arrays**: Location and category breakdowns are stored as JSONB arrays of objects
3. **Percentages**: Calculated as (item_total / grand_total) * 100
4. **Aggregation**: These tables aggregate from source tables (listings, users, developments, sales_listings)
5. **Hourly Granularity**: The `hour` field allows tracking changes throughout the day
6. **No Event Logging**: These tables store aggregated metrics only. Individual event logging should be handled separately.

