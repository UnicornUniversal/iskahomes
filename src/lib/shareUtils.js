// Share medium values for lead attribution (lead_source)
export const SHARE_MEDIUMS = {
  COPY_LINK: 'copy_link',
  WHATSAPP: 'whatsapp',
  FACEBOOK: 'facebook',
  TWITTER: 'twitter',
  LINKEDIN: 'linkedin',
  TELEGRAM: 'telegram',
  EMAIL: 'email',
  INSTAGRAM: 'instagram',
  WEBSITE: 'website' // Direct visit, no share param
}

const ALLOWED_SHARE_MEDIA = new Set(Object.values(SHARE_MEDIUMS))

/**
 * Ensures share_medium is a single safe token (e.g. "telegram").
 * Values like "telegram 4 bedroom..." break URL parsing in Telegram/WhatsApp — links stop being clickable.
 */
export function sanitizeShareMedium(raw) {
  if (raw == null || raw === '') return ''
  const token = String(raw).trim().split(/\s+/)[0].toLowerCase()
  return ALLOWED_SHARE_MEDIA.has(token) ? token : ''
}

/**
 * Canonical share URL without stale/broken query strings (only path matters for routing).
 */
export function getCanonicalShareBaseUrl(entity, entityType = 'listing') {
  if (typeof window === 'undefined') return ''
  const origin = window.location.origin
  try {
    if (entityType === 'listing' && entity?.id && entity.slug && entity.listing_type) {
      return `${origin}/home/property/${encodeURIComponent(entity.listing_type)}/${encodeURIComponent(entity.slug)}/${entity.id}`
    }
    if (entityType === 'development' && entity?.slug) {
      return `${origin}/home/allDevelopments/${encodeURIComponent(entity.slug)}`
    }
    if (entityType === 'developer' && entity?.slug) {
      return `${origin}/home/allDevelopers/${encodeURIComponent(entity.slug)}`
    }
    if (entityType === 'agent' && entity?.slug) {
      return `${origin}/home/allAgents/${encodeURIComponent(entity.slug)}`
    }
    if (entityType === 'agency' && entity?.slug) {
      return `${origin}/home/allAgencies/${encodeURIComponent(entity.slug)}`
    }
  } catch {
    /* fall through */
  }
  return ''
}

/** Prefer canonical entity URL; otherwise current path only (strip query/hash junk). */
export function getShareBaseUrl(entity, entityType = 'listing') {
  const canonical = getCanonicalShareBaseUrl(entity, entityType)
  if (canonical) return canonical
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${window.location.pathname}`
  }
  return ''
}

/**
 * Append share_medium to URL for lead attribution.
 * When someone shares a link (copy, WhatsApp, etc.), the recipient's lead will have lead_source set.
 */
export const appendShareMediumToUrl = (url, shareMedium) => {
  if (!url || !shareMedium) return url
  const medium = sanitizeShareMedium(shareMedium)
  if (!medium) return url
  try {
    const u = new URL(url)
    u.searchParams.delete('share_medium')
    u.searchParams.set('share_medium', medium)
    return u.toString()
  } catch {
    return url
  }
}

/** @typedef {'listing' | 'development' | 'developer' | 'agent' | 'agency'} ShareEntityType */

/**
 * @param {object} entity
 * @param {ShareEntityType} entityType
 */
function resolveProfileImageUrl(entity) {
  if (!entity?.profile_image) return null
  const p = entity.profile_image
  if (typeof p === 'string') return p
  return p?.url || null
}

/**
 * Display title for share previews (listing title, development name, developer name).
 * @param {object} entity
 * @param {ShareEntityType} entityType
 */
export function getShareDisplayTitle(entity, entityType = 'listing') {
  if (entityType === 'developer') return entity?.name || 'Developer on Iska Homes'
  if (entityType === 'agent') return entity?.name || 'Agent on Iska Homes'
  if (entityType === 'agency') return entity?.name || 'Agency on Iska Homes'
  if (entityType === 'development') return entity?.title || entity?.name || 'Development on Iska Homes'
  return entity?.title || 'Property on Iska Homes'
}

/**
 * @param {object} entity
 * @param {ShareEntityType} entityType
 */
export function getShareLocationLine(entity, entityType = 'listing') {
  if (!entity) return 'Location on request'
  if (entityType === 'developer' || entityType === 'agent' || entityType === 'agency') {
    const parts = [entity.city, entity.state || entity.region, entity.country].filter(Boolean)
    return parts.length ? parts.join(', ') : 'Iska Homes'
  }
  const parts = [entity.city, entity.state || entity.region, entity.country].filter(Boolean)
  return parts.length ? parts.join(', ') : 'Location on request'
}

// Utility function to generate share URLs and metadata
export const generateShareData = (property, currentUrl, shareMedium = null, entityType = 'listing') => {
  let shareUrl =
    currentUrl ||
    getShareBaseUrl(property, entityType) ||
    (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '')
  if (shareMedium) {
    shareUrl = appendShareMediumToUrl(shareUrl, shareMedium)
  }

  const displayTitle = getShareDisplayTitle(property, entityType)
  let description = 'Discover more on Iska Homes.'
  if (entityType === 'listing' && property?.description) {
    description = property.description.substring(0, 160) + (property.description.length > 160 ? '...' : '')
  } else if (entityType === 'development' && property?.description) {
    description = property.description.substring(0, 160) + (property.description.length > 160 ? '...' : '')
  } else if (entityType === 'developer') {
    const raw = property?.bio || property?.description || ''
    description = raw ? raw.substring(0, 160) + (raw.length > 160 ? '...' : '') : `View ${property?.name || 'this developer'}'s profile, developments, and listings on Iska Homes.`
  } else if (entityType === 'agent') {
    const raw = property?.bio || ''
    description = raw ? raw.substring(0, 160) + (raw.length > 160 ? '...' : '') : `View ${property?.name || 'this agent'}'s profile and listings on Iska Homes.`
  } else if (entityType === 'agency') {
    const raw = property?.description || ''
    description = raw ? raw.substring(0, 160) + (raw.length > 160 ? '...' : '') : `View ${property?.name || 'this agency'}'s profile and team on Iska Homes.`
  }

  const price =
    entityType === 'listing' && property?.price
      ? `${property.currency} ${parseFloat(property.price).toLocaleString()}${property.price_type === 'rent' ? `/${property.duration}` : ''}`
      : entityType === 'listing'
        ? 'Price available on request'
        : null

  const location = getShareLocationLine(property, entityType)

  let image = null
  if (entityType === 'listing') {
    image = property?.media?.mediaFiles?.[0]?.url || property?.media?.banner?.url
  } else if (entityType === 'development') {
    image = property?.banner?.url || property?.media?.banner?.url
  } else if (entityType === 'agency' && typeof property?.profile_image === 'string') {
    image = property.profile_image
  } else {
    image = resolveProfileImageUrl(property)
  }

  return {
    url: shareUrl,
    title: displayTitle,
    description,
    price,
    location,
    hashtags: ['RealEstate', 'Property', 'Home', 'ForSale', 'ForRent'],
    image
  }
}

function shareSnippetForSocial(entity, entityType) {
  const title = getShareDisplayTitle(entity, entityType)
  const loc = getShareLocationLine(entity, entityType)
  if (entityType === 'listing') {
    const priceLine =
      entity?.price && entity?.currency
        ? `${entity.currency} ${parseFloat(entity.price).toLocaleString()}${entity.price_type === 'rent' && entity.duration ? `/${entity.duration}` : ''}`
        : 'Price on request'
    const desc = entity?.description?.substring(0, 120) || 'Discover this listing on Iska Homes.'
    return { title, loc, priceLine, desc }
  }
  if (entityType === 'development') {
    const desc = entity?.description?.substring(0, 160) || 'Discover this development on Iska Homes.'
    return { title, loc, priceLine: null, desc }
  }
  const desc =
    entityType === 'developer'
      ? (entity?.bio || entity?.description || '').substring(0, 160) || `View ${title} on Iska Homes.`
      : entityType === 'agent'
        ? (entity?.bio || '').substring(0, 160) || `View ${title} on Iska Homes.`
        : (entity?.description || '').substring(0, 160) || `View ${title} on Iska Homes.`
  return { title, loc, priceLine: null, desc }
}

// Social media specific share data - each platform gets URL with share_medium for lead attribution
export const getSocialShareData = (property, currentUrl, entityType = 'listing') => {
  const baseUrl =
    currentUrl ||
    getShareBaseUrl(property, entityType) ||
    (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '')
  const { title, loc, priceLine, desc } = shareSnippetForSocial(property, entityType)

  const listingQuote =
    entityType === 'listing'
      ? `${title} — ${priceLine} — ${loc}. ${desc}`
      : null

  return {
    facebook: {
      url: appendShareMediumToUrl(baseUrl, SHARE_MEDIUMS.FACEBOOK),
      quote:
        entityType === 'listing'
          ? listingQuote
          : `${title} — ${loc}. ${desc}`
    },
    twitter: {
      url: appendShareMediumToUrl(baseUrl, SHARE_MEDIUMS.TWITTER),
      title: entityType === 'listing' && priceLine ? `${title} — ${priceLine}` : `${title} — ${loc}`,
      hashtags: ['RealEstate', 'Property', 'Home'].slice(0, 3),
      via: 'IskaHomes'
    },
    linkedin: {
      url: appendShareMediumToUrl(baseUrl, SHARE_MEDIUMS.LINKEDIN),
      title,
      summary: entityType === 'listing' && priceLine ? `${desc} ${loc}. ${priceLine}` : `${desc} ${loc}.`
    },
    whatsapp: {
      url: appendShareMediumToUrl(baseUrl, SHARE_MEDIUMS.WHATSAPP),
      title: entityType === 'listing' && priceLine ? `${title} — ${priceLine} — ${loc}` : `${title} — ${loc}`
    },
    telegram: {
      url: appendShareMediumToUrl(baseUrl, SHARE_MEDIUMS.TELEGRAM),
      title
    },
    email: {
      url: appendShareMediumToUrl(baseUrl, SHARE_MEDIUMS.EMAIL),
      subject:
        entityType === 'listing'
          ? `Property on Iska Homes: ${title}`
          : entityType === 'development'
            ? `Development on Iska Homes: ${title}`
            : `Profile on Iska Homes: ${title}`,
      body: `Hi,\n\n${entityType === 'listing' ? 'I found this listing' : 'Check out this page'} on Iska Homes:\n\n${title}\n${loc}${priceLine ? `\n${priceLine}` : ''}\n\n${desc}\n\nView it here: ${appendShareMediumToUrl(baseUrl, SHARE_MEDIUMS.EMAIL)}\n\nBest regards!`
    },
    instagram: {
      url: appendShareMediumToUrl(baseUrl, SHARE_MEDIUMS.INSTAGRAM),
      title,
      text:
        entityType === 'listing'
          ? `🏠 ${title}\n\n💰 ${priceLine}\n📍 ${loc}\n\n${desc}\n\n🔗 ${appendShareMediumToUrl(baseUrl, SHARE_MEDIUMS.INSTAGRAM)}\n\n#RealEstate #Property #Home`
          : `👤 ${title}\n📍 ${loc}\n\n${desc}\n\n🔗 ${appendShareMediumToUrl(baseUrl, SHARE_MEDIUMS.INSTAGRAM)}\n\n#RealEstate #IskaHomes`
    }
  }
}
