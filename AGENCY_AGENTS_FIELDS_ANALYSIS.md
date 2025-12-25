# Agency & Agents Fields Analysis - Consistency with Developers

## Overview
This document analyzes the required field changes for `agencies` and `agents` tables to maintain consistency with the `developers` table structure, particularly around lead tracking and data aggregation.

---

## Key Principles from Developers Table

### Lead Tracking Pattern (Developers)
Based on the developer data sample and cron implementation:

1. **`total_leads`** = Total unique leads (actual people who took action)
   - This is the PRIMARY metric for "total leads"
   - Represents unique individuals, not actions

2. **Profile-Specific Leads (Context-Specific)**
   - `unique_leads` = Unique logged-in individuals for profile context only
   - `anonymous_leads` = Unique anonymous individuals for profile context only

3. **Aggregate Leads (All Contexts)**
   - `total_unique_leads` = Aggregate unique logged-in individuals across ALL contexts (profile + listings + developments)
   - `total_anonymous_leads` = Aggregate unique anonymous individuals across ALL contexts

4. **Views Breakdown**
   - `total_listings_views` = Views on listings (cumulative from all listings)
   - `total_profile_views` = Views on profile page
   - `total_views` = Total views (listings + profile)

---

## Current State Analysis

### Agencies Table (Current Fields)
```sql
-- Metrics (aggregated from agents)
total_agents integer DEFAULT 0
active_agents integer DEFAULT 0
total_listings integer DEFAULT 0
total_views integer DEFAULT 0
total_impressions integer DEFAULT 0
total_leads integer DEFAULT 0  -- ⚠️ NEEDS CLARIFICATION
total_appointments integer DEFAULT 0
total_sales integer DEFAULT 0
total_revenue numeric(15, 2) DEFAULT 0
estimated_revenue numeric(15, 2) DEFAULT 0

-- Analytics
total_listings_views integer DEFAULT 0  -- ✅ Correct (cumulative from agents)
total_profile_views integer DEFAULT 0
total_saved integer DEFAULT 0
conversion_rate numeric(5, 2) DEFAULT 0
leads_to_sales_rate numeric(5, 2) DEFAULT 0

-- Missing Fields:
❌ unique_leads (profile-specific)
❌ anonymous_leads (profile-specific)
❌ total_unique_leads (aggregate)
❌ total_anonymous_leads (aggregate)
```

### Agents Table (Current Fields)
```sql
-- Metrics
total_listings integer DEFAULT 0
active_listings integer DEFAULT 0
total_views integer DEFAULT 0
total_impressions integer DEFAULT 0
total_leads integer DEFAULT 0  -- ⚠️ NEEDS CLARIFICATION
total_appointments integer DEFAULT 0
properties_sold integer DEFAULT 0
total_revenue numeric(15, 2) DEFAULT 0
estimated_revenue numeric(15, 2) DEFAULT 0
total_commission numeric(15, 2) DEFAULT 0

-- Analytics
total_listing_views integer DEFAULT 0  -- ⚠️ NOTE: Different naming (should be total_listings_views)
total_profile_views integer DEFAULT 0
total_saved integer DEFAULT 0
conversion_rate numeric(5, 2) DEFAULT 0
leads_to_sales_rate numeric(5, 2) DEFAULT 0

-- Missing Fields:
❌ unique_leads (profile-specific)
❌ anonymous_leads (profile-specific)
❌ total_unique_leads (aggregate)
❌ total_anonymous_leads (aggregate)
```

---

## Required Changes

### 1. Agencies Table - Add Missing Fields

#### Add Profile-Specific Lead Fields
```sql
unique_leads integer DEFAULT 0,  -- Profile-specific unique logged-in individuals
anonymous_leads integer DEFAULT 0,  -- Profile-specific unique anonymous individuals
```

#### Add Aggregate Lead Fields
```sql
total_unique_leads integer DEFAULT 0,  -- Aggregate unique logged-in individuals (from all agents + agency profile)
total_anonymous_leads integer DEFAULT 0,  -- Aggregate unique anonymous individuals (from all agents + agency profile)
```

#### Clarify `total_leads` Field
- **Current**: `total_leads integer DEFAULT 0`
- **Should be**: Represents unique leads (cumulative from all agents)
- **Note**: This should match `total_unique_leads + total_anonymous_leads` (aggregate)
- **Action**: Keep field name, but ensure it represents unique individuals, not actions

#### Add Missing Change Tracking
```sql
revenue_change numeric(5, 2) DEFAULT 0,  -- Missing in agencies table
```

#### Add Impressions Breakdown (if needed)
```sql
impressions_breakdown jsonb DEFAULT '{}'::jsonb,  -- Similar to developers
```

---

### 2. Agents Table - Add Missing Fields

#### Add Profile-Specific Lead Fields
```sql
unique_leads integer DEFAULT 0,  -- Profile-specific unique logged-in individuals
anonymous_leads integer DEFAULT 0,  -- Profile-specific unique anonymous individuals
```

#### Add Aggregate Lead Fields
```sql
total_unique_leads integer DEFAULT 0,  -- Aggregate unique logged-in individuals (profile + listings)
total_anonymous_leads integer DEFAULT 0,  -- Aggregate unique anonymous individuals (profile + listings)
```

#### Clarify `total_leads` Field
- **Current**: `total_leads integer DEFAULT 0`
- **Should be**: Represents unique leads (individual agent's unique leads)
- **Note**: This should match `total_unique_leads + total_anonymous_leads` for the agent
- **Action**: Keep field name, but ensure it represents unique individuals

#### Fix Field Naming Inconsistency
```sql
-- Current (WRONG):
total_listing_views integer DEFAULT 0

-- Should be (CORRECT):
total_listings_views integer DEFAULT 0  -- Match developers/agencies naming
```

#### Add Impressions Breakdown (if needed)
```sql
impressions_breakdown jsonb DEFAULT '{}'::jsonb,  -- Similar to developers
```

---

## Field Mapping Summary

### Developers → Agencies → Agents Consistency

| Field Name | Developers | Agencies | Agents | Notes |
|------------|-----------|----------|--------|-------|
| `total_leads` | ✅ Unique leads | ✅ Cumulative unique from agents | ✅ Individual unique leads | **PRIMARY METRIC** |
| `unique_leads` | ✅ Profile-specific | ❌ **ADD** | ❌ **ADD** | Profile context only |
| `anonymous_leads` | ✅ Profile-specific | ❌ **ADD** | ❌ **ADD** | Profile context only |
| `total_unique_leads` | ✅ Aggregate | ❌ **ADD** | ❌ **ADD** | All contexts combined |
| `total_anonymous_leads` | ✅ Aggregate | ❌ **ADD** | ❌ **ADD** | All contexts combined |
| `total_listings_views` | ✅ | ✅ | ⚠️ **RENAME** (`total_listing_views` → `total_listings_views`) | Views on listings |
| `total_profile_views` | ✅ | ✅ | ✅ | Views on profile |
| `total_views` | ✅ | ✅ | ✅ | Total views |
| `total_impressions` | ✅ | ✅ | ✅ | Total impressions |
| `impressions_breakdown` | ✅ | ❌ **ADD** | ❌ **ADD** | JSONB breakdown |
| `revenue_change` | ✅ | ❌ **ADD** | ✅ | Period-over-period change |

---

## Data Aggregation Logic

### For Agencies (Cumulative from Agents)

1. **`total_leads`** = Sum of unique leads from all agents
   - Should equal: `SUM(agents.total_leads)` where `agents.agency_id = agency.agency_id`
   - Represents total unique individuals who interacted with any agent under the agency

2. **`total_unique_leads`** = Aggregate unique logged-in individuals
   - Agency profile leads (logged-in) + All agent profile leads (logged-in) + All agent listing leads (logged-in)
   - Deduplicated across all contexts

3. **`total_anonymous_leads`** = Aggregate unique anonymous individuals
   - Agency profile leads (anonymous) + All agent profile leads (anonymous) + All agent listing leads (anonymous)
   - Deduplicated across all contexts

4. **`total_listings_views`** = Sum of listing views from all agents
   - `SUM(agents.total_listings_views)` where `agents.agency_id = agency.agency_id`
   - Agencies don't list properties directly, so this is cumulative from agents

5. **`total_profile_views`** = Agency profile views only
   - Views on the agency's profile page (not cumulative from agents)

### For Agents (Individual Metrics)

1. **`total_leads`** = Unique leads for this agent
   - Should equal: `total_unique_leads + total_anonymous_leads` for the agent
   - Represents unique individuals who interacted with this agent

2. **`total_unique_leads`** = Aggregate unique logged-in individuals
   - Agent profile leads (logged-in) + Agent listing leads (logged-in)
   - Deduplicated across profile and listings

3. **`total_anonymous_leads`** = Aggregate unique anonymous individuals
   - Agent profile leads (anonymous) + Agent listing leads (anonymous)
   - Deduplicated across profile and listings

4. **`total_listings_views`** = Views on this agent's listings
   - Sum of views on all listings where `listing.lister_id = agent.agent_id`

---

## Implementation Notes

### Cron Job Updates
The cron job (`src/app/api/cron/analytics/route.js`) will need to:

1. **For Agents:**
   - Calculate `unique_leads` and `anonymous_leads` from profile leads
   - Calculate `total_unique_leads` and `total_anonymous_leads` from profile + listing leads
   - Update `total_leads` = `total_unique_leads + total_anonymous_leads`
   - Update `total_listings_views` from listing analytics

2. **For Agencies:**
   - Aggregate `total_leads` from all agents: `SUM(agents.total_leads)`
   - Aggregate `total_unique_leads` from agency profile + all agent profiles + all agent listings (deduplicated)
   - Aggregate `total_anonymous_leads` from agency profile + all agent profiles + all agent listings (deduplicated)
   - Aggregate `total_listings_views` from all agents: `SUM(agents.total_listings_views)`
   - Calculate `total_profile_views` from agency profile views only

### Component Reusability
Since components are reused:
- Field names must match exactly
- Data structure must be consistent
- Display logic should work for developers, agencies, and agents

---

## Summary of Required SQL Changes

### Agencies Table
```sql
-- Add missing lead tracking fields
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS unique_leads integer DEFAULT 0;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS anonymous_leads integer DEFAULT 0;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS total_unique_leads integer DEFAULT 0;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS total_anonymous_leads integer DEFAULT 0;

-- Add missing change tracking
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS revenue_change numeric(5, 2) DEFAULT 0;

-- Add impressions breakdown
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS impressions_breakdown jsonb DEFAULT '{}'::jsonb;
```

### Agents Table
```sql
-- Add missing lead tracking fields
ALTER TABLE agents ADD COLUMN IF NOT EXISTS unique_leads integer DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS anonymous_leads integer DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS total_unique_leads integer DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS total_anonymous_leads integer DEFAULT 0;

-- Fix field naming inconsistency
ALTER TABLE agents RENAME COLUMN total_listing_views TO total_listings_views;

-- Add impressions breakdown
ALTER TABLE agents ADD COLUMN IF NOT EXISTS impressions_breakdown jsonb DEFAULT '{}'::jsonb;
```

---

## Verification Checklist

- [ ] Agencies table has all 4 lead fields: `unique_leads`, `anonymous_leads`, `total_unique_leads`, `total_anonymous_leads`
- [ ] Agents table has all 4 lead fields: `unique_leads`, `anonymous_leads`, `total_unique_leads`, `total_anonymous_leads`
- [ ] Agents table field renamed: `total_listing_views` → `total_listings_views`
- [ ] Both tables have `impressions_breakdown` field
- [ ] Agencies table has `revenue_change` field
- [ ] Cron job updated to calculate and aggregate these fields correctly
- [ ] Components can reuse the same field names across developers, agencies, and agents
- [ ] `total_leads` consistently represents unique individuals (not actions) across all tables

