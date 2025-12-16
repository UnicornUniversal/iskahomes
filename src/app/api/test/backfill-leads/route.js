import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { fetchEventsWithRetry } from '@/lib/posthogCron'
import crypto from 'crypto'

/**
 * Backfill leads from PostHog
 * Fetches all lead events from PostHog and inserts them into the leads table
 * Also updates listings, developments, and developers tables with lead counts
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const hours = parseInt(searchParams.get('hours') || '8760') // Default: 1 year (8760 hours)
    const limit = parseInt(searchParams.get('limit') || '10000') // Default: 10k events per batch
    
    const functionStartTime = Date.now()
    let totalEventsFetched = 0
    let totalLeadsCreated = 0
    let totalLeadsUpdated = 0
    let errors = []
    const processedSeekerIds = new Set() // Track unique seekers for aggregate counts
    
    // Fetch all lead events from PostHog
    const queryStartTime = new Date()
    queryStartTime.setHours(queryStartTime.getHours() - hours)
    const endTime = new Date()
    
    console.log(`Fetching lead events from PostHog (last ${hours} hours, from ${queryStartTime.toISOString()} to ${endTime.toISOString()})`)
    
    // Define lead event names
    const leadEventNames = [
      'lead', // Unified lead event (new format)
      'lead_phone', // Legacy lead events (backward compatibility)
      'lead_message',
      'lead_appointment',
      'lead_email',
      'lead_website'
    ]
    
    // Use the same fetchEventsWithRetry function as the cron job
    const { success, events: allEvents, apiCalls, error: fetchError } = await fetchEventsWithRetry(
      queryStartTime,
      endTime,
      leadEventNames
    )
    
    if (!success || !allEvents) {
      const errorMessage = fetchError?.message || 'Unknown error'
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch events from PostHog: ${errorMessage}`,
          details: fetchError
        },
        { status: 500 }
      )
    }
    
    // Filter to only lead events (just in case)
    const events = Array.isArray(allEvents) ? allEvents.filter(e => leadEventNames.includes(e.event)) : []
    totalEventsFetched = events.length
    
    console.log(`Total events fetched: ${totalEventsFetched}`)
    
    // Group events by (listing_id/development_id, seeker_id, context_type)
    const leadsMap = new Map()
    
    for (const event of events) {
      try {
        const { event: eventName, properties = {}, distinct_id, timestamp } = event
        
        // Extract lead_type (unified event or old format)
        let leadType = properties.lead_type || properties.leadType
        if (!leadType) {
          // Backward compatibility: derive from event name
          if (eventName === 'lead_phone') {
            leadType = 'phone'
          } else if (eventName === 'lead_message') {
            leadType = 'message'
          } else if (eventName === 'lead_appointment') {
            leadType = 'appointment'
          } else if (eventName === 'lead_email') {
            leadType = 'email'
          } else if (eventName === 'lead_website') {
            leadType = 'website'
          } else if (eventName === 'lead') {
            leadType = properties.lead_type || 'unknown'
          }
        }
        
        if (!leadType || !['phone', 'message', 'appointment', 'email', 'website'].includes(leadType)) {
          continue // Skip invalid lead types
        }
        
        // Extract context information
        const contextType = properties.context_type || properties.contextType || 'listing'
        const listingId = properties.listing_id || properties.listingId || null
        const developmentId = properties.development_id || properties.developmentId || null
        const listerId = properties.lister_id || properties.listerId || properties.developer_id || properties.agent_id || null
        const listerType = properties.lister_type || properties.listerType || 
                          (properties.developer_id ? 'developer' : 
                           properties.agent_id ? 'agent' : null)
        const seekerId = properties.seeker_id || properties.seekerId || distinct_id
        const isLoggedIn = properties.is_logged_in !== undefined ? properties.is_logged_in : 
                          (properties.isLoggedIn !== undefined ? properties.isLoggedIn : false)
        const isAnonymous = !isLoggedIn
        
        // Validate required fields
        if (!seekerId || !listerId || !listerType) {
          continue // Skip events without required fields
        }
        
        // CRITICAL: Allow null listing_id/development_id for "unknown property" leads
        // These leads should still be created so users can contact them even if the property/development doesn't exist
        // The cron job will handle these properly (they'll be counted for developers but not for specific listings/developments)
        
        // Create unique key for this lead
        // For unknown properties, use a special key format that includes context_type
        let leadKey
        if (contextType === 'listing') {
          // Allow null listingId for unknown properties
          leadKey = listingId ? `listing_${listingId}_${seekerId}` : `listing_unknown_${listerId}_${seekerId}`
        } else if (contextType === 'development') {
          // Allow null developmentId for unknown developments
          leadKey = developmentId ? `development_${developmentId}_${seekerId}` : `development_unknown_${listerId}_${seekerId}`
        } else if (contextType === 'profile' && listerId) {
          leadKey = `profile_${listerId}_${seekerId}`
        } else {
          continue // Skip invalid contexts (must have at least listerId for profile)
        }
        
        // Get or create lead record
        if (!leadsMap.has(leadKey)) {
          leadsMap.set(leadKey, {
            listing_id: contextType === 'listing' ? listingId : null,
            development_id: contextType === 'development' ? developmentId : null,
            lister_id: listerId,
            lister_type: listerType,
            seeker_id: seekerId,
            context_type: contextType,
            is_anonymous: isAnonymous,
            lead_actions: [],
            first_action_date: null,
            last_action_date: null,
            last_action_type: null,
            lead_score: 0
          })
        }
        
        const lead = leadsMap.get(leadKey)
        
        // Parse timestamp
        const eventDate = new Date(timestamp)
        const actionDate = eventDate.toISOString().split('T')[0].replace(/-/g, '') // YYYYMMDD
        const actionHour = eventDate.getHours()
        const actionTimestamp = eventDate.toISOString()
        
        // Determine action type and metadata
        let actionType = 'lead_unknown'
        let actionMetadata = {}
        
        if (leadType === 'phone') {
          actionType = 'lead_phone'
          actionMetadata = {
            action: properties.action || 'click',
            phone_number: properties.phone_number || properties.phoneNumber || null
          }
        } else if (leadType === 'message') {
          actionType = 'lead_message'
          actionMetadata = {
            message_type: properties.message_type || properties.messageType || 'direct_message'
          }
        } else if (leadType === 'appointment') {
          actionType = 'lead_appointment'
          actionMetadata = {
            appointment_type: properties.appointment_type || properties.appointmentType || 'viewing'
          }
        } else if (leadType === 'email') {
          actionType = 'lead_email'
        } else if (leadType === 'website') {
          actionType = 'lead_website'
        }
        
        // Calculate lead score
        const leadScoreMap = {
          'lead_phone': 10,
          'lead_message': (actionMetadata.message_type === 'email' ? 10 : 
                         actionMetadata.message_type === 'whatsapp' ? 15 : 20),
          'lead_appointment': 25,
          'lead_email': 10,
          'lead_website': 5
        }
        const actionScore = leadScoreMap[actionType] || 10
        
        // Create action object
        const actionObj = {
          action_id: crypto.randomUUID(),
          action_type: actionType,
          action_date: actionDate,
          action_hour: actionHour,
          action_timestamp: actionTimestamp,
          action_metadata: {
            context_type: contextType,
            ...actionMetadata
          }
        }
        
        // Add action to lead
        lead.lead_actions.push(actionObj)
        
        // Update dates and score
        if (!lead.first_action_date || eventDate < new Date(lead.first_action_date)) {
          lead.first_action_date = actionTimestamp.split('T')[0] // YYYY-MM-DD
        }
        if (!lead.last_action_date || eventDate > new Date(lead.last_action_date)) {
          lead.last_action_date = actionTimestamp.split('T')[0] // YYYY-MM-DD
          lead.last_action_type = actionType
        }
        lead.lead_score = Math.max(lead.lead_score || 0, actionScore)
        
        // Track unique seekers for aggregate counts
        if (!processedSeekerIds.has(seekerId)) {
          processedSeekerIds.add(seekerId)
        }
      } catch (error) {
        console.error('Error processing event:', error)
        errors.push({ event: event, error: error.message })
      }
    }
    
    console.log(`Grouped into ${leadsMap.size} unique leads`)
    
    // Insert/update leads in database
    const leadsToInsert = []
    const leadsToUpdate = []
    
    for (const [leadKey, leadData] of leadsMap.entries()) {
      try {
        // Check if lead already exists
        // Handle unknown properties (null listing_id/development_id) - these should still be stored
        let existingLead = null
        
        if (leadData.context_type === 'listing') {
          if (leadData.listing_id) {
            // Known listing
            const { data } = await supabaseAdmin
              .from('leads')
              .select('id, lead_actions, total_actions')
              .eq('listing_id', leadData.listing_id)
              .eq('seeker_id', leadData.seeker_id)
              .eq('context_type', 'listing')
              .single()
            
            existingLead = data
          } else {
            // Unknown property - check by lister_id, seeker_id, and null listing_id
            const { data } = await supabaseAdmin
              .from('leads')
              .select('id, lead_actions, total_actions')
              .eq('lister_id', leadData.lister_id)
              .eq('seeker_id', leadData.seeker_id)
              .eq('context_type', 'listing')
              .is('listing_id', null)
              .is('development_id', null)
              .single()
            
            existingLead = data
          }
        } else if (leadData.context_type === 'development') {
          if (leadData.development_id) {
            // Known development
            const { data } = await supabaseAdmin
              .from('leads')
              .select('id, lead_actions, total_actions')
              .eq('development_id', leadData.development_id)
              .eq('seeker_id', leadData.seeker_id)
              .eq('context_type', 'development')
              .single()
            
            existingLead = data
          } else {
            // Unknown development - check by lister_id, seeker_id, and null development_id
            const { data } = await supabaseAdmin
              .from('leads')
              .select('id, lead_actions, total_actions')
              .eq('lister_id', leadData.lister_id)
              .eq('seeker_id', leadData.seeker_id)
              .eq('context_type', 'development')
              .is('listing_id', null)
              .is('development_id', null)
              .single()
            
            existingLead = data
          }
        } else if (leadData.context_type === 'profile' && leadData.lister_id) {
          const { data } = await supabaseAdmin
            .from('leads')
            .select('id, lead_actions, total_actions')
            .eq('lister_id', leadData.lister_id)
            .eq('seeker_id', leadData.seeker_id)
            .eq('context_type', 'profile')
            .is('listing_id', null)
            .is('development_id', null)
            .single()
          
          existingLead = data
        }
        
        if (existingLead) {
          // Merge actions (avoid duplicates)
          const existingActions = Array.isArray(existingLead.lead_actions) ? existingLead.lead_actions : []
          const existingActionIds = new Set(existingActions.map(a => a.action_id))
          
          const newActions = leadData.lead_actions.filter(a => !existingActionIds.has(a.action_id))
          const mergedActions = [...existingActions, ...newActions]
          
          // Sort by timestamp
          mergedActions.sort((a, b) => 
            new Date(a.action_timestamp) - new Date(b.action_timestamp)
          )
          
          leadsToUpdate.push({
            id: existingLead.id,
            lead_actions: mergedActions,
            total_actions: mergedActions.length,
            first_action_date: leadData.first_action_date,
            last_action_date: leadData.last_action_date,
            last_action_type: leadData.last_action_type,
            lead_score: Math.max(existingLead.lead_score || 0, leadData.lead_score),
            is_anonymous: leadData.is_anonymous,
            updated_at: new Date().toISOString()
          })
        } else {
          // New lead
          leadsToInsert.push({
            ...leadData,
            total_actions: leadData.lead_actions.length,
            status: 'new',
            status_tracker: ['new'],
            notes: [],
            date: leadData.first_action_date?.replace(/-/g, '') || null,
            hour: leadData.lead_actions[0]?.action_hour || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }
      } catch (error) {
        console.error(`Error checking lead ${leadKey}:`, error)
        errors.push({ leadKey, error: error.message })
      }
    }
    
    // Batch insert new leads
    if (leadsToInsert.length > 0) {
      const { data: insertedLeads, error: insertError } = await supabaseAdmin
        .from('leads')
        .insert(leadsToInsert)
        .select()
      
      if (insertError) {
        console.error('Error inserting leads:', insertError)
        errors.push({ operation: 'insert', error: insertError.message })
      } else {
        totalLeadsCreated = insertedLeads?.length || 0
        console.log(`Inserted ${totalLeadsCreated} new leads`)
      }
    }
    
    // Batch update existing leads
    if (leadsToUpdate.length > 0) {
      for (const leadUpdate of leadsToUpdate) {
        const { id, ...updateData } = leadUpdate
        const { error: updateError } = await supabaseAdmin
          .from('leads')
          .update(updateData)
          .eq('id', id)
        
        if (updateError) {
          console.error(`Error updating lead ${id}:`, updateError)
          errors.push({ leadId: id, error: updateError.message })
        } else {
          totalLeadsUpdated++
        }
      }
      console.log(`Updated ${totalLeadsUpdated} existing leads`)
    }
    
    // Now update listings, developments, and developers tables with lead counts
    // This is similar to what the cron job does, but we'll recalculate from the leads table
    console.log('Updating lead counts in listings, developments, and developers tables...')
    
    // Update listings
    const { data: listingLeads } = await supabaseAdmin
      .from('leads')
      .select('listing_id, seeker_id, is_anonymous')
      .eq('context_type', 'listing')
      .not('listing_id', 'is', null)
    
    if (listingLeads && listingLeads.length > 0) {
      const listingCounts = {}
      for (const lead of listingLeads) {
        if (!listingCounts[lead.listing_id]) {
          listingCounts[lead.listing_id] = {
            unique_seekers: new Set(),
            anonymous_seekers: new Set(),
            total_actions: 0
          }
        }
        if (lead.is_anonymous) {
          listingCounts[lead.listing_id].anonymous_seekers.add(lead.seeker_id)
        } else {
          listingCounts[lead.listing_id].unique_seekers.add(lead.seeker_id)
        }
      }
      
      // Update each listing
      for (const [listingId, counts] of Object.entries(listingCounts)) {
        const { error } = await supabaseAdmin
          .from('listings')
          .update({
            unique_leads: counts.unique_seekers.size,
            anonymous_leads: counts.anonymous_seekers.size,
            total_leads: counts.unique_seekers.size + counts.anonymous_seekers.size
          })
          .eq('id', listingId)
        
        if (error) {
          console.error(`Error updating listing ${listingId}:`, error)
          errors.push({ listingId, error: error.message })
        }
      }
    }
    
    // Update developments
    const { data: developmentLeads } = await supabaseAdmin
      .from('leads')
      .select('development_id, seeker_id, is_anonymous')
      .eq('context_type', 'development')
      .not('development_id', 'is', null)
    
    if (developmentLeads && developmentLeads.length > 0) {
      const developmentCounts = {}
      for (const lead of developmentLeads) {
        const devId = String(lead.development_id)
        if (!developmentCounts[devId]) {
          developmentCounts[devId] = {
            unique_seekers: new Set(),
            anonymous_seekers: new Set()
          }
        }
        if (lead.is_anonymous) {
          developmentCounts[devId].anonymous_seekers.add(lead.seeker_id)
        } else {
          developmentCounts[devId].unique_seekers.add(lead.seeker_id)
        }
      }
      
      // Update each development
      for (const [devId, counts] of Object.entries(developmentCounts)) {
        const { error } = await supabaseAdmin
          .from('developments')
          .update({
            unique_leads: counts.unique_seekers.size,
            anonymous_leads: counts.anonymous_seekers.size,
            total_leads: counts.unique_seekers.size + counts.anonymous_seekers.size
          })
          .eq('id', devId)
        
        if (error) {
          console.error(`Error updating development ${devId}:`, error)
          errors.push({ developmentId: devId, error: error.message })
        }
      }
    }
    
    // Update developers (profile-specific and aggregate)
    const { data: allDeveloperLeads } = await supabaseAdmin
      .from('leads')
      .select('lister_id, listing_id, development_id, seeker_id, is_anonymous, context_type')
      .eq('lister_type', 'developer')
    
    if (allDeveloperLeads && allDeveloperLeads.length > 0) {
      // Get all listings and developments for developers
      const { data: developerListings } = await supabaseAdmin
        .from('listings')
        .select('id, user_id')
        .eq('account_type', 'developer')
      
      const { data: developerDevelopments } = await supabaseAdmin
        .from('developments')
        .select('id, developer_id')
      
      // Build lookup maps
      const listingToDeveloper = {}
      if (developerListings) {
        for (const listing of developerListings) {
          listingToDeveloper[listing.id] = listing.user_id
        }
      }
      
      const developmentToDeveloper = {}
      if (developerDevelopments) {
        for (const dev of developerDevelopments) {
          developmentToDeveloper[String(dev.id)] = dev.developer_id
        }
      }
      
      // Aggregate leads per developer
      const developerProfileCounts = {} // Profile-specific
      const developerAggregateCounts = {} // Across all contexts
      
      for (const lead of allDeveloperLeads) {
        const developerId = lead.lister_id
        
        // Profile-specific (context_type = 'profile')
        if (lead.context_type === 'profile' && lead.lister_id) {
          if (!developerProfileCounts[developerId]) {
            developerProfileCounts[developerId] = {
              unique_seekers: new Set(),
              anonymous_seekers: new Set()
            }
          }
          if (lead.is_anonymous) {
            developerProfileCounts[developerId].anonymous_seekers.add(lead.seeker_id)
          } else {
            developerProfileCounts[developerId].unique_seekers.add(lead.seeker_id)
          }
        }
        
        // Aggregate (all contexts)
        if (!developerAggregateCounts[developerId]) {
          developerAggregateCounts[developerId] = {
            unique_seekers: new Set(),
            anonymous_seekers: new Set()
          }
        }
        
        // Add to aggregate if it's a profile lead, listing lead, or development lead
        let shouldAddToAggregate = false
        
        if (lead.context_type === 'profile' && lead.lister_id === developerId) {
          shouldAddToAggregate = true // Profile lead for this developer
        } else if (lead.context_type === 'listing' && lead.listing_id && listingToDeveloper[lead.listing_id] === developerId) {
          shouldAddToAggregate = true // Listing owned by this developer
        } else if (lead.context_type === 'development' && lead.development_id && 
                   developmentToDeveloper[String(lead.development_id)] === developerId) {
          shouldAddToAggregate = true // Development owned by this developer
        }
        
        if (shouldAddToAggregate) {
          if (lead.is_anonymous) {
            developerAggregateCounts[developerId].anonymous_seekers.add(lead.seeker_id)
          } else {
            developerAggregateCounts[developerId].unique_seekers.add(lead.seeker_id)
          }
        }
      }
      
      // Update developers table
      const allDeveloperIds = new Set([
        ...Object.keys(developerProfileCounts),
        ...Object.keys(developerAggregateCounts)
      ])
      
      for (const developerId of allDeveloperIds) {
        const profileCounts = developerProfileCounts[developerId] || { unique_seekers: new Set(), anonymous_seekers: new Set() }
        const aggregateCounts = developerAggregateCounts[developerId] || { unique_seekers: new Set(), anonymous_seekers: new Set() }
        
        const { error } = await supabaseAdmin
          .from('developers')
          .update({
            unique_leads: profileCounts.unique_seekers.size,
            anonymous_leads: profileCounts.anonymous_seekers.size,
            total_unique_leads: aggregateCounts.unique_seekers.size,
            total_anonymous_leads: aggregateCounts.anonymous_seekers.size
          })
          .eq('developer_id', developerId)
        
        if (error) {
          console.error(`Error updating developer ${developerId}:`, error)
          errors.push({ developerId, error: error.message })
        }
      }
    }
    
    const duration = ((Date.now() - functionStartTime) / 1000).toFixed(2)
    
    return NextResponse.json({
      success: true,
      summary: {
        total_events_fetched: totalEventsFetched,
        total_leads_created: totalLeadsCreated,
        total_leads_updated: totalLeadsUpdated,
        total_unique_leads: leadsMap.size,
        total_unique_seekers: processedSeekerIds.size,
        duration_seconds: duration,
        errors_count: errors.length
      },
      errors: errors.length > 0 ? errors.slice(0, 50) : [], // Limit errors in response
      message: `Backfilled ${totalLeadsCreated} new leads and updated ${totalLeadsUpdated} existing leads from ${totalEventsFetched} PostHog events`
    })
    
  } catch (error) {
    console.error('Error in backfill leads:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.stack
      },
      { status: 500 }
    )
  }
}

