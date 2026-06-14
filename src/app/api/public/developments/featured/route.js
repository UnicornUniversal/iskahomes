import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { APPROVED_ADMIN_STATUS } from '@/lib/publicDevelopmentsHelper'

const FEATURED_PACKAGE_IDS = {
  infinity: 'cc8a96fb-0a20-41af-9aa1-d68f5d1752ce',
  platinum: 'b6668135-af4d-42cb-a776-06a1f1c9e21f'
}

const TIER_LIMITS = {
  infinity: 6,
  platinum: 4
}

const parseImageUrl = (value) => {
  if (!value) return null

  try {
    if (typeof value === 'string') {
      const parsed = JSON.parse(value)
      const resolved = parsed?.url || parsed || null
      return typeof resolved === 'string' && resolved.startsWith('http') ? resolved : null
    }

    if (typeof value === 'object') {
      const resolved = value?.url || value || null
      return typeof resolved === 'string' && resolved.startsWith('http') ? resolved : null
    }
  } catch {
    if (typeof value === 'string' && value.startsWith('http')) {
      return value
    }
  }

  return null
}

const parseTypeIds = (value) => {
  if (!value) return []

  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function getApprovedDeveloperIdsForPackage(packageId) {
  const { data: subscriptions, error: subError } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('user_type', 'developer')
    .in('status', ['active', 'grace_period'])
    .eq('package_id', packageId)

  if (subError) {
    throw subError
  }

  const subscriptionDeveloperIds = (subscriptions || []).map((sub) => sub.user_id).filter(Boolean)

  if (subscriptionDeveloperIds.length === 0) {
    return []
  }

  const { data: approvedDevelopers, error: approvedDevelopersError } = await supabase
    .from('developers')
    .select('developer_id')
    .in('developer_id', subscriptionDeveloperIds)
    .eq('admin_status', APPROVED_ADMIN_STATUS)

  if (approvedDevelopersError) {
    throw approvedDevelopersError
  }

  return (approvedDevelopers || []).map((developer) => developer.developer_id).filter(Boolean)
}

async function enrichDevelopment(development, subscriptionTier) {
  const { data: developer } = await supabase
    .from('developers')
    .select(`
      id,
      developer_id,
      name,
      slug,
      profile_image,
      city,
      region,
      country,
      company_locations,
      total_units,
      total_developments,
      verified
    `)
    .eq('developer_id', development.developer_id)
    .eq('admin_status', APPROVED_ADMIN_STATUS)
    .maybeSingle()

  const typeIds = parseTypeIds(development.types)
  let propertyTypes = []

  if (typeIds.length > 0) {
    const { data: types } = await supabase
      .from('property_types')
      .select('id, name')
      .in('id', typeIds)

    propertyTypes = types || []
  }

  return {
    ...development,
    subscription_tier: subscriptionTier,
    developer: developer || null,
    property_types: propertyTypes,
    banner_url: parseImageUrl(development.banner)
  }
}

async function fetchTierDevelopments(packageId, tierName, limit, excludeDevelopmentIds = []) {
  const developerIds = await getApprovedDeveloperIdsForPackage(packageId)

  if (developerIds.length === 0) {
    return []
  }

  const fetchLimit = limit + excludeDevelopmentIds.length

  const { data: developments, error } = await supabase
    .from('developments')
    .select('*')
    .in('developer_id', developerIds)
    .eq('development_status', 'active')
    .eq('admin_status', APPROVED_ADMIN_STATUS)
    .order('created_at', { ascending: false })
    .limit(fetchLimit)

  if (error) {
    throw error
  }

  const filteredDevelopments = (developments || [])
    .filter((development) => !excludeDevelopmentIds.includes(development.id))
    .slice(0, limit)

  return Promise.all(
    filteredDevelopments.map((development) => enrichDevelopment(development, tierName))
  )
}

async function resolvePackageIds() {
  const { data: packages, error } = await supabase
    .from('subscriptions_package')
    .select('id, name')
    .eq('is_active', true)

  if (error) {
    throw error
  }

  const packageMap = new Map(
    (packages || []).map((pkg) => [pkg.name?.toLowerCase(), pkg.id])
  )

  return {
    infinity: FEATURED_PACKAGE_IDS.infinity || packageMap.get('infinity') || packageMap.get('infinite'),
    platinum: FEATURED_PACKAGE_IDS.platinum || packageMap.get('platinum')
  }
}

export async function GET() {
  try {
    const packageIds = await resolvePackageIds()
    const featuredDevelopments = []
    const usedDevelopmentIds = []

    if (packageIds.infinity) {
      const infinityDevelopments = await fetchTierDevelopments(
        packageIds.infinity,
        'infinity',
        TIER_LIMITS.infinity,
        usedDevelopmentIds
      )

      infinityDevelopments.forEach((development) => {
        featuredDevelopments.push(development)
        usedDevelopmentIds.push(development.id)
      })
    }

    if (packageIds.platinum) {
      const platinumDevelopments = await fetchTierDevelopments(
        packageIds.platinum,
        'platinum',
        TIER_LIMITS.platinum,
        usedDevelopmentIds
      )

      platinumDevelopments.forEach((development) => {
        featuredDevelopments.push(development)
        usedDevelopmentIds.push(development.id)
      })
    }

    return NextResponse.json({
      success: true,
      data: featuredDevelopments
    })
  } catch (error) {
    console.error('Error in featured developments API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
