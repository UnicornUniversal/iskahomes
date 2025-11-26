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

const MAX_FETCH_PAGES = 50

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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)

    const userId = searchParams.get('userId')
    const userType = searchParams.get('userType') || 'developer'
    const dates = searchParams.get('dates') // Comma-separated dates: "2025-11-06,2025-11-11,2025-11-12"
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    if (!dates) {
      return NextResponse.json(
        { success: false, error: 'dates parameter is required (comma-separated, e.g., "2025-11-06,2025-11-11")' },
        { status: 400 }
      )
    }

    const dateArray = dates.split(',').map(d => d.trim()).filter(Boolean)
    
    if (dateArray.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid dates provided' },
        { status: 400 }
      )
    }

    const results = {}

    for (const dateStr of dateArray) {
      // Validate date format
      const date = new Date(dateStr + 'T00:00:00.000Z')
      if (isNaN(date.getTime())) {
        results[dateStr] = {
          error: 'Invalid date format',
          events: []
        }
        continue
      }

      const startTime = new Date(date)
      startTime.setUTCHours(0, 0, 0, 0)
      const endTime = new Date(date)
      endTime.setUTCHours(23, 59, 59, 999)

      console.log(`📊 Fetching PostHog events for date ${dateStr} (${startTime.toISOString()} to ${endTime.toISOString()})`)

      // Fetch all events for this date
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

      // Filter events for this user
      const userEvents = allEvents.filter(event => matchesUser(event, userId))
      
      // Group by hour
      const eventsByHour = new Map()
      for (const event of userEvents) {
        const eventHour = new Date(event.timestamp).getUTCHours()
        if (!eventsByHour.has(eventHour)) {
          eventsByHour.set(eventHour, [])
        }
        eventsByHour.get(eventHour).push(event)
      }

      // Analyze events
      const analysis = {
        date: dateStr,
        totalEvents: allEvents.length,
        userEvents: userEvents.length,
        hoursWithEvents: Array.from(eventsByHour.keys()).sort((a, b) => a - b),
        eventsByHour: {},
        eventTypes: {},
        eventsWithoutListerId: [],
        eventsWithoutListingId: [],
        sampleEvents: []
      }

      // Count events by type
      for (const event of userEvents) {
        const eventType = event.event
        analysis.eventTypes[eventType] = (analysis.eventTypes[eventType] || 0) + 1
      }

      // Group by hour with details
      for (const [hour, events] of eventsByHour.entries()) {
        analysis.eventsByHour[hour] = {
          count: events.length,
          eventTypes: events.reduce((acc, e) => {
            acc[e.event] = (acc[e.event] || 0) + 1
            return acc
          }, {})
        }
      }

      // Find events missing lister_id
      for (const event of userEvents) {
        const props = event.properties || {}
        const listerId = props.lister_id || props.listerId || props.developer_id || props.developerId || props.agent_id || props.agentId
        
        if (!listerId) {
          analysis.eventsWithoutListerId.push({
            event: event.event,
            timestamp: event.timestamp,
            distinct_id: event.distinct_id,
            listing_id: props.listing_id || props.listingId || null,
            properties: {
              lister_id: props.lister_id,
              listerId: props.listerId,
              developer_id: props.developer_id,
              developerId: props.developerId,
              agent_id: props.agent_id,
              agentId: props.agentId
            }
          })
        }
      }

      // Find events missing listing_id (for property_view events)
      for (const event of userEvents) {
        if (event.event === 'property_view') {
          const props = event.properties || {}
          const listingId = props.listing_id || props.listingId || props.listing_uuid || props.property_id
          
          if (!listingId) {
            analysis.eventsWithoutListingId.push({
              event: event.event,
              timestamp: event.timestamp,
              distinct_id: event.distinct_id,
              properties: {
                listing_id: props.listing_id,
                listingId: props.listingId,
                listing_uuid: props.listing_uuid,
                property_id: props.property_id
              }
            })
          }
        }
      }

      // Sample events (first 5 of each type)
      const sampleByType = {}
      for (const event of userEvents) {
        const eventType = event.event
        if (!sampleByType[eventType] || sampleByType[eventType].length < 5) {
          if (!sampleByType[eventType]) {
            sampleByType[eventType] = []
          }
          sampleByType[eventType].push({
            event: event.event,
            timestamp: event.timestamp,
            distinct_id: event.distinct_id,
            properties: {
              lister_id: event.properties?.lister_id || event.properties?.listerId,
              developer_id: event.properties?.developer_id || event.properties?.developerId,
              listing_id: event.properties?.listing_id || event.properties?.listingId,
              viewed_from: event.properties?.viewed_from || event.properties?.viewedFrom
            }
          })
        }
      }
      analysis.sampleEvents = sampleByType

      results[dateStr] = analysis
    }

    return NextResponse.json({
      success: true,
      userId,
      userType,
      datesAnalyzed: dateArray,
      results
    })
  } catch (error) {
    console.error('Error in GET /api/test/missing-events:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

