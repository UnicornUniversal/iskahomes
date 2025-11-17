# Complete Listing Creation Flow

This document describes **everything** that happens when a user creates a listing, from the first step to finalization.

---

## Overview

The listing creation process follows a **step-based wizard approach** where users fill out information in multiple steps. The system supports two creation methods:

1. **Step-by-step creation** (`/api/listings/[id]/step/[stepName]`) - Used during the wizard
2. **Bulk creation** (`/api/listings` POST) - Used for creating complete listings at once

Both methods ultimately create/update listings in the `listings` table and trigger various analytics and stats updates.

---

## Step-by-Step Creation Flow

### **Initial State: User Starts Creating a Listing**

When a user first starts creating a listing (e.g., fills out "Basic Info" step):

#### 1. **Draft Listing Creation**
- **Route**: `POST /api/listings/new/step/basic-info` or `POST /api/listings/[id]/step/basic-info`
- **What Happens**:
  - System checks if user has an existing draft listing
  - If no draft exists, creates a new draft listing with:
    ```javascript
    {
      account_type: 'developer' | 'agent',
      user_id: userId,
      listing_type: 'unit' | 'property',
      listing_status: 'draft',  // ⚠️ Always starts as draft
      title: 'Draft Listing',
      description: '',
      status: 'Available',
      listing_condition: 'adding',
      upload_status: 'incomplete'
    }
    ```
  - If draft exists, uses existing draft

#### 2. **Basic Info Step Update**
- **Route**: `PUT /api/listings/[id]/step/basic-info`
- **What Happens**:
  - Updates listing with:
    - `title`
    - `description`
    - `size`
    - `status`
    - `listing_type`
    - `development_id` (if developer unit)
    - `listing_status: 'draft'` (for new listings)
  - **No analytics updates** at this stage (still draft)

---

### **Step 2: Categories**

#### **Route**: `PUT /api/listings/[id]/step/categories`

**What Happens**:
- Updates listing with:
  - `purposes` (JSONB array)
  - `types` (JSONB array)
  - `categories` (JSONB array)
  - `listing_types` (JSONB object with database, inbuilt, custom arrays)
- **No analytics updates** (still draft)

---

### **Step 3: Specifications**

#### **Route**: `PUT /api/listings/[id]/step/specifications`

**What Happens**:
- Updates listing with:
  - `specifications` (JSONB object with all property specs)
- **No analytics updates** (still draft)

---

### **Step 4: Location**

#### **Route**: `PUT /api/listings/[id]/step/location`

**What Happens**:
- Updates listing with:
  - `country`
  - `state`
  - `city`
  - `town`
  - `full_address`
  - `latitude`
  - `longitude`
  - `location_additional_information`
- **No analytics updates** (still draft)

---

### **Step 5: Pricing**

#### **Route**: `PUT /api/listings/[id]/step/pricing`

**What Happens**:
1. **Updates listing with pricing data**:
   - `pricing` (JSONB object with price, currency, duration, price_type, etc.)
   - Legacy flat fields: `price`, `currency`, `duration`, `price_type`
   - `is_negotiable`, `flexible_terms`
   - `available_from`, `available_until`
   - `acquisition_rules`

2. **Currency Conversion**:
   - Calls `processCurrencyConversions()` to:
     - Calculate `estimated_revenue` (in user's primary currency)
     - Calculate `global_price.estimated_revenue` (in USD)
   - Updates listing with both values

3. **Analytics Update**:
   - ✅ **Updates `admin_sales_analytics`** (updates `total_estimated_revenue` for awaiting sales)
   - This happens even for draft listings because pricing affects revenue calculations

---

### **Step 6: Amenities**

#### **Route**: `PUT /api/listings/[id]/step/amenities`

**What Happens**:
- Updates listing with:
  - `amenities` (JSONB object with inbuilt, custom, database arrays)
- **No analytics updates** (still draft)

---

### **Step 7: Social Amenities**

#### **Route**: `PUT /api/listings/[id]/step/social-amenities`

**What Happens**:
1. **Downloads and stores images** from Google Places API URLs:
   - Downloads amenity images (schools, hospitals, airports, parks, shops, police)
   - Uploads to Supabase Storage (`iskaHomes/social-amenities/`)
   - Stores `database_url` for each amenity

2. **Updates `social_amenities` table**:
   - Creates or updates record with:
     - `listing_id`
     - `schools` (JSONB array)
     - `hospitals` (JSONB array)
     - `airports` (JSONB array)
     - `parks` (JSONB array)
     - `shops` (JSONB array)
     - `police` (JSONB array)

3. **Updates listing**:
   - Updates `last_modified_by` timestamp
- **No analytics updates** (still draft)

---

### **Step 8: Media**

#### **Route**: `PUT /api/listings/[id]/step/media`

**What Happens**:
1. **Handles file uploads**:
   - Uploads images to Supabase Storage (`iskaHomes/property-media/`)
   - Organizes images into albums structure
   - Uploads video files (`iskaHomes/property-media/`)
   - Handles YouTube URLs and virtual tour URLs

2. **Updates listing with**:
   - `media` (JSONB object with albums, video, youtubeUrl, virtualTourUrl)
   - Albums structure:
     ```javascript
     {
       albums: [
         {
           id: "album_1",
           name: "General",
           images: [...],
           isDefault: true
         }
       ],
       video: {...},
       youtubeUrl: "...",
       virtualTourUrl: "..."
     }
     ```
- **No analytics updates** (still draft)

---

### **Step 9: Immersive Experience**

#### **Route**: `PUT /api/listings/[id]/step/immersive-experience`

**What Happens**:
1. **Uploads 3D model** (if provided):
   - Uploads to Supabase Storage (`iskaHomes/3d-models/`)
   - Updates listing with `3d_model` (JSONB object)

2. **Updates listing with**:
   - `3d_model`
   - `virtual_tour_link`
- **No analytics updates** (still draft)

---

### **Step 10: Additional Info**

#### **Route**: `PUT /api/listings/[id]/step/additional-info`

**What Happens**:
1. **Uploads files**:
   - Floor plan → `iskaHomes/property-media/`
   - Additional files → `iskaHomes/property-files/`

2. **Updates listing with**:
   - `additional_information`
   - `floor_plan`
   - `additional_files` (JSONB array)
- **No analytics updates** (still draft)

---

### **Step 11: Preview & Finalize**

#### **Route**: `PUT /api/listings/[id]` (Finalization)

**What Happens**:

1. **Updates Listing Status**:
   ```javascript
   {
     listing_status: 'active',  // Changed from 'draft'
     listing_condition: 'completed',
     upload_status: 'completed'
   }
   ```

2. **Development Stats Update** (if developer unit):
   - Calls `updateDevelopmentAfterListing(developmentId, 'update')`
   - Recalculates:
     - `property_purposes_stats`
     - `property_categories_stats`
     - `property_types_stats`
     - `property_subtypes_stats`
     - `total_estimated_revenue`
   - Updates `developments` table

3. **Developer Stats Update** (if developer unit):
   - Calls `updateDeveloperAfterListing(userId, 'update')`
   - Recalculates from all listings:
     - `total_units`
     - `total_developments`
     - `total_revenue` (from sold/rented listings)
     - `estimated_revenue` (from all active/sold/rented listings)
     - `property_purposes_stats`
     - `property_categories_stats`
     - `property_types_stats`
     - `property_subtypes_stats`
     - `country_stats`
     - `state_stats`
     - `city_stats`
     - `town_stats`
   - Updates `developers` table

4. **Legacy Admin Analytics Update**:
   - Calls `updateAdminAnalytics()` (old `admin_analytics` table)
   - Updates platform-wide aggregations

5. **New Admin Analytics Updates** (ONLY when published):
   - ✅ **Updates `admin_listings_analytics`**:
     - Recalculates all listing aggregates:
       - Total listings by user type (developers, agents, agencies)
       - Listings by status (active, inactive, available, etc.)
       - Listings by location (country, state, city, town)
       - Listings by category (purpose, type, sub_type, category)
       - Listings by user type breakdown
     - Creates/updates record for today's date
   
   - ✅ **Updates `admin_sales_analytics`**:
     - Recalculates sales metrics:
       - Total revenue (sold properties)
       - Total estimated revenue (awaiting sales)
       - Total units sold vs awaiting sales
       - Breakdown by sale type (sale, rent, lease)
       - Breakdown by user type (developers, agents, agencies)
       - Breakdown by developments
     - Creates/updates record for today's date

---

## Bulk Creation Flow (POST /api/listings)

### **When User Creates Listing in One Go**

#### **Route**: `POST /api/listings`

**What Happens**:

1. **Authentication & Validation**:
   - Verifies JWT token
   - Validates required fields (title, description, status)
   - Checks for existing incomplete draft to resume

2. **File Uploads**:
   - Uploads media files to Supabase Storage
   - Uploads 3D models (if developer)
   - Uploads additional files
   - Downloads and stores social amenity images

3. **Currency Conversion**:
   - Processes pricing to calculate `estimated_revenue` and `global_price`

4. **Creates Listing**:
   - Inserts into `listings` table with all data
   - Initial status: `listing_status: 'draft'`, `listing_condition: 'adding'`, `upload_status: 'incomplete'`

5. **Social Amenities**:
   - Creates/updates `social_amenities` table

6. **Development Stats** (if developer unit):
   - Updates development stats

7. **Developer Stats** (if developer unit):
   - Updates developer metrics

8. **Finalization**:
   - Updates listing to:
     - `listing_status: 'active'` (or from form data)
     - `listing_condition: 'completed'`
     - `upload_status: 'completed'`

9. **Analytics Updates** (if finalized as active):
   - Updates legacy `admin_analytics`
   - Updates `admin_listings_analytics`
   - Updates `admin_sales_analytics`

---

## Status Change Flow (Sold/Rented)

### **When User Changes Listing Status to Sold/Rented**

#### **Route**: `PUT /api/listings/[id]` or `PUT /api/listings/[id]/step/[stepName]`

**What Happens**:

1. **Detects Status Change**:
   - Compares old `listing_status` with new `listing_status`
   - Identifies if changed to 'sold' or 'rented'

2. **Creates Sales Entry**:
   - Calls `createSalesListingEntry()`:
     - Inserts into `sales_listings` table:
       - `listing_id`
       - `user_id`
       - `sale_price` (from `estimated_revenue`)
       - `currency` (developer's primary currency)
       - `sale_type` ('sold' or 'rented')
       - `sale_date` (today)
       - `sale_timestamp` (now)
       - `sale_source: 'platform'`

3. **Updates Revenue**:
   - Calls `updateTotalRevenue()`:
     - Updates `developers.total_revenue` (adds sale price)
     - Updates `developments.total_revenue` (adds sale price)

4. **Updates Analytics**:
   - ✅ **Updates `admin_sales_analytics`**:
     - Recalculates:
       - `total_revenue` (increases)
       - `total_units_sold` (increases)
       - `sales_by_type` (updates sale/rent/lease counts)
       - User type breakdowns (developers, agents, agencies)
       - Development aggregates

5. **Handles Rented → Sold Transition**:
   - If status changes from 'rented' to 'sold':
     - Updates existing `sales_listings` entry
     - Adjusts revenue (subtracts old, adds new)

---

## Database Tables Affected

### **Primary Tables**:
1. **`listings`** - Main listing data
2. **`social_amenities`** - Social amenities data
3. **`sales_listings`** - Sales records (when sold/rented)

### **Stats Tables**:
4. **`developments`** - Development stats (if developer unit)
5. **`developers`** - Developer stats (if developer unit)

### **Analytics Tables**:
6. **`admin_analytics`** - Legacy platform analytics (when finalized)
7. **`admin_listings_analytics`** - New listings analytics (when published)
8. **`admin_sales_analytics`** - New sales analytics (when published or pricing changes)

---

## Key Points

### **Draft vs Published**:
- **Draft listings** (`listing_status: 'draft'`):
  - No analytics updates (except pricing updates `admin_sales_analytics`)
  - Can be saved and resumed later
  - Not counted in public listings

- **Published listings** (`listing_status: 'active'` AND `listing_condition: 'completed'`):
  - Triggers all analytics updates
  - Counted in public listings
  - Included in developer/development stats

### **Analytics Update Triggers**:
1. **`admin_listings_analytics`**: Only when listing is **published** (finalized as active)
2. **`admin_sales_analytics`**: 
   - When listing is **published** (updates estimated_revenue)
   - When **pricing changes** (updates estimated_revenue)
   - When **status changes to sold/rented** (updates revenue and units sold)

### **Currency Handling**:
- All revenue in analytics tables is stored in **USD**
- Uses `global_price.estimated_revenue` (always USD)
- Falls back to `estimated_revenue.estimated_revenue` if needed

### **Error Handling**:
- Analytics updates are **non-blocking**
- If analytics fail, listing operation still succeeds
- Errors are logged but don't break the user flow

---

## Summary Flow Diagram

```
User Starts Creating Listing
    ↓
[Step 1: Basic Info] → Creates Draft Listing (status: 'draft')
    ↓
[Step 2: Categories] → Updates Draft
    ↓
[Step 3: Specifications] → Updates Draft
    ↓
[Step 4: Location] → Updates Draft
    ↓
[Step 5: Pricing] → Updates Draft + Updates admin_sales_analytics (estimated_revenue)
    ↓
[Step 6: Amenities] → Updates Draft
    ↓
[Step 7: Social Amenities] → Updates social_amenities table
    ↓
[Step 8: Media] → Uploads files, Updates Draft
    ↓
[Step 9: Immersive Experience] → Uploads 3D model, Updates Draft
    ↓
[Step 10: Additional Info] → Uploads files, Updates Draft
    ↓
[Step 11: Preview & Finalize] → Changes status to 'active'
    ↓
    ├─→ Updates Development Stats
    ├─→ Updates Developer Stats
    ├─→ Updates admin_analytics (legacy)
    ├─→ Updates admin_listings_analytics (NEW) ✅
    └─→ Updates admin_sales_analytics (NEW) ✅

[Later: Status Change to Sold/Rented]
    ↓
    ├─→ Creates sales_listings entry
    ├─→ Updates Developer/Development total_revenue
    └─→ Updates admin_sales_analytics ✅
```

---

## Notes

- All analytics tables use **date-based aggregation** (one record per day)
- Analytics are **recalculated from source data** (not incremental)
- The system supports **resuming incomplete listings** (draft-first approach)
- **File uploads** happen immediately when files are provided
- **Currency conversion** happens automatically when pricing is set
- **Analytics updates** are async and don't block the main operation

