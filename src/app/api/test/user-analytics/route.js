import { NextResponse } from 'next/server'
import { fetchPostHogEventsByQueryAPI } from '@/lib/posthogCron'

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

function createTotalsTemplate() {
  return {
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
    props.user_id,
    props.userId,
    event.distinct_id,
    event.person_id
  ]
  return candidates.some(value => value && String(value).toLowerCase() === needle)
}

function aggregateEvents(events) {
  const totals = createTotalsTemplate()
  const dailyMap = new Map()
  const profileViewerSet = new Set()
  const eventBreakdown = {}
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
        event_breakdown: {},
        total_events: 0,
        entries: [
          {
            id: `posthog-${dateKey}`,
            source: 'posthog_aggregate'
          }
        ]
      })
    }
    return dailyMap.get(dateKey)
  }

  for (const event of events) {
    const eventName = event.event
    const dateKey = toDayKey(event.timestamp)
    const dayEntry = getDayEntry(dateKey)
    const props = event.properties || {}

    eventBreakdown[eventName] = (eventBreakdown[eventName] || 0) + 1
    dayEntry.event_breakdown[eventName] = (dayEntry.event_breakdown[eventName] || 0) + 1
    dayEntry.total_events++

    switch (eventName) {
      case 'profile_view':
        totals.profile_views++
        totals.total_views++
        dayEntry.profile_views++
        dayEntry.total_views++
        if (event.distinct_id) profileViewerSet.add(event.distinct_id)
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
        totals.total_impressions_received++
        dayEntry.total_impressions++
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
        totals.impression_share_received++
        totals.total_impressions_received++
        dayEntry.total_impressions++
        break
      case 'impression_saved_listing':
        totals.impression_saved_listing_received++
        totals.total_impressions_received++
        dayEntry.total_impressions++
        break
      default:
        break
    }

    if (leadEvents.has(eventName)) {
      totals.total_listing_leads++
      totals.total_leads++
      dayEntry.total_listing_leads++
      dayEntry.total_leads++
    }

    if (eventName === 'lead_appointment') totals.appointments_booked++
    if (eventName === 'lead_message') totals.leads_initiated++
  }

  totals.unique_profile_viewers = profileViewerSet.size

  const daily = Array.from(dailyMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date))

  return { totals, daily, eventBreakdown }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)

    const userId = searchParams.get('userId') || null
    const userType = searchParams.get('userType') || 'developer'
    const includeRaw = searchParams.get('includeRaw') === 'true'

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

    const filteredEvents = userId ? allEvents.filter(event => matchesUser(event, userId)) : allEvents

    const { totals, daily, eventBreakdown } = aggregateEvents(filteredEvents)

    totals.total_views = totals.total_views || (totals.profile_views + totals.total_listing_views)

    const sampleEvents = filteredEvents.slice(0, 25).map(event => ({
      event: event.event,
      timestamp: event.timestamp,
      listing_id: event.properties?.listing_id || event.properties?.listingId || null,
      lister_id: event.properties?.lister_id || event.properties?.listerId || null,
      distinct_id: event.distinct_id || null
    }))

    return NextResponse.json({
      success: true,
      filters: {
        userId,
        userType,
        startDate,
        endDate
      },
      counts: {
        totalEventsCaptured: filteredEvents.length,
        totalEventsFetched: allEvents.length,
        uniqueDates: daily.length,
        totalRows: daily.length,
        uniqueUsers: userId ? 1 : new Set(filteredEvents.map(event => event.properties?.lister_id || event.properties?.developer_id || event.distinct_id || event.person_id).filter(Boolean)).size
      },
      totals,
      daily,
      eventBreakdown,
      sampleEvents,
      rawEvents: includeRaw ? filteredEvents : undefined
    })
  } catch (error) {
    console.error('Error in GET /api/test/user-analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

