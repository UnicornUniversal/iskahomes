# 🏢 Iska Homes - Agency Dashboard Summary

## 📋 Overview

The Agency Dashboard is designed for real estate agencies to manage their property listings, clients (homeowners), appointments, leads, and performance analytics. It shares many components with the Developer Dashboard but is tailored for agency-specific workflows.

---

## 🎯 Agency Dashboard Features

### **1. Dashboard Overview**
- **Key Metrics Cards:**
  - Total Listings (Properties)
  - Total Views
  - Total Impressions
  - Total Leads
  - Active Homeowners (Clients)
  - Total Appointments
  - Revenue/Commission Tracking
  - Average Response Time

- **Quick Stats:**
  - Recent Messages (unread count)
  - Upcoming Appointments (next 7 days)
  - Pending Reviews
  - New Leads (last 24 hours)

### **2. Property Listings Management**
- Create, edit, and manage property listings
- Multi-step property creation wizard
- Property status management (draft, active, archived, sold, rented)
- Media uploads (images, videos, 3D models)
- Property analytics per listing
- Bulk operations (archive, delete, status change)

### **3. Agents Management** 👥
- Add and manage agents within the agency
- Agent profiles and permissions
- Agent performance tracking
- Agent assignment to listings
- Agent search and filtering

### **4. Appointments Management**
- Calendar view (monthly, weekly, daily)
- List view with filters
- Appointment scheduling with clients
- Approval/rejection workflow
- Appointment reminders
- Time slot management
- Appointment history

### **5. Messages & Conversations**
- Real-time messaging system
- Conversation threads linked to properties
- Multiple message types (text, images, files, audio, video, location)
- Read receipts and timestamps
- Unread message indicators
- Quick reply templates

### **6. Leads Management**
- Lead capture from property views
- Lead scoring (High/Medium/Base)
- Lead status workflow: New → Contacted → Qualified → Converted/Lost
- Lead actions tracking (phone, message, email, appointment)
- Lead notes and history
- Lead assignment
- Export functionality

### **7. Analytics & Performance**
- **Property Analytics:**
  - Views per property
  - Impressions tracking
  - Lead conversion rates
  - Popular listings carousel
  
- **Lead Analytics:**
  - Lead trends over time
  - Lead sources analysis
  - Conversion funnel
  - Channel performance
  
- **Profile Analytics:**
  - Profile views
  - Brand visibility
  - Engagement metrics
  
- **Sales/Commission Analytics:**
  - Revenue tracking
  - Commission calculations
  - Sales trends
  - Top performing properties

### **8. Favorites Tracking**
- Properties saved by users
- User engagement insights
- Potential lead identification

### **9. Profile Management**
- Agency profile information
- Logo and branding
- Contact details
- Social media links
- Bio and description
- Service areas

### **10. Subscriptions**
- View current subscription plan
- Subscription history
- Upgrade/downgrade options
- Billing information

---

## 🔄 Reusable Components from Developer Dashboard

### **✅ Directly Reusable Components**

#### **1. Navigation & Layout**
- **`DeveloperNav.jsx`** → **`AgencyNav.jsx`** (modified)
  - Same structure, different menu items
  - Collapsible sidebar
  - Mobile responsive
  - Active route highlighting

#### **2. Dashboard Cards**
- **`DataCard.jsx`** ✅ **Fully Reusable**
  - Metric display cards
  - Icon support
  - Link navigation
  - Used for: Total Listings, Views, Impressions, Leads, etc.

#### **3. Statistics & Analytics**
- **`StatisticsView.jsx`** ✅ **Fully Reusable**
  - Interactive line charts
  - Date range picker
  - Period selection (Today, Week, Month, Year)
  - Views and impressions tracking

- **`PropertiesByCategories.jsx`** ✅ **Fully Reusable**
  - Property breakdown by category
  - Visual charts

- **`PropertiesByType.jsx`** ✅ **Fully Reusable**
  - Property breakdown by type
  - Visual charts

- **`PropertiesBySubType.jsx`** ✅ **Fully Reusable**
  - Property breakdown by sub-type
  - Visual charts

- **`PopularListings.jsx`** ✅ **Fully Reusable**
  - Top performing listings carousel
  - View count and ranking

#### **4. Leads Management**
- **`LeadsManagement.jsx`** ✅ **Fully Reusable**
  - Lead list with filters
  - Lead scoring display
  - Status management
  - Notes and reminders
  - Export functionality
  - Action tracking

- **`LatestLeads.jsx`** ✅ **Fully Reusable**
  - Recent leads widget
  - Quick overview

- **`LeadsTrend.jsx`** ✅ **Fully Reusable**
  - Lead trends over time
  - Time series charts

- **`ChannelPerformance.jsx`** ✅ **Fully Reusable**
  - Lead source analysis
  - Channel comparison

- **`LeadLifecycle.jsx`** ✅ **Fully Reusable**
  - Lead conversion funnel
  - Stage analysis

#### **5. Appointments**
- **`LatestAppointments.jsx`** ✅ **Fully Reusable**
  - Recent appointments widget
  - Quick overview
  - Client contact info

- **`ListingAppointments.jsx`** ✅ **Fully Reusable**
  - Appointment calendar
  - List view
  - Approval workflow

#### **6. Messages**
- **`RecentMessages.jsx`** ✅ **Fully Reusable**
  - Unread message previews
  - Quick navigation

- **`Conversation.jsx`** ✅ **Fully Reusable**
  - Full conversation view
  - Message types support

- **`Chats.jsx`** ✅ **Fully Reusable**
  - Conversation list
  - Search and filter

#### **7. Reminders**
- **`LatestReminders.jsx`** ✅ **Fully Reusable**
  - Recent reminders widget
  - Quick actions

- **`Reminders.jsx`** ✅ **Fully Reusable**
  - Full reminders management
  - Create, edit, delete

#### **8. Sales & Revenue**
- **`RecentSales.jsx`** ✅ **Fully Reusable**
  - Recent sales/transactions
  - Revenue tracking

- **`SalesTrendChart.jsx`** ✅ **Fully Reusable**
  - Sales trends visualization
  - Revenue charts

#### **9. General Components**
- **`Notifications.jsx`** ✅ **Fully Reusable**
  - In-app notifications
  - Toast notifications

- **`SimpleServices.jsx`** ✅ **Fully Reusable**
  - Service links/widget

- **`date-range-picker.jsx`** ✅ **Fully Reusable**
  - Date range selection
  - Used in analytics

- **`export-dropdown.jsx`** ✅ **Fully Reusable**
  - Export to CSV/Excel
  - Data export functionality

#### **10. Property Management**
- **`PropertyManagementWizard.jsx`** ✅ **Fully Reusable**
  - Multi-step property creation
  - All property fields
  - Media uploads

- **`ListingCard.jsx`** ✅ **Fully Reusable**
  - Property card display
  - Used in listings pages

- **`AllUnits.jsx`** → **`AllListings.jsx`** (modified)
  - List of all properties
  - Filters and search
  - Pagination

---

### **🔄 Components Requiring Modification**

#### **1. Navigation**
- **`DeveloperNav.jsx`** → **`AgencyNav.jsx`**
  - Change menu items:
    - Dashboard ✅
    - Properties (instead of Units/Developments)
    - Homeowners (new)
    - Appointments ✅
    - Messages ✅
    - Leads ✅
    - Favorites (new)
    - Reviews (new)
    - Analytics (with submenu) ✅
    - Profile ✅
    - Subscriptions ✅
  - Update routes from `/developer/[slug]` to `/agency/[slug]`

#### **2. Dashboard Page**
- **`developer/[slug]/dashboard/page.jsx`** → **`agency/[slug]/dashboard/page.jsx`**
  - Change metrics:
    - Total Units → Total Listings
    - Total Developments → Active Homeowners
    - Keep: Views, Impressions, Revenue
  - Add: Reviews widget, Favorites widget
  - Remove: Developments-related widgets

#### **3. Analytics Pages**
- **`analytics/properties/page.jsx`** ✅ **Fully Reusable**
- **`analytics/leads/page.jsx`** ✅ **Fully Reusable**
- **`analytics/sales/page.jsx`** ✅ **Fully Reusable**
- **`analytics/profile/page.jsx`** ✅ **Fully Reusable**
  - Just update routes and API calls to use `agent_id` instead of `developer_id`

---

### **🆕 New Components Needed**

#### **1. Agents Management**
- **`AgentsList.jsx`** (new)
  - List of all agents in the agency
  - Search and filters
  - Agent cards with performance metrics

- **`AgentCard.jsx`** (new)
  - Individual agent display
  - Contact information
  - Listings count
  - Performance metrics
  - Quick actions

- **`AgentProfile.jsx`** (new)
  - Full agent profile page
  - Listings assigned
  - Performance analytics
  - Permissions management

#### **2. Favorites Tracking**
- **`FavoritesList.jsx`** (new)
  - Properties saved by users
  - User information
  - Potential lead identification

- **`FavoriteCard.jsx`** (new)
  - Property + user info
  - Quick contact actions

#### **4. Agency-Specific Analytics**
- **`AgentsAnalytics.jsx`** (new)
  - Agent performance comparison
  - Top performing agents
  - Agent growth trends
  - Agent engagement metrics

---

## 📁 Proposed File Structure

```
src/app/agency/[slug]/
├── layout.jsx                    # Agency layout with AgencyNav
├── page.jsx                      # Agency profile/public page
├── dashboard/
│   └── page.jsx                  # Dashboard overview
├── properties/
│   ├── page.jsx                  # All properties list
│   ├── new/
│   │   └── page.jsx              # Create new property
│   └── [propertySlug]/
│       ├── page.jsx              # Property details/edit
│       ├── analytics/
│       │   └── page.jsx          # Property analytics
│       └── leads/
│           └── page.jsx          # Property leads
├── agents/
│   ├── page.jsx                  # All agents list
│   └── [agentId]/
│       └── page.jsx              # Agent profile
├── appointments/
│   └── page.jsx                  # Appointments calendar/list
├── messages/
│   └── page.jsx                  # Messages/conversations
├── leads/
│   └── page.jsx                  # All leads management
├── favorites/
│   └── page.jsx                  # Favorites tracking
├── analytics/
│   ├── page.jsx                  # Analytics overview
│   ├── properties/
│   │   └── page.jsx              # Property analytics
│   ├── leads/
│   │   └── page.jsx              # Lead analytics
│   ├── sales/
│   │   └── page.jsx              # Sales/commission analytics
│   ├── profile/
│   │   └── page.jsx              # Profile analytics
│   └── agents/
│       └── page.jsx              # Agents analytics (new)
├── profile/
│   └── page.jsx                  # Agency profile settings
└── subscriptions/
    └── page.jsx                  # Subscription management

src/app/components/agencies/
├── AgencyNav.jsx                 # Agency navigation (modified from DeveloperNav)
├── DataCard.jsx                  # ✅ Reused from developers
├── LatestAppointments.jsx        # ✅ Reused from developers
├── RecentMessages.jsx           # ✅ Reused from developers
├── LatestLeads.jsx              # ✅ Reused from developers
├── LatestReminders.jsx          # ✅ Reused from developers
├── AgentsList.jsx               # 🆕 New
├── AgentCard.jsx                # 🆕 New
└── FavoritesList.jsx            # 🆕 New

src/app/components/analytics/     # ✅ All reusable
├── LeadsManagement.jsx
├── LeadsTrend.jsx
├── ChannelPerformance.jsx
├── LeadLifecycle.jsx
├── StatisticsView.jsx
├── PropertiesByCategories.jsx
├── PropertiesByType.jsx
├── PropertiesBySubType.jsx
├── PopularListings.jsx
├── RecentSales.jsx
└── ... (all other analytics components)

src/app/components/propertyManagement/  # ✅ All reusable
├── PropertyManagementWizard.jsx
├── modules/
│   ├── PropertyLocation.jsx
│   ├── PropertyCategories.jsx
│   └── ...
└── ...

src/app/components/messages/      # ✅ All reusable
├── Conversation.jsx
├── Chats.jsx
└── ...

src/app/components/general/       # ✅ All reusable
├── Notifications.jsx
├── SimpleServices.jsx
└── ...
```

---

## 🔑 Key Differences: Agency vs Developer

| Feature | Developer | Agency |
|---------|-----------|--------|
| **Primary Focus** | Units & Developments | Properties & Agents |
| **Management** | Units, Developments, Team | Properties, Agents, Team |
| **Analytics** | Development-focused | Agent & listing-focused |
| **Revenue** | Sales from units | Commissions from sales |
| **Team** | Multi-user with roles | Agents (separate table) + team members |
| **Listings** | Units within developments | Individual properties |
| **Sub-entities** | Team members | Agents (can add/manage) |
| **Aggregation** | Direct ownership | Aggregated from agents |

---

## 🎨 Component Reuse Summary

### **100% Reusable (No Changes Needed):**
- ✅ All analytics components
- ✅ All messaging components
- ✅ All appointment components
- ✅ All leads management components
- ✅ All reminders components
- ✅ All sales/revenue components
- ✅ Property management wizard
- ✅ DataCard
- ✅ General utilities (date picker, export, etc.)

### **Requires Modification:**
- 🔄 Navigation (menu items and routes)
- 🔄 Dashboard page (metrics and widgets)
- 🔄 API calls (use `agent_id` instead of `developer_id`)

### **New Components Needed:**
- 🆕 Agents management (3-4 components)
- 🆕 Favorites tracking (2 components)
- 🆕 Agents analytics (1 component)

---

## 📊 Estimated Component Breakdown

- **Total Components Needed:** ~40-45
- **Fully Reusable:** ~35-40 (80-85%)
- **Requires Modification:** ~5 (10%)
- **New Components:** ~5-8 (10-15%)

---

## 🚀 Implementation Priority

### **Phase 1: Core Dashboard**
1. AgencyNav (modified from DeveloperNav)
2. Dashboard page with metrics
3. Basic routing structure

### **Phase 2: Property Management**
1. Properties list page
2. Property creation/edit (reuse wizard)
3. Property analytics

### **Phase 3: Agents Management**
1. Agents list
2. Agent profiles
3. Agent permissions
4. Agents analytics

### **Phase 4: Communication**
1. Messages (reuse)
2. Appointments (reuse)
3. Leads (reuse)

### **Phase 5: Analytics**
1. All analytics pages (reuse with route updates)
2. Custom agency analytics

### **Phase 6: Additional Features**
1. Favorites tracking
2. Subscriptions

---

This structure maximizes code reuse while providing agency-specific functionality. The majority of components can be reused directly, with only navigation, routing, and a few new components needed for agency-specific features.

