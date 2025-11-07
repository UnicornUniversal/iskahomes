# Amenities Structure

## Overview

The amenities field in listings only contains **`inbuilt`** and **`custom`** arrays. The `database` and `general` arrays are no longer used.

## Structure

```json
{
  "amenities": {
    "inbuilt": [
      {
        "id": "amenity_1",
        "name": "Swimming Pool",
        "icon": "FaSwimmingPool",
        "category": "general"
      },
      {
        "id": "amenity_2", 
        "name": "Parking",
        "icon": "FaParking",
        "category": "general"
      }
    ],
    "custom": [
      {
        "id": "custom_1",
        "name": "Custom Amenity 1"
      }
    ]
  }
}
```

## Frontend Submission

When submitting a listing, the amenities are sent as part of the `propertyData` object:

```javascript
const propertyData = {
  // ... other fields
  amenities: {
    inbuilt: formData.amenities.inbuilt || [],
    custom: formData.amenities.custom || []
  }
}
```

## Backend Processing

The backend expects and stores only `inbuilt` and `custom`:

```javascript
amenities: {
  inbuilt: propertyData.amenities?.inbuilt || [],
  custom: propertyData.amenities?.custom || []
}
```

## Notes

- **`inbuilt`**: Amenities selected from the predefined list (from `StaticData.js` or database)
- **`custom`**: User-created custom amenities
- **`database`**: Not used (removed)
- **`general`**: Not used (removed - now called `inbuilt`)

