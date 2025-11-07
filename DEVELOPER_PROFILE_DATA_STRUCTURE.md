# Developer Profile Data Structure

## Data Sent to Backend (PUT /api/developers/profile)

When the user saves the profile, the following data structure is sent:

```json
{
  "name": "Erudite Real Estates",
  "email": "eruditejones@gmail.com",
  "phone": "+233241380253",
  "secondary_email": "se@iskaglobal.com",
  "secondary_phone": "0234839494",
  "tertiary_email": "nanel@gmail.com",
  "tertiary_phone": "0241380254",
  "website": "https://kr8tos.vercel.app/",
  "address": "No 10 Church Road Spintex",
  "city": "Asutifi",
  "region": "Ahafo",
  "country": "Ghana",
  "postal_code": "",
  "description": "We are some bad ass company",
  "founded_year": "2020",
  "company_size": "50-100",
  "license_number": "3745000484",
  "specialization": {
    "database": [
      {
        "id": "8a17e13c-fdf9-4e13-ad59-d62b69c19487",
        "name": "Commercial",
        "type": "database"
      },
      {
        "id": "db22c93d-00d3-4bd6-9e27-a6393e1925c1",
        "name": "Mixed Use",
        "type": "database"
      }
    ],
    "custom": [
      {
        "id": "custom_1234567890",
        "name": "Custom Specialization",
        "type": "custom"
      }
    ]
  },
  "social_media": {
    "facebook": "https://www.facebook.com/yourpage",
    "instagram": "https://www.instagram.com/yourpage",
    "linkedin": "https://www.linkedin.com/company/yourcompany",
    "tiktok": "https://www.tiktok.com/@yourpage"
  },
  "customer_care": [
    {
      "name": "Ahalm Bou-Chedid",
      "phone": "0244741500"
    },
    {
      "name": "Chloe Some Surname",
      "phone": "0284948740"
    }
  ],
  "company_statistics": [
    {
      "label": "Employees",
      "value": "250+"
    },
    {
      "label": "Projects Completed",
      "value": "50+"
    },
    {
      "label": "Awards",
      "value": "10"
    }
  ],
  "locations": [
    {
      "id": "loc_1234567890",
      "place_id": "ChIJ...",
      "description": "Main Office",
      "address": "No 10 Church Road Spintex, Accra, Ghana",
      "country": "Ghana",
      "region": "Greater Accra",
      "city": "Accra",
      "latitude": 5.77602,
      "longitude": -1.35944,
      "currency": "GHS",
      "currency_name": "Ghanaian Cedi",
      "primary_location": true
    },
    {
      "id": "loc_1234567891",
      "place_id": "ChIJ...",
      "description": "Branch Office",
      "address": "123 Main Street, Kumasi, Ghana",
      "country": "Ghana",
      "region": "Ashanti",
      "city": "Kumasi",
      "latitude": 6.6885,
      "longitude": -1.6244,
      "currency": "GHS",
      "currency_name": "Ghanaian Cedi",
      "primary_location": false
    }
  ],
  "profile_image": {
    // File object if new upload, or existing object
  },
  "cover_image": {
    // File object if new upload, or existing object
  },
  "registration_files": [
    // Array of File objects if new uploads, or existing objects
  ]
}
```

## Backend Processing Logic

1. **Store `locations` array** in a new JSONB field `company_locations` in the developers table

2. **Find primary location** from the `locations` array (where `primary_location: true`)

3. **If primary location exists**, update these fields on the developers table:
   - `country` ← primary location's `country`
   - `city` ← primary location's `city`
   - `latitude` ← primary location's `latitude`
   - `longitude` ← primary location's `longitude`
   - `default_currency` ← primary location's currency object:
     ```json
     {
       "code": "GHS",
       "name": "Ghanaian Cedi"
     }
     ```

4. **Store `company_statistics`** as JSONB array in the `company_statistics` field

5. **Map field names**:
   - Frontend: `founded_year` → Database: `founded_year` (already correct)
   - Frontend: `company_size` → Database: `company_size` (already correct)
   - Frontend: `license_number` → Database: `license_number` (already correct)
   - Frontend: `specialization` → Database: `specialization` (already JSONB, correct structure)

## Database Schema Updates Needed

If `company_locations` field doesn't exist, add it:

```sql
ALTER TABLE developers 
ADD COLUMN IF NOT EXISTS company_locations JSONB DEFAULT '[]'::jsonb;
```

