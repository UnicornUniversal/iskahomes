# Social Amenities API Integration

This document outlines the integration of social amenities functionality into the listings API routes.

---

## ✅ Changes Made

### 1. **Database Schema**
Created `social_amenities` table with:
- `listing_id` - Foreign key to listings table
- `schools` - JSONB array of nearby schools
- `hospitals` - JSONB array of nearby hospitals
- `airports` - JSONB array of nearby airports
- `parks` - JSONB array of nearby parks
- `shops` - JSONB array of nearby shops & markets
- `police` - JSONB array of nearby police stations
- Automatic timestamps and cascade delete

### 2. **API Routes Updated**

---

## 📝 POST `/api/listings` - Create Listing

### **New Functionality:**
- Accepts `social_amenities` parameter in FormData
- Automatically saves amenities to `social_amenities` table after listing creation
- Non-blocking: If amenities save fails, listing creation still succeeds

### **Request Format:**
```javascript
const formData = new FormData()

// ... existing listing data ...

// Add social amenities
formData.append('social_amenities', JSON.stringify({
  schools: [
    {
      id: "ChIJ...",
      name: "Top Kid Activity Centre",
      address: "Fourth Street, Madina",
      rating: 4.8,
      distance: 2.9,
      location: { lat: 5.6605557, lng: -0.1553334 },
      types: ["school", "point_of_interest"],
      openNow: false,
      photoUrl: "https://..."
    }
  ],
  hospitals: [...],
  airports: [...],
  parks: [...],
  shops: [...],
  police: [...]
}))
```

### **Response:**
```json
{
  "success": true,
  "data": {
    "id": "listing-uuid",
    "title": "Property Title",
    ...
  },
  "message": "Listing created successfully"
}
```

---

## 📖 GET `/api/listings/[id]` - Get Listing

### **New Functionality:**
- Automatically fetches social amenities for the listing
- Returns amenities in `social_amenities` field
- Returns `null` if no amenities found (property not geocoded yet)

### **Response:**
```json
{
  "success": true,
  "data": {
    "id": "listing-uuid",
    "title": "Property Title",
    ...
    "developers": {...},
    "relatedListings": [...],
    "social_amenities": {
      "id": "amenities-uuid",
      "listing_id": "listing-uuid",
      "schools": [...],
      "hospitals": [...],
      "airports": [...],
      "parks": [...],
      "shops": [...],
      "police": [...],
      "last_updated": "2025-10-12T10:30:00Z",
      "created_at": "2025-10-12T10:30:00Z"
    }
  }
}
```

---

## ✏️ PUT `/api/listings/[id]` - Update Listing

### **New Functionality:**
- Accepts `social_amenities` parameter in FormData
- Uses UPSERT logic:
  - If amenities exist → **UPDATE** them
  - If amenities don't exist → **INSERT** new record
- Non-blocking: If amenities update fails, listing update still succeeds

### **Request Format:**
```javascript
const formData = new FormData()

// ... existing listing data ...

// Update social amenities
formData.append('social_amenities', JSON.stringify({
  schools: [...],  // Updated schools data
  hospitals: [...],
  airports: [...],
  parks: [...],
  shops: [...],
  police: [...]
}))
```

### **Response:**
```json
{
  "success": true,
  "data": {
    "id": "listing-uuid",
    "title": "Updated Property Title",
    ...
  },
  "message": "Listing updated successfully"
}
```

---

## 🗑️ DELETE `/api/listings/[id]` - Delete Listing

### **New Functionality:**
- Explicitly deletes social amenities before deleting listing
- Uses cascade delete from database (automatic fallback)
- Ensures clean deletion of all related data

### **Request:**
```javascript
DELETE /api/listings/[id]
Headers: {
  Authorization: "Bearer YOUR_TOKEN"
}
```

### **Response:**
```json
{
  "success": true,
  "message": "Listing and associated data deleted successfully"
}
```

---

## 🔧 Implementation Details

### **Error Handling:**
- Social amenities operations are non-blocking
- If amenities fail, the main operation (create/update) still succeeds
- Errors are logged to console for debugging
- User receives success message for listing operation

### **Data Validation:**
- All amenity arrays default to empty `[]` if not provided
- JSON parsing is wrapped in try-catch
- Invalid data doesn't break the API

### **Database Consistency:**
- Unique constraint on `listing_id` prevents duplicates
- Foreign key ensures referential integrity
- Cascade delete keeps database clean

---

## 📊 Data Structure

### **Single Amenity Object:**
```json
{
  "id": "place_id_from_google",
  "name": "Amenity Name",
  "address": "Full Address",
  "rating": 4.8,
  "distance": 2.9,
  "location": {
    "lat": 5.6605557,
    "lng": -0.1553334
  },
  "types": ["school", "point_of_interest"],
  "priceLevel": 2,
  "openNow": false,
  "photoUrl": "https://maps.googleapis.com/..."
}
```

### **Full Amenities Object:**
```json
{
  "schools": [amenity1, amenity2, ...],
  "hospitals": [amenity1, amenity2, ...],
  "airports": [amenity1, amenity2, ...],
  "parks": [amenity1, amenity2, ...],
  "shops": [amenity1, amenity2, ...],
  "police": [amenity1, amenity2, ...]
}
```

---

## 🎯 Usage Examples

### **1. Create Listing with Amenities:**
```javascript
const formData = new FormData()
formData.append('title', 'Beautiful Apartment')
formData.append('description', '2BR apartment in East Legon')
// ... other listing fields ...

// Add amenities after fetching from Google Places
const amenities = await fetchNearbyAmenities(latitude, longitude)
formData.append('social_amenities', JSON.stringify(amenities))

const response = await fetch('/api/listings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
```

### **2. Update Amenities:**
```javascript
// User clicks "Refresh Amenities" button
const newAmenities = await fetchNearbyAmenities(latitude, longitude)

const formData = new FormData()
formData.append('social_amenities', JSON.stringify(newAmenities))
// ... other fields to update ...

const response = await fetch(`/api/listings/${listingId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
```

### **3. Display Amenities on Frontend:**
```javascript
const response = await fetch(`/api/listings/${listingId}`)
const { data } = await response.json()

if (data.social_amenities) {
  const schools = data.social_amenities.schools
  const hospitals = data.social_amenities.hospitals
  // ... display amenities in UI
} else {
  // Show "Fetching amenities..." or "No amenities data"
}
```

---

## 🚀 Next Steps

### **Frontend Integration:**
1. Modify `PropertyManagement.jsx` to collect amenities from `SocialAmenities` component
2. Include amenities data in form submission
3. Add "Refresh Amenities" button for manual updates

### **Backend Optimization:**
1. Add caching layer for frequently accessed listings
2. Implement background job for auto-refreshing old amenities
3. Add API rate limiting to prevent abuse

### **User Features:**
1. Show amenities on property detail pages
2. Filter properties by nearby amenities
3. Show amenities on map view
4. Allow users to report incorrect amenities

---

## 📋 Testing Checklist

- [ ] Create listing with amenities
- [ ] Create listing without amenities
- [ ] Update listing with new amenities
- [ ] Update listing without changing amenities
- [ ] Delete listing with amenities
- [ ] Fetch listing with amenities
- [ ] Fetch listing without amenities
- [ ] Handle malformed amenities data
- [ ] Test cascade delete
- [ ] Test with invalid auth token

---

## ⚠️ Important Notes

1. **Non-Blocking Operations**: Amenities operations never block listing CRUD
2. **Optional Data**: Amenities are completely optional
3. **Auto-Delete**: Amenities automatically deleted when listing is deleted
4. **No Duplicates**: One amenities record per listing (enforced by UNIQUE constraint)
5. **Cost Awareness**: Only fetch amenities once, store forever

---

**Last Updated:** October 2025

