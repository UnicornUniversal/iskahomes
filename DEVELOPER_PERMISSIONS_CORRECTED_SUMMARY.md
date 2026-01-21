# Developer Permissions - Corrected Structure Summary

## ✅ Changes Made

### 1. **Removed Redundant Parent Permissions**
- ❌ Removed: `dashboard.dashboard`, `analytics.analytics`, `messages.messages`, etc.
- ✅ Now: Route access is checked via `category.view` permission
- **Logic**: If user has `dashboard.view`, they can access `/developer/[slug]/dashboard`

### 2. **Fixed Units/Listings Permissions**
**Before (WRONG):**
- `units.publish` / `units.unpublish` - These don't exist!
- `units.feature` - Not a separate operation

**After (CORRECT):**
- `units.view` - View units list and details
- `units.create` - Create new units
- `units.edit` - Edit units (includes changing `listing_status`, `status`, `is_featured`)
- `units.delete` - Delete units
- `units.view_analytics` - View unit analytics page
- `units.view_leads` - View unit leads page

**Note**: Changing `listing_status` from 'draft' to 'active' is part of `edit` permission, not a separate "publish" action.

### 3. **Fixed Developments Permissions**
**Before (WRONG):**
- `developments.publish` / `developments.unpublish` - These don't exist!

**After (CORRECT):**
- `developments.view` - View developments list and details
- `developments.create` - Create new developments
- `developments.edit` - Edit developments (includes changing `status`, `development_status`)
- `developments.delete` - Delete developments

**Note**: Changing `development_status` from 'draft' to 'active' is part of `edit` permission.

### 4. **Fixed Appointments Permissions**
**Before (WRONG):**
- `appointments.approve` / `appointments.reject` / `appointments.cancel` - These are just status updates!

**After (CORRECT):**
- `appointments.view` - View appointments list and calendar
- `appointments.create` - Create new appointments
- `appointments.edit` - Edit appointments (includes updating `status` field)
- `appointments.delete` - Delete appointments

**Note**: Changing appointment `status` to 'confirmed', 'cancelled', etc. is part of `edit` permission.

### 5. **Fixed Messages Permissions**
**Before:**
- `messages.messages` (redundant parent)
- `messages.read` (redundant - same as view)
- `messages.manage` (too vague)

**After:**
- `messages.view` - View messages/conversations
- `messages.send` - Send new messages
- `messages.reply` - Reply to messages
- `messages.delete` - Delete messages/conversations
- `messages.mark_read` - Mark messages as read

---

## Route-to-Permission Mapping (CORRECTED)

### Route Access Logic
**Rule**: To access a route, user needs `category.view` permission.

| Route | Permission Check |
|-------|------------------|
| `/developer/[slug]/dashboard` | `dashboard.view` |
| `/developer/[slug]/messages` | `messages.view` |
| `/developer/[slug]/developments` | `developments.view` |
| `/developer/[slug]/developments/[devSlug]` | `developments.view` |
| `/developer/[slug]/units` | `units.view` |
| `/developer/[slug]/units/[unitSlug]` | `units.view` |
| `/developer/[slug]/units/[unitSlug]/analytics` | `units.view_analytics` |
| `/developer/[slug]/units/[unitSlug]/leads` | `units.view_leads` |
| `/developer/[slug]/appointments` | `appointments.view` |
| `/developer/[slug]/leads` | `leads.view` |
| `/developer/[slug]/team` | `team.view` |
| `/developer/[slug]/team/roles` | `team.manage_roles` |
| `/developer/[slug]/analytics` | `analytics.view` |
| `/developer/[slug]/analytics/properties` | `analytics.view_properties` |
| `/developer/[slug]/analytics/leads` | `analytics.view_leads` |
| `/developer/[slug]/analytics/sales` | `analytics.view_sales` |
| `/developer/[slug]/analytics/profile` | `analytics.view_profile_brand` |
| `/developer/[slug]/analytics/appointments` | `analytics.view_appointments` |
| `/developer/[slug]/analytics/messages` | `analytics.view_messages` |
| `/developer/[slug]/analytics/market` | `analytics.view_market` |
| `/developer/[slug]/profile` | `profile.view` |
| `/developer/[slug]/subscriptions` | `subscriptions.view` |

### Action Permissions

#### Units Actions
- **Create Unit**: `units.create`
- **Edit Unit**: `units.edit` (includes changing listing_status, status, is_featured)
- **Delete Unit**: `units.delete`
- **View Analytics**: `units.view_analytics`
- **View Leads**: `units.view_leads`

#### Developments Actions
- **Create Development**: `developments.create`
- **Edit Development**: `developments.edit` (includes changing status, development_status)
- **Delete Development**: `developments.delete`

#### Appointments Actions
- **Create Appointment**: `appointments.create`
- **Edit Appointment**: `appointments.edit` (includes updating status)
- **Delete Appointment**: `appointments.delete`

#### Leads Actions
- **View All Leads**: `leads.view_all` (vs just `leads.view` for assigned only)
- **Edit Lead**: `leads.edit`
- **Update Lead Status**: `leads.update_status`
- **Add Notes**: `leads.add_notes`
- **Assign Lead**: `leads.assign`
- **Delete Lead**: `leads.delete`
- **Export Leads**: `leads.export`

---

## Actual Database Fields

### Listings/Units
- `listing_status`: 'draft' | 'active' | 'archived' | 'sold' | 'rented'
- `status`: 'Available' | 'Unavailable' | 'Sold' | 'Rented Out' | 'Taken' | 'Under Maintenance / Renovation' | 'Coming Soon'
- `is_featured`: boolean
- **Operations**: create, edit (includes status changes), delete

### Developments
- `status`: 'Planning' | 'Under Construction' | 'Pre-Construction' | 'Ready for Occupancy' | 'Completed' | 'Sold Out'
- `development_status`: 'active' | 'inactive' | 'draft'
- **Operations**: create, edit (includes status changes), delete

### Appointments
- `status`: 'pending' | 'confirmed' | 'completed' | 'cancelled'
- **Operations**: create, edit (includes status updates), delete

---

## Implementation Notes

### Route Protection
```javascript
// Check if user can access route
const canAccess = hasPermission(userPermissions, 'dashboard.view', 'developer')
// OR use helper function
const canAccess = canAccessRoute(userPermissions, 'dashboard', 'developer')
```

### Action Protection
```javascript
// Check if user can perform action
const canCreate = hasPermission(userPermissions, 'units.create', 'developer')
const canEdit = hasPermission(userPermissions, 'units.edit', 'developer')
const canDelete = hasPermission(userPermissions, 'units.delete', 'developer')
```

### Status Changes
Status changes (listing_status, status, development_status, appointment status) are part of the `edit` permission, not separate permissions.

---

## Summary

✅ **Removed**: Redundant parent permissions (`dashboard.dashboard`, etc.)
✅ **Fixed**: Units/Listings - removed non-existent `publish`/`unpublish`/`feature`
✅ **Fixed**: Developments - removed non-existent `publish`/`unpublish`
✅ **Fixed**: Appointments - removed non-existent `approve`/`reject`/`cancel` (these are just status updates)
✅ **Simplified**: Messages permissions
✅ **Matched**: All permissions now match actual project operations and database fields

**Key Principle**: Route access = `category.view`, Actions = specific permissions, Status changes = part of `edit` permission.
