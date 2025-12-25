# 💰 Agency Commission Rate Structure

## Overview

The `commission_rate` field in the `agencies` table is a JSONB field that allows agencies to set different commission rates based on:
1. **Purpose** (Rent, Sale, Lease)
2. **Property Type** (with category: "property_type")
3. **Property Subtype** (with category: "property_subtype")

The "default" rate is required and serves as a fallback for any property that doesn't match a specific rate configuration.

---

## 📋 JSONB Structure

### **Default Structure (Simple)**

```json
{
  "default": 3.0
}
```

### **Extended Structure (with Purpose-Based Rates)**

```json
{
  "default": 3.0,
  "Rent": [
    {
      "category": "property_type",
      "id": "type-house-id",
      "percentage": 10.0
    },
    {
      "category": "property_subtype",
      "id": "subtype-2bedroom-id",
      "percentage": 8.0
    }
  ],
  "Sale": [
    {
      "category": "property_type",
      "id": "type-apartment-id",
      "percentage": 5.0
    },
    {
      "category": "property_subtype",
      "id": "subtype-penthouse-id",
      "percentage": 6.0
    }
  ]
}
```

---

## 🎯 Structure Explanation

### **Required Field**
- `default` - Default commission rate (required, fallback rate) - **Number**

### **Optional Purpose-Based Rates**
- `Rent` - Array of commission rate objects for rental properties
- `Sale` - Array of commission rate objects for sale properties
- `Lease` - Array of commission rate objects for lease properties
- Or any custom purpose key (e.g., "Luxury", "Commercial")

### **Rate Object Structure**
Each rate object in the purpose arrays contains:
- `category` - **String** - Either `"property_type"` or `"property_subtype"`
- `id` - **String** - The ID of the property type or subtype
- `percentage` - **Number** - The commission rate percentage

---

## 📊 Rate Resolution Logic

When calculating commission for a property, the system follows this priority:

1. **Check for specific subtype rate** in the purpose array
   - Match: `purpose` → find in array where `category === "property_subtype"` AND `id === propertySubtypeId`
   - Example: `commission_rate.Rent` → find `{category: "property_subtype", id: "subtype-2bedroom-id"}` → 8.0%

2. **Check for specific type rate** in the purpose array
   - Match: `purpose` → find in array where `category === "property_type"` AND `id === propertyTypeId`
   - Example: `commission_rate.Rent` → find `{category: "property_type", id: "type-house-id"}` → 10.0%

3. **If not found, use default**
   - Example: `commission_rate.default` → 3.0%

---

## 💡 Example Scenarios

### **Scenario 1: Rent - House with Subtype Match**

```javascript
const purpose = "Rent";
const propertyTypeId = "type-house-id";
const propertySubtypeId = "subtype-2bedroom-id";

const commissionRate = {
  "default": 3.0,
  "Rent": [
    {
      "category": "property_type",
      "id": "type-house-id",
      "percentage": 10.0
    },
    {
      "category": "property_subtype",
      "id": "subtype-2bedroom-id",
      "percentage": 8.0
    }
  ]
};

// Resolution: subtype match takes priority
// Result: 8.0%
```

### **Scenario 2: Rent - House with Type Match Only**

```javascript
const purpose = "Rent";
const propertyTypeId = "type-house-id";
const propertySubtypeId = "subtype-3bedroom-id"; // Not in rates

// Resolution: type match
// Result: 10.0%
```

### **Scenario 3: Sale - Apartment with No Match**

```javascript
const purpose = "Sale";
const propertyTypeId = "type-office-id"; // Not in Sale rates
const propertySubtypeId = "subtype-office-suite-id";

// Resolution: no match, use default
// Result: 3.0%
```

### **Scenario 4: Unknown Purpose**

```javascript
const purpose = "Lease"; // Not in commission_rate
const propertyTypeId = "type-warehouse-id";

// Resolution: purpose not found, use default
// Result: 3.0%
```

---

## 🔧 Customization Examples

### **Example 1: Default Only (Simple)**

```json
{
  "default": 3.0
}
```

### **Example 2: Rent with Multiple Property Types**

```json
{
  "default": 3.0,
  "Rent": [
    {
      "category": "property_type",
      "id": "type-house-id",
      "percentage": 10.0
    },
    {
      "category": "property_type",
      "id": "type-apartment-id",
      "percentage": 8.0
    },
    {
      "category": "property_type",
      "id": "type-land-id",
      "percentage": 5.0
    }
  ]
}
```

### **Example 3: Sale with Subtypes**

```json
{
  "default": 3.0,
  "Sale": [
    {
      "category": "property_subtype",
      "id": "subtype-penthouse-id",
      "percentage": 6.0
    },
    {
      "category": "property_subtype",
      "id": "subtype-villa-id",
      "percentage": 5.5
    },
    {
      "category": "property_subtype",
      "id": "subtype-mansion-id",
      "percentage": 7.0
    }
  ]
}
```

### **Example 4: Mixed Types and Subtypes**

```json
{
  "default": 3.0,
  "Rent": [
    {
      "category": "property_type",
      "id": "type-house-id",
      "percentage": 10.0
    },
    {
      "category": "property_subtype",
      "id": "subtype-2bedroom-id",
      "percentage": 8.0
    },
    {
      "category": "property_subtype",
      "id": "subtype-3bedroom-id",
      "percentage": 9.0
    }
  ],
  "Sale": [
    {
      "category": "property_type",
      "id": "type-apartment-id",
      "percentage": 5.0
    },
    {
      "category": "property_subtype",
      "id": "subtype-penthouse-id",
      "percentage": 6.0
    }
  ]
}
```

### **Example 5: Multiple Purposes**

```json
{
  "default": 3.0,
  "Rent": [
    {
      "category": "property_type",
      "id": "type-house-id",
      "percentage": 10.0
    }
  ],
  "Sale": [
    {
      "category": "property_type",
      "id": "type-house-id",
      "percentage": 5.0
    }
  ],
  "Lease": [
    {
      "category": "property_type",
      "id": "type-office-id",
      "percentage": 7.0
    }
  ]
}
```

---

## 💻 JavaScript Helper Functions

### **Get Commission Rate**

```javascript
/**
 * Get commission rate for a property
 * @param {Object} commissionRate - The commission_rate JSONB object
 * @param {string} purpose - Property purpose (Rent, Sale, Lease)
 * @param {string} propertyTypeId - Property type ID
 * @param {string} propertySubtypeId - Property subtype ID (optional)
 * @returns {number} Commission rate percentage
 */
function getCommissionRate(commissionRate, purpose, propertyTypeId, propertySubtypeId = null) {
  // If purpose not found, return default
  if (!commissionRate[purpose] || !Array.isArray(commissionRate[purpose])) {
    return commissionRate?.default || 3.0;
  }

  const purposeRates = commissionRate[purpose];

  // Priority 1: Check for subtype match (if subtype provided)
  if (propertySubtypeId) {
    const subtypeMatch = purposeRates.find(
      rate => rate.category === "property_subtype" && rate.id === propertySubtypeId
    );
    if (subtypeMatch) {
      return subtypeMatch.percentage;
    }
  }

  // Priority 2: Check for type match
  if (propertyTypeId) {
    const typeMatch = purposeRates.find(
      rate => rate.category === "property_type" && rate.id === propertyTypeId
    );
    if (typeMatch) {
      return typeMatch.percentage;
    }
  }

  // Priority 3: Use default
  return commissionRate?.default || 3.0;
}

// Usage examples
const rate1 = getCommissionRate(
  agency.commission_rate,
  "Rent",
  "type-house-id",
  "subtype-2bedroom-id"
); // Returns 8.0% (subtype match)

const rate2 = getCommissionRate(
  agency.commission_rate,
  "Rent",
  "type-house-id",
  "subtype-3bedroom-id"
); // Returns 10.0% (type match)

const rate3 = getCommissionRate(
  agency.commission_rate,
  "Sale",
  "type-office-id"
); // Returns 3.0% (default, no match)
```

### **Add Commission Rate**

```javascript
/**
 * Add a commission rate to a purpose
 * @param {Object} commissionRate - Current commission_rate object
 * @param {string} purpose - Purpose (Rent, Sale, etc.)
 * @param {string} category - "property_type" or "property_subtype"
 * @param {string} id - Property type or subtype ID
 * @param {number} percentage - Commission rate percentage
 * @returns {Object} Updated commission_rate object
 */
function addCommissionRate(commissionRate, purpose, category, id, percentage) {
  // Ensure default exists
  if (!commissionRate.default) {
    commissionRate.default = 3.0;
  }

  // Initialize purpose array if it doesn't exist
  if (!commissionRate[purpose]) {
    commissionRate[purpose] = [];
  }

  // Check if rate already exists for this id and category
  const existingIndex = commissionRate[purpose].findIndex(
    rate => rate.category === category && rate.id === id
  );

  const rateObject = {
    category,
    id,
    percentage
  };

  if (existingIndex >= 0) {
    // Update existing rate
    commissionRate[purpose][existingIndex] = rateObject;
  } else {
    // Add new rate
    commissionRate[purpose].push(rateObject);
  }

  return { ...commissionRate };
}

// Usage
const updated = addCommissionRate(
  agency.commission_rate,
  "Rent",
  "property_type",
  "type-house-id",
  10.0
);
```

### **Remove Commission Rate**

```javascript
/**
 * Remove a commission rate from a purpose
 * @param {Object} commissionRate - Current commission_rate object
 * @param {string} purpose - Purpose (Rent, Sale, etc.)
 * @param {string} category - "property_type" or "property_subtype"
 * @param {string} id - Property type or subtype ID
 * @returns {Object} Updated commission_rate object
 */
function removeCommissionRate(commissionRate, purpose, category, id) {
  if (!commissionRate[purpose] || !Array.isArray(commissionRate[purpose])) {
    return { ...commissionRate };
  }

  const updated = {
    ...commissionRate,
    [purpose]: commissionRate[purpose].filter(
      rate => !(rate.category === category && rate.id === id)
    )
  };

  // Remove purpose array if empty
  if (updated[purpose].length === 0) {
    delete updated[purpose];
  }

  return updated;
}

// Usage
const updated = removeCommissionRate(
  agency.commission_rate,
  "Rent",
  "property_type",
  "type-house-id"
);
```

---

## 🗄️ Database Queries

### **Get Commission Rate (PostgreSQL)**

```sql
-- Get default commission rate
SELECT 
  (commission_rate->>'default')::numeric as rate
FROM agencies
WHERE id = 'agency-uuid';

-- Get all rates for a purpose
SELECT 
  commission_rate->'Rent' as rent_rates
FROM agencies
WHERE id = 'agency-uuid';

-- Find specific rate using JSONB path
SELECT 
  (rate->>'percentage')::numeric as rate
FROM agencies,
  jsonb_array_elements(commission_rate->'Rent') as rate
WHERE id = 'agency-uuid'
  AND rate->>'category' = 'property_type'
  AND rate->>'id' = 'type-house-id';
```

### **Add Commission Rate**

```sql
-- Add a rate to Rent array
UPDATE agencies
SET commission_rate = jsonb_set(
  commission_rate,
  '{Rent}',
  COALESCE(commission_rate->'Rent', '[]'::jsonb) || 
  '[{"category": "property_type", "id": "type-house-id", "percentage": 10.0}]'::jsonb
)
WHERE id = 'agency-uuid';

-- Initialize purpose array if it doesn't exist and add rate
UPDATE agencies
SET commission_rate = 
  CASE 
    WHEN commission_rate ? 'Rent' THEN
      jsonb_set(
        commission_rate,
        '{Rent}',
        commission_rate->'Rent' || 
        '[{"category": "property_type", "id": "type-house-id", "percentage": 10.0}]'::jsonb
      )
    ELSE
      jsonb_set(
        commission_rate,
        '{Rent}',
        '[{"category": "property_type", "id": "type-house-id", "percentage": 10.0}]'::jsonb
      )
  END
WHERE id = 'agency-uuid';
```

### **Update Commission Rate**

```sql
-- Update a specific rate in the array
UPDATE agencies
SET commission_rate = jsonb_set(
  commission_rate,
  '{Rent}',
  (
    SELECT jsonb_agg(
      CASE 
        WHEN rate->>'category' = 'property_type' AND rate->>'id' = 'type-house-id' THEN
          jsonb_set(rate, '{percentage}', '12.0'::jsonb)
        ELSE rate
      END
    )
    FROM jsonb_array_elements(commission_rate->'Rent') as rate
  )
)
WHERE id = 'agency-uuid';
```

### **Remove Commission Rate**

```sql
-- Remove a specific rate from array
UPDATE agencies
SET commission_rate = jsonb_set(
  commission_rate,
  '{Rent}',
  (
    SELECT jsonb_agg(rate)
    FROM jsonb_array_elements(commission_rate->'Rent') as rate
    WHERE NOT (rate->>'category' = 'property_type' AND rate->>'id' = 'type-house-id')
  )
)
WHERE id = 'agency-uuid';
```

---

## ✅ Validation Rules

1. **"default" key must always be present** (required) - must be a number
2. **Purpose keys are optional** (Rent, Sale, Lease, etc.) - must be arrays
3. **Rate objects must have:**
   - `category` - must be "property_type" or "property_subtype"
   - `id` - must be a valid string (property type/subtype ID)
   - `percentage` - must be a valid number (0-100)
4. **No duplicate rates** - same category + id combination should be unique within a purpose
5. **Subtype takes priority** - if both type and subtype match, use subtype rate

---

## 🎨 UI Considerations

When building the agency dashboard commission rate settings:

1. **Default Rate Section**
   - Required input field for "Default" commission rate
   - Prominently displayed

2. **Purpose-Based Sections**
   - Tabs or accordions for each purpose (Rent, Sale, Lease)
   - Each section shows a list of configured rates

3. **Add Rate Form**
   - Dropdown/selector for Purpose (Rent, Sale, etc.)
   - Dropdown for Category (Property Type / Property Subtype)
   - Dropdown/autocomplete for selecting Property Type or Subtype (shows name, stores ID)
   - Input field for Percentage
   - Add button

4. **Rate List Display**
   - Show: Category, Property Name (resolved from ID), Percentage
   - Edit button for each rate
   - Delete button for each rate
   - Sortable/filterable list

5. **Validation**
   - Ensure default is always present
   - Validate percentage is 0-100
   - Prevent duplicate category+id combinations within same purpose
   - Show warning if removing last rate in a purpose

---

## 📝 Notes

- Commission rates are stored as **percentages** (e.g., 10.0 = 10%)
- **Subtype takes priority** over type when both match
- **Default is required** and serves as fallback for any unmatched properties
- Rates can be **added, updated, or removed** at any time
- **Purpose keys are case-sensitive** (use "Rent", "Sale", not "rent", "sale")
- **Category must be exactly** "property_type" or "property_subtype"
- This structure provides **granular control** while maintaining simplicity

---

This structure allows agencies to set specific commission rates for different property types and subtypes within each purpose, with a reliable default fallback system.
