/**
 * Anonymous ID Management
 * Generates and manages anonymous user IDs stored in localStorage
 * Used to track anonymous users who take lead actions before logging in
 * 
 * IMPORTANT: Lead Metrics Definitions
 * ===================================
 * - total_leads: Total number of lead ACTIONS (phone clicks, messages, appointments)
 *   - One user can take multiple actions, so this counts actions, not individuals
 * 
 * - unique_leads: Total number of UNIQUE LOGGED-IN individuals who became leads
 *   - Counts distinct logged-in users (where is_anonymous = false)
 *   - One user = one count, regardless of how many actions they take
 * 
 * - anonymous_leads: Total number of UNIQUE ANONYMOUS individuals who became leads
 *   - Counts distinct anonymous users (where is_anonymous = true)
 *   - Uses anonymous ID from localStorage to track unique anonymous users
 *   - One anonymous user = one count, regardless of how many actions they take
 * 
 * - Total Unique Leads = unique_leads + anonymous_leads
 *   - This represents the total number of unique individuals (logged-in + anonymous)
 *   - This is what should be displayed as "Total Leads" in the UI
 *   - total_leads should be kept for backward compatibility and action tracking
 */

const ANONYMOUS_ID_KEY = 'iska_anonymous_id'

/**
 * Generate a new anonymous ID (UUID v4 format)
 */
function generateAnonymousId() {
  return crypto.randomUUID()
}

/**
 * Get or create anonymous ID from localStorage
 * Returns null if user is logged in (should use their actual user ID instead)
 */
export function getAnonymousId() {
  // Only generate if we're in browser environment
  if (typeof window === 'undefined') {
    return null
  }

  try {
    let anonymousId = localStorage.getItem(ANONYMOUS_ID_KEY)
    
    if (!anonymousId) {
      // Generate new anonymous ID
      anonymousId = generateAnonymousId()
      localStorage.setItem(ANONYMOUS_ID_KEY, anonymousId)
    }
    
    return anonymousId
  } catch (error) {
    console.error('Error getting anonymous ID:', error)
    return null
  }
}

/**
 * Clear anonymous ID from localStorage
 * Should be called when user logs in (they now have a real user ID)
 */
export function clearAnonymousId() {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.removeItem(ANONYMOUS_ID_KEY)
  } catch (error) {
    console.error('Error clearing anonymous ID:', error)
  }
}

/**
 * Check if a given ID is an anonymous ID (UUID format check)
 * This helps distinguish anonymous IDs from actual user UUIDs
 */
export function isAnonymousId(id) {
  if (!id) return false
  // Anonymous IDs are UUIDs, but we can't distinguish them from user IDs by format alone
  // Instead, we rely on is_logged_in flag
  // This function is mainly for validation/debugging
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

