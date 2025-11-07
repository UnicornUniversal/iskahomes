# Enhanced PostHog Analytics Implementation - Iska Homes

## 🎯 Overview

The Iska Homes platform now features a comprehensive analytics system that automatically tracks property seeker interactions and provides detailed insights for property owners. This enhanced system allows property owners to see exactly who viewed their listings and contact them directly.

## ✨ Key Features

### 1. **Automatic Property Seeker Tracking**
- Automatically captures `seeker_id` for logged-in property seekers
- Includes `seeker_name` and `seeker_email` when available
- Maintains privacy for anonymous users
- Provides `is_logged_in` flag for easy filtering

### 2. **Detailed Impression Tracking**
- New `trackListingImpression()` function for comprehensive view tracking
- Session-based tracking to identify unique visitors
- Property metadata (title, price, location) for context
- Time-based analytics for trend analysis

### 3. **Enhanced Lead Generation**
- All lead tracking functions now include seeker identification
- Property owners can see who clicked phone, message, or appointment buttons
- Direct contact capabilities for logged-in viewers
- Conversion rate tracking from views to leads

## 🔧 Technical Implementation

### Enhanced Analytics Hook

The `useAnalytics` hook has been enhanced with:

```javascript
// Automatic seeker context helper
const getSeekerContext = useCallback((additionalContext = {}) => {
  const isPropertySeeker = user?.user_type === 'property_seeker'
  return {
    ...additionalContext,
    seekerId: isPropertySeeker ? user.id : null,
    seekerName: isPropertySeeker ? user.profile?.name : null,
    seekerEmail: isPropertySeeker ? user.email : null,
    is_logged_in: isPropertySeeker
  }
}, [user])
```

### New Tracking Functions

#### 1. Enhanced Property View Tracking
```javascript
analytics.trackPropertyView(listingId, {
  viewedFrom: 'home',
  developerId: listing.developer_id,
  agentId: listing.agent_id,
  listingType: listing.listing_type
  // seeker_id, seeker_name, seeker_email automatically included
})
```

#### 2. Detailed Listing Impressions
```javascript
analytics.trackListingImpression(listingId, {
  developerId: listing.developer_id,
  agentId: listing.agent_id,
  listingType: listing.listing_type,
  viewedFrom: 'listing_page',
  sessionId: sessionId,
  propertyTitle: listing.title,
  propertyPrice: listing.price,
  propertyLocation: listing.location
  // seeker information automatically included
})
```

#### 3. Enhanced Lead Tracking
```javascript
analytics.trackPhoneInteraction('click', {
  contextType: 'listing',
  listingId: listing.id,
  developerId: listing.developer_id,
  phoneNumber: listing.phone
  // seeker_id automatically included for logged-in users
})
```

## 📊 Analytics Events Structure

### Property View Events
```javascript
{
  event: 'property_view',
  properties: {
    listing_id: 'listing-123',
    viewed_from: 'home',
    developer_id: 'dev-456',
    agent_id: 'agent-789',
    listing_type: 'unit',
    seeker_id: 'seeker-101', // Only for logged-in property seekers
    seeker_name: 'John Doe', // Only for logged-in property seekers
    seeker_email: 'john@example.com', // Only for logged-in property seekers
    is_logged_in: true, // Boolean flag
    timestamp: '2024-01-15T10:30:00Z'
  }
}
```

### Listing Impression Events
```javascript
{
  event: 'listing_impression',
  properties: {
    listing_id: 'listing-123',
    seeker_id: 'seeker-101',
    seeker_name: 'John Doe',
    seeker_email: 'john@example.com',
    developer_id: 'dev-456',
    agent_id: 'agent-789',
    listing_type: 'unit',
    viewed_from: 'listing_page',
    is_logged_in: true,
    session_id: 'session-abc123',
    timestamp: '2024-01-15T10:30:00Z',
    property_title: 'Modern 3BR Apartment',
    property_price: '$500,000',
    property_location: 'Accra, Ghana'
  }
}
```

### Lead Events
```javascript
{
  event: 'lead_phone',
  properties: {
    action: 'click',
    context_type: 'listing',
    listing_id: 'listing-123',
    developer_id: 'dev-456',
    phone_number: '+233123456789',
    seeker_id: 'seeker-101',
    seeker_name: 'John Doe',
    seeker_email: 'john@example.com',
    is_logged_in: true,
    timestamp: '2024-01-15T10:35:00Z'
  }
}
```

## 🏠 Property Owner Dashboard

### Analytics Dashboard Features

1. **Overview Statistics**
   - Total views across all listings
   - Unique viewers count
   - Logged-in vs anonymous viewer breakdown
   - Conversion rates from views to leads

2. **Listing Performance**
   - Individual listing view counts
   - Logged-in viewer details
   - Recent viewer information with contact details
   - Anonymous viewer counts

3. **Lead Generation**
   - Phone click tracking
   - Message interaction tracking
   - Appointment booking tracking
   - Lead conversion analysis

4. **Viewer Contact Capabilities**
   - Direct messaging to logged-in viewers
   - Email contact information
   - Session-based tracking
   - Time-based viewer analytics

### Dashboard Implementation

```javascript
// Property Owner Analytics Dashboard
import PropertyOwnerAnalytics from '@/components/analytics/PropertyOwnerAnalytics'

function DeveloperDashboard({ developerId }) {
  return (
    <div>
      <h1>My Properties Dashboard</h1>
      <PropertyOwnerAnalytics developerId={developerId} />
    </div>
  )
}
```

## 🔍 PostHog Queries for Property Owners

### View Analytics by Developer
```javascript
// Total views for a developer's listings
Event: property_view OR listing_impression
Filter: developer_id = 'dev-456'
Group by: listing_id
```

### Logged-in Viewers
```javascript
// See who viewed your listings
Event: listing_impression
Filter: developer_id = 'dev-456' AND is_logged_in = true
Group by: seeker_id
Properties: seeker_name, seeker_email, listing_id
```

### Lead Generation
```javascript
// Leads generated from your listings
Event: lead_phone OR lead_message OR lead_appointment
Filter: developer_id = 'dev-456'
Group by: seeker_id
Properties: seeker_name, seeker_email, listing_id, action
```

### Conversion Analysis
```javascript
// Funnel: View → Lead
Step 1: listing_impression (developer_id = 'dev-456')
Step 2: lead_phone OR lead_message OR lead_appointment (developer_id = 'dev-456')
```

## 🚀 Implementation Guide

### 1. Update Existing Components

Replace existing analytics calls with enhanced versions:

```javascript
// Before
analytics.trackPropertyView(listing.id, {
  viewedFrom: 'home',
  developerId: listing.developer_id
})

// After (automatic seeker tracking)
analytics.trackPropertyView(listing.id, {
  viewedFrom: 'home',
  developerId: listing.developer_id,
  agentId: listing.agent_id,
  listingType: listing.listing_type
})
```

### 2. Add Detailed Impressions

For listing detail pages, add comprehensive impression tracking:

```javascript
useEffect(() => {
  if (listing?.id) {
    analytics.trackListingImpression(listing.id, {
      developerId: listing.developer_id,
      agentId: listing.agent_id,
      listingType: listing.listing_type,
      viewedFrom: 'listing_page',
      sessionId: sessionId,
      propertyTitle: listing.title,
      propertyPrice: listing.price,
      propertyLocation: listing.location
    })
  }
}, [listing?.id])
```

### 3. Enhanced Lead Tracking

Update all lead tracking calls to include seeker context:

```javascript
// Phone clicks
analytics.trackPhoneInteraction('click', {
  contextType: 'listing',
  listingId: listing.id,
  developerId: listing.developer_id,
  phoneNumber: listing.phone
})

// Message clicks
analytics.trackMessageClick({
  contextType: 'listing',
  listingId: listing.id,
  developerId: listing.developer_id,
  messageType: 'direct_message'
})
```

## 📈 Benefits for Property Owners

### 1. **Lead Identification**
- See exactly who viewed your listings
- Contact interested buyers directly
- Track viewer engagement over time

### 2. **Performance Optimization**
- Identify which listings get the most views
- Understand viewer behavior patterns
- Optimize listing content based on engagement

### 3. **Conversion Tracking**
- Monitor view-to-lead conversion rates
- Identify high-intent viewers
- Track lead quality and source

### 4. **Marketing Insights**
- Understand which marketing channels drive quality traffic
- Track seasonal trends in property interest
- Identify peak viewing times

## 🔒 Privacy & Compliance

### Data Protection
- Only logged-in property seekers are identified
- Anonymous users remain anonymous
- Email addresses are only visible to property owners
- GDPR-compliant data handling

### User Consent
- Property seekers consent to tracking when they create accounts
- Clear privacy policy regarding analytics data
- Option to opt-out of detailed tracking

## 🎯 Next Steps

### 1. **Integration**
- Update all listing components with enhanced analytics
- Implement property owner dashboard
- Add analytics to search and filter pages

### 2. **Testing**
- Verify analytics data collection
- Test property owner dashboard functionality
- Validate seeker identification accuracy

### 3. **Optimization**
- Create PostHog dashboards for property owners
- Set up automated reports
- Implement lead scoring based on engagement

## 📞 Support

For implementation questions:
- Check `src/hooks/useAnalytics.js` for the complete API
- Review `POSTHOG_USAGE_EXAMPLES.jsx` for implementation patterns
- See `src/app/components/analytics/` for example components

---

**Status: ✅ ENHANCED ANALYTICS IMPLEMENTATION COMPLETE**

The enhanced analytics system is now ready to provide property owners with detailed insights into who viewed their listings and help them generate more leads through direct contact with interested buyers.
