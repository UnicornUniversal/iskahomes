import { supabaseAdmin } from '@/lib/supabase'
import {
  isStarterPlanName,
  packageMatchesUserType,
} from '@/lib/starterSubscriptionPlan'

/**
 * Find the starter package (name Basic or Free) for a developer or agency account.
 */
export async function findStarterPackageForUserType(dbUserType) {
  const { data: candidates, error } = await supabaseAdmin
    .from('subscriptions_package')
    .select('*')
    .eq('is_active', true)
    .eq('subscriptions_type', 'package')
    .or('name.ilike.basic,name.ilike.free')

  if (error || !candidates?.length) {
    return { data: null, error: error || null }
  }

  const filtered = candidates.filter(
    (p) => packageMatchesUserType(p, dbUserType) && isStarterPlanName(p.name)
  )

  if (!filtered.length) return { data: null, error: null }

  filtered.sort((a, b) => {
    const aBasic = String(a.name || '').trim().toLowerCase() === 'basic' ? 0 : 1
    const bBasic = String(b.name || '').trim().toLowerCase() === 'basic' ? 0 : 1
    if (aBasic !== bBasic) return aBasic - bBasic
    return String(a.name || '').localeCompare(String(b.name || ''))
  })

  return { data: filtered[0], error: null }
}

/** @deprecated Use findStarterPackageForUserType */
export const findFreeMainPackageForUserType = findStarterPackageForUserType
