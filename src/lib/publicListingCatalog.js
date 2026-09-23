/** Public catalog: active, visible, and not held by admin. */

export const LISTING_ADMIN_HOLD_STATUSES = ['blocked', 'pending']

export function applyPublicListingCatalogFilters(query) {
  return query
    .eq('listing_status', 'active')
    .eq('visibility', true)
    .or('admin_status.is.null,admin_status.not.in.(blocked,pending)')
}

export function isListingAdminBlocked(adminStatus) {
  return String(adminStatus || '').toLowerCase() === 'blocked'
}

export function isListingPubliclyListed(listing) {
  const status = String(listing?.listing_status || '').toLowerCase()
  const adminStatus = String(listing?.admin_status || '').toLowerCase()
  return (
    status === 'active' &&
    listing?.visibility !== false &&
    !LISTING_ADMIN_HOLD_STATUSES.includes(adminStatus)
  )
}

export function filterPublicCatalogListings(listings) {
  if (!Array.isArray(listings)) return []
  return listings.filter(isListingPubliclyListed)
}
