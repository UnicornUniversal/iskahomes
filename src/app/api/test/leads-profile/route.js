import { NextResponse } from 'next/server'
import { fetchEventsWithRetry } from '@/lib/posthogCron'
import crypto from 'crypto'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const seekerId = searchParams.get('seeker_id') || null
    const listerId = searchParams.get('lister_id') || null
    const profileId = searchParams.get('profile_id') || null

    // Fetch ALL lead events from PostHog (no time constraint)
    // Use a very wide time range (10 years ago to now) to effectively get all events
    const endTime = new Date()
    const startTime = new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000) // 10 years ago

    console.log(`📊 Fetching profile-based lead events (listing_id = null) from PostHog`)

    // Fetch unified lead events from PostHog (including old format for backward compatibility)
    const leadEventNames = ['lead', 'lead_phone', 'lead_message', 'lead_appointment'] // Unified + legacy events
    
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

    // Filter to only lead events (should already be filtered, but double-check)
    const leadEvents = Array.isArray(allEvents) 
      ? allEvents.filter(e => leadEventNames.includes(e.event))
      : []

    // Filter to only events where listing_id is null/undefined
    let profileBasedLeads = leadEvents.filter(e => {
      const listingId = e.properties?.listing_id || e.properties?.listingId || e.properties?.listing_uuid || e.properties?.property_id
      return !listingId // Only include if listing_id is missing
    })

    console.log(`✅ Found ${profileBasedLeads.length} profile-based lead events (listing_id = null) from ${leadEvents.length} total lead events`)

    // Apply additional filters if provided
    if (seekerId) {
      profileBasedLeads = profileBasedLeads.filter(e => 
        e.properties?.seeker_id === seekerId || 
        e.properties?.seekerId === seekerId ||
        e.distinct_id === seekerId
      )
    }
    if (listerId) {
      profileBasedLeads = profileBasedLeads.filter(e => 
        e.properties?.lister_id === listerId || 
        e.properties?.listerId === listerId ||
        e.properties?.developer_id === listerId ||
        e.properties?.developerId === listerId ||
        e.properties?.agent_id === listerId ||
        e.properties?.agentId === listerId
      )
    }
    if (profileId) {
      profileBasedLeads = profileBasedLeads.filter(e => 
        e.properties?.profile_id === profileId || 
        e.properties?.profileId === profileId
      )
    }

    // Group by profile_id/lister_id and seeker_id
    const leadsMap = {} // { profileId_listerId_seekerId: { events, metadata } }
    const summaryByProfile = {}
    const summaryByLister = {}
    const summaryBySeeker = {}
    const allActions = []

    profileBasedLeads.forEach(event => {
      const { event: eventName, properties = {}, distinct_id, timestamp } = event
      
      // Extract properties (handle both camelCase and snake_case)
      const seekerId = properties.seeker_id || properties.seekerId || distinct_id
      const listerId = properties.lister_id || properties.listerId || properties.developer_id || properties.developerId || properties.agent_id || properties.agentId
      const listerType = properties.lister_type || properties.listerType || 
        (properties.developer_id || properties.developerId ? 'developer' : null) ||
        (properties.agent_id || properties.agentId ? 'agent' : null)
      const profileId = properties.profile_id || properties.profileId || listerId // Use listerId as fallback for profileId
      const contextType = properties.context_type || properties.contextType || 'profile'

      // Skip if no lister_id and no seeker_id
      if (!listerId && !seekerId) {
        return
      }

      // Create a key for grouping
      const leadKey = `${profileId}_${listerId}_${seekerId}`

      if (!leadsMap[leadKey]) {
        leadsMap[leadKey] = {
          listing_id: null, // Explicitly null for profile-based leads
          lister_id: listerId,
          lister_type: listerType,
          seeker_id: seekerId,
          profile_id: profileId,
          context_type: contextType,
          events: [],
          first_action_date: null,
          last_action_date: null
        }
      }

      const lead = leadsMap[leadKey]
      
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
      
      // Determine action_type based on lead_type for backward compatibility
      let actionType = 'lead'
      if (leadType === 'phone') {
        actionType = 'lead_phone'
      } else if (leadType === 'message') {
        actionType = 'lead_message'
      } else if (leadType === 'appointment') {
        actionType = 'lead_appointment'
      }
      
      // Create action object
      const action = {
        action_id: crypto.randomUUID(),
        action_type: actionType, // Use legacy action_type for backward compatibility
        lead_type: leadType, // Include lead_type in metadata
        action_date: new Date(timestamp).toISOString().split('T')[0], // YYYY-MM-DD
        action_timestamp: timestamp,
        action_metadata: {
          lead_type: leadType,
          action: properties.action || null,
          message_type: properties.message_type || properties.messageType || null,
          appointment_type: properties.appointment_type || properties.appointmentType || null,
          context_type: contextType,
          phone_number: properties.phone_number || properties.phoneNumber || null,
          profile_id: profileId
        }
      }

      lead.events.push(action)
      allActions.push({
        ...action,
        listing_id: null,
        seeker_id: seekerId,
        lister_id: listerId,
        profile_id: profileId
      })

      // Update date range
      const actionDate = action.action_date
      if (!lead.first_action_date || actionDate < lead.first_action_date) {
        lead.first_action_date = actionDate
      }
      if (!lead.last_action_date || actionDate > lead.last_action_date) {
        lead.last_action_date = actionDate
      }
    })

    // Group by profile/lister
    Object.values(leadsMap).forEach(lead => {
      const profileId = lead.profile_id || 'unknown'
      const listerId = lead.lister_id || 'unknown'
      const seekerId = lead.seeker_id

      // Group by profile
      if (!summaryByProfile[profileId]) {
        summaryByProfile[profileId] = {
          profile_id: profileId,
          lister_id: listerId,
          lister_type: lead.lister_type,
          total_lead_records: 0,
          unique_seekers: new Set(),
          total_actions: 0,
          action_types: {},
          date_range: {
            earliest: lead.first_action_date,
            latest: lead.last_action_date
          },
          leads: []
        }
      }

      const profileSummary = summaryByProfile[profileId]
      profileSummary.total_lead_records++
      profileSummary.unique_seekers.add(seekerId)
      profileSummary.total_actions += lead.events.length

      // Update date range
      if (lead.first_action_date && (!profileSummary.date_range.earliest || lead.first_action_date < profileSummary.date_range.earliest)) {
        profileSummary.date_range.earliest = lead.first_action_date
      }
      if (lead.last_action_date && (!profileSummary.date_range.latest || lead.last_action_date > profileSummary.date_range.latest)) {
        profileSummary.date_range.latest = lead.last_action_date
      }

      // Count action types
      lead.events.forEach(action => {
        const actionType = action.action_type
        profileSummary.action_types[actionType] = (profileSummary.action_types[actionType] || 0) + 1
      })

      profileSummary.leads.push({
        listing_id: null,
        lister_id: lead.lister_id,
        lister_type: lead.lister_type,
        seeker_id: lead.seeker_id,
        profile_id: lead.profile_id,
        lead_actions: lead.events,
        total_actions: lead.events.length,
        first_action_date: lead.first_action_date,
        last_action_date: lead.last_action_date,
        last_action_type: lead.events[lead.events.length - 1]?.action_type || 'unknown',
        status: 'new',
        context_type: lead.context_type
      })

      // Group by lister
      if (listerId && listerId !== 'unknown') {
        if (!summaryByLister[listerId]) {
          summaryByLister[listerId] = {
            lister_id: listerId,
            lister_type: lead.lister_type,
            total_lead_records: 0,
            unique_seekers: new Set(),
            unique_profiles: new Set(),
            total_actions: 0,
            action_types: {},
            date_range: {
              earliest: lead.first_action_date,
              latest: lead.last_action_date
            },
            leads: []
          }
        }

        const listerSummary = summaryByLister[listerId]
        listerSummary.total_lead_records++
        listerSummary.unique_seekers.add(seekerId)
        listerSummary.unique_profiles.add(profileId)
        listerSummary.total_actions += lead.events.length

        // Update date range
        if (lead.first_action_date && (!listerSummary.date_range.earliest || lead.first_action_date < listerSummary.date_range.earliest)) {
          listerSummary.date_range.earliest = lead.first_action_date
        }
        if (lead.last_action_date && (!listerSummary.date_range.latest || lead.last_action_date > listerSummary.date_range.latest)) {
          listerSummary.date_range.latest = lead.last_action_date
        }

        lead.events.forEach(action => {
          const actionType = action.action_type
          listerSummary.action_types[actionType] = (listerSummary.action_types[actionType] || 0) + 1
        })

        listerSummary.leads.push({
          listing_id: null,
          lister_id: lead.lister_id,
          lister_type: lead.lister_type,
          seeker_id: lead.seeker_id,
          profile_id: lead.profile_id,
          lead_actions: lead.events,
          total_actions: lead.events.length,
          first_action_date: lead.first_action_date,
          last_action_date: lead.last_action_date,
          last_action_type: lead.events[lead.events.length - 1]?.action_type || 'unknown',
          status: 'new',
          context_type: lead.context_type
        })
      }

      // Group by seeker
      if (!summaryBySeeker[seekerId]) {
        summaryBySeeker[seekerId] = {
          seeker_id: seekerId,
          total_lead_records: 0,
          unique_listers: new Set(),
          unique_profiles: new Set(),
          total_actions: 0,
          action_types: {},
          leads: []
        }
      }

      const seekerSummary = summaryBySeeker[seekerId]
      seekerSummary.total_lead_records++
      if (listerId) seekerSummary.unique_listers.add(listerId)
      if (profileId) seekerSummary.unique_profiles.add(profileId)
      seekerSummary.total_actions += lead.events.length

      lead.events.forEach(action => {
        const actionType = action.action_type
        seekerSummary.action_types[actionType] = (seekerSummary.action_types[actionType] || 0) + 1
      })

      seekerSummary.leads.push({
        listing_id: null,
        lister_id: lead.lister_id,
        lister_type: lead.lister_type,
        seeker_id: lead.seeker_id,
        profile_id: lead.profile_id,
        lead_actions: lead.events,
        total_actions: lead.events.length,
        first_action_date: lead.first_action_date,
        last_action_date: lead.last_action_date,
        last_action_type: lead.events[lead.events.length - 1]?.action_type || 'unknown',
        status: 'new',
        context_type: lead.context_type
      })
    })

    // Convert Sets to numbers for JSON serialization
    Object.values(summaryByProfile).forEach(summary => {
      summary.unique_seekers = summary.unique_seekers.size
      summary.leads = summary.leads.slice(0, 10)
    })

    Object.values(summaryByLister).forEach(summary => {
      summary.unique_seekers = summary.unique_seekers.size
      summary.unique_profiles = summary.unique_profiles.size
      summary.leads = summary.leads.slice(0, 10)
    })

    Object.values(summaryBySeeker).forEach(summary => {
      summary.unique_listers = summary.unique_listers.size
      summary.unique_profiles = summary.unique_profiles.size
      summary.leads = summary.leads.slice(0, 10)
    })

    // Get unique counts
    const uniqueListers = new Set()
    const uniqueSeekers = new Set()
    const uniqueProfiles = new Set()
    Object.values(leadsMap).forEach(lead => {
      if (lead.lister_id) uniqueListers.add(lead.lister_id)
      if (lead.seeker_id) uniqueSeekers.add(lead.seeker_id)
      if (lead.profile_id) uniqueProfiles.add(lead.profile_id)
    })

    return NextResponse.json({
      success: true,
      source: 'PostHog',
      filter: 'listing_id = null (profile-based leads)',
      timeRange: {
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        note: 'All events (10 year range to fetch everything)'
      },
      summary: {
        total_lead_records: Object.keys(leadsMap).length,
        unique_listers: uniqueListers.size,
        unique_seekers: uniqueSeekers.size,
        unique_profiles: uniqueProfiles.size,
        total_actions: allActions.length,
        filtered_by_seeker_id: seekerId || null,
        filtered_by_lister_id: listerId || null,
        filtered_by_profile_id: profileId || null,
        total_lead_events_fetched: leadEvents.length,
        profile_based_events: profileBasedLeads.length,
        events_with_listing_id: leadEvents.length - profileBasedLeads.length,
        api_calls: apiCalls || 1
      },
      by_profile: Object.values(summaryByProfile)
        .sort((a, b) => b.total_lead_records - a.total_lead_records)
        .map(summary => ({
          profile_id: summary.profile_id,
          lister_id: summary.lister_id,
          lister_type: summary.lister_type,
          total_lead_records: summary.total_lead_records,
          unique_seekers: summary.unique_seekers,
          total_actions: summary.total_actions,
          action_types: summary.action_types,
          date_range: summary.date_range,
          sample_leads: summary.leads.slice(0, 5)
        })),
      by_lister: Object.values(summaryByLister)
        .sort((a, b) => b.total_lead_records - a.total_lead_records)
        .map(summary => ({
          lister_id: summary.lister_id,
          lister_type: summary.lister_type,
          total_lead_records: summary.total_lead_records,
          unique_seekers: summary.unique_seekers,
          unique_profiles: summary.unique_profiles,
          total_actions: summary.total_actions,
          action_types: summary.action_types,
          date_range: summary.date_range,
          sample_leads: summary.leads.slice(0, 5)
        })),
      by_seeker: Object.values(summaryBySeeker)
        .sort((a, b) => b.total_lead_records - a.total_lead_records)
        .map(summary => ({
          seeker_id: summary.seeker_id,
          total_lead_records: summary.total_lead_records,
          unique_listers: summary.unique_listers,
          unique_profiles: summary.unique_profiles,
          total_actions: summary.total_actions,
          action_types: summary.action_types,
          sample_leads: summary.leads.slice(0, 5)
        })),
      recent_actions: allActions
        .sort((a, b) => new Date(b.action_timestamp) - new Date(a.action_timestamp))
        .slice(0, 20),
      raw_data: profileBasedLeads.slice(0, 50).map(e => ({
        event: e.event,
        timestamp: e.timestamp,
        distinct_id: e.distinct_id,
        properties: {
          listing_id: null, // Explicitly null
          listingId: null,
          listing_uuid: null,
          seeker_id: e.properties?.seeker_id || e.properties?.seekerId || null,
          seekerId: e.properties?.seekerId || null,
          lister_id: e.properties?.lister_id || e.properties?.listerId || null,
          listerId: e.properties?.listerId || null,
          lister_type: e.properties?.lister_type || e.properties?.listerType || null,
          context_type: e.properties?.context_type || e.properties?.contextType || null,
          profile_id: e.properties?.profile_id || e.properties?.profileId || null,
          action: e.properties?.action || null,
          message_type: e.properties?.message_type || e.properties?.messageType || null,
          appointment_type: e.properties?.appointment_type || e.properties?.appointmentType || null,
          phone_number: e.properties?.phone_number || e.properties?.phoneNumber || null
        }
      }))
    })

  } catch (error) {
    console.error('❌ Profile-based leads test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

