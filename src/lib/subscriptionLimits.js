/**
 * Subscription rate-limit utilities.
 * - Merge api_limits from main package + addon packages.
 * - Numeric limit -1 or very large = unlimited.
 * - Used by API (server) and can be used by frontend (same merge logic).
 */

const UNLIMITED_NUMBER = -1
const TRUTHY = ['true', '1', 'yes', 'included', 'full', 'full + export', 'full_access', 'advanced', 'basic', 'standard', 'top', 'priority', 'rotational']

/**
 * Normalize api_limits from DB (object keyed by limit name, value = { value, data_type }).
 * @param {Record<string, { value: any, data_type: string }>} apiLimits
 * @returns {Record<string, { value: any, data_type: string }>}
 */
function normalizeApiLimits(apiLimits) {
  if (!apiLimits || typeof apiLimits !== 'object' || Array.isArray(apiLimits)) {
    return {}
  }
  const out = {}
  for (const [key, config] of Object.entries(apiLimits)) {
    if (!key || !config || typeof config !== 'object') continue
    const dataType = String(config.data_type || 'text').toLowerCase()
    let value = config.value
    if (dataType === 'number') {
      const n = Number(value)
      value = Number.isFinite(n) ? n : 0
      // Treat very large as unlimited
      if (value > 1e9) value = UNLIMITED_NUMBER
    } else {
      value = value == null ? '' : String(value)
    }
    out[key] = { value, data_type: dataType }
  }
  return out
}

/**
 * Merge multiple api_limits objects (main + addons). For numbers: take max; for text: take first truthy or last.
 * @param {Array<Record<string, { value: any, data_type: string }>>} apiLimitsList
 * @returns {Record<string, { value: any, data_type: string }>}
 */
function mergeApiLimits(apiLimitsList) {
  const merged = {}
  for (const apiLimits of apiLimitsList) {
    const normalized = normalizeApiLimits(apiLimits)
    for (const [key, { value, data_type }] of Object.entries(normalized)) {
      if (data_type === 'number') {
        const existing = merged[key]
        const existingVal = existing ? existing.value : undefined
        if (existingVal === undefined || existingVal === UNLIMITED_NUMBER) {
          merged[key] = { value, data_type: 'number' }
        } else if (value === UNLIMITED_NUMBER) {
          merged[key] = { value: UNLIMITED_NUMBER, data_type: 'number' }
        } else {
          merged[key] = {
            value: Math.max(existingVal, value),
            data_type: 'number'
          }
        }
      } else {
        const existing = merged[key]
        const existingVal = existing ? existing.value : ''
        const isNewTruthy = TRUTHY.includes(String(value).toLowerCase().trim())
        const isExistingTruthy = TRUTHY.includes(String(existingVal).toLowerCase().trim())
        if (!existing || (!isExistingTruthy && isNewTruthy)) {
          merged[key] = { value, data_type: 'text' }
        }
      }
    }
  }
  return merged
}

/**
 * Get effective limits from main subscription + addon subscriptions (package objects with api_limits).
 * @param {object|null} mainSubscription - { subscriptions_package: { api_limits } }
 * @param {array} addonSubscriptions - [{ subscriptions_package: { api_limits } }]
 * @returns {Record<string, { value: any, data_type: string }>}
 */
export function getEffectiveLimits(mainSubscription, addonSubscriptions = []) {
  const list = []
  if (mainSubscription?.subscriptions_package?.api_limits) {
    list.push(mainSubscription.subscriptions_package.api_limits)
  }
  for (const addon of addonSubscriptions || []) {
    if (addon?.subscriptions_package?.api_limits) {
      list.push(addon.subscriptions_package.api_limits)
    }
  }
  return mergeApiLimits(list)
}

/**
 * Check if user has any active addon subscription (for "Additional Addons" / client management / service charges).
 * @param {array} addonSubscriptions - list of subscription rows
 * @returns {boolean}
 */
export function hasAddonAccess(addonSubscriptions) {
  return Array.isArray(addonSubscriptions) && addonSubscriptions.length > 0
}

/**
 * Check numeric limit. -1 = unlimited.
 * @param {Record<string, { value: any, data_type: string }>} limits
 * @param {string} key
 * @param {number} currentUsage
 * @returns {{ allowed: boolean, limit: number, unlimited: boolean }}
 */
export function checkNumericLimit(limits, key, currentUsage) {
  const entry = limits?.[key]
  if (!entry) {
    return { allowed: true, limit: undefined, unlimited: true }
  }
  const limit = entry.data_type === 'number' ? Number(entry.value) : 0
  const unlimited = limit === UNLIMITED_NUMBER || limit >= 1e9
  return {
    allowed: unlimited || currentUsage <= limit,
    limit: unlimited ? undefined : limit,
    unlimited
  }
}

/**
 * Check boolean/text feature flag (e.g. featured_properties_enabled, service_charges).
 * @param {Record<string, { value: any, data_type: string }>} limits
 * @param {string} key
 * @returns {boolean}
 */
export function checkFeatureEnabled(limits, key) {
  const entry = limits?.[key]
  if (!entry) return false
  const v = entry.value
  if (entry.data_type === 'number') {
    return Number(v) > 0 || v === UNLIMITED_NUMBER
  }
  return TRUTHY.includes(String(v).toLowerCase().trim())
}

/**
 * Keys that indicate client management / service charge addon (any one truthy = has addon).
 */
export const ADDON_FEATURE_KEYS = [
  'service_charges',
  'client_profiles',
  'client_search_filter',
  'client_units_tracking',
  'transactions_payments',
  'role_based_permissions',
  'due_dates_status_reminders',
  'paid_due_overdue_tracking',
  'engagement_notes_reminders',
  'client_documents',
  'totals_pending_activity_history'
]

/**
 * Whether effective limits include addon features (client management / service charges).
 * @param {Record<string, { value: any, data_type: string }>} limits
 * @returns {boolean}
 */
export function hasClientManagementAddonInLimits(limits) {
  return ADDON_FEATURE_KEYS.some(key => checkFeatureEnabled(limits, key))
}

export { UNLIMITED_NUMBER, normalizeApiLimits, mergeApiLimits }
