/**
 * Server-only: resolve subscription limits for a user (for API enforcement).
 */

import { supabaseAdmin } from '@/lib/supabase'
import {
  getEffectiveLimits,
  hasAddonAccess,
  hasClientManagementAddonInLimits,
  checkNumericLimit,
} from '@/lib/subscriptionLimits'
import { getCalendarMonthBounds } from '@/lib/subscriptionContext'

export const ACTIVE_SUBSCRIPTION_STATUSES = ['pending', 'active', 'grace_period']

const SUBSCRIPTION_SELECT = `
  *,
  subscriptions_package:package_id (
    id,
    name,
    subscriptions_type,
    api_limits,
    user_type
  )
`

async function fetchSubscriptions(userId, dbUserType) {
  const [mainResult, addonResult] = await Promise.all([
    supabaseAdmin
      .from('subscriptions')
      .select(SUBSCRIPTION_SELECT)
      .eq('user_id', userId)
      .eq('user_type', dbUserType)
      .eq('subscriptions_type', 'package')
      .in('status', ACTIVE_SUBSCRIPTION_STATUSES)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from('subscriptions')
      .select(SUBSCRIPTION_SELECT)
      .eq('user_id', userId)
      .eq('user_type', dbUserType)
      .eq('subscriptions_type', 'addon')
      .in('status', ACTIVE_SUBSCRIPTION_STATUSES),
  ])

  return {
    mainSub: mainResult.data,
    mainErr: mainResult.error,
    addonSubs: addonResult.data || [],
    addonErr: addonResult.error,
  }
}

async function getAgencyAgentIds(agencyId) {
  const { data } = await supabaseAdmin
    .from('agents')
    .select('agent_id')
    .eq('agency_id', agencyId)
  return (data || []).map((row) => row.agent_id).filter(Boolean)
}

async function countLeadsInMonth({ agencyId, developerId }) {
  const { start, end } = getCalendarMonthBounds()
  let query = supabaseAdmin
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .or('is_anonymous.is.null,is_anonymous.eq.false')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())

  if (agencyId) {
    query = query.eq('agency_id', agencyId)
  } else if (developerId) {
    query = query.eq('lister_type', 'developer').eq('lister_id', developerId)
  } else {
    return 0
  }

  const { count, error } = await query
  if (error) {
    console.error('countLeadsInMonth:', error)
    return 0
  }
  return count ?? 0
}

async function countAppointmentsInMonth({ agencyId, developerId, agentIds = [] }) {
  const { start, end } = getCalendarMonthBounds()
  const orFilters = []

  if (agencyId) {
    orFilters.push(`and(account_type.eq.agency,account_id.eq.${agencyId})`)
    if (agentIds.length > 0) {
      orFilters.push(
        `and(account_type.eq.agent,account_id.in.(${agentIds.join(',')}))`
      )
    }
  } else if (developerId) {
    orFilters.push(`and(account_type.eq.developer,account_id.eq.${developerId})`)
  } else {
    return 0
  }

  const { count, error } = await supabaseAdmin
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .or(orFilters.join(','))

  if (error) {
    console.error('countAppointmentsInMonth:', error)
    return 0
  }
  return count ?? 0
}

export async function getUsageForBillingAccount(userId, dbUserType) {
  const usage = {
    total_units: 0,
    total_developments: 0,
    total_listings: 0,
    total_agents: 0,
    total_leads: 0,
    total_appointments: 0,
    total_clients: 0,
    total_roles: 0,
    total_team_members: 0,
    leads_per_month: 0,
    appointments_per_month: 0,
    calendar_month_start: getCalendarMonthBounds().start.toISOString(),
    calendar_month_end: getCalendarMonthBounds().end.toISOString(),
  }

  if (dbUserType === 'developer') {
    const { data: dev } = await supabaseAdmin
      .from('developers')
      .select('id, total_units, total_developments, total_leads, total_appointments')
      .eq('developer_id', userId)
      .single()

    if (dev) {
      usage.total_units = Number(dev.total_units) || 0
      usage.total_developments = Number(dev.total_developments) || 0
      usage.total_leads = Number(dev.total_leads) || 0
      usage.total_appointments = Number(dev.total_appointments) || 0

      const orgId = dev.id
      const [{ count: rolesCount }, { count: membersCount }] = await Promise.all([
        supabaseAdmin
          .from('organization_roles')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('organization_type', 'developer'),
        supabaseAdmin
          .from('organization_team_members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('organization_type', 'developer'),
      ])
      usage.total_roles = rolesCount ?? 0
      usage.total_team_members = membersCount ?? 0
    }

    const { count: clientsCount } = await supabaseAdmin
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('developer_id', userId)
    usage.total_clients = clientsCount ?? 0

    usage.leads_per_month = await countLeadsInMonth({ developerId: userId })
    usage.appointments_per_month = await countAppointmentsInMonth({ developerId: userId })
    return usage
  }

  if (dbUserType === 'agency') {
    const { data: agency } = await supabaseAdmin
      .from('agencies')
      .select('id, total_listings, total_agents, total_leads, total_appointments, active_agents')
      .eq('agency_id', userId)
      .single()

    if (agency) {
      usage.total_listings = Number(agency.total_listings) || 0
      usage.total_agents =
        Number(agency.total_agents) || Number(agency.active_agents) || 0
      usage.total_leads = Number(agency.total_leads) || 0
      usage.total_appointments = Number(agency.total_appointments) || 0

      const orgId = agency.id
      const [{ count: rolesCount }, { count: membersCount }] = await Promise.all([
        supabaseAdmin
          .from('organization_roles')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('organization_type', 'agency'),
        supabaseAdmin
          .from('organization_team_members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('organization_type', 'agency'),
      ])
      usage.total_roles = rolesCount ?? 0
      usage.total_team_members = membersCount ?? 0
    }

    const agentIds = await getAgencyAgentIds(userId)
    usage.leads_per_month = await countLeadsInMonth({ agencyId: userId })
    usage.appointments_per_month = await countAppointmentsInMonth({
      agencyId: userId,
      agentIds,
    })
    return usage
  }

  return usage
}

/**
 * Get effective limits and addon access for a billing account.
 */
export async function getSubscriptionLimitsForUser(userId, dbUserType) {
  if (!userId || !dbUserType) {
    return {
      limits: {},
      hasAddon: false,
      hasClientManagementAddon: false,
      hasActiveSubscription: false,
      mainSubscription: null,
      packageName: null,
    }
  }

  const { mainSub, mainErr, addonSubs, addonErr } = await fetchSubscriptions(
    userId,
    dbUserType
  )

  if (mainErr || addonErr) {
    console.error('getSubscriptionLimitsForUser:', mainErr || addonErr)
    return {
      limits: {},
      hasAddon: false,
      hasClientManagementAddon: false,
      hasActiveSubscription: false,
      mainSubscription: null,
      packageName: null,
    }
  }

  const limits = getEffectiveLimits(mainSub, addonSubs || [])
  const hasAddon = hasAddonAccess(addonSubs || [])
  const hasClientManagementAddon =
    hasAddon && hasClientManagementAddonInLimits(limits)

  return {
    limits,
    hasAddon,
    hasClientManagementAddon,
    hasActiveSubscription: Boolean(mainSub),
    mainSubscription: mainSub,
    packageName: mainSub?.subscriptions_package?.name || null,
  }
}

export async function getFullSubscriptionState(userId, dbUserType) {
  const subscription = await getSubscriptionLimitsForUser(userId, dbUserType)
  const usage = await getUsageForBillingAccount(userId, dbUserType)
  return {
    ...subscription,
    usage,
    billingUserId: userId,
    billingUserType: dbUserType,
  }
}

/**
 * Block creating a new item when monthly/cumulative limit would be exceeded.
 */
export function assertCanIncrementLimit(limits, limitKey, currentUsage, label) {
  const nextUsage = Number(currentUsage) + 1
  const { allowed, limit, unlimited } = checkNumericLimit(limits, limitKey, nextUsage)
  if (allowed) {
    return { allowed: true }
  }
  const readable =
    label ||
    limitKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return {
    allowed: false,
    limit,
    unlimited,
    usage: currentUsage,
    message: `You have reached your plan limit for ${readable}${unlimited ? '' : ` (${limit})`}. Please upgrade your subscription.`,
  }
}

export async function assertAgencyMonthlyLeadAllowed(agencyId) {
  const { limits } = await getSubscriptionLimitsForUser(agencyId, 'agency')
  const usage = await getUsageForBillingAccount(agencyId, 'agency')
  return assertCanIncrementLimit(
    limits,
    'leads_per_month',
    usage.leads_per_month,
    'leads this month'
  )
}

export async function assertAgencyMonthlyAppointmentAllowed(agencyId) {
  const { limits } = await getSubscriptionLimitsForUser(agencyId, 'agency')
  const usage = await getUsageForBillingAccount(agencyId, 'agency')
  return assertCanIncrementLimit(
    limits,
    'appointments_per_month',
    usage.appointments_per_month,
    'appointments this month'
  )
}

export async function assertDeveloperMonthlyLeadAllowed(developerId) {
  const { limits } = await getSubscriptionLimitsForUser(developerId, 'developer')
  const usage = await getUsageForBillingAccount(developerId, 'developer')
  return assertCanIncrementLimit(
    limits,
    'leads_per_month',
    usage.leads_per_month,
    'leads this month'
  )
}

export async function assertDeveloperMonthlyAppointmentAllowed(developerId) {
  const { limits } = await getSubscriptionLimitsForUser(developerId, 'developer')
  const usage = await getUsageForBillingAccount(developerId, 'developer')
  return assertCanIncrementLimit(
    limits,
    'appointments_per_month',
    usage.appointments_per_month,
    'appointments this month'
  )
}

/**
 * Resolve agency_id for a lead and enforce monthly pool when applicable.
 */
export async function assertLeadCreationAllowed({ listerType, listerId, agencyId }) {
  let resolvedAgencyId = agencyId || null
  if (!resolvedAgencyId && listerType === 'agency') {
    resolvedAgencyId = listerId
  }
  if (!resolvedAgencyId && listerType === 'agent' && listerId) {
    const { data: agent } = await supabaseAdmin
      .from('agents')
      .select('agency_id')
      .eq('agent_id', listerId)
      .maybeSingle()
    resolvedAgencyId = agent?.agency_id || null
  }

  if (resolvedAgencyId) {
    return assertAgencyMonthlyLeadAllowed(resolvedAgencyId)
  }

  if (listerType === 'developer' && listerId) {
    return assertDeveloperMonthlyLeadAllowed(listerId)
  }

  return { allowed: true }
}

export async function assertAppointmentCreationAllowed({ accountType, accountId }) {
  if (accountType === 'agency') {
    return assertAgencyMonthlyAppointmentAllowed(accountId)
  }

  if (accountType === 'agent' && accountId) {
    const { data: agent } = await supabaseAdmin
      .from('agents')
      .select('agency_id')
      .eq('agent_id', accountId)
      .maybeSingle()
    if (agent?.agency_id) {
      return assertAgencyMonthlyAppointmentAllowed(agent.agency_id)
    }
  }

  if (accountType === 'developer' && accountId) {
    return assertDeveloperMonthlyAppointmentAllowed(accountId)
  }

  return { allowed: true }
}
