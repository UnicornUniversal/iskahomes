# Admin Analytics Data Structure

This document provides a complete sample of the `admin_analytics` table structure with all fields populated with example data.

## Table Structure

```json
{
  "date": "2025-01-17",
  "week": "2025-W03",
  "month": "2025-01",
  "quarter": "2025-Q1",
  "year": 2025,
  
  "country": [
    {
      "name": "Ghana",
      "total_listings": 234,
      "total_sales": 12,
      "total_views": 5678,
      "total_leads": 289,
      "sales_value": 3450000,
      "sales_amount": 315000,  // USD value of sold listings
      "listings_sold": 12,     // Count of sold listings
      "percentage": 32.5
    },
    {
      "name": "Nigeria",
      "total_listings": 156,
      "total_sales": 8,
      "total_views": 3456,
      "total_leads": 189,
      "sales_value": 2340000,
      "sales_amount": 210000,
      "listings_sold": 8,
      "percentage": 21.7
    }
  ],
  
  "state": [
    {
      "name": "Greater Accra",
      "country": "Ghana",
      "total_listings": 156,
      "total_sales": 8,
      "total_views": 3456,
      "total_leads": 189,
      "sales_value": 2340000,
      "sales_amount": 210000,
      "listings_sold": 8,
      "percentage": 21.7
    }
  ],
  
  "city": [
    {
      "name": "Accra",
      "state": "Greater Accra",
      "country": "Ghana",
      "total_listings": 123,
      "total_sales": 5,
      "total_views": 2345,
      "total_leads": 145,
      "sales_value": 1890000,
      "sales_amount": 168000,
      "listings_sold": 5,
      "percentage": 17.1
    }
  ],
  
  "town": [
    {
      "name": "East Legon",
      "city": "Accra",
      "state": "Greater Accra",
      "country": "Ghana",
      "total_listings": 45,
      "total_sales": 2,
      "total_views": 890,
      "total_leads": 67,
      "sales_value": 450000,
      "sales_amount": 40000,
      "listings_sold": 2,
      "percentage": 6.3
    }
  ],
  
  "listings_by_property_purpose": {
    "purpose-id-1": {
      "category_id": "purpose-id-1",
      "total_listings": 234,
      "total_sales": 12,
      "total_views": 5678,
      "total_leads": 289,
      "sales_value": 3450000,
      "sales_amount": 315000,  // USD value of sold listings for this purpose
      "listings_sold": 12,      // Count of sold listings for this purpose
      "percentage": 32.5
    },
    "purpose-id-2": {
      "category_id": "purpose-id-2",
      "total_listings": 156,
      "total_sales": 8,
      "total_views": 3456,
      "total_leads": 189,
      "sales_value": 2340000,
      "sales_amount": 210000,
      "listings_sold": 8,
      "percentage": 21.7
    }
  },
  
  "listings_by_property_type": {
    "type-id-1": {
      "category_id": "type-id-1",
      "total_listings": 456,
      "total_sales": 23,
      "total_views": 9876,
      "total_leads": 456,
      "sales_value": 5670000,
      "sales_amount": 515000,  // USD value of sold listings for this type
      "listings_sold": 23,      // Count of sold listings for this type
      "percentage": 63.3
    }
  },
  
  "listings_by_sub_type": {
    "subtype-id-1": {
      "category_id": "subtype-id-1",
      "total_listings": 298,
      "total_sales": 15,
      "total_views": 6789,
      "total_leads": 298,
      "sales_value": 2340000,
      "sales_amount": 213000,  // USD value of sold listings for this subtype
      "listings_sold": 15,      // Count of sold listings for this subtype
      "percentage": 41.4
    }
  },
  
  "listings_by_category": {
    "category-id-1": {
      "category_id": "category-id-1",
      "total_listings": 89,
      "total_sales": 5,
      "total_views": 2345,
      "total_leads": 123,
      "sales_value": 890000,
      "sales_amount": 81000,   // USD value of sold listings for this category
      "listings_sold": 5,       // Count of sold listings for this category
      "percentage": 12.4
    }
  },
  
  "developers_metrics": {
    "total": 156,
    "new": 5,
    "active": 98,
    "deactivated_accounts": 12,
    "inactive": 41,
    "verified": 134,
    "unverified": 22,
    "total_listings": 789,
    "total_sales": 8,
    "total_revenue": 2340000,
    "total_leads_generated": 456
  },
  
  "agents_metrics": {
    "total": 89,
    "new": 3,
    "active": 67,
    "deactivated_accounts": 5,
    "inactive": 12,
    "verified": 78,
    "unverified": 11,
    "total_listings": 298,
    "total_sales": 3,
    "total_revenue": 890000,
    "total_leads_generated": 234
  },
  
  "agencies_metrics": {
    "total": 34,
    "new": 1,
    "active": 22,
    "deactivated_accounts": 2,
    "inactive": 9,
    "verified": 28,
    "unverified": 6,
    "total_listings": 123,
    "total_sales": 1,
    "total_revenue": 567000,
    "total_leads_generated": 89
  },
  
  "property_seekers_metrics": {
    "total": 2568,
    "new": 36,
    "active": 1024,
    "deactivated_accounts": 234,
    "inactive": 1309,
    "verified": 2456,
    "unverified": 112,
    "total_views": 98765,
    "total_leads": 567,
    "saved_listings": 3456
  },
  
  "platform_engagement": {
    "total_views": 12456,
    "unique_views": 8900,
    "logged_in_views": 8456,
    "anonymous_views": 4000,
    "views_by_source": {
      "home": 4567,
      "explore": 3456,
      "search": 2890,
      "direct": 1543
    }
  },
  
  "platform_impressions": {
    "total": 34567,
    "social_media": 12345,
    "website_visit": 9876,
    "share": 7890,
    "saved_listing": 4456
  },
  
  "phone_leads": {
    "total": 234,
    "unique": 189,
    "percentage": 41.3,
    "by_context": {
      "listing": 189,
      "profile": 45
    }
  },
  
  "message_leads": {
    "total": 189,
    "unique": 156,
    "percentage": 33.3,
    "by_context": {
      "listing": 145,
      "profile": 44
    }
  },
  
  "email_leads": {
    "total": 78,
    "unique": 67,
    "percentage": 13.8,
    "by_context": {
      "listing": 56,
      "profile": 22
    }
  },
  
  "appointment_leads": {
    "total": 45,
    "unique": 38,
    "percentage": 7.9,
    "by_context": {
      "listing": 38,
      "profile": 7
    }
  },
  
  "website_leads": {
    "total": 21,
    "unique": 18,
    "percentage": 3.7,
    "by_context": {
      "listing": 15,
      "profile": 6
    }
  },
  
  "sales_metrics": {
    "total": 12,                    // Total number of listings sold
    "sales_value": 525000,          // Sum of estimated_revenue from global_price (always USD)
    "avg_sale_price": 43750,        // sales_value / total
    "total_commission": 0,           // Total commission earned (for future use)
    "avg_commission_rate": 0         // Average commission rate (for future use)
  },
  
  "conversion_rates": {
    "conversion_rate": 4.55,
    "lead_to_sale_rate": 2.12
  }
}
```

## Field Descriptions

### Location Arrays (country, state, city, town)
Each location entry contains:
- `name`: Location name
- `total_listings`: Total listings in this location
- `total_sales`: Total sales count (for this location)
- `total_views`: Total views
- `total_leads`: Total leads generated
- `sales_value`: Total sales value in listing currency
- `sales_amount`: **USD value of sold listings** (from global_price.estimated_revenue)
- `listings_sold`: **Count of sold listings** for this location
- `percentage`: Percentage of total listings
- `country`, `state`, `city`: Parent location context (for nested locations)

### Category Breakdowns (listings_by_property_purpose, listings_by_property_type, listings_by_category, listings_by_sub_type)
Each category entry contains:
- `category_id`: The ID of the category/purpose/type/subtype
- `total_listings`: Total listings in this category
- `total_sales`: Total sales count (legacy, same as listings_sold)
- `total_views`: Total views
- `total_leads`: Total leads generated
- `sales_value`: Total sales value in listing currency
- `sales_amount`: **USD value of sold listings** (from global_price.estimated_revenue)
- `listings_sold`: **Count of sold listings** for this category
- `percentage`: Percentage of total listings

### sales_metrics
- `total`: Total number of listings sold (across all categories)
- `sales_value`: Sum of all `global_price.estimated_revenue` (always USD)
- `avg_sale_price`: `sales_value / total`
- `total_commission`: Total commission (for future use)
- `avg_commission_rate`: Average commission rate (for future use)

## Notes

1. **sales_amount** is always in USD (from `global_price.estimated_revenue`)
2. **sales_value** is in the listing's original currency (from `estimated_revenue.estimated_revenue`)
3. **listings_sold** counts only listings with `listing_status = 'sold'` (not 'rented')
4. All metrics are cumulative per day (one record per day)
5. When a listing is sold, it updates:
   - `sales_metrics.total` (+1)
   - `sales_metrics.sales_value` (+global_price.estimated_revenue)
   - All category breakdowns with `sales_amount` and `listings_sold`
   - All location arrays with `sales_amount` and `listings_sold`

