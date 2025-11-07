# Listing Events Reference

## Overview
This document lists all PostHog events that are tracked for listings/properties.

---

## 📊 Listing-Related Events

### 1. **`property_view`**
**Event Name:** `property_view`  
**Purpose:** Basic property/listing view tracking  
**When it fires:** When a user views a listing card or detail page

**Properties sent:**
- `listing_id` - The ID of the listing
- `viewed_from` - Where it was viewed ('home', 'explore', 'listing_page', 'search_results')
- `lister_id` - ID of the developer/agent who owns the listing
- `lister_type` - Type of lister ('developer', 'agent')
- `listing_type` - Type of listing ('unit', 'development', 'property')
- `seeker_id` - Property seeker ID (if logged in)
- `is_logged_in` - Boolean flag
- `timestamp` - ISO timestamp

**Where it's tracked:**
- `src/app/property/[listing_type]/[slug]/[id]/page.jsx` - Listing detail page
- `src/app/components/Listing/SecondaryListingCard.jsx` - Listing cards on homepage
- `src/app/components/analytics/EnhancedListingCard.jsx` - Enhanced listing cards
- `src/app/allDevelopments/[slug]/page.jsx` - Development page unit listings

---

### 2. **`listing_impression`**
**Event Name:** `listing_impression`  
**Purpose:** Detailed impression tracking for property owners (more metadata)  
**When it fires:** When a user views a listing (same as property_view, but with more context)

**Properties sent:**
- `listing_id` - The ID of the listing
- `lister_id` - ID of the developer/agent who owns the listing
- `lister_type` - Type of lister ('developer', 'agent')
- `seeker_id` - Property seeker ID (if logged in)
- `seeker_name` - Property seeker name (if available)
- `seeker_email` - Property seeker email (if available)
- `listing_type` - Type of listing
- `viewed_from` - Where it was viewed
- `is_logged_in` - Boolean flag
- `session_id` - To track unique sessions
- `property_title` - Title of the property (optional)
- `property_price` - Price of the property (optional)
- `property_location` - Location of the property (optional)
- `timestamp` - ISO timestamp

**Where it's tracked:**
- `src/app/property/[listing_type]/[slug]/[id]/page.jsx` - Listing detail page
- `src/app/components/Listing/SecondaryListingCard.jsx` - Listing cards on homepage
- `src/app/components/analytics/EnhancedListingCard.jsx` - Enhanced listing cards

**Note:** This event is tracked alongside `property_view` to provide more detailed analytics for property owners.

---

### 3. **`impression_share`**
**Event Name:** `impression_share`  
**Purpose:** Track when a listing is shared  
**When it fires:** When user shares a listing via social media, copy link, email, etc.

**Properties sent:**
- `share_type` - 'listing' or 'profile'
- `platform` - 'facebook', 'twitter', 'whatsapp', 'link', 'email', 'copy_link'
- `listing_id` - The ID of the listing
- `lister_id` - ID of the developer/agent
- `lister_type` - Type of lister
- `seeker_id` - Property seeker ID (if logged in)
- `is_logged_in` - Boolean flag
- `timestamp` - ISO timestamp

---

### 4. **`impression_saved_listing`**
**Event Name:** `impression_saved_listing`  
**Purpose:** Track when a listing is saved/unsaved  
**When it fires:** When user clicks save/unsave button on a listing

**Properties sent:**
- `listing_id` - The ID of the listing
- `action` - 'add' or 'remove'
- `lister_id` - ID of the developer/agent
- `lister_type` - Type of lister
- `seeker_id` - Property seeker ID (if logged in)
- `is_logged_in` - Boolean flag
- `timestamp` - ISO timestamp

---

### 5. **`lead_phone`**
**Event Name:** `lead_phone`  
**Purpose:** Track phone number interactions (clicks, copies)  
**When it fires:** When user clicks or copies a phone number

**Properties sent:**
- `action` - 'click' or 'copy'
- `context_type` - 'profile' or 'listing'
- `listing_id` - The ID of the listing
- `lister_id` - ID of the developer/agent
- `lister_type` - Type of lister
- `phone_number` - Phone number (optional, hashed/masked)
- `seeker_id` - Property seeker ID (if logged in)
- `is_logged_in` - Boolean flag
- `timestamp` - ISO timestamp

---

### 6. **`lead_message`**
**Event Name:** `lead_message`  
**Purpose:** Track message/chat interactions  
**When it fires:** When user clicks message/chat button

**Properties sent:**
- `context_type` - 'profile' or 'listing'
- `listing_id` - The ID of the listing
- `lister_id` - ID of the developer/agent
- `lister_type` - Type of lister
- `message_type` - 'direct_message', 'whatsapp', 'email'
- `seeker_id` - Property seeker ID (if logged in)
- `is_logged_in` - Boolean flag
- `timestamp` - ISO timestamp

---

### 7. **`lead_appointment`**
**Event Name:** `lead_appointment`  
**Purpose:** Track appointment bookings  
**When it fires:** When user clicks to book an appointment/viewing

**Properties sent:**
- `context_type` - 'profile' or 'listing'
- `listing_id` - The ID of the listing
- `lister_id` - ID of the developer/agent
- `lister_type` - Type of lister
- `appointment_type` - 'viewing', 'consultation', etc.
- `seeker_id` - Property seeker ID (if logged in)
- `is_logged_in` - Boolean flag
- `timestamp` - ISO timestamp

---

### 8. **`impression_social_media`**
**Event Name:** `impression_social_media`  
**Purpose:** Track social media link clicks  
**When it fires:** When user clicks on social media links (Facebook, Twitter, etc.)

**Properties sent:**
- `platform` - Social media platform name
- `context_type` - 'profile' or 'listing'
- `listing_id` - The ID of the listing (if applicable)
- `lister_id` - ID of the developer/agent
- `lister_type` - Type of lister
- `seeker_id` - Property seeker ID (if logged in)
- `is_logged_in` - Boolean flag
- `timestamp` - ISO timestamp

---

### 9. **`impression_website_visit`**
**Event Name:** `impression_website_visit`  
**Purpose:** Track website link clicks  
**When it fires:** When user clicks on developer/agent website link

**Properties sent:**
- `website_url` - The website URL clicked
- `context_type` - 'profile' or 'listing'
- `listing_id` - The ID of the listing (if applicable)
- `lister_id` - ID of the developer/agent
- `lister_type` - Type of lister
- `seeker_id` - Property seeker ID (if logged in)
- `is_logged_in` - Boolean flag
- `timestamp` - ISO timestamp

---

## 📈 Summary

**Total Listing Events:** 9 events

1. `property_view` - Basic view tracking
2. `listing_impression` - Detailed impression tracking
3. `impression_share` - Share tracking
4. `impression_saved_listing` - Save/unsave tracking
5. `lead_phone` - Phone interaction tracking
6. `lead_message` - Message interaction tracking
7. `lead_appointment` - Appointment booking tracking
8. `impression_social_media` - Social media click tracking
9. `impression_website_visit` - Website click tracking

---

## 🔍 Current Status

Based on your PostHog data:
- ✅ `property_view`: 34 events found
- ✅ `listing_impression`: 34 events found
- ✅ `impression_share`: 4 events found
- ✅ `impression_saved_listing`: 4 events found
- ✅ `lead_phone`: 8 events found
- ✅ `lead_message`: 3 events found
- ❌ `lead_appointment`: 0 events (not being tracked yet)
- ❌ `impression_social_media`: 0 events (not being tracked yet)
- ❌ `impression_website_visit`: 0 events (not being tracked yet)

---

## 💡 Notes

- `property_view` and `listing_impression` are both tracked when viewing a listing
- `listing_impression` provides more detailed metadata for property owners
- All events include `listing_id`, `lister_id`, and `seeker_id` when available
- Events are automatically sent to PostHog via the `useAnalytics` hook

