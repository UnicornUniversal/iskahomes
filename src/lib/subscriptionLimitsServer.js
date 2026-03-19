/**
 * Server-only: resolve subscription limits for a user (for API enforcement).
 */

import { supabaseAdmin } from '@/lib/supabase'
import {
  getEffectiveLimits,
  hasAddonAccess,
  hasClientManagementAddonInLimits
} from '@/lib/subscriptionLimits'

const ACTIVE_STATUSES = ['pending', 'active', 'grace_period']

/**
 * Get effective limits and addon access for a user. Use in API routes.
 * @param {string} userId - developer_id, agency_id, or user_id
 * @param {string} dbUserType - 'developer' | 'agency' | 'agent'
 * @returns {Promise<{ limits: object, hasAddon: boolean, hasClientManagementAddon: boolean }>}
 */
export async function getSubscriptionLimitsForUser(userId, dbUserType) {
  if (!userId || !dbUserType) {
    return { limits: {}, hasAddon: false, hasClientManagementAddon: false }
  }

  const [
    { data: mainSub, error: mainErr },
    { data: addonSubs, error: addonErr }
  ] = await Promise.all([
    supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        subscriptions_package:package_id (
          id,
          name,
          subscriptions_type,
          api_limits
        )
      `)
      .eq('user_id', userId)
      .eq('user_type', dbUserType)
      .eq('subscriptions_type', 'package')
      .in('status', ACTIVE_STATUSES)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        subscriptions_package:package_id (
          id,
          name,
          subscriptions_type,
          api_limits
        )
      `)
      .eq('user_id', userId)
      .eq('user_type', dbUserType)
      .eq('subscriptions_type', 'addon')
      .in('status', ACTIVE_STATUSES)
  ])

  if (mainErr || addonErr) {
    console.error('getSubscriptionLimitsForUser:', mainErr || addonErr)
    return { limits: {}, hasAddon: false, hasClientManagementAddon: false }
  }

  const limits = getEffectiveLimits(mainSub, addonSubs || [])
  const hasAddon = hasAddonAccess(addonSubs || [])
  const hasClientManagementAddon =
    hasAddon && hasClientManagementAddonInLimits(limits)

  return {
    limits,
    hasAddon,
    hasClientManagementAddon
  }
}
