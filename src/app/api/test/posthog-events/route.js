import { NextResponse } from 'next/server'
import { fetchPostHogEventsByTimeRange } from '@/lib/posthogCron'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const eventName = searchParams.get('event') || null
    const hours = parseInt(searchParams.get('hours') || '24') // Default 24 hours

    const endTime = new Date()
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000)

    console.log(`📊 Fetching PostHog events from ${startTime.toISOString()} to ${endTime.toISOString()}`)

    const { events, next } = await fetchPostHogEventsByTimeRange(
      startTime,
      endTime,
      [], // Fetch all events
      null
    )

    const customEventNames = [
      'property_view', 'listing_impression', 'lead_phone', 'lead_message', 'lead_appointment',
      'impression_social_media', 'impression_website_visit', 'impression_share',
      'impression_saved_listing', 'profile_view', 'property_search', 'development_view',
      'development_share', 'development_saved', 'development_social_click',
      'development_interaction', 'development_lead', 'listing_sold'
    ]

    // Detailed event breakdown
    const eventBreakdown = events.reduce((acc, e) => {
      if (!acc[e.event]) {
        acc[e.event] = {
          count: 0,
          has_listing_id: 0,
          has_lister_id: 0,
          has_seeker_id: 0,
          sample_properties: null
        }
      }
      acc[e.event].count++
      if (e.properties?.listing_id || e.properties?.listingId) acc[e.event].has_listing_id++
      if (e.properties?.lister_id || e.properties?.listerId) acc[e.event].has_lister_id++
      if (e.properties?.seeker_id || e.properties?.seekerId || e.distinct_id) acc[e.event].has_seeker_id++
      if (!acc[e.event].sample_properties) {
        acc[e.event].sample_properties = {
          listing_id: e.properties?.listing_id || e.properties?.listingId || null,
          lister_id: e.properties?.lister_id || e.properties?.listerId || null,
          seeker_id: e.properties?.seeker_id || e.properties?.seekerId || null,
          distinct_id: e.distinct_id,
          viewed_from: e.properties?.viewed_from || e.properties?.viewedFrom || null,
          context_type: e.properties?.context_type || e.properties?.contextType || null,
          action_type: e.properties?.action_type || e.properties?.actionType || null,
          platform: e.properties?.platform || null
        }
      }
      return acc
    }, {})

    const customEvents = events.filter(e => customEventNames.includes(e.event))
    const nonCustomEvents = events.filter(e => !customEventNames.includes(e.event))

    // Group events by what table they should populate
    const tableMapping = {
      listing_analytics: ['property_view', 'listing_impression', 'impression_social_media', 'impression_website_visit', 'impression_share', 'impression_saved_listing'],
      leads: ['lead_phone', 'lead_message', 'lead_appointment'],
      user_analytics: ['profile_view', 'property_search'],
      development_analytics: ['development_view', 'development_share', 'development_saved', 'development_social_click', 'development_interaction', 'development_lead']
    }

    const eventsByTable = {}
    for (const [table, eventList] of Object.entries(tableMapping)) {
      eventsByTable[table] = {
        events: eventList,
        found: customEvents.filter(e => eventList.includes(e.event)),
        count: customEvents.filter(e => eventList.includes(e.event)).length,
        breakdown: eventList.reduce((acc, eventName) => {
          const found = customEvents.filter(e => e.event === eventName)
          if (found.length > 0) {
            acc[eventName] = {
              count: found.length,
              with_listing_id: found.filter(e => e.properties?.listing_id || e.properties?.listingId).length,
              with_lister_id: found.filter(e => e.properties?.lister_id || e.properties?.listerId).length,
              with_seeker_id: found.filter(e => e.properties?.seeker_id || e.properties?.seekerId).length
            }
          }
          return acc
        }, {})
      }
    }

    // Get unique listing IDs, lister IDs, and seeker IDs from custom events
    const uniqueListingIds = new Set()
    const uniqueListerIds = new Set()
    const uniqueSeekerIds = new Set()
    
    customEvents.forEach(e => {
      if (e.properties?.listing_id) uniqueListingIds.add(e.properties.listing_id)
      if (e.properties?.listingId) uniqueListingIds.add(e.properties.listingId)
      if (e.properties?.lister_id) uniqueListerIds.add(e.properties.lister_id)
      if (e.properties?.listerId) uniqueListerIds.add(e.properties.listerId)
      if (e.properties?.seeker_id) uniqueSeekerIds.add(e.properties.seeker_id)
      if (e.properties?.seekerId) uniqueSeekerIds.add(e.properties.seekerId)
      if (e.distinct_id) uniqueSeekerIds.add(e.distinct_id)
    })

    // Get 5 examples of each event type (not just first 50 total)
    const eventsByType = {}
    events.forEach(e => {
      if (!eventsByType[e.event]) {
        eventsByType[e.event] = []
      }
      if (eventsByType[e.event].length < 5) {
        eventsByType[e.event].push(e)
      }
    })
    
    // Flatten to get up to 5 examples per event type
    const limitedEvents = Object.values(eventsByType).flat().slice(0, limit)
    const limitedCustomEvents = Object.values(eventsByType)
      .filter(arr => customEventNames.includes(arr[0]?.event))
      .flat()
      .slice(0, limit)

    return NextResponse.json({
      success: true,
      timeRange: {
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        hours: hours
      },
      summary: {
        totalEvents: events.length,
        customEventsFound: customEvents.length,
        nonCustomEvents: nonCustomEvents.length,
        uniqueListingIds: uniqueListingIds.size,
        uniqueListerIds: uniqueListerIds.size,
        uniqueSeekerIds: uniqueSeekerIds.size
      },
      eventBreakdown: Object.entries(eventBreakdown)
        .sort((a, b) => b[1].count - a[1].count)
        .map(([event, data]) => ({
          event,
          count: data.count,
          has_listing_id: data.has_listing_id,
          has_lister_id: data.has_lister_id,
          has_seeker_id: data.has_seeker_id,
          sample_properties: data.sample_properties
        })),
      eventsByTable,
      customEventBreakdown: customEvents.reduce((acc, e) => {
        acc[e.event] = (acc[e.event] || 0) + 1
        return acc
      }, {}),
      uniqueIds: {
        listing_ids: Array.from(uniqueListingIds).slice(0, 20), // Limit to 20 for display
        lister_ids: Array.from(uniqueListerIds).slice(0, 20),
        seeker_ids: Array.from(uniqueSeekerIds).slice(0, 20)
      },
      // Show 5 examples of each event type
      eventsByType: Object.entries(eventsByType).reduce((acc, [eventName, eventList]) => {
        acc[eventName] = eventList.slice(0, 5).map(e => ({
          event: e.event,
          timestamp: e.timestamp,
          created_at: e.created_at,
          distinct_id: e.distinct_id,
          properties: {
            listing_id: e.properties?.listing_id || e.properties?.listingId || null,
            lister_id: e.properties?.lister_id || e.properties?.listerId || null,
            seeker_id: e.properties?.seeker_id || e.properties?.seekerId || null,
            viewed_from: e.properties?.viewed_from || e.properties?.viewedFrom || null,
            context_type: e.properties?.context_type || e.properties?.contextType || null,
            action_type: e.properties?.action_type || e.properties?.actionType || null,
            platform: e.properties?.platform || null,
            share_type: e.properties?.share_type || null
          }
        }))
        return acc
      }, {}),
      sampleEvents: limitedEvents.map(e => ({
        event: e.event,
        timestamp: e.timestamp,
        created_at: e.created_at,
        distinct_id: e.distinct_id,
        properties: {
          listing_id: e.properties?.listing_id || e.properties?.listingId || null,
          lister_id: e.properties?.lister_id || e.properties?.listerId || null,
          seeker_id: e.properties?.seeker_id || e.properties?.seekerId || null,
          viewed_from: e.properties?.viewed_from || e.properties?.viewedFrom || null,
          context_type: e.properties?.context_type || e.properties?.contextType || null,
          action_type: e.properties?.action_type || e.properties?.actionType || null,
          platform: e.properties?.platform || null,
          share_type: e.properties?.share_type || null
        }
      })),
      customEvents: limitedCustomEvents.map(e => ({
        event: e.event,
        timestamp: e.timestamp,
        created_at: e.created_at,
        distinct_id: e.distinct_id,
        properties: {
          listing_id: e.properties?.listing_id || e.properties?.listingId || null,
          lister_id: e.properties?.lister_id || e.properties?.listerId || null,
          seeker_id: e.properties?.seeker_id || e.properties?.seekerId || null,
          viewed_from: e.properties?.viewed_from || e.properties?.viewedFrom || null,
          context_type: e.properties?.context_type || e.properties?.contextType || null,
          action_type: e.properties?.action_type || e.properties?.actionType || null,
          platform: e.properties?.platform || null,
          share_type: e.properties?.share_type || null
        }
      })),
      hasMore: events.length > limit,
      hasNextPage: !!next,
      rawSample: limitedEvents[0] || null
    })

  } catch (error) {
    console.error('❌ PostHog test fetch error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
