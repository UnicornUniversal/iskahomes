'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

const DEVELOPER_BASIC_SELECT = `
  id,
  developer_id,
  name,
  email,
  slug,
  phone,
  profile_image,
  admin_status,
  account_status,
  company_locations,
  default_currency,
  commission_rate,
  total_leads,
  total_appointments,
  total_units,
  total_developments,
  total_views,
  total_impressions,
  total_sales,
  total_revenue
`

const DEVELOPER_ANALYTICS_SELECT = `
  id,
  developer_id,
  name,
  email,
  slug,
  phone,
  profile_image,
  admin_status,
  account_status,
  company_locations,
  default_currency,
  commission_rate,
  leads_breakdown,
  conversion_rate,
  unique_leads,
  anonymous_leads,
  total_unique_leads,
  total_anonymous_leads,
  total_leads,
  total_appointments,
  total_units,
  total_developments,
  property_purposes_stats,
  property_categories_stats,
  property_types_stats,
  property_subtypes_stats,
  country_stats,
  state_stats,
  city_stats,
  town_stats,
  total_views,
  total_impressions,
  total_saved,
  total_sales,
  estimated_revenue,
  total_revenue,
  total_listings_views,
  total_profile_views,
  impressions_breakdown,
  lead_source_breakdown
`

const AGENCY_EXTENDED_SELECT = `
  id,
  agency_id,
  name,
  email,
  slug,
  phone,
  profile_image,
  admin_status,
  account_status,
  company_locations,
  default_currency,
  commission_rates,
  total_agents,
  total_listings,
  total_leads,
  total_impressions,
  total_sales,
  estimated_revenue,
  total_revenue
`

const AGENT_EXTENDED_SELECT = `
  id,
  agent_id,
  agency_id,
  location_id,
  name,
  email,
  slug,
  phone,
  profile_image,
  admin_status,
  account_status,
  agent_status,
  commission_rate,
  commission_rates,
  total_listings,
  total_leads,
  properties_sold,
  total_revenue,
  total_profile_views,
  estimated_revenue,
  total_commission
`

const profileCache = new Map()
const inflightRequests = new Map()

function getSelectForTable(table, scope) {
  if (table === 'developers') {
    return scope === 'analytics' ? DEVELOPER_ANALYTICS_SELECT : DEVELOPER_BASIC_SELECT
  }
  if (table === 'agencies') return AGENCY_EXTENDED_SELECT
  if (table === 'agents') return AGENT_EXTENDED_SELECT
  return 'id'
}

function getOwnerContext(user) {
  if (!user?.profile) return null

  if (user.user_type === 'developer') {
    return {
      table: 'developers',
      key: 'id',
      value: user.profile.id,
    }
  }

  if (user.user_type === 'agency') {
    return {
      table: 'agencies',
      key: 'id',
      value: user.profile.id,
    }
  }

  if (user.user_type === 'agent') {
    return {
      table: 'agents',
      key: 'id',
      value: user.profile.id,
    }
  }

  if (user.user_type === 'team_member' && user.profile.organization_type) {
    if (user.profile.organization_type === 'developer') {
      return {
        table: 'developers',
        key: 'id',
        value: user.profile.organization_id,
      }
    }
    if (user.profile.organization_type === 'agency') {
      return {
        table: 'agencies',
        key: 'id',
        value: user.profile.organization_id,
      }
    }
  }

  return null
}

export default function useExtendedAuthProfile(options = {}) {
  const { user } = useAuth()
  const scope = options.scope === 'analytics' ? 'analytics' : 'basic'
  const [extendedProfile, setExtendedProfile] = useState(null)
  const [loading, setLoading] = useState(false)

  const ownerContext = useMemo(() => getOwnerContext(user), [user])
  const requestKey = useMemo(() => {
    if (!ownerContext?.table || !ownerContext?.key || !ownerContext?.value) return null
    return `${ownerContext.table}:${ownerContext.key}:${ownerContext.value}:${scope}`
  }, [ownerContext, scope])

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!ownerContext?.table || !ownerContext?.key || !ownerContext?.value || !requestKey) {
        if (!cancelled) setExtendedProfile(null)
        return
      }

      const cached = profileCache.get(requestKey)
      if (cached) {
        if (!cancelled) setExtendedProfile(cached)
        return
      }

      setLoading(true)
      try {
        let request = inflightRequests.get(requestKey)
        if (!request) {
          const selectFields = getSelectForTable(ownerContext.table, scope)
          request = supabase
            .from(ownerContext.table)
            .select(selectFields)
            .eq(ownerContext.key, ownerContext.value)
            .maybeSingle()
            .then(({ data }) => data || null)
            .finally(() => inflightRequests.delete(requestKey))
          inflightRequests.set(requestKey, request)
        }

        const data = await request
        if (data) profileCache.set(requestKey, data)

        if (!cancelled) setExtendedProfile(data || null)
      } catch {
        if (!cancelled) setExtendedProfile(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [ownerContext, requestKey, scope])

  return { extendedProfile, loading }
}

