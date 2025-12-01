# Iska Homes - Comprehensive Project Description

## 📋 Project Overview

**Iska Homes** is a comprehensive real estate platform that connects property seekers, developers, and agents in a unified marketplace. The platform enables property listings, developments management, lead generation, analytics, messaging, and subscription-based services. It's built as a modern, full-stack web application using Next.js 16 with React 19, Supabase for backend services, and PostHog for analytics.

### Core Purpose
- **For Property Seekers**: Browse, search, save, and contact property owners/agents
- **For Developers**: Create developments, list units, manage projects, track analytics
- **For Agents**: List properties, manage clients, track leads and commissions
- **For Admins**: Manage users, subscriptions, categories, and platform analytics

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 16.0.1 (App Router)
- **React**: 19.0.0
- **Styling**: Tailwind CSS 4.0
- **UI Components**: 
  - Radix UI (Avatar, Scroll Area, Separator, Slot)
  - Lucide React (Icons)
  - Custom UI components
- **Animations**: Framer Motion 12.22.0
- **Maps**: 
  - Google Maps (via @googlemaps/react-wrapper)
  - Leaflet & React Leaflet
- **3D Rendering**: Three.js with @react-three/fiber and @react-three/drei
- **Calendar**: @schedule-x/calendar, react-big-calendar
- **Charts**: Chart.js with react-chartjs-2
- **Notifications**: react-toastify
- **Social Sharing**: react-share
- **Carousel**: Swiper

### Backend & Database
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (for images, videos, 3D models, documents)
- **Real-time**: Supabase Realtime (for messaging)
- **Email**: SendGrid (@sendgrid/mail)
- **Caching**: Redis (optional, can use direct DB queries)

### Analytics & Monitoring
- **Analytics**: PostHog (posthog-js)
- **Event Tracking**: Custom analytics system with PostHog integration
- **Cron Jobs**: Custom cron scheduler for analytics aggregation

### Additional Libraries
- **JWT**: jsonwebtoken (for custom token handling)
- **Password Hashing**: bcryptjs
- **Currency**: country-to-currency
- **Utilities**: clsx, tailwind-merge, class-variance-authority

---

## 🏗️ Architecture Overview

### Application Structure
```
iska-home/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── admin/              # Admin dashboard & management
│   │   ├── agents/             # Agent dashboard & features
│   │   ├── allAgents/          # Public agent listings
│   │   ├── allDevelopers/      # Public developer listings
│   │   ├── allDevelopments/    # Public development listings
│   │   ├── api/                # API routes (Next.js API routes)
│   │   ├── components/         # React components
│   │   ├── developer/          # Developer dashboard & features
│   │   ├── exploreProperties/  # Property search & browse
│   │   ├── homeowner/          # Homeowner features
│   │   ├── property/           # Property detail pages
│   │   ├── propertySeeker/     # Property seeker dashboard
│   │   └── [auth pages]/       # Signin, signup, forgot-password, etc.
│   ├── contexts/               # React contexts (AuthContext)
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility libraries & helpers
│   └── middleware.js           # Next.js middleware for route protection
├── public/                     # Static assets
└── [SQL files]                 # Database migration scripts
```

### API Architecture
The application uses Next.js API routes organized by feature:
- `/api/auth/*` - Authentication endpoints
- `/api/listings/*` - Property/unit listing management
- `/api/developments/*` - Development management
- `/api/analytics/*` - Analytics data endpoints
- `/api/messages/*` - Messaging system
- `/api/conversations/*` - Conversation management
- `/api/leads/*` - Lead tracking
- `/api/subscriptions/*` - Subscription management
- `/api/admin/*` - Admin operations
- `/api/cron/*` - Scheduled job endpoints
- `/api/public/*` - Public-facing endpoints

---

## 🎯 Key Features

### 1. User Management & Authentication

#### User Types
- **Property Seekers** (`property_seeker`): Browse properties, save favorites, book appointments
- **Developers** (`developer`): Create developments, list units, manage projects
- **Agents** (`agent`): List properties, manage clients, track leads
- **Admins** (`admin`): Platform management, user administration

#### Authentication Features
- Email/password authentication via Supabase Auth
- Email verification with SendGrid
- Password reset functionality
- JWT-based session management
- One email = one account type policy (strict)
- Protected routes via middleware
- Role-based access control

### 2. Property & Development Listings

#### Listing Types
- **Properties**: Individual properties listed by agents
- **Units**: Units within developments (developer listings)
- **Developments**: Complete development projects with multiple units

#### Listing Features
- **Draft-First Approach**: All listings created as drafts, then published
- **Resume Functionality**: Users can resume incomplete listings
- **Multi-Step Creation**: Step-based listing creation process
- **Rich Media Support**:
  - Image galleries with albums
  - Video uploads
  - YouTube integration
  - Virtual tour URLs
  - 3D models (for developers)
  - Additional documents (PDFs, etc.)
- **Comprehensive Details**:
  - Property specifications (bedrooms, bathrooms, size, etc.)
  - Location with GPS coordinates
  - Amenities (database, general, custom)
  - Social amenities (nearby facilities)
  - Pricing with currency conversion
  - Availability dates
  - Status tracking (draft, active, archived, sold, rented)
- **SEO Optimization**: Meta tags, descriptions, keywords, slugs
- **Search & Filter**: Advanced search with multiple filters
- **Featured Listings**: Premium/featured property highlighting

### 3. Development Management

#### Development Features
- Create and manage development projects
- Add multiple units to developments
- Development profiles with company information
- Location management with multiple company locations
- Development statistics and analytics
- Unit management within developments
- Development-specific pricing and availability

### 4. Messaging System

#### Real-Time Messaging
- One-to-one conversations between users
- Support for all user types (seekers, developers, agents, admins)
- Real-time message delivery via Supabase Realtime
- Message types: text, images, files, audio, video, location
- Read receipts and unread counts
- Conversation context (linked to listings/developments/units)
- Message status tracking (read, unread, edited, deleted)
- Reply-to-message functionality

#### Conversation Management
- Conversation list with previews
- Unread message counts per user
- Conversation status (active, archived, closed)
- Last message preview
- Conversation search and filtering

### 5. Analytics & Reporting

#### Analytics System
- **PostHog Integration**: Event tracking and analytics
- **Custom Analytics Tables**:
  - `listing_analytics`: Daily aggregated metrics per listing
  - `user_analytics`: Daily aggregated metrics per user
  - `development_analytics`: Daily aggregated metrics per development
  - `admin_analytics`: Platform-wide aggregated metrics
  - `leads`: Individual lead records with action tracking

#### Tracked Events
- Property views (with source tracking: home, explore, search, direct)
- Development views
- Profile views
- Lead actions (phone, message, email, appointment, website)
- Impressions (social media, website visits, shares, saved listings)
- Listing creation/updates/deletions
- User authentication events
- Search events

#### Analytics Metrics
- Views (total, unique, logged-in, anonymous)
- Leads (by method: phone, message, email, appointment)
- Conversion rates (view-to-lead, lead-to-sale)
- Impressions and engagement
- Sales tracking and revenue
- User behavior analytics
- Period-over-period comparisons
- Top performing properties/developments

#### Cron-Based Aggregation
- Hourly cron job for analytics aggregation
- Fetches events from PostHog API
- Aggregates data in-memory
- Writes to database tables
- Handles missing events and data consistency

### 6. Lead Management

#### Lead Tracking
- Automatic lead capture from user interactions
- Lead actions tracking (phone clicks, message clicks, etc.)
- Lead status management (new, contacted, qualified, converted, lost)
- Lead notes and history
- Lead source tracking
- Unique lead identification
- Lead trends and analytics

### 7. Subscription Management

#### Subscription Features
- Subscription packages with different tiers
- Package features and limits
- Subscription requests and approvals
- Subscription history tracking
- Billing information management
- Subscription status tracking (active, cancelled, expired)
- Paid status tracking
- Ideal duration and user type matching

### 8. Search & Discovery

#### Search Features
- Advanced property search with filters:
  - Property type, category, purpose
  - Location (country, state, city, neighborhood)
  - Price range
  - Size (bedrooms, bathrooms, area)
  - Amenities
  - Availability dates
- Development search
- Agent/developer profile search
- Saved searches
- Search result pagination
- Infinite scroll support

### 9. User Dashboards

#### Developer Dashboard
- Property/unit management
- Development management
- Analytics overview
- Lead management
- Subscription management
- Profile management
- Revenue tracking

#### Agent Dashboard
- Property listings management
- Client management (homeowners)
- Appointments calendar
- Messages and conversations
- Reviews management
- Favorites tracking
- Lead tracking

#### Property Seeker Dashboard
- Saved properties
- Appointment bookings
- Message history
- Search history
- Profile management
- Preferences

#### Admin Dashboard
- User management (developers, agents, seekers)
- Subscription management
- Package management
- Category management (property types, purposes, statuses, amenities)
- Platform analytics
- Billing information
- Subscription requests approval

### 10. Additional Features

#### Social Features
- Save/favorite properties
- Share properties (social media, email, link)
- Social amenities integration (nearby facilities)
- Reviews and ratings (for agents)

#### Appointments
- Schedule property tours
- Appointment calendar
- Appointment reminders
- Appointment management

#### Notifications
- Email notifications (via SendGrid)
- In-app notifications
- Toast notifications

#### File Management
- Image uploads to Supabase Storage
- Video uploads
- Document uploads
- 3D model uploads
- File organization in albums

---

## 🗄️ Database Schema

### Core Tables

#### Users & Authentication
- `developers`: Developer profiles and company information
- `agents`: Agent profiles and credentials
- `property_seekers`: Property seeker profiles
- `admins`: Admin user accounts

#### Listings
- `listings`: Main listings table (properties and units)
  - Supports both developer units and agent properties
  - JSONB fields for flexible data (amenities, specifications, media)
  - Status tracking (draft, active, archived, sold, rented)
  - SEO fields (slug, meta tags)
  - Location with GPS coordinates
  - Pricing with currency support

#### Developments
- `developments`: Development project information
- `units`: Units within developments (separate from listings for developers)

#### Messaging
- `conversations`: One-to-one conversation records
  - User pairs (user1_id, user1_type, user2_id, user2_type)
  - Unread counts per user
  - Last message tracking
  - Context linking (listing_id, development_id, unit_id)
- `messages`: Individual messages within conversations
  - Sender/receiver information
  - Message content and type
  - Read status
  - Attachments (JSONB array)
  - Reply-to functionality

#### Analytics
- `listing_analytics`: Daily aggregated metrics per listing
  - Views (total, unique, by source)
  - Leads (by method)
  - Impressions
  - Sales data
  - Conversion rates
- `user_analytics`: Daily aggregated metrics per user
  - Profile views
  - Listing statistics
  - Lead generation
  - Revenue tracking
- `development_analytics`: Daily aggregated metrics per development
- `admin_analytics`: Platform-wide aggregated metrics
- `leads`: Individual lead records
  - Lead actions (JSONB array)
  - Status tracking
  - Notes

#### Subscriptions
- `subscriptions_package`: Available subscription packages
- `subscriptions`: User subscriptions
- `subscriptions_request`: Subscription requests
- `subscription_history`: Subscription history

#### Categories & Taxonomy
- `property_types`: Property type categories
- `property_categories`: Property category classifications
- `property_purposes`: Property purpose (buy, rent, etc.)
- `property_subtypes`: Property subtype classifications
- `property_statuses`: Property status options
- `property_amenities`: Amenity database

#### Other Tables
- `social_amenities`: Nearby facilities and amenities
- `saved_listings`: User saved/favorite properties
- `appointments`: Property tour appointments
- `reminders`: User reminders
- `sales_listings`: Sales transaction records

### Database Features
- UUID primary keys
- JSONB for flexible schema fields
- Foreign key relationships
- Timestamps (created_at, updated_at)
- Soft deletes where applicable
- Indexes for performance
- Constraints for data integrity

---

## 🔐 Authentication & Authorization

### Authentication Flow
1. User signs up with email/password and user type
2. Supabase Auth creates user account
3. User profile created in respective table (developers/agents/property_seekers)
4. Email verification sent via SendGrid
5. User verifies email
6. JWT token stored in cookies
7. AuthContext provides user state throughout app

### Authorization
- Route protection via Next.js middleware
- Role-based access control
- User type validation
- One email = one account type policy
- Token verification on protected routes

### Security Features
- Password hashing with bcryptjs
- JWT token management
- Service role key protection (server-side only)
- Environment variable security
- Supabase Row Level Security (RLS) policies

---

## 📊 Analytics Implementation

### Event Tracking
Events are tracked client-side using PostHog:
- `property_view`: Property listing views
- `development_view`: Development page views
- `profile_view`: User profile views
- `lead_phone`: Phone number clicks
- `lead_message`: Message button clicks
- `lead_appointment`: Appointment bookings
- `impression_social_media`: Social media clicks
- `impression_website_visit`: Website visits
- `impression_share`: Share actions
- `impression_saved_listing`: Save/favorite actions
- `listing_created`, `listing_updated`, `listing_deleted`
- `user_logged_in`, `user_logged_out`
- `property_search`

### Analytics Aggregation
- **Cron Job**: Runs hourly via `/api/cron/analytics`
- **Process**:
  1. Fetches events from PostHog API for the previous hour
  2. Aggregates events in-memory (counts, unique counts, grouping)
  3. Calculates derived metrics (conversion rates, etc.)
  4. Writes aggregated data to database tables
  5. Handles missing events and data consistency

### Analytics Data Structure
- **Time Dimensions**: date, week, month, quarter, year
- **User Dimensions**: user_id, user_type, listing_id, development_id
- **Metrics**: views, leads, impressions, sales, revenue, conversion rates
- **Breakdowns**: by source, by method, by location, etc.

---

## 🔄 Key Workflows

### Listing Creation Workflow
1. User clicks "Add New Property/Unit"
2. System checks for incomplete drafts
3. If draft exists, offer to resume or start fresh
4. Multi-step form:
   - Basic information
   - Location details
   - Specifications
   - Amenities
   - Pricing
   - Media uploads
   - Additional details
5. Each step saves to draft
6. On completion, listing marked as active
7. Analytics events tracked

### Lead Generation Workflow
1. User views property/development
2. User clicks contact method (phone, message, etc.)
3. Event tracked in PostHog
4. Lead record created/updated in database
5. Lister notified (via dashboard)
6. Lead appears in analytics

### Messaging Workflow
1. User initiates conversation from listing/development
2. System finds or creates conversation
3. Messages sent via API
4. Real-time updates via Supabase Realtime
5. Unread counts updated
6. Read receipts tracked

### Subscription Workflow
1. User browses subscription packages
2. User requests subscription
3. Admin reviews and approves
4. Subscription activated
5. Features unlocked
6. Billing tracked

---

## 🎨 UI/UX Features

### Design System
- Tailwind CSS for styling
- Custom color scheme
- Responsive design (mobile-first)
- Modern UI components
- Smooth animations with Framer Motion
- Loading states and skeletons
- Error handling and user feedback

### Key UI Components
- Property cards with image galleries
- Search filters and results
- Dashboard layouts
- Analytics charts and graphs
- Calendar components
- Map integrations
- Modal dialogs
- Toast notifications
- Form components

---

## 🔌 Integrations

### Supabase
- Database (PostgreSQL)
- Authentication
- Storage (file uploads)
- Real-time subscriptions

### SendGrid
- Email verification
- Password reset emails
- Transactional emails

### PostHog
- Event tracking
- User analytics
- Product analytics

### Google Maps
- Location search
- Map displays
- Geocoding

### Redis (Optional)
- Caching layer
- Session storage
- Can be replaced with direct DB queries

---

## 📁 File Structure Details

### API Routes (`src/app/api/`)
- **auth/**: Authentication endpoints (signup, signin, signout, verify-email, forgot-password, reset-password, create-admin)
- **listings/**: Listing CRUD operations, search, analytics, step-based creation
- **developments/**: Development management, search, stats
- **analytics/**: Analytics data endpoints (overview, properties, leads, statistics)
- **messages/**: Message sending and retrieval
- **conversations/**: Conversation management, read status
- **leads/**: Lead tracking and trends
- **subscriptions/**: Subscription management
- **admin/**: Admin operations (users, packages, categories)
- **cron/**: Scheduled jobs (analytics aggregation, cleanup)
- **public/**: Public-facing endpoints (developments, developers, listings)
- **upload/**: File upload handling
- **appointments/**: Appointment management
- **reminders/**: Reminder management

### Components (`src/app/components/`)
- **admin/**: Admin dashboard components
- **agents/**: Agent-specific components
- **analytics/**: Analytics charts and displays
- **developers/**: Developer dashboard components
- **Listing/**: Property listing components
- **messages/**: Messaging UI components
- **ui/**: Reusable UI components
- **Filters/**: Search filter components
- **shared/**: Shared components

### Libraries (`src/lib/`)
- **supabase.js**: Supabase client configuration
- **auth.js**: Authentication helpers
- **database.js**: Database operation helpers
- **posthog.js**: PostHog analytics integration
- **posthogCron.js**: PostHog cron job logic
- **analyticsBatcher.js**: Analytics event batching
- **cache.js**: Caching utilities
- **fileUpload.js**: File upload handling
- **sendgrid.js**: Email sending
- **jwt.js**: JWT token management
- **currencyConversion.js**: Currency utilities
- **utils.js**: General utilities

### Hooks (`src/hooks/`)
- **useAuth.js**: Authentication hook
- **useAnalytics.js**: Analytics tracking hook
- **useCachedData.js**: Data caching hook
- **useStaticData.js**: Static data management
- **useInfiniteScroll.js**: Infinite scroll functionality

---

## 🚀 Environment Setup

### Required Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# SendGrid
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=verified_email@domain.com
SENDGRID_FROM_NAME=Iska Homes

# Frontend
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
FRONTEND_LINK=http://localhost:3000

# Google Maps (optional)
NEXT_PUBLIC_GOOGLE_MAPS_API=your_google_maps_key

# PostHog (optional)
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Redis (optional)
REDIS_URL=your_redis_url
```

### Setup Steps
1. Clone repository
2. Install dependencies: `npm install`
3. Create `.env.local` with required variables
4. Set up Supabase project and run SQL migrations
5. Configure SendGrid account
6. Run development server: `npm run dev`

---

## 🔧 Development Workflow

### Code Organization
- **App Router**: Next.js 16 App Router for routing
- **Server Components**: Default, use 'use client' when needed
- **API Routes**: Next.js API routes for backend logic
- **Components**: React components with proper separation of concerns
- **TypeScript Types**: Type definitions in separate files (UnitTypes.ts, DevelopmentTypes.ts)

### Key Patterns
- **Draft-First**: Listings created as drafts first
- **Step-Based Forms**: Multi-step form handling
- **Event-Driven Analytics**: PostHog event tracking
- **Real-Time Updates**: Supabase Realtime for messaging
- **Caching**: Redis or direct DB queries for performance
- **Error Handling**: Comprehensive error handling and user feedback

### Database Migrations
- SQL files in root directory
- Run migrations in Supabase SQL editor
- Migration files named descriptively
- Includes table creation, alterations, and data migrations

---

## 📈 Performance Optimizations

### Caching Strategy
- Static data caching
- API response caching
- Redis caching (optional)
- Database query optimization

### Image Optimization
- Next.js Image component
- Supabase Storage for media
- Image compression and optimization
- Lazy loading

### Code Splitting
- Next.js automatic code splitting
- Dynamic imports for heavy components
- Route-based code splitting

---

## 🧪 Testing & Quality

### Code Quality
- ESLint configuration
- Code formatting standards
- Error logging and monitoring
- Comprehensive error handling

### Data Validation
- Input validation on forms
- API request validation
- Database constraints
- Type checking

---

## 📝 Documentation

The project includes extensive documentation:
- **ENV_SETUP_GUIDE.md**: Environment variable setup
- **SUPABASE_SETUP.md**: Supabase configuration
- **DATABASE_TABLES_AND_FIELDS.md**: Database schema documentation
- **MESSAGING_SYSTEM_OVERVIEW.md**: Messaging system architecture
- **ANALYTICS_README/**: Analytics system documentation
- **LISTING_CREATION_FLOW.md**: Listing creation process
- **SIGNUP_POLICY.md**: Authentication policies
- And many more feature-specific documentation files

---

## 🎯 Future Enhancements

Potential areas for expansion:
- Mobile app (React Native)
- Advanced search with AI recommendations
- Virtual reality property tours
- Payment integration
- Advanced analytics and reporting
- Multi-language support
- Advanced notification system
- Social features (reviews, ratings, community)

---

## 🔒 Security Considerations

- Environment variable protection
- Service role key security
- JWT token management
- Password hashing
- Input sanitization
- SQL injection prevention (via Supabase)
- XSS protection
- CORS configuration
- Rate limiting (to be implemented)

---

## 📞 Support & Maintenance

### Monitoring
- PostHog for user analytics
- Error logging
- Performance monitoring
- Database monitoring via Supabase

### Maintenance Tasks
- Regular database backups (Supabase)
- Cron job monitoring
- Analytics data consistency checks
- Incomplete listing cleanup
- Cache invalidation

---

## 🏁 Getting Started

1. **Prerequisites**:
   - Node.js 18+ installed
   - Supabase account
   - SendGrid account (for emails)
   - PostHog account (for analytics, optional)

2. **Installation**:
   ```bash
   npm install
   ```

3. **Configuration**:
   - Set up `.env.local` with all required variables
   - Run SQL migrations in Supabase
   - Configure SendGrid sender email

4. **Development**:
   ```bash
   npm run dev
   ```

5. **Build**:
   ```bash
   npm run build
   npm start
   ```

---

## 📚 Additional Resources

- Next.js Documentation: https://nextjs.org/docs
- Supabase Documentation: https://supabase.com/docs
- PostHog Documentation: https://posthog.com/docs
- SendGrid Documentation: https://docs.sendgrid.com
- Tailwind CSS Documentation: https://tailwindcss.com/docs

---

**This is a comprehensive real estate platform with advanced features for property management, lead generation, analytics, and user engagement. The codebase is well-structured, documented, and follows modern web development best practices.**

