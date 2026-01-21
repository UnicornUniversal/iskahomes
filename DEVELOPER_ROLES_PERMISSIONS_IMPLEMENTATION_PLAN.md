# Developer Roles & Permissions Implementation Plan

## Overview
This document outlines the implementation plan for roles and permissions system for developers, mapping all existing routes to permission checks.

---

## Current State Analysis

### 1. **Existing Files**
- ✅ `src/lib/rolesAndPermissions.js` - Contains permission definitions and default roles
- ✅ `DEVELOPER_ROLES_PERMISSIONS_SCHEMA.md` - Database schema documentation
- ✅ Developer routes exist in `src/app/developer/[slug]/`

### 2. **Developer Routes Identified**

Based on the navigation and file structure, here are all developer routes:

| Route | Description | Current Permission Needed |
|-------|-------------|--------------------------|
| `/developer/[slug]/dashboard` | Dashboard overview | `dashboard.dashboard` or `dashboard.view` |
| `/developer/[slug]/messages` | Messages/Conversations | `messages.messages` or `messages.view` |
| `/developer/[slug]/developments` | Developments list | `developments.developments` or `developments.view` |
| `/developer/[slug]/developments/[devSlug]` | Individual development | `developments.view` |
| `/developer/[slug]/units` | Units list | `units.units` or `units.view` |
| `/developer/[slug]/units/[unitSlug]` | Individual unit | `units.view` |
| `/developer/[slug]/units/[unitSlug]/analytics` | Unit analytics | `units.view_analytics` |
| `/developer/[slug]/units/[unitSlug]/leads` | Unit leads | `units.view_leads` |
| `/developer/[slug]/appointments` | Appointments | `appointments.appointments` or `appointments.view` |
| `/developer/[slug]/leads` | Leads management | `leads.leads` or `leads.view` |
| `/developer/[slug]/team` | Team management | `team.team` or `team.view` |
| `/developer/[slug]/team/roles` | Team roles management | `team.manage_roles` |
| `/developer/[slug]/analytics` | Analytics overview | `analytics.analytics` or `analytics.view` |
| `/developer/[slug]/analytics/properties` | Properties analytics | `analytics.view_properties` |
| `/developer/[slug]/analytics/leads` | Leads analytics | `analytics.view_leads` |
| `/developer/[slug]/analytics/sales` | Sales analytics | `analytics.view_sales` |
| `/developer/[slug]/analytics/profile` | Profile & Brand analytics | `analytics.view_profile_brand` |
| `/developer/[slug]/analytics/appointments` | Appointments analytics | `analytics.view_appointments` |
| `/developer/[slug]/analytics/messages` | Messages analytics | `analytics.view_messages` |
| `/developer/[slug]/analytics/market` | Market intelligence | `analytics.view_market` |
| `/developer/[slug]/profile` | Profile settings | `profile.profile` or `profile.view` |
| `/developer/[slug]/subscriptions` | Subscription management | `subscriptions.subscriptions` or `subscriptions.view` |
| `/developer/[slug]/favorites` | Favorites (commented out) | `favorites.favorites` or `favorites.view` |
| `/developer/[slug]/agents` | Agents (commented out) | Not in current permissions |

---

## Permission Structure Analysis

### Current Permission Categories in `rolesAndPermissions.js`:

1. **dashboard** ✅
   - `dashboard.dashboard` (parent - route access)
   - `dashboard.view`
   - `dashboard.export`

2. **messages** ✅
   - `messages.messages` (parent - route access)
   - `messages.read`
   - `messages.view`
   - `messages.send`
   - `messages.reply`
   - `messages.delete`
   - `messages.manage`

3. **developments** ✅
   - `developments.developments` (parent - route access)
   - `developments.view`
   - `developments.create`
   - `developments.edit`
   - `developments.delete`
   - `developments.publish`
   - `developments.unpublish`
   - `developments.manage`

4. **units** ✅
   - `units.units` (parent - route access)
   - `units.view`
   - `units.create`
   - `units.edit`
   - `units.delete`
   - `units.publish`
   - `units.unpublish`
   - `units.feature`
   - `units.view_analytics`
   - `units.view_leads`
   - `units.manage`

5. **appointments** ✅
   - `appointments.appointments` (parent - route access)
   - `appointments.view`
   - `appointments.create`
   - `appointments.edit`
   - `appointments.delete`
   - `appointments.cancel`
   - `appointments.manage`

6. **leads** ✅
   - `leads.leads` (parent - route access)
   - `leads.view`
   - `leads.view_all`
   - `leads.assign`
   - `leads.update`
   - `leads.delete`
   - `leads.export`
   - `leads.manage`

7. **team** ✅
   - `team.team` (parent - route access)
   - `team.view`
   - `team.invite`
   - `team.edit`
   - `team.remove`
   - `team.manage_roles`
   - `team.assign_roles`
   - `team.manage_permissions`
   - `team.manage`

8. **analytics** ✅
   - `analytics.analytics` (parent - route access)
   - `analytics.view`
   - `analytics.view_overview`
   - `analytics.view_properties`
   - `analytics.view_leads`
   - `analytics.view_sales`
   - `analytics.view_profile_brand`
   - `analytics.view_appointments`
   - `analytics.view_messages`
   - `analytics.view_market`
   - `analytics.export`
   - `analytics.manage`

9. **profile** ✅
   - `profile.profile` (parent - route access)
   - `profile.view`
   - `profile.edit`
   - `profile.manage_branding`
   - `profile.manage_settings`
   - `profile.manage`

10. **subscriptions** ✅
    - `subscriptions.subscriptions` (parent - route access)
    - `subscriptions.view`
    - `subscriptions.upgrade`
    - `subscriptions.downgrade`
    - `subscriptions.cancel`
    - `subscriptions.manage`

11. **media** ✅
    - `media.media` (parent - route access)
    - `media.upload`
    - `media.delete`
    - `media.manage`

12. **financial** ✅
    - `financial.financial` (parent - route access)
    - `financial.view`
    - `financial.view_pricing`
    - `financial.edit_pricing`
    - `financial.view_revenue`
    - `financial.manage`

13. **favorites** ✅
    - `favorites.favorites` (parent - route access)
    - `favorites.view`
    - `favorites.add`
    - `favorites.remove`
    - `favorites.manage`

---

## Route-to-Permission Mapping

### Route Protection Strategy

Each route should check for **parent permission** (e.g., `dashboard.dashboard`) OR **view permission** (e.g., `dashboard.view`) to grant access to the route itself.

Then, within each page/component, check for **specific action permissions** before allowing actions.

### Detailed Mapping:

#### 1. Dashboard Routes
```
/developer/[slug]/dashboard
├── Route Access: dashboard.dashboard OR dashboard.view
└── Actions:
    ├── View stats: dashboard.view
    └── Export data: dashboard.export
```

#### 2. Messages Routes
```
/developer/[slug]/messages
├── Route Access: messages.messages OR messages.view
└── Actions:
    ├── View conversations: messages.view
    ├── Read messages: messages.read
    ├── Send messages: messages.send
    ├── Reply to messages: messages.reply
    ├── Delete messages: messages.delete
    └── Manage conversations: messages.manage
```

#### 3. Developments Routes
```
/developer/[slug]/developments
├── Route Access: developments.developments OR developments.view
└── Actions:
    ├── View list: developments.view
    ├── Create new: developments.create
    ├── Edit existing: developments.edit
    ├── Delete: developments.delete
    ├── Publish: developments.publish
    ├── Unpublish: developments.unpublish
    └── Full management: developments.manage

/developer/[slug]/developments/[devSlug]
├── Route Access: developments.view
└── Actions: Same as above based on context
```

#### 4. Units Routes
```
/developer/[slug]/units
├── Route Access: units.units OR units.view
└── Actions:
    ├── View list: units.view
    ├── Create new: units.create
    ├── Edit existing: units.edit
    ├── Delete: units.delete
    ├── Publish: units.publish
    ├── Unpublish: units.unpublish
    ├── Feature unit: units.feature
    └── Full management: units.manage

/developer/[slug]/units/[unitSlug]
├── Route Access: units.view
└── Actions: Same as above

/developer/[slug]/units/[unitSlug]/analytics
├── Route Access: units.view_analytics
└── Actions: View analytics data

/developer/[slug]/units/[unitSlug]/leads
├── Route Access: units.view_leads
└── Actions: View leads for this unit
```

#### 5. Appointments Routes
```
/developer/[slug]/appointments
├── Route Access: appointments.appointments OR appointments.view
└── Actions:
    ├── View list: appointments.view
    ├── Create new: appointments.create
    ├── Edit existing: appointments.edit
    ├── Delete: appointments.delete
    ├── Cancel: appointments.cancel
    └── Full management: appointments.manage
```

#### 6. Leads Routes
```
/developer/[slug]/leads
├── Route Access: leads.leads OR leads.view
└── Actions:
    ├── View list: leads.view
    ├── View all leads: leads.view_all
    ├── Assign leads: leads.assign
    ├── Update lead: leads.update
    ├── Delete lead: leads.delete
    ├── Export leads: leads.export
    └── Full management: leads.manage
```

#### 7. Team Routes
```
/developer/[slug]/team
├── Route Access: team.team OR team.view
└── Actions:
    ├── View team members: team.view
    ├── Invite members: team.invite
    ├── Edit members: team.edit
    ├── Remove members: team.remove
    └── Full management: team.manage

/developer/[slug]/team/roles
├── Route Access: team.manage_roles
└── Actions:
    ├── View roles: team.manage_roles
    ├── Create roles: team.manage_roles
    ├── Edit roles: team.manage_roles
    ├── Assign roles: team.assign_roles
    └── Manage permissions: team.manage_permissions
```

#### 8. Analytics Routes
```
/developer/[slug]/analytics
├── Route Access: analytics.analytics OR analytics.view
└── Actions:
    ├── View overview: analytics.view_overview
    ├── Export data: analytics.export
    └── Configure: analytics.manage

/developer/[slug]/analytics/properties
├── Route Access: analytics.view_properties
└── Actions: View property analytics

/developer/[slug]/analytics/leads
├── Route Access: analytics.view_leads
└── Actions: View leads analytics

/developer/[slug]/analytics/sales
├── Route Access: analytics.view_sales
└── Actions: View sales analytics

/developer/[slug]/analytics/profile
├── Route Access: analytics.view_profile_brand
└── Actions: View profile & brand analytics

/developer/[slug]/analytics/appointments
├── Route Access: analytics.view_appointments
└── Actions: View appointments analytics

/developer/[slug]/analytics/messages
├── Route Access: analytics.view_messages
└── Actions: View messages analytics

/developer/[slug]/analytics/market
├── Route Access: analytics.view_market
└── Actions: View market intelligence
```

#### 9. Profile Routes
```
/developer/[slug]/profile
├── Route Access: profile.profile OR profile.view
└── Actions:
    ├── View profile: profile.view
    ├── Edit profile: profile.edit
    ├── Manage branding: profile.manage_branding
    ├── Manage settings: profile.manage_settings
    └── Full management: profile.manage
```

#### 10. Subscriptions Routes
```
/developer/[slug]/subscriptions
├── Route Access: subscriptions.subscriptions OR subscriptions.view
└── Actions:
    ├── View subscription: subscriptions.view
    ├── Upgrade plan: subscriptions.upgrade
    ├── Downgrade plan: subscriptions.downgrade
    ├── Cancel subscription: subscriptions.cancel
    └── Full management: subscriptions.manage
```

#### 11. Favorites Routes (Currently Commented Out)
```
/developer/[slug]/favorites
├── Route Access: favorites.favorites OR favorites.view
└── Actions:
    ├── View favorites: favorites.view
    ├── Add to favorites: favorites.add
    ├── Remove from favorites: favorites.remove
    └── Full management: favorites.manage
```

---

## Implementation Components Needed

### 1. **Permission Check Utility Functions**
Location: `src/lib/permissions.js` (new file)

Functions needed:
- `checkRoutePermission(userPermissions, route, organizationType)` - Check if user can access route
- `checkActionPermission(userPermissions, action, organizationType)` - Check if user can perform action
- `getUserPermissions(userId, organizationId, organizationType)` - Fetch user permissions from DB
- `hasAnyPermission(userPermissions, permissionKeys, organizationType)` - Check if user has any of the permissions
- `hasAllPermissions(userPermissions, permissionKeys, organizationType)` - Check if user has all permissions

### 2. **Route Protection Middleware/Component**
Location: `src/app/components/permissions/ProtectedRoute.jsx` (new file)

Component that:
- Wraps protected routes
- Checks user permissions
- Redirects unauthorized users
- Shows loading state while checking

### 3. **Permission Guard Hook**
Location: `src/lib/hooks/usePermission.js` (new file)

React hook:
- `usePermission(permissionKey, organizationType)` - Returns boolean
- `usePermissions(permissionKeys, organizationType)` - Returns object with permission checks
- `useRoutePermission(route, organizationType)` - Returns boolean for route access

### 4. **API Route Protection**
Location: Update all API routes in `src/app/api/`

Middleware to:
- Extract user from token
- Fetch user permissions
- Check permissions before processing request
- Return 403 if unauthorized

### 5. **UI Permission Wrappers**
Location: `src/app/components/permissions/` (new directory)

Components:
- `<PermissionGate permission="..." organizationType="developer">` - Show/hide based on permission
- `<ActionButton permission="..." organizationType="developer">` - Disable/enable button
- `<ProtectedLink permission="..." organizationType="developer">` - Show/hide link

---

## Implementation Steps

### Phase 1: Core Permission Infrastructure
1. ✅ Review and finalize permission structure (already done in `rolesAndPermissions.js`)
2. Create `src/lib/permissions.js` with permission checking utilities
3. Create `src/lib/hooks/usePermission.js` React hook
4. Create database helper functions to fetch user permissions

### Phase 2: Route Protection
1. Create `ProtectedRoute` component
2. Update `src/app/developer/[slug]/layout.jsx` to check permissions
3. Add permission checks to each route/page component
4. Create redirect logic for unauthorized access

### Phase 3: Component-Level Protection
1. Create `PermissionGate` component
2. Create `ActionButton` component
3. Create `ProtectedLink` component
4. Update navigation to hide/show items based on permissions

### Phase 4: API Protection
1. Create API middleware for permission checking
2. Update all developer API routes to use middleware
3. Add permission checks to sensitive operations (create, edit, delete)

### Phase 5: Testing & Refinement
1. Test each role (Owner, Admin, Manager, Editor, Viewer)
2. Verify route access restrictions
3. Verify action restrictions
4. Test edge cases (multiple organizations, role changes)

---

## Permission Check Logic

### Route Access Check:
```javascript
// Check if user can access a route
function canAccessRoute(userPermissions, route, organizationType) {
  // Extract route category (e.g., 'dashboard' from '/developer/[slug]/dashboard')
  const routeCategory = extractRouteCategory(route)
  
  // Check parent permission OR view permission
  const parentPermission = `${routeCategory}.${routeCategory}`
  const viewPermission = `${routeCategory}.view`
  
  return hasPermission(userPermissions, parentPermission, organizationType) ||
         hasPermission(userPermissions, viewPermission, organizationType)
}
```

### Action Permission Check:
```javascript
// Check if user can perform an action
function canPerformAction(userPermissions, category, action, organizationType) {
  const permissionKey = `${category}.${action}`
  return hasPermission(userPermissions, permissionKey, organizationType)
}
```

---

## Default Roles Summary

### Owner
- ✅ All permissions: `true`
- ✅ Cannot be removed
- ✅ System role

### Admin
- ✅ Almost all permissions: `true`
- ❌ Limited: `subscriptions.manage`, `subscriptions.upgrade`, `subscriptions.downgrade`, `subscriptions.cancel`
- ❌ Limited: `team.manage` (cannot manage Owner)

### Manager
- ✅ Dashboard, Units, Developments, Leads, Appointments, Messages (most actions)
- ✅ Analytics (view only, no export/configure)
- ✅ Profile (view/edit, no branding/settings)
- ❌ Team management (view only)
- ❌ Subscriptions (view only)
- ❌ Financial (view only, no manage)

### Editor
- ✅ Dashboard, Units, Developments (create/edit/publish, no delete)
- ✅ Leads (view/update, no delete/export/assign)
- ✅ Messages (view/send/reply, no delete)
- ✅ Analytics (view only, limited sections)
- ❌ Team management
- ❌ Subscriptions
- ❌ Financial (view pricing only)

### Viewer
- ✅ Dashboard, Units, Developments, Leads, Appointments, Messages (view only)
- ✅ Analytics (view only, limited sections)
- ✅ Profile (view only)
- ✅ Subscriptions (view only)
- ❌ All create/edit/delete actions
- ❌ Team management
- ❌ Financial (view only, no pricing)

---

## Next Steps

1. **Review this plan** - Confirm route-to-permission mappings
2. **Create permission utilities** - Build core permission checking functions
3. **Implement route protection** - Add permission checks to routes
4. **Add component guards** - Protect UI elements based on permissions
5. **Protect API endpoints** - Add permission middleware to API routes
6. **Test thoroughly** - Verify all roles work correctly

---

## Questions to Resolve

1. **Should we check permissions on every page load or cache them?**
   - Recommendation: Cache in context/state, refresh on role change

2. **How to handle permission changes while user is logged in?**
   - Recommendation: Refresh permissions on role change, show notification

3. **What happens when Owner removes themselves?**
   - Recommendation: Prevent Owner from removing themselves, require transfer first

4. **Should permissions be checked client-side, server-side, or both?**
   - Recommendation: Both - client-side for UX, server-side for security

5. **How to handle nested routes (e.g., `/units/[slug]/analytics`)?**
   - Recommendation: Check parent route permission + specific sub-route permission

---

## Files to Create/Modify

### New Files:
1. `src/lib/permissions.js` - Permission checking utilities
2. `src/lib/hooks/usePermission.js` - React hooks for permissions
3. `src/app/components/permissions/ProtectedRoute.jsx` - Route protection component
4. `src/app/components/permissions/PermissionGate.jsx` - Show/hide based on permission
5. `src/app/components/permissions/ActionButton.jsx` - Button with permission check
6. `src/app/components/permissions/ProtectedLink.jsx` - Link with permission check
7. `src/middleware/permissions.js` - API permission middleware

### Files to Modify:
1. `src/app/developer/[slug]/layout.jsx` - Add permission checks
2. All route pages in `src/app/developer/[slug]/` - Add permission checks
3. `src/app/components/developers/DeveloperNav.jsx` - Hide/show nav items
4. All API routes in `src/app/api/` - Add permission middleware
5. `src/contexts/AuthContext.jsx` - Add permissions to user context

---

## Notes

- All permission checks should use the existing `hasPermission` function from `rolesAndPermissions.js`
- Permission structure is already well-defined in `rolesAndPermissions.js`
- Default roles are already configured
- Need to integrate with database schema from `DEVELOPER_ROLES_PERMISSIONS_SCHEMA.md`
- Consider performance: cache permissions, minimize database queries
