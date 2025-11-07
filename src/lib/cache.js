import { setKey, getKey, connectRedis, isRedisConnected } from './redis'

// Cache keys for different data types
const CACHE_KEYS = {
  PROPERTY_CATEGORIES: 'property_categories',
  PROPERTY_PURPOSES: 'property_purposes', 
  PROPERTY_TYPES: 'property_types',
  PROPERTY_SUBTYPES: 'property_subtypes',
  PROPERTY_STATUSES: 'property_statuses',
  AMENITIES: 'amenities'
}

// Cache with infinite TTL (no expiration)
const INFINITE_TTL = -1

/**
 * Cache static reference data with infinite TTL
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 */
export async function cacheStaticData(key, data) {
  try {
    // Don't call connectRedis here - setKey already handles connection
    // This prevents duplicate connection attempts
    const result = await setKey(key, data, { ttl: INFINITE_TTL })
    if (result) {
      console.log(`✅ Cached ${key} with infinite TTL`)
    }
    return result
  } catch (error) {
    console.error(`❌ Failed to cache ${key}:`, error)
    return false
  }
}

/**
 * Get cached static reference data
 * @param {string} key - Cache key
 * @returns {any|null} Cached data or null if not found
 */
export async function getCachedStaticData(key) {
  try {
    // Don't call connectRedis here - getKey already handles connection
    // This prevents duplicate connection attempts
    const data = await getKey(key)
    return data
  } catch (error) {
    console.error(`❌ Failed to get cached ${key}:`, error)
    return null
  }
}

/**
 * Cache property categories
 * @param {Array} categories - Array of category objects
 */
export async function cachePropertyCategories(categories) {
  return await cacheStaticData(CACHE_KEYS.PROPERTY_CATEGORIES, categories)
}

/**
 * Get cached property categories
 * @returns {Array|null} Cached categories or null
 */
export async function getCachedPropertyCategories() {
  return await getCachedStaticData(CACHE_KEYS.PROPERTY_CATEGORIES)
}

/**
 * Cache property purposes
 * @param {Array} purposes - Array of purpose objects
 */
export async function cachePropertyPurposes(purposes) {
  return await cacheStaticData(CACHE_KEYS.PROPERTY_PURPOSES, purposes)
}

/**
 * Get cached property purposes
 * @returns {Array|null} Cached purposes or null
 */
export async function getCachedPropertyPurposes() {
  return await getCachedStaticData(CACHE_KEYS.PROPERTY_PURPOSES)
}

/**
 * Cache property types
 * @param {Array} types - Array of type objects
 */
export async function cachePropertyTypes(types) {
  return await cacheStaticData(CACHE_KEYS.PROPERTY_TYPES, types)
}

/**
 * Get cached property types
 * @returns {Array|null} Cached types or null
 */
export async function getCachedPropertyTypes() {
  return await getCachedStaticData(CACHE_KEYS.PROPERTY_TYPES)
}

/**
 * Cache property subtypes
 * @param {Array} subtypes - Array of subtype objects
 */
export async function cachePropertySubtypes(subtypes) {
  return await cacheStaticData(CACHE_KEYS.PROPERTY_SUBTYPES, subtypes)
}

/**
 * Get cached property subtypes
 * @returns {Array|null} Cached subtypes or null
 */
export async function getCachedPropertySubtypes() {
  return await getCachedStaticData(CACHE_KEYS.PROPERTY_SUBTYPES)
}

/**
 * Cache amenities
 * @param {Array} amenities - Array of amenity objects
 */
export async function cacheAmenities(amenities) {
  return await cacheStaticData(CACHE_KEYS.AMENITIES, amenities)
}

/**
 * Get cached amenities
 * @returns {Array|null} Cached amenities or null
 */
export async function getCachedAmenities() {
  return await getCachedStaticData(CACHE_KEYS.AMENITIES)
}

/**
 * Cache property statuses
 * @param {Array} statuses - Array of status objects
 */
export async function cachePropertyStatuses(statuses) {
  return await cacheStaticData(CACHE_KEYS.PROPERTY_STATUSES, statuses)
}

/**
 * Get cached property statuses
 * @returns {Array|null} Cached statuses or null
 */
export async function getCachedPropertyStatuses() {
  return await getCachedStaticData(CACHE_KEYS.PROPERTY_STATUSES)
}

/**
 * Clear specific cache entry
 * @param {string} key - Cache key to clear
 */
export async function clearCache(key) {
  try {
    // Don't call connectRedis here - setKey already handles connection
    // This prevents duplicate connection attempts
    const result = await setKey(key, null, { ttl: 1 })
    if (result) {
      console.log(`🗑️ Cleared cache: ${key}`)
    }
    return result
  } catch (error) {
    console.error(`❌ Failed to clear cache ${key}:`, error)
    return false
  }
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export async function getCacheStats() {
  try {
    // Don't call connectRedis here - getKey already handles connection
    // This prevents duplicate connection attempts
    const stats = {}
    
    // Check which keys exist
    for (const [name, key] of Object.entries(CACHE_KEYS)) {
      const data = await getKey(key)
      stats[name.toLowerCase()] = {
        exists: data !== null,
        size: data ? JSON.stringify(data).length : 0,
        lastChecked: new Date().toISOString()
      }
    }
    
    return {
      redisConnected: isRedisConnected(),
      cacheStats: stats,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('❌ Failed to get cache stats:', error)
    return {
      redisConnected: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
}

export { CACHE_KEYS }
