"use client"
// Client-side cache invalidation utilities
import { clearCacheKeys } from '@/hooks/useCachedData'

// Cache keys for different data types
export const CACHE_KEYS = {
  PROPERTY_PURPOSES: 'property-purposes',
  PROPERTY_TYPES: 'property-types', 
  PROPERTY_CATEGORIES: 'property-categories',
  PROPERTY_SUBTYPES: 'property-subtypes',
  DEVELOPMENTS: (developerId) => `developments-${developerId}`,
}

// Client-side cache invalidation functions
export function invalidatePropertyPurposesCache() {
  clearCacheKeys([CACHE_KEYS.PROPERTY_PURPOSES])
}

export function invalidatePropertyTypesCache() {
  clearCacheKeys([
    CACHE_KEYS.PROPERTY_TYPES,
    CACHE_KEYS.PROPERTY_CATEGORIES, // Categories depend on types
    CACHE_KEYS.PROPERTY_SUBTYPES    // Subtypes depend on types
  ])
}

export function invalidatePropertyCategoriesCache() {
  clearCacheKeys([CACHE_KEYS.PROPERTY_CATEGORIES])
}

export function invalidatePropertySubtypesCache() {
  clearCacheKeys([CACHE_KEYS.PROPERTY_SUBTYPES])
}

export function invalidateDevelopmentsCache(developerId) {
  if (developerId) {
    clearCacheKeys([CACHE_KEYS.DEVELOPMENTS(developerId)])
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
  
  clearCacheKeys(keysToClear)
}

// Hook to get cache invalidation functions
export function useCacheInvalidation(developerId) {
  return {
    invalidatePropertyPurposes: invalidatePropertyPurposesCache,
    invalidatePropertyTypes: invalidatePropertyTypesCache,
    invalidatePropertyCategories: invalidatePropertyCategoriesCache,
    invalidatePropertySubtypes: invalidatePropertySubtypesCache,
    invalidateDevelopments: () => invalidateDevelopmentsCache(developerId),
    invalidateAll: () => invalidateAllPropertyManagementCaches(developerId)
  }
}
