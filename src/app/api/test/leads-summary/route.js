import { NextResponse } from 'next/server'
import { fetchEventsWithRetry } from '@/lib/posthogCron'
import crypto from 'crypto'

export async function GET(request) {
  try {
    // Fetch ALL lead events from PostHog (no time constraint, no filters)
    // Use a very wide time range (10 years ago to now) to effectively get all events
    const endTime = new Date()
    const startTime = new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000) // 10 years ago

    console.log(`📊 Fetching ALL lead events from PostHog (no filters, no time constraint): ${startTime.toISOString()} to ${endTime.toISOString()}`)

    // Fetch unified lead events from PostHog (including old format for backward compatibility)
    const leadEventNames = ['lead', 'lead_phone', 'lead_message', 'lead_appointment'] // Unified + legacy events
    
    console.log(`📡 Fetching ALL lead events from PostHog...`)
    const { success, events: allEvents, apiCalls, error } = await fetchEventsWithRetry(
      startTime,
      endTime,
      leadEventNames // Filter by unified lead event name + legacy events
    )

    if (!success || !allEvents) {
      console.error('❌ Failed to fetch events from PostHog:', error)
      return NextResponse.json({
        success: false,
        error: error?.message || 'Failed to fetch events from PostHog'
      }, { status: 500 })
    }

    console.log(`✅ Fetched ${allEvents.length} lead events from PostHog (${apiCalls || 1} API calls)`)

    // Filter to only lead events (should already be filtered, but double-check)
    
    const leadEvents = Array.isArray(allEvents) 
      ? allEvents.filter(e => leadEventNames.includes(e.event))
      : []

    console.log(`✅ Found ${leadEvents.length} lead events from PostHog`)

    // Process all lead events (no filtering)
    const filteredEvents = leadEvents
    console.log(`📊 Processing ${filteredEvents.length} lead events for aggregation`)

    // Process all lead events - simple format, no complex grouping
    const allLeads = filteredEvents.map(event => {
      const { event: eventName, properties = {}, distinct_id, timestamp } = event
      
      // Extract lead_type from properties (unified lead event)
      // Backward compatibility: derive from old event names if lead_type is missing
      let leadType = properties.lead_type || properties.leadType
      if (!leadType) {
        if (eventName === 'lead_phone') {
          leadType = 'phone'
        } else if (eventName === 'lead_message') {
          leadType = 'message'
        } else if (eventName === 'lead_appointment') {
          leadType = 'appointment'
        } else {
          leadType = 'unknown'
        }
      }
      
      // Extract all properties (handle both camelCase and snake_case)
      return {
        event: eventName, // Will be 'lead'
        lead_type: leadType, // 'phone', 'message', or 'appointment'
        timestamp: timestamp,
        distinct_id: distinct_id,
        listing_id: properties.listing_id || properties.listingId || properties.listing_uuid || properties.property_id || null,
        lister_id: properties.lister_id || properties.listerId || properties.developer_id || properties.developerId || properties.agent_id || properties.agentId || null,
        lister_type: properties.lister_type || properties.listerType || 
          (properties.developer_id || properties.developerId ? 'developer' : null) ||
          (properties.agent_id || properties.agentId ? 'agent' : null) || null,
        seeker_id: properties.seeker_id || properties.seekerId || distinct_id || null,
        context_type: properties.context_type || properties.contextType || null,
        profile_id: properties.profile_id || properties.profileId || null,
        action: properties.action || null,
        message_type: properties.message_type || properties.messageType || null,
        appointment_type: properties.appointment_type || properties.appointmentType || null,
        phone_number: properties.phone_number || properties.phoneNumber || null,
        // Include all other properties for debugging
        all_properties: properties
      }
    })

    // Simple aggregations by lead_type
    const eventBreakdown = allLeads.reduce((acc, lead) => {
      const key = `lead_${lead.lead_type}` // e.g., 'lead_phone', 'lead_message', 'lead_appointment'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    const contextTypeBreakdown = allLeads.reduce((acc, lead) => {
      const ctx = lead.context_type || 'unknown'
      acc[ctx] = (acc[ctx] || 0) + 1
      return acc
    }, {})

    const uniqueListings = new Set(allLeads.map(l => l.listing_id).filter(Boolean))
    const uniqueSeekers = new Set(allLeads.map(l => l.seeker_id).filter(Boolean))
    const uniqueListers = new Set(allLeads.map(l => l.lister_id).filter(Boolean))

    return NextResponse.json({
      success: true,
      source: 'PostHog',
      timeRange: {
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        note: 'All events (10 year range to fetch everything)'
      },
      summary: {
        total_lead_events: allLeads.length,
        unique_listings: uniqueListings.size,
        unique_seekers: uniqueSeekers.size,
        unique_listers: uniqueListers.size,
        api_calls: apiCalls || 1,
        event_breakdown: eventBreakdown,
        context_type_breakdown: contextTypeBreakdown,
        events_with_listing_id: allLeads.filter(l => l.listing_id).length,
        events_without_listing_id: allLeads.filter(l => !l.listing_id).length,
        events_with_seeker_id: allLeads.filter(l => l.seeker_id && l.seeker_id !== l.distinct_id).length,
        events_with_distinct_id_only: allLeads.filter(l => !l.seeker_id || l.seeker_id === l.distinct_id).length
      },
      all_leads: allLeads.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // Most recent first
    })

  } catch (error) {
    console.error('❌ Leads summary test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
