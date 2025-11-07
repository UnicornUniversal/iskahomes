// Cache invalidation utilities for property management data
// This file should NOT import React hooks or client-side code

// Cache keys for different data types
export const CACHE_KEYS = {
  PROPERTY_PURPOSES: 'property-purposes',
  PROPERTY_TYPES: 'property-types', 
  PROPERTY_CATEGORIES: 'property-categories',
  PROPERTY_SUBTYPES: 'property-subtypes',
  DEVELOPMENTS: (developerId) => `developments-${developerId}`,
}

// Server-side cache invalidation functions
// These will be called from API routes to invalidate client-side caches
export function invalidatePropertyPurposesCache() {
  // This will be handled by the client-side cache system
  // For now, we'll just log that invalidation was requested
  console.log('Cache invalidation requested: property-purposes (both admin and public routes)')
}

export function invalidatePropertyTypesCache() {
  console.log('Cache invalidation requested: property-types, property-categories, property-subtypes (both admin and public routes)')
}

export function invalidatePropertyCategoriesCache() {
  console.log('Cache invalidation requested: property-categories (both admin and public routes)')
}

export function invalidatePropertySubtypesCache() {
  console.log('Cache invalidation requested: property-subtypes (both admin and public routes)')
}

export function invalidateDevelopmentsCache(developerId) {
  if (developerId) {
    console.log(`Cache invalidation requested: developments-${developerId}`)
  }
}

export function invalidateAllPropertyManagementCaches(developerId) {
  const keysToClear = [
    CACHE_KEYS.PROPERTY_PURPOSES,
    CACHE_KEYS.PROPERTY_TYPES,
    CACHE_KEYS.PROPERTY_CATEGORIES,
    CACHE_KEYS.PROPERTY_SUBTYPES,
  ]
  
  if (developerId) {
    keysToClear.push(CACHE_KEYS.DEVELOPMENTS(developerId))
  }
  
  console.log('Cache invalidation requested for all keys:', keysToClear)
}
