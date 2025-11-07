import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { fetchEventsWithRetry } from '@/lib/posthogCron'
import { 
  createRunRecord, 
  updateRunProgress, 
  completeRun, 
  failRun, 
  getLastSuccessfulRun, 
  getIncompleteRuns,
  getStuckRuns
} from '@/lib/cronStatus'
import { getAllActiveEntities } from '@/lib/cronScheduler'
import crypto from 'crypto'

// Helper functions
function parseDate(input) {
  const d = input ? new Date(input) : new Date()
  if (Number.isNaN(d.getTime())) throw new Error('Invalid date')
  return d
}

function formatDayKey(d) {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

function calendarParts(d) {
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth() + 1
  const q = Math.floor((m - 1) / 3) + 1
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dayNum = tmp.getUTCDay() || 7
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7)
  // ISO format: week (YYYY-W##), month (YYYY-MM), quarter (YYYY-Q#)
  return {
    date: `${y}-${String(m).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`,
    week: `${y}-W${String(week).padStart(2, '0')}`, // YYYY-W## format (e.g., 2025-W45)
    month: `${y}-${String(m).padStart(2, '0')}`, // YYYY-MM format (e.g., 2025-11)
    quarter: `${y}-Q${q}`, // YYYY-Q# format (e.g., 2025-Q4)
    year: y
  }
}

// Aggregate events in-memory
function aggregateEvents(events) {
  const aggregates = {
    listings: {}, // { listingId: { metrics... } }
    users: {},    // { userId: { metrics... } }
    developments: {}, // { developmentId: { metrics... } }
    leads: {}    // { listingId_seekerId: { actions... } }
  }

  for (const event of events) {
    const { event: eventName, properties = {}, distinct_id, timestamp } = event
    const eventDate = new Date(timestamp)
    const dayKey = formatDayKey(eventDate)
    
    // Common properties
    const listingId = properties.listing_id || properties.listingId
    const listerId = properties.lister_id || properties.listerId
    const listerType = properties.lister_type || properties.listerType
    const seekerId = properties.seeker_id || distinct_id
    const isLoggedIn = properties.is_logged_in === true || properties.is_logged_in === 'true'
    const viewedFrom = properties.viewed_from || properties.viewedFrom

    // Initialize aggregates if needed
    if (listingId && !aggregates.listings[listingId]) {
      aggregates.listings[listingId] = {
        total_views: 0,
        unique_views: new Set(),
        logged_in_views: 0,
        anonymous_views: 0,
        views_from_home: 0,
        views_from_explore: 0,
        views_from_search: 0,
        views_from_direct: 0,
        total_impressions: 0,
        impression_social_media: 0,
        impression_website_visit: 0,
        impression_share: 0,
        impression_saved_listing: 0,
        total_leads: 0,
        phone_leads: 0,
        message_leads: 0,
        email_leads: 0,
        appointment_leads: 0,
        website_leads: 0,
        unique_leads: new Set(),
        total_sales: 0,
        sales_value: 0
      }
      if (Object.keys(aggregates.listings).length <= 5) {
        console.log(`✅ Initialized listing aggregate for ${listingId}`)
      }
    }

    // Process events
    switch (eventName) {
      case 'property_view': {
        if (!listingId) {
          console.log(`⚠️ Skipping property_view: missing listingId`, { properties: Object.keys(properties) })
          break
        }
        const listing = aggregates.listings[listingId]
        if (!listing) {
          console.error(`❌ CRITICAL: listing ${listingId} not initialized in aggregates!`)
          break
        }
        listing.total_views++
        if (seekerId) listing.unique_views.add(seekerId)
        if (isLoggedIn) listing.logged_in_views++
        else listing.anonymous_views++
        if (viewedFrom) {
          const key = `views_from_${String(viewedFrom).toLowerCase()}`
          if (listing[key] !== undefined) listing[key]++
        }
        break
      }

      case 'listing_impression': {
        // listing_impression is similar to property_view but for detailed impressions
        if (!listingId) {
          console.log(`⚠️ Skipping listing_impression: missing listingId`, { properties: Object.keys(properties) })
          break
        }
        const listing = aggregates.listings[listingId]
        if (!listing) {
          console.error(`❌ CRITICAL: listing ${listingId} not initialized in aggregates for listing_impression!`)
          break
        }
        listing.total_views++
        listing.total_impressions++
        if (seekerId) listing.unique_views.add(seekerId)
        if (isLoggedIn) listing.logged_in_views++
        else listing.anonymous_views++
        if (viewedFrom) {
          const key = `views_from_${String(viewedFrom).toLowerCase()}`
          if (listing[key] !== undefined) listing[key]++
        }
        break
      }

      case 'impression_social_media': {
        if (!listingId) break
        const listing = aggregates.listings[listingId]
        listing.impression_social_media++
        listing.total_impressions++
        break
      }

      case 'impression_website_visit': {
        if (!listingId) break
        const listing = aggregates.listings[listingId]
        listing.impression_website_visit++
        listing.total_impressions++
        break
      }

      case 'impression_share': {
        if (!listingId) break
        const listing = aggregates.listings[listingId]
        listing.impression_share++
        listing.total_impressions++
        break
      }

      case 'impression_saved_listing': {
        if (!listingId) break
        const listing = aggregates.listings[listingId]
        listing.impression_saved_listing++
        listing.total_impressions++
        break
      }

      case 'lead_phone': {
        if (!listingId || !seekerId) {
          console.log(`⚠️ Skipping lead_phone: listingId=${listingId}, seekerId=${seekerId}`)
          break
        }
        const listing = aggregates.listings[listingId]
        listing.phone_leads++
        listing.total_leads++
        if (seekerId) listing.unique_leads.add(seekerId)
        
        // Track lead actions
        const leadKey = `${listingId}_${seekerId}`
        if (!aggregates.leads[leadKey]) {
          aggregates.leads[leadKey] = {
            listing_id: listingId,
            lister_id: listerId,
            lister_type: listerType,
            seeker_id: seekerId,
            actions: []
          }
        }
        aggregates.leads[leadKey].actions.push({
          action_id: crypto.randomUUID(),
          action_type: 'lead_phone',
          action_date: dayKey,
          action_timestamp: timestamp,
          action_metadata: {
            action: properties.action || 'click',
            context_type: properties.context_type || 'listing'
          }
        })
        break
      }

      case 'lead_message': {
        if (!listingId || !seekerId) break
        const listing = aggregates.listings[listingId]
        const messageType = String(properties.message_type || '').toLowerCase()
        if (messageType === 'email') {
          listing.email_leads++
        } else {
          listing.message_leads++
        }
        listing.total_leads++
        if (seekerId) listing.unique_leads.add(seekerId)
        
        const leadKey = `${listingId}_${seekerId}`
        if (!aggregates.leads[leadKey]) {
          aggregates.leads[leadKey] = {
            listing_id: listingId,
            lister_id: listerId,
            lister_type: listerType,
            seeker_id: seekerId,
            actions: []
          }
        }
        aggregates.leads[leadKey].actions.push({
          action_id: crypto.randomUUID(),
          action_type: 'lead_message',
          action_date: dayKey,
          action_timestamp: timestamp,
          action_metadata: {
            context_type: properties.context_type || 'listing',
            message_type: properties.message_type || 'direct_message'
          }
        })
        break
      }

      case 'lead_appointment': {
        if (!listingId || !seekerId) break
        const listing = aggregates.listings[listingId]
        listing.appointment_leads++
        listing.total_leads++
        if (seekerId) listing.unique_leads.add(seekerId)
        
        const leadKey = `${listingId}_${seekerId}`
        if (!aggregates.leads[leadKey]) {
          aggregates.leads[leadKey] = {
        listing_id: listingId,
            lister_id: listerId,
            lister_type: listerType,
            seeker_id: seekerId,
            actions: []
          }
        }
        aggregates.leads[leadKey].actions.push({
          action_id: crypto.randomUUID(),
          action_type: 'lead_appointment',
          action_date: dayKey,
          action_timestamp: timestamp,
          action_metadata: {
            context_type: properties.context_type || 'listing',
            appointment_type: properties.appointment_type || 'viewing'
          }
        })
        break
      }

      case 'listing_sold': {
        if (!listingId) break
        const listing = aggregates.listings[listingId]
        listing.total_sales++
        const saleValue = Number(properties.price) || 0
        listing.sales_value += saleValue
        break
      }

      case 'profile_view': {
        const profileId = properties.profile_id
        const profileType = properties.profile_type
        if (!profileId) break
        
        if (!aggregates.users[profileId]) {
          aggregates.users[profileId] = {
            user_type: profileType || 'unknown',
            profile_views: 0,
            unique_profile_viewers: new Set(),
            profile_views_from_home: 0,
            profile_views_from_listings: 0,
            profile_views_from_search: 0,
            searches_performed: 0
          }
        }
        const user = aggregates.users[profileId]
        user.profile_views++
        if (distinct_id) user.unique_profile_viewers.add(distinct_id)
        const from = properties.viewed_from || properties.viewedFrom
        if (from === 'home') user.profile_views_from_home++
        else if (from === 'listings') user.profile_views_from_listings++
        else if (from === 'search') user.profile_views_from_search++
        break
      }

      case 'property_search': {
        if (!seekerId) break
        if (!aggregates.users[seekerId]) {
          aggregates.users[seekerId] = {
            user_type: 'property_seeker',
            profile_views: 0,
            unique_profile_viewers: new Set(),
            profile_views_from_home: 0,
            profile_views_from_listings: 0,
            profile_views_from_search: 0,
            searches_performed: 0
          }
        }
        aggregates.users[seekerId].searches_performed++
        break
      }

      case 'development_view': {
        const developmentId = properties.development_id || properties.developmentId
        if (!developmentId) break
        
        if (!aggregates.developments[developmentId]) {
          aggregates.developments[developmentId] = {
            total_views: 0,
            unique_views: new Set(),
            logged_in_views: 0,
            anonymous_views: 0,
            views_from_home: 0,
            views_from_explore: 0,
            views_from_search: 0,
            views_from_direct: 0,
            total_leads: 0,
            phone_leads: 0,
            message_leads: 0,
            email_leads: 0,
            appointment_leads: 0,
            website_leads: 0,
            unique_leads: new Set(),
            total_sales: 0,
            sales_value: 0,
            total_shares: 0,
            saved_count: 0,
            social_media_clicks: 0,
            total_interactions: 0
          }
        }
        const dev = aggregates.developments[developmentId]
        dev.total_views++
        if (seekerId) dev.unique_views.add(seekerId)
        if (isLoggedIn) dev.logged_in_views++
        else dev.anonymous_views++
        if (viewedFrom) {
          const key = `views_from_${String(viewedFrom).toLowerCase()}`
          if (dev[key] !== undefined) dev[key]++
        }
        break
      }

      case 'development_share': {
        const developmentId = properties.development_id || properties.developmentId
        if (!developmentId) break
        const dev = aggregates.developments[developmentId]
        if (dev) dev.total_shares++
        break
      }

      case 'development_saved': {
        const developmentId = properties.development_id || properties.developmentId
        if (!developmentId) break
        const dev = aggregates.developments[developmentId]
        if (dev) dev.saved_count++
        break
      }

      case 'development_social_click': {
        const developmentId = properties.development_id || properties.developmentId
        if (!developmentId) break
        const dev = aggregates.developments[developmentId]
        if (dev) dev.social_media_clicks++
        break
      }

      case 'development_interaction': {
        const developmentId = properties.development_id || properties.developmentId
        if (!developmentId) break
        const dev = aggregates.developments[developmentId]
        if (dev) dev.total_interactions++
        break
      }

      case 'development_lead': {
        const developmentId = properties.development_id || properties.developmentId
        if (!developmentId) break
        const dev = aggregates.developments[developmentId]
        if (!dev) break
        
        const leadType = properties.lead_type || 'message'
        if (leadType === 'phone') dev.phone_leads++
        else if (leadType === 'email') dev.email_leads++
        else if (leadType === 'appointment') dev.appointment_leads++
        else if (leadType === 'website') dev.website_leads++
        else dev.message_leads++
        
        dev.total_leads++
        if (seekerId) dev.unique_leads.add(seekerId)
        break
      }
    }
  }

  return aggregates
}

// Main cron handler
export async function POST(request) {
  const runId = crypto.randomUUID()
  let runRecord = null

  try {
    // 1. Check for incomplete/stuck runs
    const incompleteRuns = await getIncompleteRuns()
    const stuckRuns = await getStuckRuns()
    
    if (incompleteRuns.length > 0 || stuckRuns.length > 0) {
      console.log(`⚠️ Found ${incompleteRuns.length} incomplete and ${stuckRuns.length} stuck runs`)
      // Mark stuck runs as failed
      for (const stuckRun of stuckRuns) {
        await failRun(stuckRun.run_id, new Error('Run stuck for more than 2 hours'))
      }
    }

    // 2. Get last successful run to determine start time
    // Check if we should ignore last run (for testing - add ?ignoreLastRun=true to URL)
    const { searchParams } = new URL(request.url)
    const ignoreLastRun = searchParams.get('ignoreLastRun') === 'true'
    const testMode = searchParams.get('testMode') === 'true' // Fetch last 24 hours for testing
    
    const lastRun = ignoreLastRun ? null : await getLastSuccessfulRun()
    console.log('🔍 Last successful run:', lastRun ? {
      run_id: lastRun.run_id,
      end_time: lastRun.end_time,
      completed_at: lastRun.completed_at
    } : 'None found (or ignored)')
    
    let startTime
    if (testMode) {
      // Test mode: fetch last 24 hours
      startTime = new Date(Date.now() - 24 * 60 * 60 * 1000)
      console.log('🧪 TEST MODE: Fetching last 24 hours')
            } else {
      startTime = lastRun 
        ? new Date(lastRun.end_time)
        : new Date(Date.now() - 60 * 60 * 1000) // Default: 1 hour ago
    }
    
    const endTime = new Date()
    const targetDate = formatDayKey(endTime)
    const cal = calendarParts(endTime)

    console.log('⏰ Time range calculation:', {
      hasLastRun: !!lastRun,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      timeRangeHours: (endTime - startTime) / (1000 * 60 * 60),
      targetDate,
      currentTime: new Date().toISOString()
    })

    // 3. Create run record
    runRecord = await createRunRecord({
      run_id: runId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      target_date: cal.date,
      run_type: 'scheduled'
    })

    console.log(`📊 Starting analytics cron run ${runId} from ${startTime.toISOString()} to ${endTime.toISOString()}`)

    // 4. Fetch events from PostHog
    // Define the custom events we care about
    const customEventNames = [
      'property_view',
      'listing_impression', // Also track this (found in PostHog)
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
      'development_lead',
      'listing_sold'
    ]

    console.log('📡 Fetching events from PostHog:', {
      eventNames: customEventNames.length,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      eventList: customEventNames,
      timeRangeMinutes: (endTime - startTime) / (1000 * 60)
    })

    // Fetch ALL events in the time range (PostHog event filter might not work correctly)
    // We'll filter in-memory instead
    const { success, events: allEvents, apiCalls, error } = await fetchEventsWithRetry(
      startTime,
      endTime,
      [] // Empty array = fetch all events, then filter in-memory
    )

    if (!success || !allEvents) {
      const errorMessage = error?.message || 'Unknown error'
      console.error(`❌ Failed to fetch events from PostHog: ${errorMessage}`)
      throw new Error(`Failed to fetch events from PostHog: ${errorMessage}`)
    }

    // Filter to only our custom events
    const events = Array.isArray(allEvents) ? allEvents.filter(e => customEventNames.includes(e.event)) : []
    
    console.log('🔍 Event filtering:', {
      totalEventsFetched: allEvents.length,
      customEventsFound: events.length,
      eventBreakdown: allEvents.reduce((acc, e) => {
        acc[e.event] = (acc[e.event] || 0) + 1
        return acc
      }, {})
    })

    console.log('📡 PostHog API response:', {
      success,
      totalEventsFetched: allEvents?.length || 0,
      customEventsFound: events?.length || 0,
      apiCalls: apiCalls || 0,
      error: error?.message || null,
      sampleCustomEvents: events?.slice(0, 3).map(e => ({
        event: e.event,
        timestamp: e.timestamp,
        listing_id: e.properties?.listing_id,
        distinct_id: e.distinct_id
      })) || []
    })

    await updateRunProgress(runId, {
      events_fetched: allEvents.length, // Total events fetched
      posthog_api_calls: apiCalls || 0
    })

    console.log(`✅ Fetched ${allEvents.length} total events, ${events.length} custom events from PostHog (${apiCalls} API calls)`)
    
    if (events.length === 0) {
      console.warn('⚠️ WARNING: No custom events found! This might indicate:')
      console.warn(`  1. No custom events in the time range (found ${allEvents.length} total events, but none match our custom event names)`)
      console.warn('  2. Events are being sent with different names')
      console.warn('  3. Time range is too narrow')
      const eventBreakdown = allEvents.reduce((acc, e) => { 
        acc[e.event] = (acc[e.event] || 0) + 1
        return acc 
      }, {})
      console.warn(`  4. Event breakdown: ${JSON.stringify(Object.keys(eventBreakdown))}`)
    }

    // 5. Aggregate events in-memory
    console.log(`🔄 Aggregating ${events.length} custom events...`)
    console.log('📋 Sample events before aggregation:', events.slice(0, 3).map(e => ({
      event: e.event,
      listing_id: e.properties?.listing_id || e.properties?.listingId,
      lister_id: e.properties?.lister_id || e.properties?.listerId,
      seeker_id: e.properties?.seeker_id || e.properties?.seekerId
    })))
    
    const aggregates = aggregateEvents(events)
    
    console.log('📊 Aggregation results:', {
      listingsWithEvents: Object.keys(aggregates.listings).length,
      usersWithEvents: Object.keys(aggregates.users).length,
      developmentsWithEvents: Object.keys(aggregates.developments).length,
      leadsWithEvents: Object.keys(aggregates.leads).length,
      sampleListingIds: Object.keys(aggregates.listings).slice(0, 5),
      sampleListingData: Object.entries(aggregates.listings).slice(0, 3).map(([id, data]) => ({
        listing_id: id,
        total_views: data.total_views,
        total_impressions: data.total_impressions,
        total_leads: data.total_leads
      })),
      leadDetails: Object.entries(aggregates.leads).map(([key, lead]) => ({
        key,
        listing_id: lead.listing_id,
        seeker_id: lead.seeker_id,
        actions_count: lead.actions.length,
        lister_id: lead.lister_id
      }))
    })
    
    // Get active entities
    const { listing_ids, user_ids, development_ids } = await getAllActiveEntities()

    console.log('📋 Active entities from database:', {
      activeListings: listing_ids.length,
      activeUsers: user_ids.length,
      activeDevelopments: development_ids.length
    })

    // 6. Build listing analytics rows
    // IMPORTANT: Create rows for BOTH active listings AND listings with events
    // This ensures we capture all activity, even if a listing is temporarily inactive
    const allListingIds = new Set([...listing_ids, ...Object.keys(aggregates.listings)])
    console.log(`📝 Building rows for ${allListingIds.size} listings (${listing_ids.length} active + ${Object.keys(aggregates.listings).length} with events)`)
    
    const listingRows = []
    const listingTotals = {} // For updating listings table
    
    for (const listingId of allListingIds) {
      const listing = aggregates.listings[listingId] || {
        total_views: 0,
        unique_views: new Set(),
        logged_in_views: 0,
        anonymous_views: 0,
        views_from_home: 0,
        views_from_explore: 0,
        views_from_search: 0,
        views_from_direct: 0,
        total_impressions: 0,
        impression_social_media: 0,
        impression_website_visit: 0,
        impression_share: 0,
        impression_saved_listing: 0,
        total_leads: 0,
        phone_leads: 0,
        message_leads: 0,
        email_leads: 0,
        appointment_leads: 0,
        website_leads: 0,
        unique_leads: new Set(),
        total_sales: 0,
        sales_value: 0
      }

      const total_views = listing.total_views
      const unique_views = listing.unique_views instanceof Set ? listing.unique_views.size : (listing.unique_views || 0)
      const total_leads = listing.total_leads
      const unique_leads = listing.unique_leads instanceof Set ? listing.unique_leads.size : (listing.unique_leads || 0)
      const total_sales = listing.total_sales
      const sales_value = listing.sales_value
      const avg_sale_price = total_sales > 0 ? Number((sales_value / total_sales).toFixed(2)) : 0
      const conversion_rate = total_views > 0 ? Number(((total_leads / total_views) * 100).toFixed(2)) : 0
      const lead_to_sale_rate = total_leads > 0 ? Number(((total_sales / total_leads) * 100).toFixed(2)) : 0

      listingRows.push({
        listing_id: listingId,
        date: cal.date,
        week: cal.week,
        month: cal.month,
        quarter: cal.quarter,
        year: cal.year,
        total_views,
        unique_views,
        logged_in_views: listing.logged_in_views,
        anonymous_views: listing.anonymous_views,
        views_from_home: listing.views_from_home,
        views_from_explore: listing.views_from_explore,
        views_from_search: listing.views_from_search,
        views_from_direct: listing.views_from_direct,
        total_impressions: listing.total_impressions,
        impression_social_media: listing.impression_social_media,
        impression_website_visit: listing.impression_website_visit,
        impression_share: listing.impression_share,
        impression_saved_listing: listing.impression_saved_listing,
        total_leads,
        phone_leads: listing.phone_leads,
        message_leads: listing.message_leads,
        email_leads: listing.email_leads,
        appointment_leads: listing.appointment_leads,
        website_leads: listing.website_leads,
        unique_leads,
        total_sales,
        sales_value: Number(sales_value.toFixed(2)),
        avg_sale_price,
        conversion_rate,
        lead_to_sale_rate,
        avg_days_to_sale: 0
      })

      // Store totals for updating listings table
      listingTotals[listingId] = {
        total_views,
        total_leads
      }
    }
    
    console.log(`📊 Listing rows summary:`, {
      totalRows: listingRows.length,
      rowsWithData: listingRows.filter(r => r.total_views > 0 || r.total_impressions > 0 || r.total_leads > 0).length,
      rowsWithViews: listingRows.filter(r => r.total_views > 0).length,
      rowsWithImpressions: listingRows.filter(r => r.total_impressions > 0).length,
      rowsWithLeads: listingRows.filter(r => r.total_leads > 0).length,
      sampleRow: listingRows.find(r => r.total_views > 0) || listingRows[0]
    })

    // 7. Build user analytics rows
    const userRows = []
    const developerTotals = {} // For updating developers table
    
    for (const userId of user_ids) {
      const user = aggregates.users[userId] || {
        user_type: 'unknown',
        profile_views: 0,
        unique_profile_viewers: new Set(),
        profile_views_from_home: 0,
        profile_views_from_listings: 0,
        profile_views_from_search: 0,
        searches_performed: 0
      }

      // Determine user_type from database if not in events
      let user_type = user.user_type
      if (user_type === 'unknown') {
          // Check developers table
        const { data: dev } = await supabaseAdmin
            .from('developers')
          .select('developer_id')
            .eq('developer_id', userId)
          .maybeSingle()
        if (dev) user_type = 'developer'
        else {
          // Check agents table
          const { data: agent } = await supabaseAdmin
              .from('agents')
            .select('agent_id, user_id, developer_id')
            .or(`agent_id.eq.${userId},user_id.eq.${userId},developer_id.eq.${userId}`)
            .maybeSingle()
          if (agent) user_type = 'agent'
        }
      }

      userRows.push({
        user_id: userId,
        user_type,
        date: cal.date,
        week: cal.week,
        month: cal.month,
        quarter: cal.quarter,
        year: cal.year,
        profile_views: user.profile_views,
        unique_profile_viewers: user.unique_profile_viewers.size,
        profile_views_from_home: user.profile_views_from_home,
        profile_views_from_listings: user.profile_views_from_listings,
        profile_views_from_search: user.profile_views_from_search,
        total_listings: 0,
        active_listings: 0,
        sold_listings: 0,
        rented_listings: 0,
        total_listing_views: 0,
        total_listing_leads: 0,
        total_listing_sales: 0,
        total_revenue: 0,
        // avg_revenue_per_listing: 0, // Column doesn't exist in schema
        total_leads_generated: 0,
        phone_leads_generated: 0,
        message_leads_generated: 0,
        // email_leads_generated: 0, // Column doesn't exist in schema
        // appointment_leads_generated: 0, // Column doesn't exist in schema
        website_leads_generated: 0,
        total_impressions_received: 0,
        impression_social_media_received: 0,
        impression_website_visit_received: 0,
        impression_share_received: 0,
        impression_saved_listing_received: 0,
        properties_viewed: 0,
        unique_properties_viewed: 0,
        leads_initiated: 0,
        appointments_booked: 0,
        properties_saved: 0,
        searches_performed: user.searches_performed,
        overall_conversion_rate: 0,
        view_to_lead_rate: 0,
        lead_to_sale_rate: 0,
        profile_to_lead_rate: 0
      })

      // For developers, aggregate totals from their listings
      if (user_type === 'developer') {
        // Get developer's listings
        const { data: developerListings } = await supabaseAdmin
          .from('listings')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'active')

        let totalViews = 0
        let totalLeads = 0
        let totalImpressions = 0

        for (const listing of developerListings || []) {
          const listingTotal = listingTotals[listing.id]
          if (listingTotal) {
            totalViews += listingTotal.total_views
            totalLeads += listingTotal.total_leads
          }
          // Get impressions from listing analytics
          const listingData = aggregates.listings[listing.id]
          if (listingData) {
            totalImpressions += listingData.total_impressions
          }
        }

        developerTotals[userId] = {
          total_views: totalViews,
          total_leads: totalLeads,
          total_impressions: totalImpressions
        }
      }
    }

    // 8. Build development analytics rows
    const developmentRows = []
    for (const developmentId of development_ids) {
      const dev = aggregates.developments[developmentId] || {
        total_views: 0,
        unique_views: new Set(),
        logged_in_views: 0,
        anonymous_views: 0,
        views_from_home: 0,
        views_from_explore: 0,
        views_from_search: 0,
        views_from_direct: 0,
        total_leads: 0,
        phone_leads: 0,
        message_leads: 0,
        email_leads: 0,
        appointment_leads: 0,
        website_leads: 0,
        unique_leads: new Set(),
        total_sales: 0,
        sales_value: 0,
        total_shares: 0,
        saved_count: 0,
        social_media_clicks: 0,
        total_interactions: 0
      }

      // Get developer_id from database
      const { data: devData } = await supabaseAdmin
        .from('developments')
        .select('developer_id')
        .eq('id', developmentId)
        .maybeSingle()

      const total_views = dev.total_views
      const unique_views = dev.unique_views.size
      const total_leads = dev.total_leads
      const unique_leads = dev.unique_leads.size
      const total_sales = dev.total_sales
      const sales_value = dev.sales_value
      const avg_sale_price = total_sales > 0 ? Number((sales_value / total_sales).toFixed(2)) : 0
      const conversion_rate = total_views > 0 ? Number(((total_leads / total_views) * 100).toFixed(2)) : 0
      const lead_to_sale_rate = total_leads > 0 ? Number(((total_sales / total_leads) * 100).toFixed(2)) : 0
      const engagement_rate = total_views > 0 ? Number((((dev.total_shares + dev.saved_count + dev.social_media_clicks) / total_views) * 100).toFixed(2)) : 0

      developmentRows.push({
        development_id: developmentId,
        developer_id: devData?.developer_id || null,
        date: cal.date,
        week: cal.week,
        month: cal.month,
        quarter: cal.quarter,
        year: cal.year,
        total_views,
        unique_views,
        logged_in_views: dev.logged_in_views,
        anonymous_views: dev.anonymous_views,
        views_from_home: dev.views_from_home,
        views_from_explore: dev.views_from_explore,
        views_from_search: dev.views_from_search,
        views_from_direct: dev.views_from_direct,
        total_leads,
        phone_leads: dev.phone_leads,
        message_leads: dev.message_leads,
        email_leads: dev.email_leads,
        appointment_leads: dev.appointment_leads,
        website_leads: dev.website_leads,
        unique_leads,
        total_sales,
        sales_value: Number(sales_value.toFixed(2)),
        avg_sale_price,
        conversion_rate,
        lead_to_sale_rate,
        avg_days_to_sale: 0,
        total_shares: dev.total_shares,
        saved_count: dev.saved_count,
        social_media_clicks: dev.social_media_clicks,
        // total_interactions: dev.total_interactions, // Column doesn't exist in schema
        engagement_rate
      })
    }

    // 9. Build leads rows (time series - new record per cron run)
    // Each cron run creates a new lead record, allowing time series tracking
    // Actions within the same run are merged together
    const leadRows = []
    
    console.log(`📝 Building lead rows from ${Object.keys(aggregates.leads).length} lead combinations`)
    
    // Fetch lister_id for leads that don't have it (e.g., lead_phone from customer care)
    const leadsNeedingListerId = []
    for (const leadKey in aggregates.leads) {
      const lead = aggregates.leads[leadKey]
      if (lead.actions.length === 0) {
        console.log(`⚠️ Skipping lead ${leadKey}: no actions`)
        continue
      }
      if (!lead.lister_id && lead.listing_id) {
        leadsNeedingListerId.push(lead.listing_id)
      }
    }
    
    // Batch fetch lister_ids from listings table
    const listingToListerMap = {}
    if (leadsNeedingListerId.length > 0) {
      const uniqueListingIds = [...new Set(leadsNeedingListerId)]
      console.log(`🔍 Fetching lister_id for ${uniqueListingIds.length} listings without lister_id in events`)
      
      const { data: listingsData, error: listingsError } = await supabaseAdmin
        .from('listings')
        .select('id, user_id, listing_type')
        .in('id', uniqueListingIds)
      
      if (!listingsError && listingsData) {
        for (const listing of listingsData) {
          listingToListerMap[listing.id] = {
            lister_id: listing.user_id,
            lister_type: listing.listing_type === 'unit' ? 'developer' : 'agent'
          }
        }
        console.log(`✅ Fetched lister_id for ${Object.keys(listingToListerMap).length} listings`)
      } else if (listingsError) {
        console.error(`❌ Error fetching lister_ids:`, listingsError)
      }
    }
    
    for (const leadKey in aggregates.leads) {
      const lead = aggregates.leads[leadKey]
      if (lead.actions.length === 0) {
        continue
      }
      
      // Get lister_id from event or from database lookup
      let finalListerId = lead.lister_id
      let finalListerType = lead.lister_type
      
      if (!finalListerId && lead.listing_id) {
        const listingInfo = listingToListerMap[lead.listing_id]
        if (listingInfo) {
          finalListerId = listingInfo.lister_id
          finalListerType = listingInfo.lister_type
          console.log(`✅ Resolved lister_id for lead ${leadKey}: ${finalListerId} (${finalListerType})`)
        } else {
          console.warn(`⚠️ Could not find lister_id for listing ${lead.listing_id}, skipping lead ${leadKey}`)
          continue
        }
      }
      
      if (!finalListerId) {
        console.warn(`⚠️ Skipping lead ${leadKey}: no lister_id available`)
        continue
      }

      // Sort actions by timestamp
      const sortedActions = lead.actions.sort((a, b) => 
        new Date(a.action_timestamp) - new Date(b.action_timestamp)
      )

      console.log(`✅ Creating lead record for ${leadKey}: ${sortedActions.length} actions, lister_id=${finalListerId}`)

      // Create one lead record per seeker+listing combination for this cron run
      // This allows tracking: "User interacted with listing X in run 1, then again in run 2"
      leadRows.push({
        listing_id: lead.listing_id,
        lister_id: finalListerId,
        lister_type: finalListerType,
        seeker_id: lead.seeker_id,
        lead_actions: sortedActions, // All actions from this cron run
        total_actions: sortedActions.length,
        first_action_date: sortedActions[0]?.action_date || cal.date,
        last_action_date: sortedActions[sortedActions.length - 1]?.action_date || cal.date,
        last_action_type: sortedActions[sortedActions.length - 1]?.action_type || 'unknown',
        status: 'new',
        notes: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
    
    console.log(`📊 Lead rows built: ${leadRows.length} records ready to insert`)

    // 10. Write to database
    const insertResults = {
      listings: { inserted: 0, errors: [] },
      users: { inserted: 0, errors: [] },
      developments: { inserted: 0, errors: [] },
      leads: { inserted: 0, errors: [] }
    }

    // Insert listing analytics (time series - always insert new records)
    // Each cron run creates new records, allowing time series analysis
    console.log(`💾 Inserting ${listingRows.length} listing analytics records...`)
    if (listingRows.length > 0) {
      try {
        // Log detailed information about what we're inserting
        const rowsWithData = listingRows.filter(r => r.total_views > 0 || r.total_impressions > 0 || r.total_leads > 0)
        console.log('📊 Listing rows breakdown:', {
          totalRows: listingRows.length,
          rowsWithData: rowsWithData.length,
          rowsWithViews: listingRows.filter(r => r.total_views > 0).length,
          rowsWithImpressions: listingRows.filter(r => r.total_impressions > 0).length,
          rowsWithLeads: listingRows.filter(r => r.total_leads > 0).length,
          sampleRowWithData: rowsWithData[0] || null,
          sampleRowWithoutData: listingRows.find(r => r.total_views === 0 && r.total_impressions === 0 && r.total_leads === 0) || null
        })
        // Safely serialize sample row (handle Sets and other non-serializable values)
        const sampleRow = listingRows[0]
        const serializableRow = sampleRow ? {
          ...sampleRow,
          unique_views: typeof sampleRow.unique_views === 'number' ? sampleRow.unique_views : (sampleRow.unique_views?.size || 0),
          unique_leads: typeof sampleRow.unique_leads === 'number' ? sampleRow.unique_leads : (sampleRow.unique_leads?.size || 0)
        } : null
        console.log('📤 Sample listing row:', JSON.stringify(serializableRow, null, 2))
        
        const { data, error } = await supabaseAdmin
          .from('listing_analytics')
          .insert(listingRows)
          .select()
        
        if (error) {
          console.error('❌ Error inserting listing analytics:', error)
          console.error('❌ Error details:', JSON.stringify(error, null, 2))
          insertResults.listings.errors.push(error.message)
        } else {
          console.log(`✅ Successfully inserted ${listingRows.length} listing analytics records`)
          console.log(`✅ Inserted data sample:`, data?.[0] || 'No data returned')
          insertResults.listings.inserted = data?.length || listingRows.length
        }
      } catch (err) {
        console.error('❌ Exception inserting listing analytics:', err)
        console.error('❌ Exception stack:', err.stack)
        insertResults.listings.errors.push(err.message)
      }
    } else {
      console.warn('⚠️ No listing rows to insert!')
      console.warn('⚠️ This might indicate:')
      console.warn('  1. No active listings in database')
      console.warn('  2. No events with listing_id in PostHog')
      console.warn('  3. Issue with getAllActiveEntities()')
    }

    // Insert user analytics (time series - always insert new records)
    // Each cron run creates new records, allowing time series analysis
    if (userRows.length > 0) {
      try {
        const { error } = await supabaseAdmin
          .from('user_analytics')
          .insert(userRows)
        
        if (error) {
          insertResults.users.errors.push(error.message)
        } else {
          insertResults.users.inserted = userRows.length
        }
      } catch (err) {
        insertResults.users.errors.push(err.message)
      }
    }

    // Insert development analytics (time series - always insert new records)
    // Each cron run creates new records, allowing time series analysis
    if (developmentRows.length > 0) {
      try {
        const { error } = await supabaseAdmin
          .from('development_analytics')
          .insert(developmentRows)
        
        if (error) {
          insertResults.developments.errors.push(error.message)
        } else {
          insertResults.developments.inserted = developmentRows.length
        }
      } catch (err) {
        insertResults.developments.errors.push(err.message)
      }
    }

    // Insert leads (time series - always insert new records)
    console.log(`💾 Inserting ${leadRows.length} lead records...`)
    if (leadRows.length > 0) {
      try {
        console.log('📤 Sample lead row:', JSON.stringify(leadRows[0], null, 2))
        const { data, error } = await supabaseAdmin
          .from('leads')
          .insert(leadRows)
          .select()
        
        if (error) {
          console.error('❌ Error inserting leads:', error)
          insertResults.leads.errors.push(error.message)
        } else {
          console.log(`✅ Successfully inserted ${leadRows.length} lead records`)
          insertResults.leads.inserted = leadRows.length
        }
      } catch (err) {
        console.error('❌ Exception inserting leads:', err)
        insertResults.leads.errors.push(err.message)
      }
    } else {
      console.warn('⚠️ No lead rows to insert!')
    }

    // 11. Update listings table with cumulative totals (sum from all listing_analytics records)
    // Update ALL active listings, not just those with events in this run
    console.log(`🔄 Updating all active listings with cumulative totals...`)
    try {
      const { data: allActiveListings, error: listingsError } = await supabaseAdmin
        .from('listings')
        .select('id')
        .eq('status', 'active')

      if (listingsError) {
        console.error('❌ Error fetching active listings:', listingsError)
      } else if (allActiveListings && allActiveListings.length > 0) {
        console.log(`📊 Found ${allActiveListings.length} active listings to update`)
        
        for (const listing of allActiveListings) {
          try {
            // Calculate cumulative totals from all listing_analytics records
            const { data: analyticsData, error: analyticsError } = await supabaseAdmin
              .from('listing_analytics')
              .select('total_views, total_leads')
              .eq('listing_id', listing.id)

            if (!analyticsError) {
              const cumulativeViews = analyticsData?.reduce((sum, row) => sum + (row.total_views || 0), 0) || 0
              const cumulativeLeads = analyticsData?.reduce((sum, row) => sum + (row.total_leads || 0), 0) || 0

              const { error: updateError } = await supabaseAdmin
                .from('listings')
                .update({
                  total_views: cumulativeViews,
                  total_leads: cumulativeLeads
                })
                .eq('id', listing.id)

              if (updateError) {
                console.error(`❌ Error updating listing ${listing.id}:`, updateError)
              }
            }
          } catch (err) {
            console.error(`❌ Exception updating listing ${listing.id}:`, err)
          }
        }
        console.log(`✅ Completed updating ${allActiveListings.length} listings`)
      }
    } catch (err) {
      console.error('❌ Exception in listings update loop:', err)
    }

    // 12. Update developers table with cumulative totals (sum from all their listings)
    // Update ALL developers, not just those with events in this run
    console.log(`🔄 Updating all developers with cumulative totals...`)
    try {
      const { data: allDevelopers, error: developersError } = await supabaseAdmin
        .from('developers')
        .select('developer_id')

      if (developersError) {
        console.error('❌ Error fetching developers:', developersError)
      } else if (allDevelopers && allDevelopers.length > 0) {
        console.log(`📊 Found ${allDevelopers.length} developers to update`)
        
        for (const developer of allDevelopers) {
          try {
            // Get all listings for this developer
            const { data: developerListings, error: listingsError } = await supabaseAdmin
              .from('listings')
              .select('id')
              .eq('user_id', developer.developer_id)
              .eq('status', 'active')

            if (listingsError) {
              console.error(`❌ Error fetching listings for developer ${developer.developer_id}:`, listingsError)
              continue
            }

            if (!developerListings || developerListings.length === 0) {
              // No listings, set totals to 0
              const { error: updateError } = await supabaseAdmin
                .from('developers')
                .update({
                  total_views: 0,
                  total_leads: 0,
                  total_impressions: 0
                })
                .eq('developer_id', developer.developer_id)

              if (updateError) {
                console.error(`❌ Error updating developer ${developer.developer_id}:`, updateError)
              }
              continue
            }

            const listingIds = developerListings.map(l => l.id)

            // Calculate cumulative totals from all listing_analytics records for this developer's listings
            const { data: analyticsData, error: analyticsError } = await supabaseAdmin
              .from('listing_analytics')
              .select('total_views, total_leads, total_impressions')
              .in('listing_id', listingIds)

            if (!analyticsError) {
              const cumulativeViews = analyticsData?.reduce((sum, row) => sum + (row.total_views || 0), 0) || 0
              const cumulativeLeads = analyticsData?.reduce((sum, row) => sum + (row.total_leads || 0), 0) || 0
              const cumulativeImpressions = analyticsData?.reduce((sum, row) => sum + (row.total_impressions || 0), 0) || 0

              const { error: updateError } = await supabaseAdmin
                .from('developers')
                .update({
                  total_views: cumulativeViews,
                  total_leads: cumulativeLeads,
                  total_impressions: cumulativeImpressions
                })
                .eq('developer_id', developer.developer_id)

              if (updateError) {
                console.error(`❌ Error updating developer ${developer.developer_id}:`, updateError)
              }
            }
          } catch (err) {
            console.error(`❌ Exception updating developer ${developer.developer_id}:`, err)
          }
        }
        console.log(`✅ Completed updating ${allDevelopers.length} developers`)
      }
    } catch (err) {
      console.error('❌ Exception in developers update loop:', err)
    }

    // 13. Update admin_analytics table with platform-wide aggregations
    console.log(`🔄 Updating admin_analytics for date ${cal.date}...`)
    try {
      // Aggregate platform-wide metrics from all analytics tables
      const { data: allListingAnalytics, error: listingAnalyticsError } = await supabaseAdmin
        .from('listing_analytics')
        .select('*')
        .eq('date', cal.date)

      const { data: allUserAnalytics, error: userAnalyticsError } = await supabaseAdmin
        .from('user_analytics')
        .select('*')
        .eq('date', cal.date)

      // Format date for lead query (first_action_date is stored as YYYYMMDD)
      const leadDateKey = formatDayKey(new Date(cal.date))
      const { data: allLeads, error: leadsError } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('first_action_date', leadDateKey)

      // Get counts from database
      const { count: totalDevelopers } = await supabaseAdmin
        .from('developers')
        .select('*', { count: 'exact', head: true })

      const { count: totalAgents } = await supabaseAdmin
        .from('agents')
        .select('*', { count: 'exact', head: true })

      const { count: totalPropertySeekers } = await supabaseAdmin
        .from('property_seekers')
        .select('*', { count: 'exact', head: true })

      const { count: totalListings } = await supabaseAdmin
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      // Aggregate platform engagement
      const platformEngagement = {
        total_views: allListingAnalytics?.reduce((sum, row) => sum + (row.total_views || 0), 0) || 0,
        unique_views: allListingAnalytics?.reduce((sum, row) => sum + (row.unique_views || 0), 0) || 0,
        logged_in_views: allListingAnalytics?.reduce((sum, row) => sum + (row.logged_in_views || 0), 0) || 0,
        anonymous_views: allListingAnalytics?.reduce((sum, row) => sum + (row.anonymous_views || 0), 0) || 0,
        views_by_source: {
          home: allListingAnalytics?.reduce((sum, row) => sum + (row.views_from_home || 0), 0) || 0,
          explore: allListingAnalytics?.reduce((sum, row) => sum + (row.views_from_explore || 0), 0) || 0,
          search: allListingAnalytics?.reduce((sum, row) => sum + (row.views_from_search || 0), 0) || 0,
          direct: allListingAnalytics?.reduce((sum, row) => sum + (row.views_from_direct || 0), 0) || 0
        }
      }

      // Aggregate platform impressions
      const platformImpressions = {
        total: allListingAnalytics?.reduce((sum, row) => sum + (row.total_impressions || 0), 0) || 0,
        social_media: allListingAnalytics?.reduce((sum, row) => sum + (row.impression_social_media || 0), 0) || 0,
        website_visit: allListingAnalytics?.reduce((sum, row) => sum + (row.impression_website_visit || 0), 0) || 0,
        share: allListingAnalytics?.reduce((sum, row) => sum + (row.impression_share || 0), 0) || 0,
        saved_listing: allListingAnalytics?.reduce((sum, row) => sum + (row.impression_saved_listing || 0), 0) || 0
      }

      // Aggregate leads by type
      const phoneLeads = {
        total: allLeads?.filter(lead => 
          lead.lead_actions?.some(action => action.action_type === 'lead_phone')
        ).length || 0,
        unique: new Set(allLeads?.filter(lead => 
          lead.lead_actions?.some(action => action.action_type === 'lead_phone')
        ).map(lead => lead.seeker_id)).size || 0,
        percentage: 0,
        by_context: {}
      }

      const messageLeads = {
        total: allLeads?.filter(lead => 
          lead.lead_actions?.some(action => action.action_type === 'lead_message')
        ).length || 0,
        unique: new Set(allLeads?.filter(lead => 
          lead.lead_actions?.some(action => action.action_type === 'lead_message')
        ).map(lead => lead.seeker_id)).size || 0,
        percentage: 0,
        by_context: {}
      }

      const emailLeads = {
        total: allLeads?.filter(lead => 
          lead.lead_actions?.some(action => action.action_type === 'lead_email')
        ).length || 0,
        unique: new Set(allLeads?.filter(lead => 
          lead.lead_actions?.some(action => action.action_type === 'lead_email')
        ).map(lead => lead.seeker_id)).size || 0,
        percentage: 0,
        by_context: {}
      }

      const appointmentLeads = {
        total: allLeads?.filter(lead => 
          lead.lead_actions?.some(action => action.action_type === 'lead_appointment')
        ).length || 0,
        unique: new Set(allLeads?.filter(lead => 
          lead.lead_actions?.some(action => action.action_type === 'lead_appointment')
        ).map(lead => lead.seeker_id)).size || 0,
        percentage: 0,
        by_context: {}
      }

      const websiteLeads = {
        total: allLeads?.filter(lead => 
          lead.lead_actions?.some(action => action.action_type === 'lead_website')
        ).length || 0,
        unique: new Set(allLeads?.filter(lead => 
          lead.lead_actions?.some(action => action.action_type === 'lead_website')
        ).map(lead => lead.seeker_id)).size || 0,
        percentage: 0,
        by_context: {}
      }

      // Calculate percentages
      const totalLeadsCount = allLeads?.length || 0
      if (totalLeadsCount > 0) {
        phoneLeads.percentage = Number(((phoneLeads.total / totalLeadsCount) * 100).toFixed(2))
        messageLeads.percentage = Number(((messageLeads.total / totalLeadsCount) * 100).toFixed(2))
        emailLeads.percentage = Number(((emailLeads.total / totalLeadsCount) * 100).toFixed(2))
        appointmentLeads.percentage = Number(((appointmentLeads.total / totalLeadsCount) * 100).toFixed(2))
        websiteLeads.percentage = Number(((websiteLeads.total / totalLeadsCount) * 100).toFixed(2))
      }

      // Aggregate user metrics
      const developersMetrics = {
        total: totalDevelopers || 0,
        new: 0,
        active: totalDevelopers || 0,
        deactivated_accounts: 0,
        inactive: 0,
        verified: 0,
        unverified: 0,
        total_listings: totalListings || 0,
        total_sales: allListingAnalytics?.reduce((sum, row) => sum + (row.total_sales || 0), 0) || 0,
        total_revenue: allListingAnalytics?.reduce((sum, row) => sum + (row.sales_value || 0), 0) || 0,
        total_leads_generated: allLeads?.filter(lead => lead.lister_type === 'developer').length || 0
      }

      const agentsMetrics = {
        total: totalAgents || 0,
        new: 0,
        active: totalAgents || 0,
        deactivated_accounts: 0,
        inactive: 0,
        verified: 0,
        unverified: 0,
        total_listings: 0,
        total_sales: 0,
        total_revenue: 0,
        total_leads_generated: allLeads?.filter(lead => lead.lister_type === 'agent').length || 0
      }

      const propertySeekersMetrics = {
        total: totalPropertySeekers || 0,
        new: 0,
        active: totalPropertySeekers || 0,
        deactivated_accounts: 0,
        inactive: 0,
        verified: 0,
        unverified: 0,
        total_views: platformEngagement.total_views,
        total_leads: totalLeadsCount,
        saved_listings: platformImpressions.saved_listing
      }

      // Calculate conversion rates
      const totalViews = platformEngagement.total_views
      const conversionRate = totalViews > 0 
        ? Number(((totalLeadsCount / totalViews) * 100).toFixed(2)) 
        : 0

      const totalSales = allListingAnalytics?.reduce((sum, row) => sum + (row.total_sales || 0), 0) || 0
      const leadToSaleRate = totalLeadsCount > 0
        ? Number(((totalSales / totalLeadsCount) * 100).toFixed(2))
        : 0

      // Upsert admin_analytics
      const adminAnalyticsData = {
        date: cal.date,
        week: cal.week,
        month: cal.month,
        quarter: cal.quarter,
        year: cal.year,
        platform_engagement: platformEngagement,
        platform_impressions: platformImpressions,
        phone_leads: phoneLeads,
        message_leads: messageLeads,
        email_leads: emailLeads,
        appointment_leads: appointmentLeads,
        website_leads: websiteLeads,
        developers_metrics: developersMetrics,
        agents_metrics: agentsMetrics,
        property_seekers_metrics: propertySeekersMetrics,
        sales_metrics: {
          total: totalSales,
          sales_value: allListingAnalytics?.reduce((sum, row) => sum + (row.sales_value || 0), 0) || 0,
          avg_sale_price: totalSales > 0 
            ? Number((allListingAnalytics?.reduce((sum, row) => sum + (row.sales_value || 0), 0) / totalSales).toFixed(2))
            : 0,
          total_commission: 0,
          avg_commission_rate: 0
        },
        conversion_rates: {
          conversion_rate: conversionRate,
          lead_to_sale_rate: leadToSaleRate
        },
        updated_at: new Date().toISOString()
      }

      const { data: existingAdmin, error: fetchError } = await supabaseAdmin
        .from('admin_analytics')
        .select('*')
        .eq('date', cal.date)
        .maybeSingle()

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found, which is OK
        console.error('❌ Error fetching admin_analytics:', fetchError)
      } else {
        if (existingAdmin) {
          // Update existing record
          const { error: updateError } = await supabaseAdmin
            .from('admin_analytics')
            .update(adminAnalyticsData)
            .eq('date', cal.date)

          if (updateError) {
            console.error('❌ Error updating admin_analytics:', updateError)
          } else {
            console.log(`✅ Updated admin_analytics for date ${cal.date}`)
          }
        } else {
          // Insert new record
          const { error: insertError } = await supabaseAdmin
            .from('admin_analytics')
            .insert(adminAnalyticsData)

          if (insertError) {
            console.error('❌ Error inserting admin_analytics:', insertError)
          } else {
            console.log(`✅ Inserted admin_analytics for date ${cal.date}`)
          }
        }
      }
    } catch (err) {
      console.error('❌ Exception updating admin_analytics:', err)
    }

    // 13. Mark run as completed
    await completeRun(runId, {
      events_processed: events.length,
      listings_processed: listingRows.length,
      users_processed: userRows.length,
      developments_processed: developmentRows.length,
      leads_processed: leadRows.length,
      listings_inserted: insertResults.listings.inserted,
      users_inserted: insertResults.users.inserted,
      developments_inserted: insertResults.developments.inserted,
      leads_inserted: insertResults.leads.inserted
    })

    console.log(`✅ Cron run ${runId} completed successfully`)

    return NextResponse.json({
      success: true,
      run_id: runId,
      date: cal.date,
      processed: {
        events: events.length,
        listings: listingRows.length,
        users: userRows.length,
        developments: developmentRows.length,
        leads: leadRows.length
      },
      inserted: insertResults
    })

  } catch (error) {
    console.error('Cron analytics error:', error)
    
    // Mark run as failed
    if (runRecord) {
      await failRun(runId, error)
    }
    
    return NextResponse.json({
      success: false,
      error: error.message,
      run_id: runId
    }, { status: 500 })
  }
}

export async function GET(request) {
  // Health check
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    
    if (!date) {
      return NextResponse.json({ ok: true, message: 'Health check passed' })
    }
    
    // Test run for specific date
    const resp = await POST(new Request(request.url, {
      method: 'POST',
      body: JSON.stringify({ date })
    }))
    
    const data = await resp.json()
    return NextResponse.json({ ok: true, sample: data })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
