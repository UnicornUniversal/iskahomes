# 🏢 Agency Table Fields - Quick Reference

## Summary

Based on your requirements:
- ✅ **Agencies can add agents** (team management feature)
- ❌ **No homeowners section**
- ❌ **No reviews section**

---

## 📋 Agency Table Fields

### **Core Fields** (Required)
```sql
id                    UUID (Primary Key)
agency_id             UUID (Links to auth.users.id, UNIQUE)
slug                  VARCHAR(255) (UNIQUE)
name                  VARCHAR(255) (Required)
email                 VARCHAR(255) (UNIQUE, Required)
```

### **Contact Information**
```sql
phone                 VARCHAR(50)
secondary_email       VARCHAR(255)
secondary_phone       VARCHAR(50)
tertiary_email        VARCHAR(255)
tertiary_phone        VARCHAR(50)
website               VARCHAR(500)
```

### **Location**
```sql
address               TEXT
city                  VARCHAR(100)
region                VARCHAR(100)
state                 VARCHAR(100)
country               VARCHAR(100)
postal_code           VARCHAR(20)
longitude             DOUBLE PRECISION
latitude              DOUBLE PRECISION
```

### **Company Details**
```sql
description           TEXT
founded               DATE
founded_year          VARCHAR(4)
employees            INTEGER
company_size          VARCHAR(50)
license               VARCHAR(255)
license_number        VARCHAR(255)
verified              BOOLEAN (default: false)
```

### **Media**
```sql
profile_image         TEXT
cover_image           TEXT
```

### **JSONB Fields** (Flexible Data)
```sql
social_media          JSONB  -- {facebook, instagram, linkedin, tiktok, twitter, youtube}
customer_care         JSONB  -- [{name, phone, email}]
registration_files    JSONB -- [{url, name, type}]
company_locations     JSONB -- [{id, place_id, description, address, country, region, city, latitude, longitude, currency, currency_name, primary_location}]
company_statistics    JSONB -- [{label, value}]
```

### **Multi-Location Support**
```sql
company_locations     JSONB (Array of locations with currency support)
default_location_status BOOLEAN
default_currency      VARCHAR(10)
```

### **Account Status**
```sql
account_status        VARCHAR(20) (active, inactive, suspended, pending)
last_login            TIMESTAMP
profile_completion_percentage INTEGER (0-100)
```

### **⭐ Agency-Specific Metrics** (Aggregated from Agents)
```sql
total_agents          INTEGER (Number of agents in agency)
active_agents         INTEGER (Number of active agents)
total_listings        INTEGER (Total listings across all agents)
total_views           INTEGER (Total views across all agents)
total_impressions     INTEGER (Total impressions across all agents)
total_leads           INTEGER (Total leads across all agents)
total_appointments    INTEGER (Total appointments across all agents)
total_sales           INTEGER (Total sales across all agents)
total_revenue         NUMERIC(15,2) (Total revenue across all agents)
estimated_revenue     NUMERIC(15,2)
```

### **Analytics**
```sql
total_listings_views  INTEGER
total_profile_views   INTEGER
total_saved           INTEGER
conversion_rate       NUMERIC(5,2)
leads_to_sales_rate   NUMERIC(5,2)
views_change          NUMERIC(5,2)
impressions_change    NUMERIC(5,2)
leads_change          NUMERIC(5,2)
```

### **Statistics Breakdown (JSONB)**
```sql
property_purposes_stats   JSONB
property_categories_stats JSONB
property_types_stats      JSONB
property_subtypes_stats   JSONB
country_stats             JSONB
state_stats               JSONB
city_stats                JSONB
town_stats                JSONB
leads_breakdown           JSONB -- {phone: count, message: count, email: count, appointment: count}
```

### **Commission & Pricing (JSONB)** ⭐
```sql
commission_rate       JSONB (Commission rates by purpose, property type, and subtype)
                      Structure: {
                        "default": 3.0,  // Required - fallback rate
                        "Rent": [        // Optional - array of rate objects
                          {
                            "category": "property_type",
                            "id": "type-house-id",
                            "percentage": 10.0
                          },
                          {
                            "category": "property_subtype",
                            "id": "subtype-2bedroom-id",
                            "percentage": 8.0
                          }
                        ],
                        "Sale": [        // Optional
                          {
                            "category": "property_type",
                            "id": "type-apartment-id",
                            "percentage": 5.0
                          }
                        ]
                      }
```

### **Signup & Invitation**
```sql
invitation_status     VARCHAR(20) (sent, accepted, expired)
signup_status         VARCHAR(20) (pending, verified, rejected)
invitation_sent_at     TIMESTAMP
```

### **Timestamps**
```sql
created_at            TIMESTAMP
updated_at            TIMESTAMP
```

---

## 🔑 Key Agency-Specific Fields

The most important fields that differentiate agencies from developers:

1. **`total_agents`** - Number of agents in the agency
2. **`active_agents`** - Number of active agents
3. **`commission_rate`** - Default commission rate for agents
4. **All metrics are aggregated** from agents (not direct ownership)

---

## 📊 Relationship with Agents Table

```sql
-- Agents belong to agencies
agents.agency_id → agencies.id

-- Query all agents for an agency
SELECT * FROM agents WHERE agency_id = 'agency-uuid';

-- Count agents
SELECT COUNT(*) FROM agents WHERE agency_id = 'agency-uuid' AND account_status = 'active';
```

---

## 🎯 Dashboard Metrics to Display

Based on agency table fields:

1. **Total Agents** (`total_agents`)
2. **Active Agents** (`active_agents`)
3. **Total Listings** (`total_listings`)
4. **Total Views** (`total_views`)
5. **Total Impressions** (`total_impressions`)
6. **Total Leads** (`total_leads`)
7. **Total Appointments** (`total_appointments`)
8. **Total Revenue** (`total_revenue`)

---

## ✅ Complete SQL File

See `create_agencies_table.sql` for the complete table creation script with all indexes and constraints.

