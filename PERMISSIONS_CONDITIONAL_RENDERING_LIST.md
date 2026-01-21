# Permissions-Based Conditional Rendering List

## Overview
This document lists all components, buttons, and UI elements that need to be conditionally rendered based on user roles and permissions. Developers (owners) should have all features visible, while team members should only see what their permissions allow.

---

## 1. DeveloperNav Component
**File:** `src/app/components/developers/DeveloperNav.jsx`

### Navigation Items to Hide:
- **Dashboard** - Hide if no `dashboard.view` permission
- **Messages** - Hide if no `messages.view` permission
- **Developments** - Hide if no `developments.view` permission
- **Units** - Hide if no `units.view` permission
- **Appointments** - Hide if no `appointments.view` permission
- **Leads** - Hide if no `leads.view` permission
- **Team** - Hide if no `team.view` permission
- **Sales** - Hide if no `sales.view` permission
- **Analytics** - Hide if no `analytics.view` permission
  - **Analytics Submenu Items:**
    - Properties - Hide if no `analytics.view_properties` permission
    - Leads - Hide if no `analytics.view_leads` permission
    - Profile & Brand - Hide if no `analytics.view_profile_brand` permission
- **Profile** - Hide if no `profile.view` permission
- **Subscriptions** - Hide if no `subscriptions.view` permission

---

## 2. AllUnits Component
**File:** `src/app/components/developers/units/AllUnits.jsx`

### Buttons/Actions to Hide:
- **"Add New Unit" button** (floating action button) - Hide if no `units.create` permission
- **"Create Your First Unit" button** (empty state) - Hide if no `units.create` permission

---

## 3. Developments Page
**File:** `src/app/developer/[slug]/developments/page.jsx`

### Buttons/Actions to Hide:
- **"Add Development" button** - Hide if no `developments.create` permission

---

## 4. Development Component (Add/Edit)
**File:** `src/app/components/developers/AddNewDevelopment/Development.jsx`

### Buttons/Actions to Hide:
- **"Delete Development" button** - Hide if no `developments.delete` permission
- **"Create Development" / "Update Development" button** (sticky submit) - Hide if:
  - Add mode: no `developments.create` permission
  - Edit mode: no `developments.edit` permission

---

## 5. UnitComponent / PropertyManagementWizard
**File:** `src/app/components/developers/units/UnitComponent.jsx` and `src/app/components/propertyManagement/PropertyManagementWizard.jsx`

### Buttons/Actions to Hide:
- **"Add New Unit" / "Create Unit" button** - Hide if no `units.create` permission
- **"Update Unit" / "Save Unit" button** - Hide if no `units.edit` permission
- **Delete unit functionality** (if exists) - Hide if no `units.delete` permission

---

## 6. Appointments Component
**File:** `src/app/components/developers/Appointments.jsx` and `src/app/components/developers/appointments/AppointmentsList.jsx`

### Buttons/Actions to Hide:
- **"Create Appointment" button** (if exists) - Hide if no `appointments.create` permission
- **Edit icon/button** (FiEdit3) - Hide if no `appointments.edit` permission
- **"Confirm" button** - Hide if no `appointments.edit` permission
- **"Mark Complete" button** - Hide if no `appointments.edit` permission
- **Status update buttons** - Hide if no `appointments.edit` permission

---

## 7. LeadsManagement Component
**File:** `src/app/components/analytics/LeadsManagement.jsx`

### Buttons/Actions to Hide:
- **"Edit Lead" button/icon** - Hide if no `leads.edit` permission
- **"Update Status" dropdown/buttons** - Hide if no `leads.update_status` permission
- **"Add Note" button/input** - Hide if no `leads.add_notes` permission
- **"Assign Lead" button** - Hide if no `leads.assign` permission
- **"Delete Lead" button** - Hide if no `leads.delete` permission
- **"Export Leads" button** - Hide if no `leads.export` permission
- **"Save Changes" button** - Hide if no `leads.edit` permission

---

## 8. Team Management Pages

### Team Page (`src/app/developer/[slug]/team/page.jsx`)
**Buttons/Actions to Hide:**
- **"Invite Member" button** - Hide if no `team.invite` permission

### TeamMembersList Component (`src/app/components/developers/team/TeamMembersList.jsx`)
**Buttons/Actions to Hide:**
- **Edit icon/button** (FiEdit) - Hide if no `team.edit` permission
- **Remove/Delete icon/button** (FiTrash2) - Hide if no `team.remove` permission

### Roles Page (`src/app/developer/[slug]/team/roles/page.jsx`)
**Buttons/Actions to Hide:**
- **"Create Role" button** - Hide if no `team.manage_roles` permission

### RolesList Component (`src/app/components/developers/team/RolesList.jsx`)
**Buttons/Actions to Hide:**
- **Edit icon/button** (FiEdit) - Hide if no `team.manage_roles` permission
- **Delete icon/button** (FiTrash2) - Hide if no `team.manage_roles` permission

---

## 9. Profile Page
**File:** `src/app/developer/[slug]/profile/page.jsx`

### Buttons/Actions to Hide:
- **"Save Changes" button** - Hide if no `profile.edit` permission
- **"Change Password" tab** - Hide if user is NOT Super Admin (only Super Admin can change password)
- **All edit inputs/fields** - Hide if no `profile.edit` permission (make read-only)
- **"Add Location" button** - Hide if no `profile.manage_locations` permission
- **"Edit Location" button** - Hide if no `profile.manage_locations` permission
- **"Remove Location" button** - Hide if no `profile.manage_locations` permission
- **Cover image upload** - Hide if no `profile.manage_branding` permission
- **Profile image upload** - Hide if no `profile.manage_branding` permission
- **Gallery image upload/delete** - Hide if no `profile.manage_branding` permission
- **Company stats add/remove** - Hide if no `profile.edit` permission
- **Customer care rep add/remove** - Hide if no `profile.edit` permission
- **File upload/remove** - Hide if no `profile.edit` permission
- **Specialization add/remove** - Hide if no `profile.edit` permission

---

## 10. Messages/Conversation Component
**File:** `src/app/components/messages/Conversation.jsx`

### Components to Hide:
- **Message input field** - Hide if no `messages.send` permission
- **Send button** - Hide if no `messages.send` permission
- **Entire message input section** (lines 695-710) - Hide if no `messages.send` permission

---

## 11. Subscriptions Page
**File:** `src/app/developer/[slug]/subscriptions/page.jsx`

### Buttons/Actions to Hide:
- **"Upgrade" button** - Hide if no `subscriptions.upgrade` permission
- **"Downgrade" button** - Hide if no `subscriptions.downgrade` permission
- **"Cancel" button** - Hide if no `subscriptions.cancel` permission
- **"Update" billing info button** - Hide if no `subscriptions.manage` permission
- **"Save Billing Information" button** - Hide if no `subscriptions.manage` permission
- **Auto-renew toggle** - Hide if no `subscriptions.manage` permission

---

## 12. Analytics Pages

### Analytics Overview (`src/app/developer/[slug]/analytics/page.jsx`)
**Buttons/Actions to Hide:**
- **Export dropdown/button** - Hide if no `analytics.export` permission

### Profile Analytics (`src/app/developer/[slug]/analytics/profile/page.jsx`)
**Buttons/Actions to Hide:**
- **Export dropdown/button** (both exports) - Hide if no `analytics.export` permission

### Properties Analytics (`src/app/developer/[slug]/analytics/properties/page.jsx`)
**Buttons/Actions to Hide:**
- **Export button** (if exists) - Hide if no `analytics.export` permission

### Leads Analytics (`src/app/developer/[slug]/analytics/leads/page.jsx`)
**Buttons/Actions to Hide:**
- **Export button** (if exists) - Hide if no `analytics.export` permission

---

## 13. Dashboard Page
**File:** `src/app/developer/[slug]/dashboard/page.jsx`

### Buttons/Actions to Hide:
- **Export button** (if exists) - Hide if no `dashboard.export` permission

---

## 14. Development Card Component
**File:** `src/app/components/developers/DevelopmentCard.jsx`

### Buttons/Actions to Hide:
- **Edit button** (if exists) - Hide if no `developments.edit` permission
- **Delete button** (if exists) - Hide if no `developments.delete` permission

---

## 15. Unit Card Component
**File:** `src/app/components/developers/units/UnitCard.jsx`

### Buttons/Actions to Hide:
- **Edit button** (if exists) - Hide if no `units.edit` permission
- **Delete button** (if exists) - Hide if no `units.delete` permission

---

## Summary by Permission Category

### Dashboard
- Navigation item: `dashboard.view`
- Export button: `dashboard.export`

### Messages
- Navigation item: `messages.view`
- Send input/button: `messages.send`

### Developments
- Navigation item: `developments.view`
- Add button: `developments.create`
- Edit button: `developments.edit`
- Delete button: `developments.delete`

### Units
- Navigation item: `units.view`
- Add button: `units.create`
- Edit button: `units.edit`
- Delete button: `units.delete`

### Appointments
- Navigation item: `appointments.view`
- Create button: `appointments.create`
- Edit/Status update buttons: `appointments.edit`
- Delete button: `appointments.delete`

### Leads
- Navigation item: `leads.view`
- Edit button: `leads.edit`
- Update status: `leads.update_status`
- Add notes: `leads.add_notes`
- Assign: `leads.assign`
- Delete: `leads.delete`
- Export: `leads.export`

### Team
- Navigation item: `team.view`
- Invite button: `team.invite`
- Edit member: `team.edit`
- Remove member: `team.remove`
- Create role: `team.manage_roles`
- Edit role: `team.manage_roles`
- Delete role: `team.manage_roles`

### Analytics
- Navigation item: `analytics.view`
- Submenu items: Respective `analytics.view_*` permissions
- Export buttons: `analytics.export`

### Profile
- Navigation item: `profile.view`
- Save button: `profile.edit`
- Change Password tab: **Super Admin only** (check role name === 'Super Admin')
- Location management: `profile.manage_locations`
- Branding management: `profile.manage_branding`

### Subscriptions
- Navigation item: `subscriptions.view`
- Upgrade: `subscriptions.upgrade`
- Downgrade: `subscriptions.downgrade`
- Cancel: `subscriptions.cancel`
- Manage: `subscriptions.manage`

---

## Special Cases

1. **Change Password** - Only available to Super Admin (check `user?.profile?.role_name === 'Super Admin'` or `user?.profile?.permissions === null`)

2. **Developers (owners)** - If `user?.profile?.permissions === null`, they have all permissions (Super Admin)

3. **Team Members** - Always check `user?.profile?.permissions` object for specific permissions

---

## Implementation Notes

- Use `userHasPermission(user, 'permission.key')` from `@/lib/permissionHelpers`
- For Super Admin check: `user?.profile?.permissions === null` OR `user?.profile?.role_name === 'Super Admin'`
- For route access: Use `userCanAccessRoute(user, 'category')` to hide entire navigation items
- Keep it simple - just conditionally render with `{hasPermission && <Component />}` or `{hasPermission ? <Component /> : null}`
