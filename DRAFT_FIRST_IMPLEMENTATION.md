# Draft-First Listing Implementation

## Overview

This document describes the draft-first approach for listing creation and updates, with robust error handling, resume functionality, and automatic cleanup of incomplete uploads.

## Key Features

### 1. State Tracking
- **`listing_condition`**: Tracks the operation state (`'adding'`, `'updating'`, `'completed'`)
- **`upload_status`**: Tracks upload completion (`'incomplete'`, `'completed'`)
- **`listing_status`**: Tracks listing visibility (`'draft'`, `'active'`, `'archived'`, `'sold'`, `'rented'`)

### 2. Draft-First Approach
- All new listings are created as drafts first (`listing_status: 'draft'`)
- Listing record is created before file uploads begin
- Files are uploaded incrementally
- If any step fails, uploaded files are cleaned up and the draft listing is deleted
- Only on successful completion is the listing marked as `'active'` (or user's choice)

### 3. Resume Functionality
- When a user clicks "Add New Unit/Property", the system checks for incomplete drafts
- If found, a modal appears asking the user to:
  - Resume an existing draft
  - Start fresh (ignore drafts)
- Draft data is automatically loaded into the form when resumed

### 4. Automatic Cleanup
- Cron job endpoint: `/api/cron/cleanup-incomplete-listings`
- Deletes incomplete listings older than 48 hours
- Cleans up associated files from Supabase Storage
- Removes associated social amenities records
- Preserves intentional drafts (where `listing_condition = 'completed'` and `upload_status = 'completed'`)

### 5. Analytics Integration
- Admin analytics only count listings where:
  - `listing_condition = 'completed'`
  - `upload_status = 'completed'`
- Incomplete drafts are excluded from analytics

## API Endpoints

### POST `/api/listings`
Creates a new listing with draft-first approach:

1. **Check for resume**: If `resume_listing_id` is provided, fetch and update existing draft
2. **Create/Update draft**: Create new draft or update existing one with `listing_condition: 'adding'`, `upload_status: 'incomplete'`, `listing_status: 'draft'`
3. **Upload files**: Upload media files, 3D models, floor plans, additional files
4. **Update listing**: Update draft with uploaded file references
5. **Process amenities**: Download and store social amenity images
6. **Update development stats**: If developer unit, update development statistics
7. **Finalize**: Mark as `listing_condition: 'completed'`, `upload_status: 'completed'`, set `listing_status` (default: `'active'`)

**Error Handling**:
- If any file upload fails, cleanup all uploaded files and delete the draft listing
- If finalization fails, mark as incomplete (listing remains for resume)

### PUT `/api/listings/[id]`
Updates an existing listing:

1. **Set updating state**: Mark as `listing_condition: 'updating'`, `upload_status: 'incomplete'`
2. **Upload new files**: Handle any new file uploads
3. **Update listing data**: Update with new data and file references
4. **Finalize**: Mark as `listing_condition: 'completed'`, `upload_status: 'completed'`

### GET `/api/listings/check-resume`
Checks for incomplete drafts for the current user:
- Returns list of drafts where:
  - `listing_status = 'draft'`
  - `listing_condition IN ('adding', 'updating')`
  - `upload_status = 'incomplete'`

### POST `/api/cron/cleanup-incomplete-listings`
Cron job endpoint to cleanup incomplete listings:
- Finds listings where:
  - `listing_status = 'draft'`
  - `listing_condition IN ('adding', 'updating')`
  - `upload_status = 'incomplete'`
  - `created_at < NOW() - INTERVAL '48 hours'`
- Deletes associated files from storage
- Deletes associated social amenities
- Deletes the draft listings

**Security**: Add `CRON_SECRET` environment variable and verify in production.

## Frontend Implementation

### PropertyManagement Component

**New State**:
- `incompleteDrafts`: Array of incomplete draft listings
- `showResumeModal`: Boolean to show/hide resume modal
- `resumeListingId`: ID of draft being resumed

**New Functions**:
- `checkForIncompleteDrafts()`: Checks for incomplete drafts on mount (add mode)
- `handleResumeDraft(draftId)`: Loads draft data into form
- `handleStartFresh()`: Ignores drafts and starts fresh

**Resume Modal**:
- Shows list of incomplete drafts with title and creation date
- Options:
  - "Resume Draft" (if single draft)
  - "Start Fresh" (always available)

**Form Submission**:
- If `resumeListingId` is set, includes it in `FormData` as `resume_listing_id`
- Includes `final_listing_status` (default: `'active'` for new, preserves `'draft'` for resumed)

## Database Schema

### `listings` Table

```sql
listing_condition TEXT NOT NULL DEFAULT 'adding' 
  CHECK (listing_condition IN ('adding', 'updating', 'completed'))

upload_status TEXT NULL DEFAULT 'incomplete' 
  CHECK (upload_status IS NULL OR upload_status IN ('incomplete', 'completed'))

listing_status TEXT NULL DEFAULT 'draft' 
  CHECK (listing_status IN ('draft', 'active', 'archived', 'sold', 'rented'))
```

### Indexes

```sql
CREATE INDEX idx_listings_listing_condition ON listings (listing_condition);
CREATE INDEX idx_listings_upload_status ON listings (upload_status);
CREATE INDEX idx_listings_cleanup_incomplete ON listings 
  (listing_status, listing_condition, upload_status, created_at)
  WHERE listing_status = 'draft' 
    AND listing_condition IN ('adding', 'updating') 
    AND upload_status = 'incomplete';
```

## Setup Instructions

### 1. Run Database Migration

Execute the migration script to update constraints and add indexes:

```sql
-- See migrate_listing_status_to_active.sql
```

### 2. Set Up Cron Job

Configure a cron job to call the cleanup endpoint every 12 hours (or as needed):

**Vercel Cron** (add to `vercel.json`):
```json
{
  "crons": [{
    "path": "/api/cron/cleanup-incomplete-listings",
    "schedule": "0 */12 * * *"
  }]
}
```

**Environment Variable**:
```env
CRON_SECRET=your-secret-token-here
```

**Manual Testing** (development only):
```bash
curl -X POST https://iskapromos.vercel.app/api/cron/cleanup-incomplete-listings \
  -H "Authorization: Bearer your-secret-token"
```

### 3. Update Frontend

The frontend automatically checks for incomplete drafts when:
- User navigates to "Add New Unit/Property" page
- User is authenticated

No additional configuration needed.

## Error Recovery Flow

### Scenario 1: Network Failure During Upload
1. Listing created as draft (`listing_condition: 'adding'`, `upload_status: 'incomplete'`)
2. Some files uploaded successfully
3. Network fails
4. User can resume draft later
5. On resume, existing files are preserved, new files are uploaded
6. If not resumed within 48 hours, cleanup job deletes draft and files

### Scenario 2: User Closes Tab
1. Same as Scenario 1
2. Draft remains in database
3. User can resume on next visit
4. Cleanup job handles old drafts

### Scenario 3: Validation Error
1. Listing created as draft
2. Files uploaded
3. Validation fails (e.g., missing title)
4. Files and listing are cleaned up immediately
5. User sees error message

### Scenario 4: Intentional Draft
1. User saves as draft (`listing_status: 'draft'`)
2. `listing_condition: 'completed'`, `upload_status: 'completed'`
3. Cleanup job preserves these drafts (doesn't match cleanup criteria)
4. User can edit and publish later

## Benefits

1. **Data Safety**: No orphaned files if upload fails
2. **User Experience**: Users can resume incomplete uploads
3. **Storage Efficiency**: Automatic cleanup of abandoned uploads
4. **Analytics Accuracy**: Only completed listings are counted
5. **Error Recovery**: Graceful handling of network issues and errors

## Monitoring

Monitor incomplete drafts:
```sql
SELECT 
  listing_condition,
  upload_status,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM listings
WHERE listing_status = 'draft'
GROUP BY listing_condition, upload_status;
```

