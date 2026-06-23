import { supabaseAdmin } from '@/lib/supabase'
import { gracePeriodEndFromEndDate } from '@/lib/subscriptionGracePolicy'
import { findStarterPackageForUserType } from '@/lib/findStarterPackageForUserType'

const ACTIVE_SUBSCRIPTION_STATUSES = ['pending', 'active', 'grace_period']

/**
 * Assign the default starter plan (Basic or Free by name, per account type) on signup.
 */
export async function activateDefaultFreeSubscription({ userId, userType }) {
  const dbUserType =
    userType === 'developer' ? 'developer' : userType === 'agency' ? 'agency' : null

  if (!dbUserType || !userId) {
    return { success: false, error: 'Subscription assignment only applies to developers and agencies' }
  }

  const { data: existingSub, error: existingError } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('user_type', dbUserType)
    .eq('subscriptions_type', 'package')
    .in('status', ACTIVE_SUBSCRIPTION_STATUSES)
    .maybeSingle()

  if (existingError) {
    return { success: false, error: existingError.message }
  }

  if (existingSub) {
    return { success: true, skipped: true, subscriptionId: existingSub.id }
  }

  const { data: starterPlan, error: planError } = await findStarterPackageForUserType(dbUserType)
  if (planError || !starterPlan) {
    return { success: false, error: planError?.message || 'Starter plan (Basic/Free) not found' }
  }

  const now = new Date()
  const startDate = new Date(now)
  const durationMonths = 1200
  const endDate = new Date(startDate)
  endDate.setMonth(endDate.getMonth() + durationMonths)
  const gracePeriodEndDate = gracePeriodEndFromEndDate(endDate)

  const { data: newSub, error: createError } = await supabaseAdmin
    .from('subscriptions')
    .insert({
      user_id: userId,
      user_type: dbUserType,
      package_id: starterPlan.id,
      subscriptions_type: 'package',
      status: 'active',
      currency: 'USD',
      amount: 0,
      duration_months: durationMonths,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      grace_period_end_date: gracePeriodEndDate.toISOString(),
      activated_at: startDate.toISOString(),
      auto_renew: false,
    })
    .select('id')
    .single()

  if (createError) {
    return { success: false, error: createError.message }
  }

  await supabaseAdmin.from('subscription_history').insert({
    subscription_id: newSub.id,
    user_id: userId,
    user_type: dbUserType,
    event_type: 'activated',
    event_date: startDate.toISOString(),
    to_package_id: starterPlan.id,
    to_status: 'active',
    reason: `Default ${starterPlan.name} plan assigned on signup`,
    changed_by: 'system',
    changed_by_user_id: userId,
    metadata: {
      subscriptions_type: 'package',
      source: 'signup',
    },
  })

  return {
    success: true,
    subscriptionId: newSub.id,
    packageId: starterPlan.id,
    packageName: starterPlan.name,
  }
}
