import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'
import {
  getEffectiveLimits,
  hasAddonAccess,
  hasClientManagementAddonInLimits
} from '@/lib/subscriptionLimits'

const ACTIVE_STATUSES = ['pending', 'active', 'grace_period']

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    const decoded = verifyToken(authHeader.split(' ')[1])
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = decoded.developer_id || decoded.agent_id || decoded.user_id
    const userType = decoded.user_type
    const dbUserType =
      userType === 'developer' ? 'developer' :
      userType === 'agency' ? 'agency' :
      userType === 'agent' ? 'agent' : null

    if (!userId || !dbUserType) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
    }

    const { data: mainSub, error: mainErr } = await supabaseAdmin
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
      .maybeSingle()

    if (mainErr) {
      console.error('Limits API main sub error:', mainErr)
      return NextResponse.json({ error: 'Failed to load subscription' }, { status: 500 })
    }

    const { data: addonSubs, error: addonErr } = await supabaseAdmin
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

    if (addonErr) {
      console.error('Limits API addons error:', addonErr)
    }

    const limits = getEffectiveLimits(mainSub, addonSubs || [])
    const hasAddon = hasAddonAccess(addonSubs || [])
    const hasClientManagementAddon =
      hasAddon && hasClientManagementAddonInLimits(limits)

    let usage = {
      total_units: 0,
      total_developments: 0,
      total_listings: 0,
      total_agents: 0,
      total_leads: 0,
      total_appointments: 0,
      total_clients: 0,
      total_roles: 0,
      total_team_members: 0
    }

    if (dbUserType === 'developer') {
      const { data: dev } = await supabaseAdmin
        .from('developers')
        .select(
          'id, total_units, total_developments, total_leads, total_appointments'
        )
        .eq('developer_id', userId)
        .single()

      if (dev) {
        usage.total_units = Number(dev.total_units) || 0
        usage.total_developments = Number(dev.total_developments) || 0
        usage.total_leads = Number(dev.total_leads) || 0
        usage.total_appointments = Number(dev.total_appointments) || 0

        const orgId = dev.id

        const { count: rolesCount } = await supabaseAdmin
          .from('organization_roles')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('organization_type', 'developer')

        usage.total_roles = rolesCount ?? 0

        const { count: membersCount } = await supabaseAdmin
          .from('organization_team_members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('organization_type', 'developer')

        usage.total_team_members = membersCount ?? 0
      }

      const { count: clientsCount } = await supabaseAdmin
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('developer_id', userId)

      usage.total_clients = clientsCount ?? 0
    }

    if (dbUserType === 'agency') {
      const { data: agency } = await supabaseAdmin
        .from('agencies')
        .select(
          'total_listings, total_agents, total_leads, total_appointments, active_agents'
        )
        .eq('agency_id', userId)
        .single()

      if (agency) {
        usage.total_listings = Number(agency.total_listings) || 0
        usage.total_agents =
          Number(agency.total_agents) || Number(agency.active_agents) || 0
        usage.total_leads = Number(agency.total_leads) || 0
        usage.total_appointments = Number(agency.total_appointments) || 0
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        limits,
        usage,
        hasAddon,
        hasClientManagementAddon,
        userType: dbUserType
      }
    })
  } catch (err) {
    console.error('Subscription limits API error:', err)
    return NextResponse.json(
      { error: 'Failed to load limits' },
      { status: 500 }
    )
  }
}
