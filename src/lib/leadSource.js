export const LEAD_SOURCE_ISKAHOMES = 'iskahomes'
export const LEAD_SOURCE_API = 'api'

/** Iska share / on-site channels. Partners cannot POST these. */
export const RESERVED_LEAD_SOURCES = new Set([
  LEAD_SOURCE_ISKAHOMES,
  'website',
  'copy_link',
  'whatsapp',
  'facebook',
  'twitter',
  'linkedin',
  'telegram',
  'email',
  'instagram'
])

export const MANUAL_LEAD_SOURCE_OPTIONS = [
  { value: LEAD_SOURCE_ISKAHOMES, label: 'Iska Homes' },
  { value: 'referral', label: 'Referral' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'phone_call', label: 'Phone call' },
  { value: 'event', label: 'Event' },
  { value: 'social_media', label: 'Social media' },
  { value: 'other', label: 'Other' }
]

export function normalizeLeadSourceKey(value, fallback = LEAD_SOURCE_ISKAHOMES) {
  const key = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 64)
  if (!key) return fallback
  if (key === 'website') return LEAD_SOURCE_ISKAHOMES
  return key
}

export function isIskaHomesSource(value) {
  const raw = String(value || '').trim().toLowerCase()
  return raw === LEAD_SOURCE_ISKAHOMES || raw === 'website'
}

export function isReservedLeadSource(value) {
  const raw = String(value || '').trim().toLowerCase()
  return RESERVED_LEAD_SOURCES.has(raw)
}

/** Partner / integration source. Empty → api. Reserved → error. */
export function resolvePartnerLeadSource(value) {
  const trimmed = String(value || '').trim()
  if (!trimmed) return { source: LEAD_SOURCE_API }
  if (isReservedLeadSource(trimmed)) {
    return { error: 'That lead_source is reserved for Iska Homes' }
  }
  return { source: normalizeLeadSourceKey(trimmed, LEAD_SOURCE_API) }
}

const ORIGIN_LABELS = {
  platform: 'Iska Homes',
  their_website: 'Their website',
  referral: 'Referral',
  walk_in: 'Walk-in',
  phone_call: 'Phone call',
  event: 'Event',
  social_media: 'Social media',
  other: 'Other',
  crm: 'CRM',
  api: 'Partner API'
}

export function formatLeadOriginLabel(origin, source) {
  const key = String(origin || '').trim().toLowerCase()
  if (key && ORIGIN_LABELS[key]) return ORIGIN_LABELS[key]
  if (key) return formatLeadSourceLabel(key)
  if (isIskaHomesSource(source)) return 'Iska Homes'
  if (normalizeLeadSourceKey(source, '') === LEAD_SOURCE_API) return 'Partner API'
  if (source) return formatLeadSourceLabel(source)
  return '—'
}

export function formatLeadSourceLabel(key) {
  if (isIskaHomesSource(key)) return 'Iska Homes'
  if (!key) return ''
  return String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Merge legacy website JSON key into iskahomes for reads. */
export function mergeWebsiteBreakdownKey(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const next = { ...raw }
  if (next.website) {
    const old = next.website
    const neu = next.iskahomes
    delete next.website
    if (!neu) {
      next.iskahomes = old
    } else {
      const amount = (Number(neu.amount) || 0) + (Number(old.amount) || 0)
      next.iskahomes = {
        ...neu,
        amount,
        context_breakdown: {
          ...(old.context_breakdown || {}),
          ...(neu.context_breakdown || {})
        }
      }
    }
  }
  return next
}
