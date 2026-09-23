export const INTERVAL_UNITS = ['day', 'week', 'month', 'year']

export function getChargeableOwner(userInfo) {
  if (!userInfo) return null

  const userType =
    userInfo.organization_type ||
    (userInfo.user_type === 'agency' || userInfo.user_type === 'developer'
      ? userInfo.user_type
      : null)

  if (userType === 'developer') {
    return { userId: userInfo.developer_id || userInfo.user_id, userType: 'developer' }
  }
  if (userType === 'agency') {
    return { userId: userInfo.agency_id || userInfo.user_id, userType: 'agency' }
  }
  return null
}

export function normalizeChargeableItem(item) {
  if (!item) return null
  if (typeof item === 'string') return { id: item }
  if (typeof item === 'object' && item.id) {
    return {
      id: item.id,
      new_amount: item.new_amount != null && item.new_amount !== '' ? Number(item.new_amount) : undefined,
      new_interval_value: item.new_interval_value != null && item.new_interval_value !== ''
        ? Number(item.new_interval_value)
        : undefined,
      new_interval_unit: item.new_interval_unit || undefined
    }
  }
  return null
}

export function chargeableItemId(item) {
  return normalizeChargeableItem(item)?.id || null
}

export function parseChargeablesList(value) {
  if (!value) return []
  const raw = Array.isArray(value) ? value : []
  return raw.map(normalizeChargeableItem).filter(Boolean)
}

export function appendChargeableId(list, typeId) {
  const arr = parseChargeablesList(list)
  if (arr.some((item) => item.id === typeId)) return arr
  return [...arr, { id: typeId }]
}

export function removeChargeableId(list, typeId) {
  return parseChargeablesList(list).filter((item) => item.id !== typeId)
}

export function addDays(dateStr, days) {
  if (!dateStr) return null
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function formatChargeableDate(dateStr) {
  if (!dateStr) return '—'
  const raw = String(dateStr).slice(0, 10)
  const d = new Date(`${raw}T00:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const day = String(d.getDate()).padStart(2, '0')
  return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`
}

export function getOwnerDefaultCurrency(profile) {
  const raw = profile?.default_currency
  if (raw) {
    if (typeof raw === 'object' && raw.code) return raw.code
    if (typeof raw === 'string' && raw.trim()) {
      try {
        const parsed = JSON.parse(raw)
        if (parsed?.code) return parsed.code
      } catch {
        return raw.trim()
      }
    }
  }
  let locations = profile?.company_locations
  if (typeof locations === 'string') {
    try { locations = JSON.parse(locations) } catch { locations = [] }
  }
  if (Array.isArray(locations)) {
    const primary = locations.find((loc) => loc.primary_location === true)
    if (primary?.currency) return primary.currency
  }
  return 'GHS'
}

export function formatChargeableInterval(value, unit) {
  const count = Number(value) || 1
  const label = unit || 'month'
  return `Every ${count} ${label}${count === 1 ? '' : 's'}`
}

export function addInterval(dateStr, value, unit) {
  if (!dateStr) return null
  const d = new Date(`${dateStr}T00:00:00`)
  const v = Number(value) || 1
  if (unit === 'day') d.setDate(d.getDate() + v)
  else if (unit === 'week') d.setDate(d.getDate() + v * 7)
  else if (unit === 'year') d.setFullYear(d.getFullYear() + v)
  else d.setMonth(d.getMonth() + v)
  return d.toISOString().slice(0, 10)
}

export function resolveAmountAndInterval(type, listingItem = {}, entryOverride = {}) {
  const hasEntryAmount = entryOverride.new_amount != null && entryOverride.new_amount !== ''
  const hasListingAmount = listingItem.new_amount != null && listingItem.new_amount !== ''
  const hasEntryInterval = entryOverride.new_interval_value != null && entryOverride.new_interval_unit
  const hasListingInterval = listingItem.new_interval_value != null && listingItem.new_interval_unit

  const amount = Number(
    hasEntryAmount ? entryOverride.new_amount : hasListingAmount ? listingItem.new_amount : type.default_amount
  )
  const interval_value = Number(
    hasEntryInterval
      ? entryOverride.new_interval_value
      : hasListingInterval
        ? listingItem.new_interval_value
        : type.default_interval_value
  )
  const interval_unit =
    (hasEntryInterval
      ? entryOverride.new_interval_unit
      : hasListingInterval
        ? listingItem.new_interval_unit
        : type.default_interval_unit) || 'month'

  const usedEntryOverride = hasEntryAmount || hasEntryInterval
  return {
    amount,
    interval_value,
    interval_unit,
    new_amount: usedEntryOverride && hasEntryAmount ? Number(entryOverride.new_amount) : null,
    new_interval_value: usedEntryOverride && hasEntryInterval ? Number(entryOverride.new_interval_value) : null,
    new_interval_unit: usedEntryOverride && hasEntryInterval ? entryOverride.new_interval_unit : null
  }
}

export function normalizeServiceChargeTime(value) {
  if (value === undefined || value === null) return null
  const raw = String(value).trim()
  if (!raw) return null
  const match = raw.match(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/)
  if (!match) return null
  const [, hh, mm, ss] = match
  return `${hh}:${mm}:${ss || '00'}`
}

export function mapChargeableType(row, revenue = {}) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    defaultAmount: parseFloat(row.default_amount) || 0,
    defaultIntervalValue: row.default_interval_value,
    defaultIntervalUnit: row.default_interval_unit,
    isDefault: !!row.is_default,
    totalRevenue: revenue.total || 0,
    incomingRevenue: revenue.incoming || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function buildChargeableEvent(event, row, extra = {}) {
  return {
    at: extra.at || new Date().toISOString(),
    event,
    status: extra.status !== undefined ? extra.status : row.status,
    next_due_status: extra.next_due_status !== undefined ? extra.next_due_status : row.next_due_status,
    paid_at: extra.paid_at !== undefined ? extra.paid_at : row.paid_at,
    period_start: row.period_start,
    period_end: row.period_end,
    next_due_date: extra.next_due_date !== undefined ? extra.next_due_date : row.next_due_date,
    next_due_time: extra.next_due_time !== undefined ? extra.next_due_time : row.next_due_time,
    amount: row.amount,
    overdue_time: extra.overdue_time !== undefined ? extra.overdue_time : row.overdue_time,
    notification_status: extra.notification_status !== undefined ? extra.notification_status : row.notification_status,
    sms_notification_status: extra.sms_notification_status !== undefined ? extra.sms_notification_status : row.sms_notification_status,
    email_notification_status: extra.email_notification_status !== undefined ? extra.email_notification_status : row.email_notification_status
  }
}

export function resolveChargeableDueStatus(row, today = new Date()) {
  const paidCycle = String(row.next_due_status || '').toLowerCase() === 'paid'
  if (paidCycle) return 'paid'
  const dueDate = row.next_due_date ? new Date(`${String(row.next_due_date).slice(0, 10)}T00:00:00`) : null
  if (!dueDate || Number.isNaN(dueDate.getTime())) return row.next_due_status || 'not_due'
  const start = new Date(today)
  start.setHours(0, 0, 0, 0)
  if (dueDate < start) return 'overdue'
  if (dueDate.getTime() === start.getTime()) return 'due'
  return String(row.next_due_status || 'not_due').toLowerCase() === 'due' ? 'due' : 'not_due'
}

export function chargeableOverdueDays(row, today = new Date()) {
  if (resolveChargeableDueStatus(row, today) !== 'overdue' || !row.next_due_date) return 0
  const due = new Date(`${String(row.next_due_date).slice(0, 10)}T00:00:00`)
  const start = new Date(today)
  start.setHours(0, 0, 0, 0)
  return Math.max(0, Math.floor((start - due) / (1000 * 60 * 60 * 24)))
}

export function mapChargeableEntry(row, extras = {}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const nextDueStatus = resolveChargeableDueStatus(row, today)
  const isOverdue = nextDueStatus === 'overdue'
  const overdueDays = chargeableOverdueDays(row, today)

  return {
    id: row.id,
    chargeableType: row.chargeable_type,
    typeName: extras.typeName || null,
    unitId: row.unit_id,
    unitName: extras.unitName || null,
    unitCover: extras.unitCover || null,
    unitLocation: extras.unitLocation || null,
    clientId: row.client_id,
    clientName: extras.clientName || 'Unassigned',
    amount: parseFloat(row.amount) || 0,
    intervalValue: row.interval_value,
    intervalUnit: row.interval_unit,
    newAmount: row.new_amount != null ? parseFloat(row.new_amount) : null,
    newIntervalValue: row.new_interval_value,
    newIntervalUnit: row.new_interval_unit,
    periodStart: row.period_start?.slice?.(0, 10) || row.period_start || null,
    periodEnd: row.period_end?.slice?.(0, 10) || row.period_end || null,
    nextDueDate: row.next_due_date?.slice?.(0, 10) || row.next_due_date || null,
    nextDueTime: row.next_due_time?.slice?.(0, 5) || '08:00',
    nextDueStatus,
    overdueTime: overdueDays,
    status: row.status,
    paidAt: row.paid_at?.slice?.(0, 10) || row.paid_at || null,
    billingReference: row.billing_reference,
    notificationStatus: row.notification_status,
    smsNotificationStatus: row.sms_notification_status || null,
    emailNotificationStatus: row.email_notification_status || null,
    entryReference: row.entry_reference || null,
    eventSeries: Array.isArray(row.event_series) ? row.event_series : [],
    isOverdue,
    createdAt: row.created_at
  }
}

export function listingCover(listing) {
  const media = listing?.media
  if (!media) return null
  if (media.banner?.url) return media.banner.url
  if (Array.isArray(media.albums) && media.albums[0]?.images?.[0]?.url) return media.albums[0].images[0].url
  if (Array.isArray(media.mediaFiles) && media.mediaFiles[0]?.url) return media.mediaFiles[0].url
  return null
}

export function listingLocation(listing) {
  return [listing?.town, listing?.city, listing?.state].filter(Boolean).join(', ') || listing?.full_address || ''
}

export async function defaultChargeablesForOwner(supabase, userId, userType) {
  const { data } = await supabase
    .from('chargeable_types')
    .select('id')
    .eq('user_id', userId)
    .eq('user_type', userType)
    .eq('is_default', true)

  return (data || []).map((row) => ({ id: row.id }))
}

export async function applyChargeableTypeToOwnerListings(supabase, userId, typeId) {
  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, chargeables')
    .eq('user_id', userId)

  if (error) throw error

  let attached = 0
  for (const listing of listings || []) {
    const next = appendChargeableId(listing.chargeables, typeId)
    if (next.length !== parseChargeablesList(listing.chargeables).length) {
      const { error: updateError } = await supabase
        .from('listings')
        .update({ chargeables: next })
        .eq('id', listing.id)
      if (!updateError) attached += 1
    }
  }
  return attached
}
