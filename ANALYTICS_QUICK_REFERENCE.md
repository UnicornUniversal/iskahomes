# Iska Homes Analytics - Quick Reference Card

## 📊 The 4 Analytics Categories

```
┌─────────────────────────────────────────────────────────────────┐
│                      ISKA HOMES ANALYTICS                       │
└─────────────────────────────────────────────────────────────────┘

1️⃣  PROPERTY VIEWS        Track listing visibility
2️⃣  PROFILE VIEWS         Track developer/agent visibility  
3️⃣  IMPRESSIONS           Track engagement actions
4️⃣  LEADS                 Track high-intent actions
```

---

## 1️⃣ Property Views

**What:** Count how many times a listing is viewed  
**Where:** Home, Explore, Listing Page, Search Results  
**Event:** `property_view`

```javascript
analytics.trackPropertyView(listingId, {
  viewedFrom: 'home',        // 'home', 'explore', 'listing_page', 'search_results'
  developerId: developer.id,
  listingType: 'unit'        // 'unit', 'development', 'property'
})
```

---

## 2️⃣ Profile Views

**What:** Count profile page visits  
**Where:** Developer/Agent profile pages  
**Event:** `profile_view`

```javascript
analytics.trackProfileView(profileId, 'developer')  // or 'agent'
```

---

## 3️⃣ Impressions

### a) Social Media Click
**What:** User clicks social media link  
**Event:** `impression_social_media`

```javascript
analytics.trackSocialMediaClick('facebook', {
  contextType: 'profile',    // or 'listing'
  profileId: profile.id,
  developerId: developer.id
})
```

### b) Website Click
**What:** User visits developer's website  
**Event:** `impression_website_visit`

```javascript
analytics.trackWebsiteClick(websiteUrl, {
  contextType: 'profile',
  profileId: profile.id
})
```

### c) Share
**What:** User shares listing/profile  
**Event:** `impression_share`

```javascript
analytics.trackShare('listing', 'whatsapp', {
  listingId: listing.id,
  developerId: developer.id
})
```

### d) Favorite
**What:** User favorites a listing  
**Event:** `impression_favorite`

```javascript
analytics.trackFavorite(listing.id, 'add', {
  developerId: developer.id
})
```

---

## 4️⃣ Leads

### a) Phone Interaction
**What:** User clicks/copies phone number  
**Event:** `lead_phone`

```javascript
analytics.trackPhoneInteraction('click', {
  contextType: 'listing',
  listingId: listing.id,
  developerId: developer.id
})
```

### b) Message Click
**What:** User clicks to message  
**Event:** `lead_message`

```javascript
analytics.trackMessageClick({
  contextType: 'listing',
  listingId: listing.id,
  messageType: 'whatsapp'    // 'direct_message', 'whatsapp', 'email'
})
```

### c) Appointment Click
**What:** User clicks to book appointment  
**Event:** `lead_appointment`

```javascript
analytics.trackAppointmentClick({
  contextType: 'listing',
  listingId: listing.id,
  appointmentType: 'viewing'
})
```

---

## 🎯 Implementation Pattern

```javascript
// 1. Import the hook
import { useAnalytics } from '@/hooks/useAnalytics'

// 2. Initialize in component
const analytics = useAnalytics()

// 3. Call tracking method on user action
const handleClick = () => {
  analytics.trackPropertyView(listing.id, { 
    viewedFrom: 'home',
    developerId: listing.developer_id 
  })
  
  // ... rest of your logic
}
```

---

## 📍 Where to Add Tracking

| Page/Component | Tracking Methods |
|----------------|------------------|
| **Home Page** | `trackPropertyView`, `trackSavedListing`, `trackShare` |
| **Explore Page** | `trackPropertyView`, `trackSavedListing`, `trackShare` |
| **Listing Detail** | `trackPropertyView`, ALL lead methods, ALL impression methods |
| **Developer Profile** | `trackProfileView`, `trackSocialMediaClick`, `trackWebsiteClick`, `trackPhoneInteraction`, `trackMessageClick` |
| **Agent Profile** | `trackProfileView`, `trackSocialMediaClick`, `trackPhoneInteraction`, `trackMessageClick` |
| **Property Cards** | `trackPropertyView`, `trackSavedListing`, `trackShare` |
| **Development Cards** | `trackDevelopmentView`, `trackDevelopmentInteraction` |
| **Development Pages** | `trackDevelopmentView`, `trackDevelopmentLead`, `trackDevelopmentInteraction` |

---

## 📊 Key Metrics to Track

### Overall Platform
- Total Property Views
- Total Profile Views  
- Total Impressions
- Total Leads
- View-to-Lead Conversion Rate

### Per Developer/Agent
- Profile Views
- Impressions Generated
- Leads Generated
- Conversion Rate

### Per Listing
- Total Views
- Views by Source
- Leads Generated
- Engagement Rate

---

## 🎨 PostHog Event Names

```
Core Analytics Events:
├── property_view              (Property Views)
├── profile_view               (Profile Views)
├── impression_social_media    (Impressions - Social)
├── impression_website_visit   (Impressions - Website)
├── impression_share           (Impressions - Share)
├── impression_saved_listing   (Impressions - Saved Listing)
├── lead_phone                 (Leads - Phone)
├── lead_message               (Leads - Message)
└── lead_appointment           (Leads - Appointment)

System Events:
├── user_logged_in
├── user_logged_out
├── listing_created
├── listing_updated
└── listing_deleted

Development Events:
├── development_created
├── development_view
├── development_interaction
└── development_lead
```

---

## ⚡ Quick Copy-Paste Examples

### Property Card (Home/Explore)
```javascript
const handleCardClick = () => {
  analytics.trackPropertyView(listing.id, {
    viewedFrom: 'home',
    developerId: listing.developer_id,
    listingType: listing.listing_type
  })
  router.push(`/property/${listing.listing_type}/${listing.id}`)
}
```

### Phone Button (Listing/Profile)
```javascript
const handlePhoneClick = () => {
  analytics.trackPhoneInteraction('click', {
    contextType: 'listing',
    listingId: listing.id,
    developerId: listing.developer_id
  })
  window.location.href = `tel:${phoneNumber}`
}
```

### Share Button
```javascript
const handleShare = (platform) => {
  analytics.trackShare('listing', platform, {
    listingId: listing.id,
    developerId: listing.developer_id
  })
  // ... share logic
}
```

### Favorite Button
```javascript
const handleFavorite = () => {
  const action = isFavorited ? 'remove' : 'add'
  analytics.trackSavedListing(listing.id, action, {
    developerId: listing.developer_id
  })
  setIsFavorited(!isFavorited)
}
```

### Message Button
```javascript
const handleMessage = () => {
  analytics.trackMessageClick({
    contextType: 'listing',
    listingId: listing.id,
    developerId: listing.developer_id,
    messageType: 'whatsapp'
  })
  window.open(`https://wa.me/${whatsappNumber}`)
}
```

### Appointment Button
```javascript
const handleAppointment = () => {
  analytics.trackAppointmentClick({
    contextType: 'listing',
    listingId: listing.id,
    developerId: listing.developer_id,
    appointmentType: 'viewing'
  })
  router.push('/appointments/book')
}
```

---

## 🔍 Testing Your Analytics

### 1. Check if tracking is working:
```javascript
// In your component
useEffect(() => {
  console.log('Tracking property view for:', listing.id)
  analytics.trackPropertyView(listing.id, { viewedFrom: 'home' })
}, [])
```

### 2. View in PostHog:
1. Go to [PostHog Dashboard](https://app.posthog.com)
2. Click "Events" in sidebar
3. See your events appear in real-time
4. Click event to see all properties

### 3. Verify data:
- Check `listing_id` is correct
- Check `developer_id` is present
- Check `timestamp` is accurate
- Check all context fields are populated

---

## 📈 Creating Insights in PostHog

### Total Property Views:
```
Event: property_view
Count: Total count
Group by: None
```

### Property Views by Source:
```
Event: property_view
Count: Total count  
Breakdown: viewed_from
```

### Lead Conversion Funnel:
```
Step 1: property_view
Step 2: lead_phone OR lead_message OR lead_appointment
```

### Top Developers by Leads:
```
Events: lead_phone, lead_message, lead_appointment
Count: Total count
Group by: developer_id
Sort: Descending
```

---

## 🎯 Next Steps

1. ✅ **Verify Installation** - PostHog is tracking pageviews
2. ⏳ **Add Property View Tracking** - Home, Explore, Listing pages
3. ⏳ **Add Lead Tracking** - Phone, Message, Appointment buttons
4. ⏳ **Add Impression Tracking** - Social, Website, Share, Favorite
5. ⏳ **Add Profile View Tracking** - Developer/Agent pages
6. ⏳ **Create Dashboards** - Setup insights in PostHog
7. ⏳ **Monitor & Optimize** - Track metrics and improve

---

**Need more examples?** Check `POSTHOG_USAGE_EXAMPLES.jsx`  
**Need detailed docs?** Check `POSTHOG_ANALYTICS_SETUP.md`

---

**Quick Import:**
```javascript
import { useAnalytics } from '@/hooks/useAnalytics'
```

**Quick Init:**
```javascript
const analytics = useAnalytics()
```

**That's it!** Start tracking! 🚀

