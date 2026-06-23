/** Starter plan name keyword per account type (case-insensitive exact match). */
export const STARTER_PLAN_NAMES = {
  developer: 'basic',
  agency: 'free',
}

export function normalizePlanName(name) {
  return String(name || '').toLowerCase().trim()
}

export function isStarterPlanName(name, userType = null) {
  const normalized = normalizePlanName(name)
  if (!normalized) return false

  if (userType === 'developer') {
    return normalized === STARTER_PLAN_NAMES.developer
  }
  if (userType === 'agency') {
    return normalized === STARTER_PLAN_NAMES.agency
  }

  return (
    normalized === STARTER_PLAN_NAMES.developer ||
    normalized === STARTER_PLAN_NAMES.agency
  )
}

export function isStarterPlanPackage(pkg, userType = null) {
  if (!pkg) return false
  return isStarterPlanName(pkg.name, userType)
}

export function starterPlanNameForUserType(userType) {
  if (userType === 'developer') return STARTER_PLAN_NAMES.developer
  if (userType === 'agency') return STARTER_PLAN_NAMES.agency
  return null
}
