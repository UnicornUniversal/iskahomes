import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

function parseJSON(value, fallback = null) {
  if (!value) return fallback
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function getDateNDaysAgo(days) {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - days)
  return date.toISOString().split('T')[0]
}

function getStartDateForRange(range) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (range) {
    case 'today':
      return today.toISOString().split('T')[0]
    
    case 'week': {
      const dayOfWeek = today.getDay()
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      const monday = new Date(today)
      monday.setUTCDate(today.getUTCDate() - daysToMonday)
      return monday.toISOString().split('T')[0]
    }
    
    case 'month': {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      return firstDay.toISOString().split('T')[0]
    }
    
    case 'year': {
      const firstDayOfYear = new Date(today.getFullYear(), 0, 1)
      return firstDayOfYear.toISOString().split('T')[0]
    }
    
    case 'all':
      return '2020-01-01' // Early date to get all data
    
    default:
      // Default to this month
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      return firstDay.toISOString().split('T')[0]
  }
}

function aggregateUserAnalytics(rows) {
  const totals = {
    profile_views: 0,
    unique_profile_viewers: 0,
    profile_views_from_home: 0,
    profile_views_from_listings: 0,
    profile_views_from_search: 0,
    total_impressions: 0,
    impression_social_media: 0,
    impression_website: 0,
    impression_share: 0,
    impression_saved: 0
  }

  const dailyMap = new Map()

  rows.forEach(row => {
    totals.profile_views += row.profile_views || 0
    totals.unique_profile_viewers += row.unique_profile_viewers || 0
    totals.profile_views_from_home += row.profile_views_from_home || 0
    totals.profile_views_from_listings += row.profile_views_from_listings || 0
    totals.profile_views_from_search += row.profile_views_from_search || 0
    totals.total_impressions += row.total_impressions_received || 0
    totals.impression_social_media += row.impression_social_media_received || 0
    totals.impression_website += row.impression_website_visit_received || 0
    totals.impression_share += row.impression_share_received || 0
    totals.impression_saved += row.impression_saved_listing_received || 0

    const dateKey = row.date
    if (!dateKey) return
    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, {
        date: dateKey,
        profile_views: 0,
        unique_profile_viewers: 0,
        total_impressions: 0,
        impression_social_media: 0,
        impression_website: 0,
        impression_share: 0,
        impression_saved: 0,
        total_leads: 0,
        appointments_booked: 0
      })
    }
    const entry = dailyMap.get(dateKey)
    entry.profile_views += row.profile_views || 0
    entry.unique_profile_viewers += row.unique_profile_viewers || 0
    entry.profile_views_from_home = (entry.profile_views_from_home || 0) + (row.profile_views_from_home || 0)
    entry.profile_views_from_listings = (entry.profile_views_from_listings || 0) + (row.profile_views_from_listings || 0)
    entry.profile_views_from_search = (entry.profile_views_from_search || 0) + (row.profile_views_from_search || 0)
    entry.total_impressions += row.total_impressions_received || 0
    entry.impression_social_media += row.impression_social_media_received || 0
    entry.impression_website += row.impression_website_visit_received || 0
    entry.impression_share += row.impression_share_received || 0
    entry.impression_saved += row.impression_saved_listing_received || 0
  })

  const profileSeries = Array.from(dailyMap.values())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(entry => ({
      date: entry.date,
      total: entry.profile_views,
      unique: entry.unique_profile_viewers
    }))

  const impressionsSeries = Array.from(dailyMap.values())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(entry => ({
      date: entry.date,
      total: entry.total_impressions,
      social: entry.impression_social_media,
      website: entry.impression_website,
      share: entry.impression_share,
      saved: entry.impression_saved
    }))

  return { totals, profileSeries, impressionsSeries }
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)

    if (!decoded || decoded.user_type !== 'developer') {
      return NextResponse.json({ error: 'Invalid token or user type' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') // For backward compatibility
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    
    // Use custom date range if provided, otherwise use range
    let startDate, endDate
    if (dateFrom && dateTo) {
      startDate = dateFrom
      endDate = dateTo
    } else {
      startDate = getStartDateForRange(range || 'month')
      endDate = new Date().toISOString().split('T')[0]
    }
    
    const startDateTime = `${startDate}T00:00:00Z`
    const endDateTime = `${endDate}T23:59:59Z`
    
    // Calculate range_days for display purposes
    const startDateObj = new Date(startDate)
    const endDateObj = new Date(endDate)
    const diffTime = Math.abs(endDateObj - startDateObj)
    const rangeDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    const developerId = decoded.user_id

    const [
      { data: developer, error: developerError },
      { data: analyticsRows, error: analyticsError },
      { data: developerListings, error: listingsError }
    ] = await Promise.all([
      supabaseAdmin
        .from('developers')
        .select(`
          developer_id,
          name,
          slug,
          leads_breakdown,
          impressions_breakdown
        `)
        .eq('developer_id', developerId)
        .single(),
      supabaseAdmin
        .from('user_analytics')
        .select('*')
        .eq('user_id', developerId)
        .eq('user_type', 'developer')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .order('hour', { ascending: true })
        .limit(1000),
      supabaseAdmin
        .from('listings')
        .select('id')
        .eq('user_id', developerId)
        .eq('account_type', 'developer')
    ])

    if (developerError) {
      console.error('Error fetching developer stats:', developerError)
      return NextResponse.json(
        { error: 'Failed to fetch developer stats', details: developerError.message },
        { status: 500 }
      )
    }

    if (analyticsError) {
      console.error('Error fetching user analytics:', analyticsError)
      return NextResponse.json(
        { error: 'Failed to fetch analytics', details: analyticsError.message },
        { status: 500 }
      )
    }

    if (listingsError) {
      console.error('Error fetching developer listings:', listingsError)
      return NextResponse.json(
        { error: 'Failed to fetch listings', details: listingsError.message },
        { status: 500 }
      )
    }

    const {
      totals,
      profileSeries,
      impressionsSeries
    } = aggregateUserAnalytics(analyticsRows || [])

    const latestEntry =
      analyticsRows && analyticsRows.length > 0
        ? analyticsRows[analyticsRows.length - 1]
        : null

    const latestChanges = {
      profile_views_change: parseJSON(latestEntry?.profile_views_change),
      impressions_change: parseJSON(latestEntry?.impressions_change)
    }

    const listingIds = (developerListings || []).map(listing => listing.id).filter(Boolean)

    let savedPropertiesCount = 0
    let appointmentsCount = 0

    if (listingIds.length > 0) {
      const [
        { count: savedCount, error: savedCountError },
        { count: appointmentsResult, error: appointmentsError }
      ] = await Promise.all([
        supabaseAdmin
          .from('saved_listings')
          .select('id', { count: 'exact', head: true })
          .in('listing_id', listingIds)
          .gte('created_at', startDateTime)
          .lte('created_at', endDateTime),
        supabaseAdmin
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('account_type', 'developer')
          .eq('account_id', developerId)
          .in('listing_id', listingIds)
          .gte('appointment_date', startDate)
          .lte('appointment_date', endDate)
      ])

      if (savedCountError) {
        console.error('Error counting saved listings:', savedCountError)
      } else if (typeof savedCount === 'number') {
        savedPropertiesCount = savedCount
      }

      if (appointmentsError) {
        console.error('Error counting appointments:', appointmentsError)
      } else if (typeof appointmentsResult === 'number') {
        appointmentsCount = appointmentsResult
      }
    }

    const responseData = {
      success: true,
      data: {
        developer: {
          name: developer?.name || null,
          slug: developer?.slug || null,
          total_profile_views: totals.profile_views,
          total_impressions: totals.total_impressions,
          total_saved: savedPropertiesCount,
          total_appointments: appointmentsCount,
          leads_breakdown: parseJSON(developer?.leads_breakdown, {}),
          impressions_breakdown: parseJSON(developer?.impressions_breakdown, {})
        },
        summary: {
          range_days: rangeDays,
          range_type: range,
          profile_views: totals.profile_views,
          unique_profile_viewers: totals.unique_profile_viewers,
          profile_views_from_home: totals.profile_views_from_home,
          profile_views_from_listings: totals.profile_views_from_listings,
          profile_views_from_search: totals.profile_views_from_search,
          total_impressions: totals.total_impressions,
          impression_social_media: totals.impression_social_media,
          impression_website: totals.impression_website,
          impression_share: totals.impression_share,
          impression_saved: totals.impression_saved,
          appointments_booked: appointmentsCount,
          properties_saved: savedPropertiesCount,
          // Use unique_leads + anonymous_leads instead of total_leads (which counts actions, not individuals)
          total_leads: (developer?.total_unique_leads || 0) + (developer?.total_anonymous_leads || 0) || 
                       (developer?.unique_leads || 0) + (developer?.anonymous_leads || 0) || 
                       (developer?.total_leads || 0),
          conversion_rate: totals.profile_views > 0 
            ? ((((developer?.total_unique_leads || 0) + (developer?.total_anonymous_leads || 0) || 
                 (developer?.unique_leads || 0) + (developer?.anonymous_leads || 0) || 
                 (developer?.total_leads || 0)) / totals.profile_views) * 100).toFixed(2)
            : 0
        },
        time_series: {
          profile_views: profileSeries,
          impressions: impressionsSeries
        },
        latest: latestEntry
          ? {
              date: latestEntry.date,
              hour: latestEntry.hour,
              profile_views: latestEntry.profile_views,
              total_impressions: latestEntry.total_impressions_received,
              profile_views_change: latestChanges.profile_views_change,
              impressions_change: latestChanges.impressions_change
            }
          : null
      }
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error in GET /api/developers/profile/analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

