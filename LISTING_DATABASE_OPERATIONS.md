# Complete Database Operations for Listing Management

This document outlines **all database operations** that occur when a user adds, edits, or deletes a listing.

---

## 📋 Table of Contents
1. [CREATE Listing](#create-listing)
2. [UPDATE Listing](#update-listing)
3. [DELETE Listing](#delete-listing)
4. [ADMIN_ANALYTICS Table](#admin_analytics-table) ⚠️ **CRITICAL MISSING**
5. [Related Tables & Relationships](#related-tables--relationships)
6. [Storage Operations](#storage-operations)
7. [Potential Issues & Missing Operations](#potential-issues--missing-operations)

---

## 🆕 CREATE Listing

### Database Tables Affected:

#### 1. **`listings` Table**
- **Operation**: `INSERT`
- **Data Written**:
  - Basic info: `account_type`, `user_id`, `listing_type`, `title`, `description`, `size`, `status`
  - Development: `development_id` (for developers only)
  - Categories: `purposes`, `types`, `categories`, `listing_types` (JSONB)
  - Specifications: `specifications` (JSONB)
  - Location: `country`, `state`, `city`, `town`, `full_address`, `latitude`, `longitude`
  - Amenities: `amenities` (JSONB)
  - Pricing: `price`, `currency`, `duration`, `price_type`, `pricing` (JSONB), `estimated_revenue`, `global_price`
  - Media: `media` (JSONB with albums structure)
  - 3D Model: `3d_model` (JSONB, developers only)
  - Additional files: `additional_files` (JSONB)
  - Availability: `available_from`, `available_until`, `acquisition_rules`
  - Metadata: `listing_status`, `is_featured`, `is_verified`, `is_premium`
  - SEO: `tags`, `meta_description`, `meta_keywords`, `seo_title`, `slug`
  - Audit: `created_by`, `last_modified_by`
  - Timestamps: `created_at` (auto), `updated_at` (auto)

#### 2. **`social_amenities` Table**
- **Operation**: `INSERT`
- **Condition**: Only if social amenities data is provided
- **Data Written**:
  - `listing_id` (foreign key)
  - `schools`, `hospitals`, `airports`, `parks`, `shops`, `police` (JSONB arrays)
  - Each amenity image is downloaded from Google Maps and uploaded to Supabase Storage
  - `database_url` is added to each amenity object
  - Timestamps: `created_at`, `updated_at`, `last_updated` (auto)

#### 3. **`developments` Table**
- **Operation**: `UPDATE`
- **Condition**: Only if `account_type = 'developer'` AND `development_id` exists
- **Data Updated**:
  - `total_units`: Incremented by 1
  - `property_purposes_stats`: Recalculated from all listings in development
  - `property_categories_stats`: Recalculated from all listings in development
  - `property_types_stats`: Recalculated from all listings in development
  - `property_subtypes_stats`: Recalculated from all listings in development
- **Calculation Logic**:
  - Fetches all listings for the development
  - Counts occurrences of each purpose/type/category/subtype
  - Calculates percentage: `(count / total_listings) * 100`
  - Each stat entry: `{ category_id, total_amount, percentage }`

### Storage Operations (Supabase Storage):

#### 1. **Media Files** (`iskaHomes/property-media/`)
- Uploads up to 20 media files
- Each file gets: `{ url, filename, originalName, size, type, path }`
- Files are added to `media.albums[].images[]` array

#### 2. **Additional Files** (`iskaHomes/additional-files/`)
- Uploads up to 10 additional files
- Files are added to `additional_files` JSONB array

#### 3. **3D Model** (`iskaHomes/3d-models/`)
- Uploads 1 file (developers only)
- Stored in `3d_model` JSONB field

#### 4. **Floor Plan** (`iskaHomes/floor-plans/`)
- Uploads 1 image file (max 300KB)
- Stored in `floor_plan` field

#### 5. **Social Amenities Images** (`iskaHomes/social-amenities/`)
- Downloads images from Google Maps URLs
- Uploads to Supabase Storage
- Updates `database_url` in amenity objects
- Handles: schools, hospitals, airports, parks, shops, police

### External Operations:
- **Currency Conversion**: Calls `processCurrencyConversions()` to calculate `estimated_revenue` and `global_price`
- **Analytics**: Tracks `listing_created` event (PostHog) → Redis counters incremented
- **Admin Analytics**: ❌ **NOT UPDATED** - `admin_analytics` table is not updated in real-time

---

## ✏️ UPDATE Listing

### Database Tables Affected:

#### 1. **`listings` Table**
- **Operation**: `UPDATE`
- **Data Updated**: All fields that are provided in the form data
- **Special Handling**:
  - New media files are appended to existing `media.albums[].images[]`
  - New additional files are appended to existing `additional_files`
  - 3D model can be replaced
  - `last_modified_by` is updated
  - `updated_at` is auto-updated by trigger
  - Currency conversions are recalculated if pricing changed

#### 2. **`social_amenities` Table**
- **Operation**: `UPDATE` or `INSERT` (upsert)
- **Logic**:
  - Checks if record exists for `listing_id`
  - If exists: `UPDATE` with new data
  - If not exists: `INSERT` new record
- **Image Processing**:
  - Only downloads images for amenities that don't have `database_url`
  - Preserves existing `database_url` values
  - Downloads and uploads new images from Google Maps

#### 3. **`developments` Table**
- **Operation**: `UPDATE` (potentially twice)
- **Conditions**:
  - Only if `account_type = 'developer'`
  - Updates stats if categories/purposes/types changed OR development changed
- **Scenarios**:
  1. **Development Changed**: 
     - Updates OLD development: Decrements `total_units`, recalculates stats
     - Updates NEW development: Recalculates stats (no unit increment, listing already moved)
  2. **Categories Changed**: Recalculates stats for current development
  3. **No Change**: No update to developments table

### Storage Operations:
- Same as CREATE, but only for NEW files uploaded
- Existing files are preserved

---

## 🗑️ DELETE Listing

### Database Tables Affected:

#### 1. **`social_amenities` Table**
- **Operation**: `DELETE` (explicit)
- **Condition**: Explicitly deleted before listing deletion
- **Note**: Also has `ON DELETE CASCADE` constraint, so would auto-delete anyway

#### 2. **`listings` Table**
- **Operation**: `DELETE`
- **Cascade Effects**: 
  - Triggers `ON DELETE CASCADE` on related tables

#### 3. **`developments` Table**
- **Operation**: `UPDATE`
- **Condition**: Only if `account_type = 'developer'` AND `development_id` exists
- **Data Updated**:
  - `total_units`: Decremented by 1 (minimum 0)
  - `property_purposes_stats`: Recalculated
  - `property_categories_stats`: Recalculated
  - `property_types_stats`: Recalculated
  - `property_subtypes_stats`: Recalculated

### Tables with CASCADE DELETE (Auto-deleted):

#### 1. **`saved_listings` Table**
- **Constraint**: `ON DELETE CASCADE`
- **Effect**: All saved listings records for this listing are automatically deleted
- **Also Updates**: `property_seekers.total_saved_listings` (decremented via trigger or manual update)

#### 2. **`social_amenities` Table**
- **Constraint**: `ON DELETE CASCADE`
- **Effect**: Social amenities record is automatically deleted
- **Note**: We explicitly delete it anyway before listing deletion

### Tables with SET NULL (Auto-updated):

#### 1. **`conversations` Table**
- **Constraint**: `listing_id REFERENCES listings(id) ON DELETE SET NULL`
- **Effect**: `listing_id` is set to NULL for any conversations referencing this listing
- **Note**: Conversations remain, but lose listing reference

### Storage Operations:
- **Files are NOT automatically deleted** from Supabase Storage
- Files remain in storage even after listing deletion
- **Recommendation**: Implement cleanup job to delete orphaned files

---

## 🔗 Related Tables & Relationships

### Direct Foreign Key Relationships:

1. **`social_amenities`**
   - `listing_id` → `listings(id)` 
   - `ON DELETE CASCADE` ✅

2. **`saved_listings`**
   - `listing_id` → `listings(id)`
   - `ON DELETE CASCADE` ✅

3. **`conversations`**
   - `listing_id` → `listings(id)`
   - `ON DELETE SET NULL` ✅

4. **`developments`**
   - `listings.development_id` → `developments(id)`
   - `ON DELETE SET NULL` ✅
   - **Manual Updates**: Stats and `total_units` are manually updated

### Potential Orphaned Records:

1. **`leads` Table**
   - Has `listing_id` column but **NO foreign key constraint**
   - **Issue**: Leads referencing deleted listings will have invalid `listing_id`
   - **Recommendation**: Add foreign key with `ON DELETE SET NULL` or `ON DELETE CASCADE`

2. **Analytics Tables**
   - May reference `listing_id` in various analytics tables
   - **Recommendation**: Check and add appropriate constraints

---

## 📦 Storage Operations Summary

### Supabase Storage Buckets Used:

1. **`iskaHomes/property-media/`**
   - Media files (images)
   - Used in: `media.albums[].images[]`

2. **`iskaHomes/additional-files/`**
   - Additional documents
   - Used in: `additional_files` JSONB array

3. **`iskaHomes/3d-models/`**
   - 3D model files (.glb)
   - Used in: `3d_model` JSONB field

4. **`iskaHomes/floor-plans/`**
   - Floor plan images
   - Used in: `floor_plan` field

5. **`iskaHomes/social-amenities/`**
   - Social amenity images (downloaded from Google Maps)
   - Used in: `social_amenities` table

### File Cleanup:
- **Current Status**: ❌ Files are NOT deleted when listing is deleted
- **Recommendation**: Implement cleanup job or manual cleanup process

---

## 📊 ADMIN_ANALYTICS Table

### Current Status: ❌ **NOT UPDATED**

The `admin_analytics` table is **NOT currently updated** when listings are created, updated, or deleted. This table is meant to store daily aggregated platform-wide analytics.

### What Should Be Updated (Based on Table Structure):

#### When a Listing is **CREATED**:

The following fields in `admin_analytics` should be updated for the current date:

1. **`listings_by_property_purpose`** (JSONB)
   - Structure: `{"purpose_id": {"total_listings": count, "total_sales": 0, "total_views": 0, "total_leads": 0, "sales_value": 0, "percentage": X}}`
   - Action: Increment `total_listings` for each purpose ID in the listing

2. **`listings_by_property_type`** (JSONB)
   - Structure: `{"type_id": {"total_listings": count, ...}}`
   - Action: Increment `total_listings` for each type ID in the listing

3. **`listings_by_sub_type`** (JSONB)
   - Structure: `{"sub_type_id": {"total_listings": count, ...}}`
   - Action: Increment `total_listings` for each subtype ID in `listing_types.database`

4. **`listings_by_category`** (JSONB)
   - Structure: `{"category_id": {"total_listings": count, ...}}`
   - Action: Increment `total_listings` for each category ID in the listing

5. **`country`** (JSONB Array)
   - Structure: `[{"name": "Ghana", "total_listings": count, "total_sales": 0, "total_views": 0, "total_leads": 0, "sales_value": 0, "percentage": X}]`
   - Action: Find or create country entry, increment `total_listings`, recalculate percentage

6. **`state`** (JSONB Array)
   - Structure: Similar to country, includes `country` field
   - Action: Find or create state entry, increment `total_listings`, recalculate percentage

7. **`city`** (JSONB Array)
   - Structure: Similar to state, includes `state` and `country` fields
   - Action: Find or create city entry, increment `total_listings`, recalculate percentage

8. **`town`** (JSONB Array)
   - Structure: Similar to city, includes `city`, `state`, and `country` fields
   - Action: Find or create town entry, increment `total_listings`, recalculate percentage

9. **`developers_metrics`** (JSONB) - If `account_type = 'developer'`
   - Structure: `{"total": count, "total_listings": count, "total_sales": 0, "total_revenue": 0, ...}`
   - Action: Increment `total` and `total_listings`

10. **`agents_metrics`** (JSONB) - If `account_type = 'agent'`
    - Structure: Same as developers_metrics
    - Action: Increment `total` and `total_listings`

#### When a Listing is **UPDATED**:

- If `purposes`, `types`, `categories`, or `listing_types` changed:
  - Decrement counts for OLD categories
  - Increment counts for NEW categories
  - Recalculate percentages

- If location changed (`country`, `state`, `city`, `town`):
  - Decrement `total_listings` for OLD location entries
  - Increment `total_listings` for NEW location entries
  - Recalculate percentages for both old and new locations

- If `status` changed to 'sold' or 'rented':
  - Update `total_sales` in relevant category/location entries
  - Update `sales_value` if price is available
  - Update `developers_metrics.total_sales` or `agents_metrics.total_sales`

#### When a Listing is **DELETED**:

- Decrement `total_listings` for all categories (purpose, type, subtype, category)
- Decrement `total_listings` for location entries (country, state, city, town)
- Decrement `total_listings` in `developers_metrics` or `agents_metrics`
- Recalculate percentages for all affected entries
- If listing was sold, decrement `total_sales` and adjust `sales_value`

### Implementation Notes:

1. **Aggregation Logic**: All counts and percentages need to be recalculated from the current state of listings
2. **Date-Based**: Updates are scoped to the current date (primary key)
3. **JSONB Operations**: Requires careful JSONB manipulation to update nested structures
4. **Performance**: Should use upsert operations to create or update the daily record

### Recommended Implementation:

Create a helper function `updateAdminAnalytics(listingId, operation, listingData)` that:
1. Fetches or creates the current date's `admin_analytics` record
2. Updates all relevant JSONB fields based on listing data
3. Recalculates percentages
4. Upserts the record

---

## ⚠️ Potential Issues & Missing Operations

### 1. **Admin Analytics Not Updated**
- **Issue**: `admin_analytics` table is NOT updated when listings are created/updated/deleted
- **Impact**: Platform-wide analytics are stale until aggregation job runs
- **Fix**: Implement real-time updates or ensure daily aggregation job runs correctly

### 2. **Leads Table**
- **Issue**: No foreign key constraint on `listing_id`
- **Impact**: Orphaned records when listing is deleted
- **Fix**: Add `ON DELETE SET NULL` or `ON DELETE CASCADE`

### 3. **File Storage Cleanup**
- **Issue**: Files remain in storage after listing deletion
- **Impact**: Storage costs, orphaned files
- **Fix**: Implement cleanup job or delete files before listing deletion

### 4. **Analytics References**
- **Issue**: Analytics tables may reference `listing_id` without constraints
- **Impact**: Data integrity issues
- **Fix**: Audit analytics tables and add appropriate constraints

### 5. **Development Stats Calculation**
- **Status**: ✅ Properly implemented
- **Note**: Recalculates from all listings, so it's accurate

### 6. **Currency Conversion Errors**
- **Status**: ✅ Gracefully handled
- **Behavior**: If conversion fails, listing creation continues without conversions

### 7. **Social Amenities Image Download Failures**
- **Status**: ✅ Gracefully handled
- **Behavior**: If image download fails, amenity is saved without `database_url`

---

## ✅ Verification Checklist

When creating/updating/deleting a listing, verify:

- [x] Listing record created/updated/deleted in `listings` table
- [x] Social amenities created/updated/deleted in `social_amenities` table
- [x] Development stats recalculated (if developer unit)
- [x] Development `total_units` updated (if developer unit)
- [x] Files uploaded to Supabase Storage
- [x] Social amenity images downloaded and uploaded
- [x] Currency conversions calculated (if pricing provided)
- [x] Saved listings cascade deleted (on listing delete)
- [x] Conversations `listing_id` set to NULL (on listing delete)
- [ ] Leads handled (no constraint - potential issue)
- [ ] Files cleaned up from storage (on listing delete - not implemented)

---

## 📝 Notes

1. **Transaction Safety**: Operations are not wrapped in transactions, so partial failures could occur
2. **Error Handling**: Most operations continue even if sub-operations fail (e.g., social amenities)
3. **Performance**: Development stats calculation queries all listings for the development (could be slow for large developments)
4. **Idempotency**: Update operations are idempotent (safe to retry)

