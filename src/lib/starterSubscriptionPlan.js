/**
 * Starter (no-payment) plans are identified by package name — "Basic" or "Free".
 * Do not rely on price === 0 or is_free; those fields are not authoritative.
 */

export function isStarterPlanName(name) {
  const n = String(name || '').trim().toLowerCase()
  return n === 'basic' || n === 'free'
}

export function isStarterPlanPackage(pkg) {
  if (!pkg) return false
  const type = String(pkg.subscriptions_type || 'package').toLowerCase()
  if (type !== 'package') return false
  return isStarterPlanName(pkg.name)
}

export function packageMatchesUserType(pkg, dbUserType) {
  const ut = String(pkg.user_type || '').toLowerCase()
  if (!ut || ut === 'all') return true
  if (dbUserType === 'developer' && (ut === 'developers' || ut === 'developer')) return true
  if (dbUserType === 'agency' && (ut === 'agencies' || ut === 'agency')) return true
  if (dbUserType === 'agent' && (ut === 'agents' || ut === 'agent')) return true
  return false
}

/** @deprecated Use isStarterPlanPackage */
export const isFreePackageRow = isStarterPlanPackage
