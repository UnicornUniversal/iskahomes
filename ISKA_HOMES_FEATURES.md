# Iska Homes — Developer Features

A verified, feature-by-feature breakdown of what the Iska Homes platform actually does for property developers, written from the current state of the codebase. Where features are partially built or use sample data, that is called out explicitly.

---

## 1. Account & Authentication

- **Sign Up & Sign In** — Developer accounts can be created with email and password.
- **Email Verification** — A verification email is required before the dashboard becomes accessible.
- **Forgot Password / Reset Password** — Developers can request a reset link by email and set a new password.
- **Change Password** — Available from inside the developer profile settings.
- **Token-Based Sessions** — On sign-in, a developer-scoped token is stored in `localStorage` (`developer_token`) and used for API calls.
- **Layout-Level Route Guards** — Every developer page checks for both authentication and the correct role. Both true `developer` accounts and `team_member` accounts whose organization is a developer can access the developer dashboard.
- **Auth-Failure Handler** — On token expiry or auth failure, the user is automatically redirected to sign-in.
- **Account Status Guard** — Suspended or restricted accounts are blocked from accessing the dashboard.

---

## 2. Developer Dashboard (Home)

The dashboard at `/developer/[slug]/dashboard` shows the following widgets, all rendered from real data on the developer's profile and from API endpoints:

### Headline KPI Cards
- **Total Units**
- **Total Views**
- **Total Impressions**
- **Total Revenue** — formatted in the developer's primary location currency
- **Total Developments**

Each card links to the relevant detail page (units list, analytics, developments list).

### Currency Awareness
The dashboard reads the developer's `company_locations`, finds the entry flagged `primary_location: true`, and uses its currency for all money figures. Falls back to `default_currency` and finally to `GHS` if neither is set.

### Live Widgets
- **Statistics View** — interactive views/leads/impressions chart
- **Simple Services** panel
- **Recent Sales** feed
- **Latest Leads** feed
- **Recent Activities** feed (limited to 10 items)
- **Latest Service Charges** (currency-aware)
- **Latest Engagements**
- **Recent Messages**
- **Latest Appointments**
- **Latest Reminders** (limited to 5)
- **Properties by Categories** (Purposes), **Properties by Type**, **Properties by Sub-Type** — driven by `property_purposes_stats`, `property_types_stats`, and `property_subtypes_stats` JSONB fields on the developer profile
- **Popular Listings** (limited to 4)

### Auto-Refresh of Profile
On mount, the dashboard re-queries the `developers` table to refresh the developer's stats so KPIs reflect the latest aggregated data. For team members, it correctly resolves the parent organization's profile.

> **Note:** A `ReportGenerator` component is imported but currently commented out on the dashboard; the underlying PDF generation (`pdf-lib` + `developerExportDocuments.js`) is in the codebase but not exposed on this page.
>
> **Note:** A `Notifications` panel is also imported but commented out; in-app notifications API exists at `/api/notifications` but is not currently rendered on the dashboard.

---

## 3. Developments Management

### Listing & Filtering — `/developer/[slug]/developments`
- Shows all of the developer's developments
- Free-text search
- Single-field location search with type-ahead (matches country, state, city, town)
- Filters by Purpose, Type, Category, and Sub-Type (using the cached taxonomy hooks `usePropertyPurposes`, `usePropertyTypes`, `usePropertyCategories`, `usePropertySubtypes`)
- Permission-aware "Create Development" button (`developments.create`)

### Multi-Step Development Editor — `/developer/[slug]/developments/[devSlug]`
The editor accepts a development ID (edit mode) or `addNewDevelopment` (create mode). It uses a single unified form with these sections:
- **Description** — title, tagline, description, size, status, number of buildings
- **Categories** — Purposes, Types, Categories, and **Unit Types** (database / inbuilt / custom)
- **Primary Location** — country, state, city, town, full address, GPS coordinates, additional info
- **Multiple Development Locations** (JSONB array) — additional sites for the project
- **Amenities** — inbuilt + custom
- **Media** — banner image, video upload, YouTube URL, virtual-tour URL, multiple media files
- **Additional Files** — supporting documents
- **Development Status** — defaults to `active`

Other capabilities:
- Edit existing developments (loads via `/api/developments/[id]`)
- Delete with confirmation modal (`DeleteDevelopmentModal`)
- Development stats panel showing listings count and total units
- Uploads route through `uploadFileToStorage` / `uploadMultipleFilesToStorage` to Supabase Storage

---

## 4. Units Management

### All Units — `/developer/[slug]/units`
- Infinite-scroll grid of unit cards
- Free-text search
- Location search (country / state / city / town with autocomplete)
- Filter by Purpose, Type, Status
- Status options actually exposed: **Available, Unavailable, Sold, Rented Out, Taken, Under Maintenance / Renovation, Coming Soon**
- Mobile and desktop filter visibility toggles
- Permission-gated "Add New Unit" button (`units.create`) — also requires the developer's profile requirements to be met before unit creation is allowed

### Unit Editor — `/developer/[slug]/units/[unitSlug]`
Routes:
- `addNewUnit` → create flow
- `[unitSlug]/edit` → edit flow
- `[unitSlug]` → view (rendered as edit mode)

Internally backed by the `PropertyManagement` component with a tabbed UI (Description / Media / Amenities). The form supports a comprehensive listing schema:
- Title, description, property_type, unit_type, development association
- Location (city, neighborhood, GPS, address)
- Size (bedrooms, bathrooms, living space, total area, ceiling height, capacity)
- Features (kitchen type, balcony, garden, security, gated community, internet, parking, conference rooms, washrooms, loading docks, forklift access, power backup, water supply, stage, lighting, sound system, chairs/tables, catering services, road access, proximity to utilities)
- Utilities (water supply, electricity, internet, drainage)
- Status (available, etc.)
- Lease terms (rent price, deposit, duration, flexible terms, cancellation policy, security requirements)
- Documentation (title deed, land certificate, lease status — freehold/leasehold)
- Topography
- Media (images, videos, virtual tour URL, 3D model)
- Amenities (database / general / custom)

### Per-Unit Sub-Pages
- `units/[unitSlug]/analytics` — Per-listing analytics powered by `ListingAnalytics` and `ListingAppointments`. Resolves the listing ID via `/api/listings/slug/[slug]?listing_type=unit`.
- `units/[unitSlug]/leads` — Per-listing leads scoped to that single unit.

---

## 5. Leads Management — `/developer/[slug]/leads`

This is the most fully implemented operational module in the developer dashboard.

### 5.1 Lead Capture
- **Automatic capture** of property-seeker actions: phone clicks (`lead_phone`), in-app/WhatsApp/email messages (`lead_message`), and appointment bookings (`lead_appointment`).
- **Anonymous lead capture** — visitors who interact without signing in still create leads (counted in `total_anonymous_leads`).
- **Manual lead entry** via the Add Lead modal capturing: name, email, phone, **lead origin** (Platform, Their Website, Referral, Walk-in, Phone Call, Event, Social Media, Other), **lead classification** (Premium, High Value, Standard), an optional linked listing or development, and notes.
- **Per-listing capture** — leads are tagged with the unit/development/profile they came from, and are also queryable per-listing via the `units/[unitSlug]/leads` page.

### 5.2 Lead Scoring (action-based)
Implemented in `calculateActionScore`:
- Appointment booked → **40 points**
- Phone click → **30 points**
- WhatsApp message → **25 points**
- Direct message → **20 points**
- Email message → **10 points**

Multiple actions on the same lead are summed.

### 5.3 Lead Categories
Implemented in `getLeadCategory`:
- **High** — score ≥ 60 (green badge)
- **Medium** — score 25–59 (yellow badge)
- **Base** — score < 25 (gray badge)

### 5.4 Manual Classification
Three classifications a developer can apply: **Premium**, **High Value**, **Standard**.

### 5.5 Status Pipeline
Leads progress through these stages (defined in `LeadLifecycle`):
- **New**
- **Contacted**
- **Scheduled**
- **Responded**
- **Closed**
- **Cold Lead** (side state)
- **Abandoned** (side state)

### 5.6 Lead Detail View
For each lead the developer can:
- See the full **action timeline** with formatted action names (`Phone Click`, `Direct Message`, `WhatsApp Message`, `Email Message`, `Appointment - Viewing`, `Manual Entry`, etc.)
- Read **contact details** (name, email, phone) and the linked listing/development
- Add, edit, and delete **internal notes**
- Add, edit, and delete **reminders** scheduled against the lead
- Send a **direct message** to the lead from inside the lead view (the message lands in the platform's chat system)
- View status, classification, and computed score
- Open a dedicated lead page at `/developer/[slug]/leads/[leadId]`

### 5.7 Filters & Search
The leads list supports server-side filtering by:
- Status, action type, lead type (logged-in / anonymous), classification
- Date range (`date_from`, `date_to`)
- Free-text search
- Listing ID (when in per-listing mode)
- Assigned user (auto-applied for non-super-admins so they only see their own assigned leads)

There is also a **filters modal** for combining filters cleanly, plus a "Leads Today" counter.

### 5.8 Assignment
Leads can be assigned to other team members via the assignable-users picker (data from `/api/audit/users`). The picker excludes Owner and Super Admin roles to keep ownership unambiguous. Assignments respect the `leads.assign` permission.

### 5.9 Reminders Carousel
The `Reminders` component (Swiper-based carousel) renders upcoming reminders for the lister, optionally scoped to a specific listing. It refreshes whenever a `refreshKey` changes.

### 5.10 Permissions
The full set of leads permissions defined in the system:
- `leads.view` — view assigned leads
- `leads.view_all` — view every lead in the organization
- `leads.edit` — edit lead information
- `leads.update_status` — move leads through the pipeline
- `leads.add_notes` — add internal notes
- `leads.assign` — assign leads to team members
- `leads.delete` — delete leads
- `leads.export` — export leads data

---

## 6. Lead Analytics — `/developer/[slug]/analytics/leads`

This page is fully wired to `/api/leads/analytics`. Verified components on the page:

### Overview Bar
Two highlight tiles (Tracked Messaging, Anonymous Leads) and six KPI cards:
- Total Leads, Conversion Rate, Phone Leads, Message Leads, Appointments, Anonymous Leads.

The Total Leads value uses a **hybrid approach**: it prefers `total_unique_leads + total_anonymous_leads` (aggregate across profile + listings + developments), falling back to profile-specific values if the aggregates aren't populated.

### Modules (rendered in order)
1. **`LeadsTrend`** — Time-series chart of incoming leads, with a date-range picker and CSV/Excel export.
2. **`LeadSourceBreakdown`** — Doughnut + bar visualisation of channel shares; for the `website` channel it further breaks down which surface (listing/development/profile) drove the lead.
3. **`LeadsShare`** — Distribution across profile / listings / developments / messaging using the `leads_breakdown` JSONB on the developer profile.
4. **`ChannelPerformance`** — For each channel (Phone, WhatsApp, Direct Message, Email, Appointment): total leads, closed leads, conversion rate, average lead score, high-value count, high-value percentage. Date-range scoped.
5. **`LeadLifecycle`** — Status distribution doughnut + funnel conversion bar chart for **New → Contacted**, **Contacted → Scheduled**, **Scheduled → Closed**, plus average time to conversion.
6. **`TemporalPatterns`** — Day-of-week and hour-of-day performance bars (total + closed).
7. **`ContextAnalysis`** — Per-context (Listing / Development / Profile) totals, closed counts, conversion rate, and percentage share.
8. **`EngagementAnalysis`** — Three engagement buckets (Single Action / Multi Action (2) / High Engagement (3+)) with conversion-rate comparison.
9. **`PredictiveMetrics`** — Pipeline health doughnut (New, In Progress, Closed, Lost) plus total leads, total closed, overall conversion rate, average lead score.
10. **`ComparativeAnalysis`** — Period-over-period comparison (auto-computes the prior window) with up/down change indicators.
11. **`OperationalEfficiency`** — Average response time, average time to conversion, abandonment rate, cold-lead rate, and a response-time distribution doughnut (Under 1 Hour / Under 24 Hours / Over 24 Hours).

All sub-components handle empty states ("No data available yet") gracefully.

---

## 7. Properties Analytics — `/developer/[slug]/analytics/properties`

Mix of live and template content:

### Live (driven by user profile)
- KPI cards: Total Units, Total Developments, Total Views, Total Impressions, Conversion Rate (calculated as `(total_unique_leads + total_anonymous_leads) / total_views * 100`)
- `StatisticsView`, `ListingsByLocation`, `DevelopmentStats`
- `PropertiesByCategories`, `PropertiesByType`, `PropertiesBySubType` (from JSONB stats fields on the developer profile)
- `PopularListings`, `TopDevelopments`

### Currently a placeholder / template
- A **Property Performance table** (per-property views, favorites, shares, leads, conversion) is in the source but **commented out**.
- A **Monthly Property Views** line chart with hardcoded sample data is in the source but **commented out**.
- A `propertyData` object containing sample listings is defined but unused since the table is commented out.

---

## 8. Profile & Brand Analytics — `/developer/[slug]/analytics/profile`

Live module wired to the developer's analytics data.

- **Summary Cards** — Profile Views, Total Views, Impressions, Appointments
- **Profile Views Chart** — Dual-line chart (Profile Views + Unique Visitors) with a date-range picker
- **CSV / Excel Export** for the profile views series
- **Range presets** — Today, This Week, This Month, This Year, All

---

## 9. Sales — `/developer/[slug]/sales`

Fully wired to `/api/sales/overview` and other sales endpoints. The page renders:

### Overview Cards (live)
- Total Revenue (currency-aware)
- Total Units Sold
- Expected Revenue
- Average Sales Time (in days)
- Leads to Sales (percentage)

### Live Sales Components
- `SoldListings` — list of sold/rented units
- `SalesTrendChart` — revenue / units-sold trend
- `SalesByLocation`
- `SalesByPurpose`, `SalesByType`, `SalesByCategories`, `SalesBySubtype`
- `TopSoldProperties`
- `DevelopmentsBySale`

> **Note:** Sales has its own dedicated page; there is no separate `analytics/sales` page (the analytics overview links to the Sales page directly).

---

## 10. Analytics Overview — `/developer/[slug]/analytics`

The landing page for the Analytics section. Mix of live and template content:

### Live
- KPI cards: Total Views, Total Leads, Total Impressions, Conversion Rate (computed from real profile data)
- Quick-link cards to the five analytics sub-areas: **Overview**, **Property Performance**, **Lead Analytics**, **Profile & Brand**, **Sales Analytics**
- "Performance Overview" line chart with a date-range picker and CSV/Excel export

### Currently sample data
- The change-percentage badges (e.g., `+12.3%`, `+8.7%`) are hardcoded sample numbers (marked `TODO: Calculate from previous period` in code)
- The "Performance Overview" chart's labels (`Week 1` through `Week 4`) and values are sample data
- The "Recent Activity" and "Top Performing Properties" feeds on this page use a hardcoded `analyticsData` array — not yet wired to live data

---

## 11. Other Analytics Sub-Pages (Status: Scaffolded UI Only)

These pages have full UI implementations but their data is currently hardcoded sample data:

- **`/analytics/appointments`** — Appointment Analytics (completion rate, ratings, type breakdown). All values come from a hardcoded `appointmentData` object.
- **`/analytics/messages`** — Messaging Analytics (response rate, response time, message types). All values come from a hardcoded `messagingData` object.
- **`/analytics/market`** — Market Analytics (market share, competitive index, demand index, price index). All values come from a hardcoded `marketData` object.

The UI, charts, and date-range pickers are implemented; only the data plumbing is missing.

---

## 12. Client Management (Mini CRM) — `/developer/[slug]/clientManagement`

Gated by `SubscriptionGate` — requires an active subscription.

### Client Directory
- Client cards with avatar, name, type, address, status, units-purchased count, and assigned-user names
- Search by name / code / email
- Filter by **status** and **source channel**
- Statuses: **Lead, Qualified, Active, Inactive**
- Source channels: **Website, Iskahomes, Inhouse, Social media, Referral, Walk-in, Other**
- Client types: **Individual, Company, Developer, Investor**
- "Add New Client" only visible to admins / super-admins

### Per-Client Detail with Tab Layout — `/clientManagement/[client]/`
Sub-pages routed under the same client:
- **Info** (`info`)
- **Units** (`units`)
- **Transactions** (`transactions`)
- **Service charges** (`service-charges`)
- **Engagement** (`engagement`)
- **Documents** (`documents`)
- **Messaging** (`messaging`)

### Per-Client CRUD Capabilities
- Engagement statuses: **Pending, Completed, Overdue**
- Transaction types: **Deposit, Installment, Full payment, Adjustment**
- Transaction statuses: **Pending, Completed, Failed, Reversed**
- Service charge statuses: **Pending, Paid**
- Documents: upload / list / delete
- Assignments: assign team members to clients with one of these roles — **Executive Manager, Sales Manager, Support, Agent, Coordinator, Other**

### Per-Client Granular Permissions
Each assigned team member can be granted CRUD-style access per section:
- `info` — per-field permissions (`name`, `address`, `emails`, `phone`, `clientType`, `totalUnitsSold`, `firstContactDate`, `secondContactDate`, `sourceUser`, `notes`)
- `units` — none / read / etc.
- `documents` — create, read, update, delete
- `serviceCharges` — create, read, update, delete, **export**
- `transactions` — create, read, update, delete, **export**
- `userAssignment` — create, read, update, delete
- `engagement` — create, read, update, delete
- `messaging` — create, read, update, delete

---

## 13. Service Charges — `/developer/[slug]/serviceCharge`

Subscription-gated page that renders the `TotalServiceCharge` component (organization-wide aggregate). Per-client service charges are managed inside each client's detail page (`clientManagement/[client]/service-charges`). Service charges support a `next_due_date` and `next_due_time` (per the SQL migrations in the repo).

---

## 14. Appointments — `/developer/[slug]/appointments`

Live and wired to `/api/appointments`.

- **Toggle between List view and Calendar view**
- **Filter by status** and search by text
- **Pagination** (10 per page)
- **Status updates** via `PUT /api/appointments` (e.g., approve, decline, mark complete)
- **Event modal** for viewing/creating appointments
- **Latest Appointments** widget on the dashboard

---

## 15. Messaging — `/developer/[slug]/messages`

Two-pane chat UI (`Chats` list + `Conversation` view).

Implemented messaging features (verified from the messaging code):
- Realtime message delivery via Supabase Realtime
- Multiple message types (text, image, file, audio, video, location)
- Read receipts and unread counts per conversation
- Reply-to-message
- Conversation context linked to a listing, development, or unit
- Messages can be sent **from inside the Leads detail view** as well

---

## 16. Team Management — `/developer/[slug]/team` and `/team/roles`

### Members Tab
- List of team members (`TeamMembersList`)
- **Invite Member** modal — captures email, first name, last name, phone, role, and an invitation message; sends via `POST /api/developers/team/members`
- Default role auto-selected from `is_default` flag on roles
- Edit member, remove member, change role
- Permission-gated by `team.invite`, `team.edit`, `team.remove`

### Roles & Permissions Tab
- List of roles (`RolesList`)
- **Create Role** modal (`CreateRoleModal`)
- **Edit Role** modal (`EditRoleModal`)
- **Permissions Editor** (`PermissionsEditor`) — toggle individual permissions per category
- Permission-gated by `team.manage_roles` and `team.manage_permissions`

### Permission Categories Supported
The `rolesAndPermissions.js` module defines these categories for developers:
- `dashboard` (view, export)
- `messages` (view, send)
- `developments` (view, create, edit, delete)
- `units` (view, create, edit, delete, view_analytics, view_leads)
- `appointments` (view, create, edit, delete)
- `leads` (view, view_all, edit, update_status, add_notes, assign, delete, export)
- `clients` (view, create, edit, delete, export)
- `team` (view, invite, edit, remove, manage_roles, assign_roles, manage_permissions)
- `analytics` (view, view_overview, view_properties, view_leads, view_profile_brand, view_appointments, view_messages, view_market, export, configure)
- `sales` (view)
- `profile` (view, edit, manage_branding, manage_settings, manage_locations)
- `subscriptions` (view, upgrade, downgrade, cancel, manage)
- `media` (upload, delete, manage)
- `favorites` (view, add, remove)
- `audit_trail` (view, manage)

The sidebar navigation hides menu items the user doesn't have permission for, and each API route enforces the same permissions on the server.

---

## 17. Audit Trail — `/developer/[slug]/audit-trail`

Live module wired to `/api/audit/events` and `/api/audit/users`.

### Capabilities
- **Filter** by date-from, date-to, and a specific user
- **Pagination** at 15 events per page (load more)
- **CSV / Excel export** of the filtered audit log
- **User-type badges**: Developer, Agency, Agent, Team, Seeker
- **Action-icon inference** based on the event name (created → +, deleted → trash, updated → pencil, otherwise eye)

### Tracked Event Types (per `EVENT_LABELS`)
The audit trail recognises 100+ event types, including (non-exhaustive):
- **Authentication**: signup, signin, signout, email verified, password reset / changed / requested, admin created
- **Listings**: listing created / updated / deleted / viewed / listed / resume checked, listing step saved
- **Developments**: development created / updated / deleted / viewed / listed / searched / stats viewed
- **Units**: unit created / updated / deleted / viewed / listed
- **Leads**: lead created / updated / viewed / listed
- **Clients**: client created / updated / deleted / viewed / listed; client document uploaded / removed / listed; client assignment created / updated / removed / listed
- **Service Charges**: created / updated / deleted / listed
- **Transactions**: created / updated / deleted / listed
- **Appointments**: appointment created / updated / listed / latest viewed
- **Reminders**: reminder created / updated / deleted / viewed / listed
- **Team & Roles**: team invitation sent / accepted, team member updated / removed, team listed
- **Agency / Agents**: agency profile viewed / updated, agent invitation sent / accepted, agent updated / removed
- **Subscriptions**: subscription created / cancelled / listed; request created / updated / viewed / listed; history / invoices viewed; billing viewed / created / updated
- **Messaging**: conversation created / viewed / listed / marked read; message sent / viewed / listed
- **Profile**: developer / agency / agent / seeker profile updated; developer profile viewed / public profile viewed
- **Analytics**: analytics viewed, developer analytics viewed
- **Other**: search performed, upload completed, saved listing added / removed, sales viewed

---

## 18. Profile & Branding — `/developer/[slug]/profile`

Comprehensive profile editor. Verified field set sent to `PUT /api/developers/profile`:

### Company Information
- Name, description, founded year, company size, license number
- Website
- Address, city, region, country, postal code

### Contact Channels (3 of each)
- Primary, secondary, tertiary email
- Primary, secondary, tertiary phone

### Multiple Locations
Each location entry includes: id, place_id, description (e.g., "Main Office"), full address, country, region, city, latitude, longitude, currency, currency name, and a `primary_location: true/false` flag.

### Specializations
Two arrays:
- `database` — specializations chosen from the platform taxonomy (Commercial, Mixed Use, etc.)
- `custom` — developer-defined specializations

### Social Media
- Facebook, Instagram, LinkedIn, TikTok (and the UI also supports WhatsApp and YouTube icons)

### Customer Care Contacts
Array of `{ name, phone }` entries for the developer's customer-care team.

### Company Statistics
Free-form key/value pairs (e.g., `{ label: "Employees", value: "250+" }`).

### Other
- Logo and cover image
- Document uploads
- Profile settings (`ProfileSettings` component) — manages notification preferences and other account settings

---

## 19. Subscriptions & Billing — `/developer/[slug]/subscriptions`

Live, comprehensive subscriptions module that pulls from multiple endpoints in parallel:

### Plans
- Pulls packages from `/api/packages?user_type=developers`
- **Currency toggle** between **GHS** and **USD** (auto-selects based on the developer's primary location's country)
- Per-plan price uses `local_currency_price` (GHS) or `international_currency_price` (USD)
- Total amount is computed using the package's **ideal duration** (the minimum payment period, e.g., 3 months)
- Feature lists per package, with auto-detection of excluded features (`x`, `excluded`, `none`, `n/a`, etc.)

### Subscription State
- Current subscription details (`/api/subscriptions`)
- Add-on subscriptions
- Subscription history (`/api/subscriptions/history`)
- Subscription requests (`/api/subscriptions-requests`)
- Invoices (`/api/subscriptions/invoices`)

### Actions
- Submit a subscription request (admin must approve)
- Cancel subscription with a cancellation-reason modal
- Choose payment method per package: **manual** or **online**

### Billing Information (`/api/billing-information`)
Comprehensive billing form supporting:
- Preferred payment method: `mobile_money` or bank
- Mobile money: provider (e.g., `mtn`), number, account name
- Bank: bank name, account number, account name, branch
- Billing email, phone, address
- "Primary" billing entry support (multiple billing records allowed)

### Subscription Limits & Gates
- `useSubscriptionLimits` hook enforces feature/usage limits on the client
- `subscriptionLimits.js` / `subscriptionLimitsServer.js` mirror the same logic on the server
- `SubscriptionGate` wraps premium features (Client Management, Service Charges) and prompts upgrade if the plan doesn't allow
- Grace-period policy in `subscriptionGracePolicy.js`
- Subscription reminder cron at `/api/cron/subscription-reminders`

---

## 20. Reminders

The `Reminders` component (used inside `LeadsManagement`) shows reminders for the lister, optionally filtered by listing. It pulls from `/api/reminders?user_id=...&user_type=...`. The `LatestReminders` widget surfaces the next 5 reminders on the dashboard.

Reminders are also part of the audit trail (`reminder_created`, `reminder_updated`, `reminder_deleted`).

---

## 21. Reports & Exports

### CSV / Excel Exports
Verified in code:
- Audit trail (CSV / Excel) via `/api/audit/events?export=csv|excel`
- Lead Analytics — Leads Trend chart
- Profile Analytics — Profile Views chart
- Analytics Overview — Performance Overview chart
- Lead detail page also offers export

### PDF Reports
- A `ReportGenerator` component exists in `components/developers/`
- The PDF generation library `pdf-lib` is in dependencies
- A helper module `developerExportDocuments.js` is in `src/lib`
- The component is **imported but currently commented out** on the dashboard, so it is not exposed to users at this time

---

## 22. Notifications

Backend pieces are in place:
- `/api/notifications` route
- `src/lib/notifications/*` (queue, worker, dispatcher, scheduler, records, preferences, constants) using BullMQ
- Email via SendGrid + Resend (`@sendgrid/mail`, `resend`)
- SMS via Twilio (`/api/sms` route)
- In-app toast feedback via `react-toastify`

The dashboard imports a `Notifications` panel but it is currently commented out, so the in-app feed is not surfaced on the dashboard at this time. Toasts are used throughout the app for action feedback.

---

## 23. Pages Currently Scaffolded / Under Construction

Honest list of routes that exist but aren't fully built:

- **`/developer/[slug]`** (root) — placeholder text and a single "Quick Stats" card. The real dashboard lives at `/developer/[slug]/dashboard`.
- **`/developer/[slug]/favorites`** — single line of placeholder text (`"this is our favorites page"`).
- **`/developer/[slug]/agents`** — single line of placeholder text (`"this is our agents page"`).
- **`/developer/[slug]/analytics/appointments`** — full UI but data is hardcoded sample data.
- **`/developer/[slug]/analytics/messages`** — full UI but data is hardcoded sample data.
- **`/developer/[slug]/analytics/market`** — full UI but data is hardcoded sample data.
- **Analytics Overview** change-percentage badges and Recent Activity / Top Properties feeds — sample data.
- **Properties Analytics** — KPIs and breakdown widgets are live; the per-property detail table and monthly views chart are commented out in source.

---

## 24. Sidebar Navigation (Permission-Aware)

Order rendered by `DeveloperNav.jsx`:

| Menu Item | Route | Permission Required |
|---|---|---|
| Dashboard | `/dashboard` | `dashboard` |
| Messages | `/messages` | `messages` |
| Leads | `/leads` | `leads` |
| Clients | `/clientManagement` | `clients` |
| Service Charges | `/serviceCharge` | `clients` |
| Developments | `/developments` | `developments` |
| Units | `/units` | `units` |
| Appointments | `/appointments` | `appointments` |
| Team | `/team` | `team` |
| Sales | `/sales` | `sales` |
| Audit Trail | `/audit-trail` | `audit_trail` |
| Analytics ▸ Properties | `/analytics/properties` | `analytics.view_properties` |
| Analytics ▸ Leads | `/analytics/leads` | `analytics.view_leads` |
| Analytics ▸ Profile & Brand | `/analytics/profile` | `analytics.view_profile_brand` |
| Profile | `/profile` | `profile` |
| Subscriptions | `/subscriptions` | `subscriptions` |
| Logout | — | always shown |

The Analytics submenu only appears if the user has at least one of its sub-permissions. Agents bypass permission checks (no permissions system for agents). Developers, agencies, and team members are all permission-gated.

> **Note:** The sidebar's Analytics submenu currently exposes only Properties, Leads, and Profile & Brand. The Appointments / Messages / Market analytics pages exist but are not linked from the sidebar.

---

## 25. Cross-Cutting Capabilities

- **Cached taxonomy data** (purposes, types, categories, sub-types) via `useCachedData` and `useStaticData` hooks.
- **Infinite scroll** on long lists (`useInfiniteScroll`).
- **Subscription limit checks** via `useSubscriptionLimits`.
- **Cache invalidation** via `useCacheInvalidation`.
- **API error handling** via `useApiErrorHandler`.
- **Auth state** centralised in `AuthContext` — handles developer / agency / agent / property-seeker tokens, team-member resolution, and developer-id mapping.
- **Currency conversion** — server-side processing on listing writes (`processCurrencyConversions` in `listingsStepHandler.js`).
- **Slugs** — server-side slug generation for listings.

---

*This document reflects the state of the developer area in the codebase. Sections marked "scaffolded" or "sample data" are pages with completed UI implementations whose data plumbing is still in progress.*
