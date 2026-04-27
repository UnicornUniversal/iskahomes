export {
  VALID_LEAD_ATTRIBUTION_CONTEXTS,
  resolveLeadAttributionFromSearchString,
  resolveLeadAttributionFromParts,
} from '@/lib/leadAttributionResolve'

/**
 * In-app lead attribution query params (distinct from share_medium on shared links).
 * - source=website → lead_source for organic on-site traffic
 * - context → lead_source_context (home, explore, search, profile, directory, featured, recommendations, development)
 *
 * If the URL already has share_medium, it is left unchanged (shared-link attribution).
 */

export const LEAD_SOURCE_WEBSITE = 'website'

/** @typedef {'home'|'explore'|'search'|'profile'|'directory'|'featured'|'recommendations'|'development'} LeadAttributionContext */

/**
 * @param {string} href - Path (e.g. /home/property/...) or full URL
 * @param {string} context - LeadAttributionContext
 * @returns {string}
 */
export function withWebsiteLeadAttribution(href, context) {
  if (!href || href === '#' || href.startsWith('mailto:')) return href
  if (!context) return href

  try {
    const isAbsolute = /^https?:\/\//i.test(href)
    const u = isAbsolute ? new URL(href) : new URL(href, 'http://local.invalid')
    if (u.searchParams.has('share_medium')) {
      return href
    }
    u.searchParams.set('source', LEAD_SOURCE_WEBSITE)
    u.searchParams.set('context', context)
    if (isAbsolute) return u.toString()
    return `${u.pathname}${u.search}${u.hash || ''}`
  } catch {
    return href
  }
}
