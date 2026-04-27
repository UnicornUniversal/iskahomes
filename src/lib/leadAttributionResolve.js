/**
 * Resolve lead_source / lead_source_context from URL query parts or pre-filled body fields.
 * Rules: share_medium (shared link) wins over source=website + context; context only when lead_source is website.
 */

export const VALID_LEAD_ATTRIBUTION_CONTEXTS = new Set([
  'home',
  'explore',
  'search',
  'profile',
  'directory',
  'featured',
  'recommendations',
  'development',
])

function norm(s) {
  if (s == null || s === '') return ''
  return String(s).trim().toLowerCase().replace(/\s+/g, '_').slice(0, 64)
}

/**
 * @param {string} search - window.location.search or "?a=b" (leading ? optional)
 * @returns {{ lead_source: string, lead_source_context: string | null }}
 */
export function resolveLeadAttributionFromSearchString(search) {
  const q = search && search.startsWith('?') ? search.slice(1) : search || ''
  let params
  try {
    params = new URLSearchParams(q)
  } catch {
    return { lead_source: 'website', lead_source_context: null }
  }

  const share = norm(params.get('share_medium'))
  const sourceParam = norm(params.get('source'))
  const utm = norm(params.get('utm_source'))
  const contextParam = norm(params.get('context'))

  let lead_source = 'website'
  if (share) lead_source = share
  else if (sourceParam) lead_source = sourceParam
  else if (utm) lead_source = utm

  let lead_source_context = null
  if (lead_source === 'website' && contextParam && VALID_LEAD_ATTRIBUTION_CONTEXTS.has(contextParam)) {
    lead_source_context = contextParam
  }

  return { lead_source, lead_source_context }
}

/**
 * Server or client: merge explicit body fields with optional raw URL params.
 * @param {Record<string, unknown>} parts
 */
export function resolveLeadAttributionFromParts(parts = {}) {
  const share = norm(parts.share_medium)
  const sourceParam = norm(parts.source)
  const utm = norm(parts.utm_source)
  const attrCtx = norm(parts.attribution_context ?? parts.lead_attribution_context)
  const bodyCtx = norm(parts.lead_source_context)
  const bodySource = norm(parts.lead_source)

  let lead_source = 'website'
  if (share) lead_source = share
  else if (sourceParam) lead_source = sourceParam
  else if (utm) lead_source = utm
  else if (bodySource) lead_source = bodySource

  let lead_source_context = null
  if (lead_source === 'website') {
    const c = attrCtx || bodyCtx
    if (c && VALID_LEAD_ATTRIBUTION_CONTEXTS.has(c)) lead_source_context = c
  }

  return { lead_source, lead_source_context }
}
