# 🏢 Agency Table Schema Documentation

## Overview

The `agencies` table stores information about real estate agencies that can manage multiple agents. This table is similar to the `developers` table but tailored for agency-specific operations.

---

## 📋 Table Structure

### **Primary Identifiers**
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `agency_id` | UUID | Links to `auth.users.id` (unique) |
| `slug` | VARCHAR(255) | URL-friendly identifier (unique) |
| `created_at` | TIMESTAMP | Record creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### **Basic Information**
| Field | Type | Description |
|-------|------|-------------|
| `name` | VARCHAR(255) | Agency name (required) |
| `email` | VARCHAR(255) | Primary email (unique, required) |
| `phone` | VARCHAR(50) | Primary phone number |
| `secondary_email` | VARCHAR(255) | Secondary contact email |
| `secondary_phone` | VARCHAR(50) | Secondary contact phone |
| `tertiary_email` | VARCHAR(255) | Tertiary contact email |
| `tertiary_phone` | VARCHAR(50) | Tertiary contact phone |
| `website` | VARCHAR(500) | Agency website URL |

### **Location Information**
| Field | Type | Description |
|-------|------|-------------|
| `address` | TEXT | Street address |
| `city` | VARCHAR(100) | City |
| `region` | VARCHAR(100) | Region/state |
| `state` | VARCHAR(100) | State (if different from region) |
| `country` | VARCHAR(100) | Country |
| `postal_code` | VARCHAR(20) | Postal/ZIP code |
| `longitude` | DOUBLE PRECISION | GPS longitude (default: 0) |
| `latitude` | DOUBLE PRECISION | GPS latitude (default: 0) |

### **Company Details**
| Field | Type | Description |
|-------|------|-------------|
| `description` | TEXT | Agency description/bio |
| `founded` | DATE | Founding date |
| `founded_year` | VARCHAR(4) | Year founded (e.g., "2020") |
| `employees` | INTEGER | Number of employees |
| `company_size` | VARCHAR(50) | Size category (e.g., "50-100") |
| `license` | VARCHAR(255) | License information |
| `license_number` | VARCHAR(255) | License number |
| `verified` | BOOLEAN | Verification status (default: false) |

### **Media**
| Field | Type | Description |
|-------|------|-------------|
| `profile_image` | TEXT | Profile image URL |
| `cover_image` | TEXT | Cover/banner image URL |

### **Social & Contact (JSONB)**
| Field | Type | Description |
|-------|------|-------------|
| `social_media` | JSONB | Social media links: `{facebook, instagram, linkedin, tiktok, twitter, youtube}` |
| `customer_care` | JSONB | Customer care contacts: `[{name, phone, email}]` |
| `registration_files` | JSONB | Registration documents: `[{url, name, type}]` |

### **Company Locations (JSONB)**
| Field | Type | Description |
|-------|------|-------------|
| `company_locations` | JSONB | Array of office locations: `[{id, place_id, description, address, country, region, city, latitude, longitude, currency, currency_name, primary_location}]` |
| `default_location_status` | BOOLEAN | Whether default location is set |
| `default_currency` | VARCHAR(10) | Default currency code (e.g., "GHS") |

### **Company Statistics (JSONB)**
| Field | Type | Description |
|-------|------|-------------|
| `company_statistics` | JSONB | Custom statistics: `[{label, value}]` e.g., `[{label: "Agents", value: "50+"}, {label: "Properties Sold", value: "1000+"}]` |

### **Account Status**
| Field | Type | Description |
|-------|------|-------------|
| `account_status` | VARCHAR(20) | Status: `active`, `inactive`, `suspended`, `pending` (default: `active`) |
| `last_login` | TIMESTAMP | Last login timestamp |
| `profile_completion_percentage` | INTEGER | Profile completion % (0-100, default: 0) |

### **Agency-Specific Metrics** ⭐
| Field | Type | Description |
|-------|------|-------------|
| `total_agents` | INTEGER | Total number of agents in the agency (default: 0) |
| `active_agents` | INTEGER | Number of active agents (default: 0) |
| `total_listings` | INTEGER | Total listings across all agents (default: 0) |
| `total_views` | INTEGER | Total views across all agents (default: 0) |
| `total_impressions` | INTEGER | Total impressions across all agents (default: 0) |
| `total_leads` | INTEGER | Total leads across all agents (default: 0) |
| `total_appointments` | INTEGER | Total appointments across all agents (default: 0) |
| `total_sales` | INTEGER | Total sales across all agents (default: 0) |
| `total_revenue` | NUMERIC(15,2) | Total revenue across all agents (default: 0) |
| `estimated_revenue` | NUMERIC(15,2) | Estimated revenue (default: 0) |

### **Analytics & Statistics**
| Field | Type | Description |
|-------|------|-------------|
| `total_listings_views` | INTEGER | Total listing views (default: 0) |
| `total_profile_views` | INTEGER | Total profile views (default: 0) |
| `total_saved` | INTEGER | Properties saved by users (default: 0) |
| `conversion_rate` | NUMERIC(5,2) | View to lead conversion rate % (default: 0) |
| `leads_to_sales_rate` | NUMERIC(5,2) | Lead to sale conversion rate % (default: 0) |

### **Change Tracking**
| Field | Type | Description |
|-------|------|-------------|
| `views_change` | NUMERIC(5,2) | Period-over-period views change % (default: 0) |
| `impressions_change` | NUMERIC(5,2) | Period-over-period impressions change % (default: 0) |
| `leads_change` | NUMERIC(5,2) | Period-over-period leads change % (default: 0) |

### **Property Statistics Breakdown (JSONB)**
| Field | Type | Description |
|-------|------|-------------|
| `property_purposes_stats` | JSONB | Breakdown by purpose (sale, rent, etc.) |
| `property_categories_stats` | JSONB | Breakdown by category |
| `property_types_stats` | JSONB | Breakdown by type |
| `property_subtypes_stats` | JSONB | Breakdown by subtype |

### **Location Statistics Breakdown (JSONB)**
| Field | Type | Description |
|-------|------|-------------|
| `country_stats` | JSONB | Breakdown by country |
| `state_stats` | JSONB | Breakdown by state/region |
| `city_stats` | JSONB | Breakdown by city |
| `town_stats` | JSONB | Breakdown by town/neighborhood |

### **Leads Breakdown (JSONB)**
| Field | Type | Description |
|-------|------|-------------|
| `leads_breakdown` | JSONB | Lead sources: `{phone: count, message: count, email: count, appointment: count}` |

### **Commission & Pricing (JSONB)**
| Field | Type | Description |
|-------|------|-------------|
| `commission_rate` | JSONB | Commission rates - "default" is required. Can add rates by purpose (Rent, Sale) with property types/subtypes. Structure: `{"default": 3.0, "Rent": [{"category": "property_type", "id": "type-id", "percentage": 10.0}], "Sale": [{"category": "property_subtype", "id": "subtype-id", "percentage": 5.0}]}` |

### **Signup & Invitation Status**
| Field | Type | Description |
|-------|------|-------------|
| `invitation_status` | VARCHAR(20) | `sent`, `accepted`, `expired` |
| `signup_status` | VARCHAR(20) | `pending`, `verified`, `rejected` (default: `pending`) |
| `invitation_sent_at` | TIMESTAMP | When invitation was sent |

---

## 🔑 Key Relationships

### **Agencies → Agents**
- Agencies can have multiple agents
- Agents table has `agency_id` field that references `agencies.id`
- Query: `SELECT * FROM agents WHERE agency_id = 'agency-uuid'`

### **Agencies → Listings**
- Agencies don't directly own listings
- Listings belong to agents (which belong to agencies)
- Aggregate listings: `SELECT COUNT(*) FROM listings WHERE lister_id IN (SELECT agent_id FROM agents WHERE agency_id = 'agency-uuid')`

### **Agencies → Team Members**
- Uses `organization_team_members` table
- `organization_type = 'agency'`
- `organization_id = agencies.id`

---

## 📊 Aggregated Metrics Calculation

Agency metrics should be calculated by aggregating data from all agents in the agency:

```sql
-- Example: Calculate total_listings for an agency
UPDATE agencies 
SET total_listings = (
  SELECT COUNT(*) 
  FROM listings 
  WHERE lister_id IN (
    SELECT agent_id 
    FROM agents 
    WHERE agency_id = agencies.id
  )
)
WHERE id = 'agency-uuid';

-- Example: Calculate total_agents
UPDATE agencies 
SET total_agents = (
  SELECT COUNT(*) 
  FROM agents 
  WHERE agency_id = agencies.id
),
active_agents = (
  SELECT COUNT(*) 
  FROM agents 
  WHERE agency_id = agencies.id 
    AND account_status = 'active'
)
WHERE id = 'agency-uuid';
```

---

## 🔍 Indexes

### **B-Tree Indexes**
- `idx_agencies_agency_id` - Fast lookup by user ID
- `idx_agencies_slug` - Fast lookup by slug
- `idx_agencies_account_status` - Filter by status
- `idx_agencies_email` - Fast lookup by email
- `idx_agencies_country` - Filter by country
- `idx_agencies_city` - Filter by city
- `idx_agencies_verified` - Filter by verification status

### **GIN Indexes (JSONB)**
- `idx_agencies_company_locations_gin` - Search within locations
- `idx_agencies_social_media_gin` - Search within social media
- `idx_agencies_customer_care_gin` - Search within customer care
- `idx_agencies_company_statistics_gin` - Search within statistics
- `idx_agencies_commission_rate_gin` - Search within commission rates

---

## 🎯 Key Differences from Developers Table

| Aspect | Developers | Agencies |
|--------|-----------|-----------|
| **Primary Entity** | Units & Developments | Agents & Listings |
| **Metrics** | `total_units`, `total_developments` | `total_agents`, `total_listings` |
| **Aggregation** | Direct ownership | Aggregated from agents |
| **Team** | Team members | Agents (separate table) |
| **Revenue** | From unit sales | From agent commissions/sales |

---

## 📝 Usage Notes

1. **Agency Identification**: Agencies are identified by `agency_id` matching `auth.users.id`
2. **Agent Management**: Use `agents` table with `agency_id` foreign key
3. **Metrics Aggregation**: Agency metrics should be recalculated periodically from agent data
4. **Team Management**: Use `organization_team_members` with `organization_type='agency'`
5. **Slug Generation**: Generate unique slugs from agency name during signup

---

## 🔄 Migration from Current Structure

If currently using `agents` table where `agency_id IS NULL` represents agencies:

1. Create new `agencies` table
2. Migrate agency records from `agents` to `agencies`
3. Update `agents.agency_id` to reference `agencies.id`
4. Update all queries to use `agencies` table for agency operations

---

This schema provides a comprehensive structure for managing agencies with multiple agents, tracking aggregated metrics, and supporting all agency dashboard features.

