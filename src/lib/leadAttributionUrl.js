import { LEAD_SOURCE_ISKAHOMES } from '@/lib/leadSource'

export {
  VALID_LEAD_ATTRIBUTION_CONTEXTS,
  resolveLeadAttributionFromSearchString,
  resolveLeadAttributionFromParts,
} from '@/lib/leadAttributionResolve'

/**
 * In-app lead attribution query params (distinct from share_medium on shared links).
 * - source=iskahomes → organic on-site traffic (legacy source=website is accepted)
 * - context → lead_source_context
 *
 * If the URL already has share_medium, it is left unchanged.
 */

export const LEAD_SOURCE_WEBSITE = LEAD_SOURCE_ISKAHOMES
export { LEAD_SOURCE_ISKAHOMES }

/** @typedef {'home'|'explore'|'search'|'profile'|'directory'|'featured'|'recommendations'|'development'} LeadAttributionContext */

export function withWebsiteLeadAttribution(href, context) {
  if (!href || href === '#' || href.startsWith('mailto:')) return href
  if (!context) return href

  try {
    const isAbsolute = /^https?:\/\//i.test(href)
    const u = isAbsolute ? new URL(href) : new URL(href, 'http://local.invalid')
    if (u.searchParams.has('share_medium')) {
      return href
    }
    u.searchParams.set('source', LEAD_SOURCE_ISKAHOMES)
    u.searchParams.set('context', context)
    if (isAbsolute) return u.toString()
    return `${u.pathname}${u.search}${u.hash || ''}`
  } catch {
    return href
  }
}
