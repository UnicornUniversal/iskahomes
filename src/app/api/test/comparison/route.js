import { NextResponse } from 'next/server'
import { fetchPostHogEventsByQueryAPI } from '@/lib/posthogCron'
import { supabaseAdmin } from '@/lib/supabase'

const CUSTOM_EVENT_NAMES = [
  'property_view',
  'listing_impression',
  'lead',
  'lead_phone',
  'lead_message',
  'lead_appointment',
  'impression_social_media',
  'impression_website_visit',
  'impression_share',
  'impression_saved_listing',
  'profile_view',
  'property_search',
  'development_view',
  'development_share',
  'development_saved',
  'development_social_click',
  'development_interaction',
  'development_lead'
]

const DEFAULT_RANGE_DAYS = 7
const MAX_RANGE_DAYS = 60
const MAX_FETCH_PAGES = 50

function normalizeDate(input, fallback) {
  if (!input) return fallback
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return fallback
  return date.toISOString().split('T')[0]
}

function toDayKey(timestamp) {
  return new Date(timestamp).toISOString().split('T')[0]
}

function clampRange(startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diff = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1
  if (diff <= MAX_RANGE_DAYS) return { startDate, endDate }
  const clampedEnd = new Date(start)
  clampedEnd.setUTCDate(start.getUTCDate() + MAX_RANGE_DAYS - 1)
  return {
    startDate,
    endDate: clampedEnd.toISOString().split('T')[0]
  }
}

function matchesUser(event, userId) {
  if (!userId) return true
  const needle = String(userId).toLowerCase()
  const props = event.properties || {}
  const candidates = [
    props.lister_id,
    props.listerId,
    props.developer_id,
    props.developerId,
    props.agent_id,
    props.agentId,
    props.user_id,
    props.userId,
    props.profile_id,
    props.profileId,
    event.distinct_id,
    event.person_id
  ]
  return candidates.some(value => value && String(value).toLowerCase() === needle)
}

function aggregateEventsForUser(events, userId) {
  const totals = {
    profile_views: 0,
    unique_profile_viewers: new Set(),
    profile_views_from_home: 0,
    profile_views_from_listings: 0,
    profile_views_from_search: 0,
    total_listing_views: 0,
    total_listing_leads: 0,
    total_impressions_received: 0,
    impression_social_media_received: 0,
    impression_website_visit_received: 0,
    impression_share_received: 0,
    impression_saved_listing_received: 0,
    leads_initiated: 0,
    appointments_booked: 0,
    properties_viewed: 0,
    properties_saved: 0,
    total_views: 0,
    total_leads: 0,
    profile_leads: 0
  }

  const dailyMap = new Map()
  const leadEvents = new Set(['lead', 'lead_phone', 'lead_message', 'lead_appointment'])

  const getDayEntry = (dateKey) => {
    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, {
        date: dateKey,
        profile_views: 0,
        total_views: 0,
        total_listing_views: 0,
        total_listing_leads: 0,
        total_impressions: 0,
        total_leads: 0,
        profile_leads: 0
      })
    }
    return dailyMap.get(dateKey)
  }

  for (const event of events) {
    const eventName = event.event
    const dateKey = toDayKey(event.timestamp)
    const dayEntry = getDayEntry(dateKey)
    const props = event.properties || {}

    switch (eventName) {
      case 'profile_view':
        totals.profile_views++
        totals.total_views++
        dayEntry.profile_views++
        dayEntry.total_views++
        if (event.distinct_id) totals.unique_profile_viewers.add(event.distinct_id)
        if (props.viewed_from === 'home') totals.profile_views_from_home++
        if (props.viewed_from === 'listings') totals.profile_views_from_listings++
        if (props.viewed_from === 'search') totals.profile_views_from_search++
        break
      case 'property_view':
        totals.total_listing_views++
        totals.total_views++
        dayEntry.total_listing_views++
        dayEntry.total_views++
        break
      case 'listing_impression':
        // UPDATED: listing_impression is NOT an impression - it's just a view with metadata
        // Impressions = Engagement = Interactions only (saves, shares, website clicks, social media clicks)
        // Do NOT count as impression - views are tracked separately
        break
      case 'impression_social_media':
        totals.impression_social_media_received++
        totals.total_impressions_received++
        dayEntry.total_impressions++
        break
      case 'impression_website_visit':
        totals.impression_website_visit_received++
        totals.total_impressions_received++
        dayEntry.total_impressions++
        break
      case 'impression_share':
        // Count all impression_share events where user matches (both listing and profile shares)
        // This matches the cron which counts both listing.impression_share and profile_impression_share
        totals.impression_share_received++
        totals.total_impressions_received++
        dayEntry.total_impressions++
        break
      case 'impression_saved_listing':
        // CRITICAL FIX: Only count if listing_id exists (matches cron logic line 509)
        // The cron only processes impression_saved_listing if listingId exists
        if (props.listing_id || props.listingId || props.listing_uuid || props.property_id) {
          totals.impression_saved_listing_received++
          totals.total_impressions_received++
          dayEntry.total_impressions++
        }
        break
      default:
        break
    }

    if (leadEvents.has(eventName)) {
      // Check if it's a profile lead (no listing_id) or listing lead
      if (!props.listing_id && !props.listingId) {
        totals.profile_leads++
        totals.total_leads++
        dayEntry.profile_leads++
        dayEntry.total_leads++
      } else {
        totals.total_listing_leads++
        totals.total_leads++
        dayEntry.total_listing_leads++
        dayEntry.total_leads++
      }
    }

    if (eventName === 'lead_appointment') totals.appointments_booked++
    if (eventName === 'lead_message' || eventName === 'lead_phone') totals.leads_initiated++
  }

  // Convert Set to number
  totals.unique_profile_viewers = totals.unique_profile_viewers.size

  const daily = Array.from(dailyMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date))

  return { totals, daily }
}

function compareValues(posthogValue, dbValue, fieldName) {
  const posthog = Number(posthogValue) || 0
  const db = Number(dbValue) || 0
  const diff = posthog - db
  const diffPercent = db !== 0 ? ((diff / db) * 100).toFixed(2) : (posthog !== 0 ? 100 : 0)
  const match = diff === 0

  return {
    field: fieldName,
    posthog,
    database: db,
    difference: diff,
    differencePercent: Number(diffPercent),
    match,
    status: match ? 'match' : (Math.abs(diffPercent) > 5 ? 'major_diff' : 'minor_diff')
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)

    const userId = searchParams.get('userId')
    const userType = searchParams.get('userType') || 'developer'
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    const today = new Date().toISOString().split('T')[0]
    const defaultStart = new Date()
    defaultStart.setUTCDate(defaultStart.getUTCDate() - DEFAULT_RANGE_DAYS + 1)
    const defaultStartStr = defaultStart.toISOString().split('T')[0]

    let startDate = normalizeDate(searchParams.get('startDate'), defaultStartStr)
    let endDate = normalizeDate(searchParams.get('endDate'), today)

    const clamped = clampRange(startDate, endDate)
    startDate = clamped.startDate
    endDate = clamped.endDate

    const startTime = new Date(`${startDate}T00:00:00.000Z`)
    const endTime = new Date(`${endDate}T23:59:59.999Z`)

    // 1. Fetch from PostHog
    console.log(`📊 Fetching PostHog events for user ${userId} from ${startDate} to ${endDate}`)
    let offset = 0
    let hasMore = true
    let page = 0
    const allEvents = []

    while (hasMore && page < MAX_FETCH_PAGES) {
      const { events, hasMore: nextHasMore, offset: nextOffset } =
        await fetchPostHogEventsByQueryAPI(startTime, endTime, CUSTOM_EVENT_NAMES, offset)

      if (events && events.length > 0) {
        allEvents.push(...events)
      }

      hasMore = nextHasMore && events.length > 0
      offset = nextOffset
      page += 1

      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 150))
      }
    }

    const filteredEvents = allEvents.filter(event => matchesUser(event, userId))
    const { totals: posthogTotals, daily: posthogDaily } = aggregateEventsForUser(filteredEvents, userId)

    // Calculate hourly breakdown for PostHog events
    const posthogHourlyBreakdown = new Map()
    for (const event of filteredEvents) {
      const eventDate = toDayKey(event.timestamp)
      const eventHour = new Date(event.timestamp).getUTCHours()
      const key = `${eventDate}_${eventHour}`
      if (!posthogHourlyBreakdown.has(key)) {
        posthogHourlyBreakdown.set(key, {
          date: eventDate,
          hour: eventHour,
          events: []
        })
      }
      posthogHourlyBreakdown.get(key).events.push(event)
    }

    // 2. Fetch from Database
    console.log(`📊 Fetching database user_analytics for user ${userId} from ${startDate} to ${endDate}`)
    const { data: dbRows, error: dbError } = await supabaseAdmin
      .from('user_analytics')
      .select('*')
      .eq('user_id', userId)
      .eq('user_type', userType)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { success: false, error: 'Database error', details: dbError.message },
        { status: 500 }
      )
    }

    // Aggregate database data
    const dbTotals = {
      profile_views: 0,
      unique_profile_viewers: 0,
      profile_views_from_home: 0,
      profile_views_from_listings: 0,
      profile_views_from_search: 0,
      total_listing_views: 0,
      total_listing_leads: 0,
      total_impressions_received: 0,
      impression_social_media_received: 0,
      impression_website_visit_received: 0,
      impression_share_received: 0,
      impression_saved_listing_received: 0,
      leads_initiated: 0,
      appointments_booked: 0,
      properties_viewed: 0,
      properties_saved: 0,
      total_views: 0,
      total_leads: 0
    }

    const dbDailyMap = new Map()
    const uniqueProfileViewersByDate = new Map() // Track max unique_profile_viewers per date

    for (const row of dbRows || []) {
      // Aggregate totals
      dbTotals.profile_views += row.profile_views || 0
      // unique_profile_viewers should be MAX, not SUM (it's a count of unique viewers)
      const currentMax = uniqueProfileViewersByDate.get(row.date) || 0
      uniqueProfileViewersByDate.set(row.date, Math.max(currentMax, row.unique_profile_viewers || 0))
      dbTotals.profile_views_from_home += row.profile_views_from_home || 0
      dbTotals.profile_views_from_listings += row.profile_views_from_listings || 0
      dbTotals.profile_views_from_search += row.profile_views_from_search || 0
      dbTotals.total_listing_views += row.total_listing_views || 0
      dbTotals.total_listing_leads += row.total_listing_leads || 0
      dbTotals.total_impressions_received += row.total_impressions_received || 0
      dbTotals.impression_social_media_received += row.impression_social_media_received || 0
      dbTotals.impression_website_visit_received += row.impression_website_visit_received || 0
      dbTotals.impression_share_received += row.impression_share_received || 0
      dbTotals.impression_saved_listing_received += row.impression_saved_listing_received || 0
      dbTotals.leads_initiated += row.leads_initiated || 0
      dbTotals.appointments_booked += row.appointments_booked || 0
      dbTotals.properties_viewed += row.properties_viewed || 0
      dbTotals.properties_saved += row.properties_saved || 0
      dbTotals.total_views += row.total_views || 0
      dbTotals.total_leads += row.total_leads || 0

      // Daily aggregation
      const dateKey = row.date
      if (!dbDailyMap.has(dateKey)) {
        dbDailyMap.set(dateKey, {
          date: dateKey,
          profile_views: 0,
          total_views: 0,
          total_listing_views: 0,
          total_listing_leads: 0,
          total_impressions: 0,
          total_leads: 0,
          hours_count: 0 // Track how many hourly entries exist for this day
        })
      }
      const dayEntry = dbDailyMap.get(dateKey)
      dayEntry.profile_views += row.profile_views || 0
      dayEntry.total_views += row.total_views || 0
      dayEntry.total_listing_views += row.total_listing_views || 0
      dayEntry.total_listing_leads += row.total_listing_leads || 0
      dayEntry.total_impressions += row.total_impressions_received || 0
      dayEntry.total_leads += row.total_leads || 0
      dayEntry.hours_count += 1
    }

    // Set unique_profile_viewers to the max across all dates
    dbTotals.unique_profile_viewers = Math.max(...Array.from(uniqueProfileViewersByDate.values()), 0)

    const dbDaily = Array.from(dbDailyMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date))

    // 3. Compare totals
    const comparisons = {
      profile_views: compareValues(posthogTotals.profile_views, dbTotals.profile_views, 'profile_views'),
      unique_profile_viewers: compareValues(posthogTotals.unique_profile_viewers, dbTotals.unique_profile_viewers, 'unique_profile_viewers'),
      profile_views_from_home: compareValues(posthogTotals.profile_views_from_home, dbTotals.profile_views_from_home, 'profile_views_from_home'),
      profile_views_from_listings: compareValues(posthogTotals.profile_views_from_listings, dbTotals.profile_views_from_listings, 'profile_views_from_listings'),
      profile_views_from_search: compareValues(posthogTotals.profile_views_from_search, dbTotals.profile_views_from_search, 'profile_views_from_search'),
      total_listing_views: compareValues(posthogTotals.total_listing_views, dbTotals.total_listing_views, 'total_listing_views'),
      total_listing_leads: compareValues(posthogTotals.total_listing_leads, dbTotals.total_listing_leads, 'total_listing_leads'),
      total_impressions_received: compareValues(posthogTotals.total_impressions_received, dbTotals.total_impressions_received, 'total_impressions_received'),
      impression_social_media_received: compareValues(posthogTotals.impression_social_media_received, dbTotals.impression_social_media_received, 'impression_social_media_received'),
      impression_website_visit_received: compareValues(posthogTotals.impression_website_visit_received, dbTotals.impression_website_visit_received, 'impression_website_visit_received'),
      impression_share_received: compareValues(posthogTotals.impression_share_received, dbTotals.impression_share_received, 'impression_share_received'),
      impression_saved_listing_received: compareValues(posthogTotals.impression_saved_listing_received, dbTotals.impression_saved_listing_received, 'impression_saved_listing_received'),
      leads_initiated: compareValues(posthogTotals.leads_initiated, dbTotals.leads_initiated, 'leads_initiated'),
      appointments_booked: compareValues(posthogTotals.appointments_booked, dbTotals.appointments_booked, 'appointments_booked'),
      total_views: compareValues(posthogTotals.total_views, dbTotals.total_views, 'total_views'),
      total_leads: compareValues(posthogTotals.total_leads, dbTotals.total_leads, 'total_leads')
    }

    // 4. Compare daily data
    const allDates = new Set([...posthogDaily.map(d => d.date), ...dbDaily.map(d => d.date)])
    const dailyComparisons = Array.from(allDates).sort().map(date => {
      const posthogDay = posthogDaily.find(d => d.date === date) || {}
      const dbDay = dbDaily.find(d => d.date === date) || {}

      return {
        date,
        database_hours_count: dbDay.hours_count || 0, // How many hourly entries exist for this day
        profile_views: compareValues(posthogDay.profile_views, dbDay.profile_views, 'profile_views'),
        total_views: compareValues(posthogDay.total_views, dbDay.total_views, 'total_views'),
        total_listing_views: compareValues(posthogDay.total_listing_views, dbDay.total_listing_views, 'total_listing_views'),
        total_listing_leads: compareValues(posthogDay.total_listing_leads, dbDay.total_listing_leads, 'total_listing_leads'),
        total_impressions: compareValues(posthogDay.total_impressions, dbDay.total_impressions, 'total_impressions'),
        total_leads: compareValues(posthogDay.total_leads, dbDay.total_leads, 'total_leads')
      }
    })

    // 5. Calculate summary stats
    const comparisonArray = Object.values(comparisons)
    const matches = comparisonArray.filter(c => c.match).length
    const totalFields = comparisonArray.length
    const matchRate = totalFields > 0 ? ((matches / totalFields) * 100).toFixed(2) : 0
    const majorDiffs = comparisonArray.filter(c => c.status === 'major_diff').length
    const minorDiffs = comparisonArray.filter(c => c.status === 'minor_diff').length

    // 6. Identify missing days
    const posthogDates = new Set(posthogDaily.map(d => d.date))
    const dbDates = new Set(dbDaily.map(d => d.date))
    const missingDays = Array.from(posthogDates).filter(date => !dbDates.has(date))
    const extraDays = Array.from(dbDates).filter(date => !posthogDates.has(date))

    // 7. Calculate hourly breakdown for database
    const hourlyBreakdown = {}
    const dbHourlyMap = new Map() // Map<date_hour, row>
    for (const row of dbRows || []) {
      const key = `${row.date}_${row.hour}`
      dbHourlyMap.set(key, row)
      
      if (!hourlyBreakdown[row.date]) {
        hourlyBreakdown[row.date] = {
          date: row.date,
          hours: [],
          total_hours: 0
        }
      }
      hourlyBreakdown[row.date].hours.push({
        hour: row.hour,
        total_views: row.total_views || 0,
        total_leads: row.total_leads || 0
      })
      hourlyBreakdown[row.date].total_hours += 1
    }

    // 8. Compare hourly breakdown - find missing hours
    const hourlyComparison = []
    for (const [key, posthogHour] of posthogHourlyBreakdown.entries()) {
      const dbHour = dbHourlyMap.get(key)
      hourlyComparison.push({
        date: posthogHour.date,
        hour: posthogHour.hour,
        posthog_events: posthogHour.events.length,
        database_exists: !!dbHour,
        database_total_views: dbHour?.total_views || 0,
        database_total_leads: dbHour?.total_leads || 0
      })
    }
    
    // Also add database hours that don't have PostHog events
    for (const [key, dbRow] of dbHourlyMap.entries()) {
      if (!posthogHourlyBreakdown.has(key)) {
        hourlyComparison.push({
          date: dbRow.date,
          hour: dbRow.hour,
          posthog_events: 0,
          database_exists: true,
          database_total_views: dbRow.total_views || 0,
          database_total_leads: dbRow.total_leads || 0
        })
      }
    }
    
    hourlyComparison.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return a.hour - b.hour
    })

    return NextResponse.json({
      success: true,
      filters: {
        userId,
        userType,
        startDate,
        endDate
      },
      summary: {
        totalFields,
        matches,
        matchRate: Number(matchRate),
        majorDiffs,
        minorDiffs,
        totalEventsFromPostHog: filteredEvents.length,
        totalRowsFromDatabase: dbRows?.length || 0,
        posthogDaysCount: posthogDaily.length,
        databaseDaysCount: dbDaily.length,
        missingDays: missingDays.sort(),
        extraDays: extraDays.sort(),
        hourlyBreakdown: Object.values(hourlyBreakdown),
        hourlyComparison: hourlyComparison,
        missingHours: hourlyComparison.filter(h => h.posthog_events > 0 && !h.database_exists).length,
        extraHours: hourlyComparison.filter(h => h.posthog_events === 0 && h.database_exists).length
      },
      totals: {
        posthog: posthogTotals,
        database: dbTotals,
        comparisons
      },
      daily: {
        posthog: posthogDaily,
        database: dbDaily,
        comparisons: dailyComparisons
      }
    })
  } catch (error) {
    console.error('Error in GET /api/test/comparison:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

