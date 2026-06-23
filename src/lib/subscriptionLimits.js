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

/**
 * Whether a numeric limit is unlimited (-1 or very large).
 */
export function isUnlimitedLimitValue(value) {
  const n = Number(value)
  return n === UNLIMITED_NUMBER || n >= 1e9
}

/**
 * Get numeric limit or undefined if missing/unlimited.
 */
export function getNumericLimit(limits, key) {
  const entry = limits?.[key]
  if (!entry || entry.data_type !== 'number') return undefined
  const value = Number(entry.value)
  if (isUnlimitedLimitValue(value)) return undefined
  return value
}

/**
 * Mark items that exceed the calendar-month cap (soft limit UI).
 * Items from prior months are never locked.
 * @param {Array} items
 * @param {string} limitKey - e.g. leads_per_month
 * @param {object} limits - effective api_limits
 * @param {(item) => string|Date} getCreatedAt
 * @param {Date} referenceMonth
 * @returns {Set<string|number>} ids that should be locked
 */
export function getMonthlyOverLimitIds(
  items,
  limitKey,
  limits,
  getCreatedAt,
  referenceMonth = new Date()
) {
  const cap = getNumericLimit(limits, limitKey)
  if (cap === undefined || !Array.isArray(items) || items.length === 0) {
    return new Set()
  }

  const month = referenceMonth.getMonth()
  const year = referenceMonth.getFullYear()

  const thisMonth = items
    .filter((item) => {
      const raw = getCreatedAt(item)
      const date = raw instanceof Date ? raw : new Date(raw)
      if (Number.isNaN(date.getTime())) return false
      return date.getMonth() === month && date.getFullYear() === year
    })
    .sort((a, b) => {
      const da = new Date(getCreatedAt(a)).getTime()
      const db = new Date(getCreatedAt(b)).getTime()
      return da - db
    })

  const locked = new Set()
  thisMonth.slice(cap).forEach((item) => {
    if (item?.id != null) locked.add(item.id)
  })
  return locked
}

export const SUBSCRIPTION_LOCKED_ROW_CLASS =
  'opacity-50 pointer-events-none select-none relative'

export const SUBSCRIPTION_LOCKED_CARD_CLASS =
  'opacity-50 pointer-events-none select-none relative'

export const SUBSCRIPTION_LIMIT_TOOLTIPS = {
  listing_limits: 'Listing limit reached. Upgrade your subscription to add or manage more properties.',
  units_per_development: 'Unit limit for this development reached. Upgrade your subscription to add more units.',
  developments_limit: 'Development limit reached. Upgrade your subscription to add more developments.',
  number_of_agents: 'Agent limit reached. Upgrade your subscription to invite more agents.',
  total_users_limit: 'Team member limit reached. Upgrade your subscription to add more users.',
  total_roles_limit: 'Role limit reached. Upgrade your subscription to add more roles.',
  leads_per_month: 'Monthly lead limit reached. Upgrade your subscription for more leads this month.',
  appointments_per_month: 'Monthly appointment limit reached. Upgrade your subscription for more bookings this month.',
  audit_trails_limit: 'Audit trail view limit reached. Upgrade your subscription to access more history.',
  audit_trails_export_enabled: 'Audit export is not included in your plan. Upgrade to export audit trails.',
  lead_export_pdf: 'PDF export is not included in your plan. Upgrade your subscription.',
  lead_export_csv: 'CSV export is not included in your plan. Upgrade your subscription.',
  lead_export_excel: 'Excel export is not included in your plan. Upgrade your subscription.',
  advanced_analytics_enabled: 'Advanced analytics is not included in your plan. Upgrade your subscription.',
  transactions_records_enabled: 'Transaction records are not included in your plan. Upgrade your subscription.',
  default: 'Plan limit reached. Upgrade your subscription to continue.',
}

export function getSubscriptionLimitTooltip(limitKey) {
  return SUBSCRIPTION_LIMIT_TOOLTIPS[limitKey] || SUBSCRIPTION_LIMIT_TOOLTIPS.default
}

/**
 * Cumulative cap — oldest items stay active, excess are locked (listings, developments, agents, audit rows).
 */
export function getCumulativeOverLimitIds(items, limitKey, limits, getCreatedAt, getId = (item) => item?.id) {
  const cap = getNumericLimit(limits, limitKey)
  if (cap === undefined || !Array.isArray(items) || items.length === 0) {
    return new Set()
  }
  if (cap === 0) {
    const locked = new Set()
    items.forEach((item) => {
      const id = getId(item)
      if (id != null) locked.add(id)
    })
    return locked
  }

  const sorted = [...items].sort((a, b) => {
    const da = new Date(getCreatedAt(a)).getTime()
    const db = new Date(getCreatedAt(b)).getTime()
    return da - db
  })

  const locked = new Set()
  sorted.slice(cap).forEach((item) => {
    const id = getId(item)
    if (id != null) locked.add(id)
  })
  return locked
}

/**
 * Per-development unit cap for developer accounts.
 */
export function getUnitsPerDevelopmentOverLimitIds(
  units,
  limits,
  getDevelopmentId = (u) => u?.development_id,
  getCreatedAt = (u) => u?.created_at,
  getId = (u) => u?.id
) {
  const cap = getNumericLimit(limits, 'units_per_development')
  if (cap === undefined || !Array.isArray(units) || units.length === 0) {
    return new Set()
  }

  const byDev = {}
  for (const unit of units) {
    const devId = getDevelopmentId(unit) || '__none__'
    if (!byDev[devId]) byDev[devId] = []
    byDev[devId].push(unit)
  }

  const locked = new Set()
  for (const group of Object.values(byDev)) {
    const sorted = [...group].sort((a, b) => {
      const da = new Date(getCreatedAt(a)).getTime()
      const db = new Date(getCreatedAt(b)).getTime()
      return da - db
    })
    sorted.slice(cap).forEach((unit) => {
      const id = getId(unit)
      if (id != null) locked.add(id)
    })
  }
  return locked
}

export function canAddUnitToAnyDevelopment(units, limits, getDevelopmentId = (u) => u?.development_id) {
  const cap = getNumericLimit(limits, 'units_per_development')
  if (cap === undefined) return true

  const counts = {}
  for (const unit of units || []) {
    const devId = getDevelopmentId(unit) || '__none__'
    counts[devId] = (counts[devId] || 0) + 1
  }

  if (Object.keys(counts).length === 0) return true
  return Object.values(counts).some((count) => count < cap)
}

export const USAGE_KEY_BY_LIMIT = {
  listing_limits: 'total_listings',
  number_of_agents: 'total_agents',
  developments_limit: 'total_developments',
  total_users_limit: 'total_team_members',
  total_roles_limit: 'total_roles',
  leads_per_month: 'leads_per_month',
  appointments_per_month: 'appointments_per_month',
}
