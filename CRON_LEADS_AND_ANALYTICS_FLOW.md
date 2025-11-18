# Cron Job Flow: Leads and Analytics

## Overview
When the cron job runs (`POST /api/cron/analytics`), it processes PostHog events and creates/updates both **individual lead records** and **aggregated analytics data**.

---

## 🔄 Complete Flow

### **Phase 1: Event Fetching & Processing**

1. **Fetch Events from PostHog**
   - Fetches events from last successful run (or last 1 year for first run)
   - Filters for lead events: `lead`, `lead_phone`, `lead_message`, `lead_appointment`

2. **Process Each Event**
   - For each lead event, extracts:
     - `listing_id` (property)
     - `seeker_id` (property seeker)
     - `lister_id` (developer/agent)
     - `lead_type` (phone, message, appointment)
     - `message_type` (email, whatsapp, direct_message) - for message leads

---

### **Phase 2: Dual Aggregation**

The cron job aggregates lead data in **TWO separate places**:

#### **A. Individual Leads Aggregation** (`aggregates.leads`)
- **Purpose**: Create individual lead records for management
- **Key**: `${listing_id}_${seeker_id}` (unique per seeker+listing)
- **Data Collected**:
  - All lead actions (phone, message, appointment)
  - Action metadata (message_type, appointment_type, etc.)
  - Timestamps for each action
  - Lister information

**Example:**
```javascript
aggregates.leads = {
  "listing-123_seeker-456": {
    listing_id: "listing-123",
    seeker_id: "seeker-456",
    lister_id: "developer-789",
    lister_type: "developer",
    actions: [
      { action_type: "lead_phone", timestamp: "2025-01-15T10:00:00Z" },
      { action_type: "lead_message", message_type: "whatsapp", timestamp: "2025-01-15T11:00:00Z" }
    ]
  }
}
```

#### **B. Listing Analytics Aggregation** (`aggregates.listings`)
- **Purpose**: Aggregate lead counts for analytics dashboards
- **Key**: `listing_id` (one record per listing)
- **Data Collected**:
  - Total leads count
  - Lead type breakdown (phone, message, email, appointment, website)
  - Unique leads count (using Set)
  - Conversion rate (leads / views)

**Example:**
```javascript
aggregates.listings = {
  "listing-123": {
    total_views: 100,
    total_leads: 5,
    phone_leads: 2,
    message_leads: 2,
    email_leads: 1,
    appointment_leads: 0,
    unique_leads: Set(["seeker-456", "seeker-789", ...]),
    conversion_rate: 5.0
  }
}
```

---

### **Phase 3: Database Writes**

#### **3A. Insert Individual Lead Records** (`leads` table)

For each unique `(seeker_id, listing_id)` combination:

1. **Sort Actions**: Sort all actions by timestamp
2. **Calculate Lead Score**: Sum points from all actions
   - Appointment: 40 points
   - Phone: 30 points
   - Direct Message: 20 points
   - WhatsApp: 15 points
   - Email: 10 points
3. **Create Lead Record**:
   ```javascript
   {
     listing_id: "listing-123",
     seeker_id: "seeker-456",
     lister_id: "developer-789",
     lister_type: "developer",
     lead_actions: [...], // All actions from this cron run
     total_actions: 2,
     lead_score: 45, // 30 (phone) + 15 (whatsapp)
     first_action_date: "2025-01-15",
     last_action_date: "2025-01-15",
     last_action_type: "lead_message",
     status: "new",
     status_tracker: ["new"],
     notes: [],
     created_at: "2025-01-15T12:00:00Z",
     updated_at: "2025-01-15T12:00:00Z"
   }
   ```
4. **Insert**: Creates a NEW record in `leads` table (time-series approach)

**Important**: 
- Each cron run creates NEW lead records
- Multiple records can exist for same `(seeker_id, listing_id)`
- Frontend groups them when displaying

---

#### **3B. Upsert Listing Analytics** (`listing_analytics` table)

For each listing that had events:

1. **Aggregate Metrics**:
   - Total views, unique views
   - Total leads, unique leads
   - Lead type breakdown (phone, message, email, appointment)
   - Conversion rate (leads / views)
   - Impressions, shares, saves

2. **Create/Update Record**:
   ```javascript
   {
     listing_id: "listing-123",
     date: "2025-01-15",
     hour: 12, // Hourly tracking
     total_views: 100,
     unique_views: 50,
     total_leads: 5,
     phone_leads: 2,
     message_leads: 2,
     email_leads: 1,
     appointment_leads: 0,
     unique_leads: 3,
     conversion_rate: 5.0,
     // ... other metrics
   }
   ```
3. **Upsert**: Updates if record exists for `(listing_id, date, hour)`, otherwise inserts

**Important**:
- One record per listing per hour
- Aggregates ALL lead events for that listing in that hour
- Used for analytics dashboards and charts

---

### **Phase 4: Update Listings Table**

After inserting analytics, the cron updates the `listings` table with:
- Cumulative totals (sum of all `listing_analytics` records)
- Breakdown aggregations (share_breakdown, leads_breakdown)
- These are used for quick lookups without querying analytics table

---

## 📊 Key Differences

| Aspect | `leads` Table | `listing_analytics` Table |
|--------|---------------|---------------------------|
| **Purpose** | Lead management (individual records) | Analytics (aggregated metrics) |
| **Granularity** | Per seeker+listing per cron run | Per listing per hour |
| **Data Type** | Individual lead records | Aggregated counts |
| **Updates** | Always INSERT (new records) | UPSERT (update if exists) |
| **Grouping** | Frontend groups by (seeker_id, listing_id) | Already aggregated |
| **Use Case** | Manage leads, track status, add notes | Analytics dashboards, charts, trends |

---

## 🔄 Example Scenario

**Scenario**: User "John" (seeker-456) calls phone number for "Property A" (listing-123) twice in one hour.

### **What Happens:**

1. **Event Processing**:
   - 2 `lead_phone` events processed
   - Both aggregated into `aggregates.leads["listing-123_seeker-456"]`
   - Both counted in `aggregates.listings["listing-123"].phone_leads`

2. **Lead Record Created**:
   ```javascript
   // leads table - ONE record with 2 actions
   {
     listing_id: "listing-123",
     seeker_id: "seeker-456",
     lead_actions: [
       { action_type: "lead_phone", timestamp: "10:00" },
       { action_type: "lead_phone", timestamp: "10:30" }
     ],
     total_actions: 2,
     lead_score: 60, // 30 + 30
     status: "new"
   }
   ```

3. **Listing Analytics Updated**:
   ```javascript
   // listing_analytics table - aggregated counts
   {
     listing_id: "listing-123",
     date: "2025-01-15",
     hour: 10,
     phone_leads: 2, // Count of phone lead events
     total_leads: 2,
     unique_leads: 1 // Only 1 unique seeker
   }
   ```

4. **Frontend Display**:
   - Leads Management: Shows ONE lead for John + Property A (grouped)
   - Analytics Dashboard: Shows 2 phone leads for Property A

---

## 🎯 Summary

**Leads Table**:
- ✅ Individual lead records for management
- ✅ Tracks all actions per seeker+listing
- ✅ Calculates lead_score
- ✅ Tracks status history
- ✅ Time-series (new record per cron run)

**Listing Analytics Table**:
- ✅ Aggregated metrics per listing per hour
- ✅ Used for dashboards and charts
- ✅ Tracks conversion rates
- ✅ Breakdown by lead type
- ✅ UPSERT (updates existing records)

Both tables are updated simultaneously during the cron run, serving different purposes:
- **Leads**: For managing individual leads
- **Analytics**: For viewing aggregated performance metrics

