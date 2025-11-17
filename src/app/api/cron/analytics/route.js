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
  const hour = d.getUTCHours() // Get hour (0-23) for hourly tracking
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dayNum = tmp.getUTCDay() // getUTCDay() returns 0=Sunday, 1=Monday, ..., 6=Saturday
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7)
  // Day of week: 1=Monday, 2=Tuesday, ..., 7=Sunday
  // Convert: 0=Sunday -> 7, 1=Monday -> 1, ..., 6=Saturday -> 6
  const dayOfWeek = dayNum === 0 ? 7 : dayNum
  // ISO format: week (YYYY-W##), month (YYYY-MM), quarter (YYYY-Q#)
  return {
    date: `${y}-${String(m).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`,
    hour: hour, // Hour of day (0-23) for hourly tracking
    day: dayOfWeek, // Day of week (1=Monday, 7=Sunday)
    week: `${y}-W${String(week).padStart(2, '0')}`, // YYYY-W## format (e.g., 2025-W45)
    month: `${y}-${String(m).padStart(2, '0')}`, // YYYY-MM format (e.g., 2025-11)
    quarter: `${y}-Q${q}`, // YYYY-Q# format (e.g., 2025-Q4)
    year: y
  }
}

// Helper function to create optimized aggregate structure
function createAggregateStructure() {
  return {
    listings: new Map(), // Use Map for better performance with large datasets
    users: new Map(),    // Use Map for better performance with large datasets
    developments: new Map(), // Use Map for better performance with large datasets
    leads: new Map()    // Use Map for better performance with large datasets
  }
}

// Helper function to track unique counts efficiently (limited Set size)
function trackUnique(uniqueSet, uniqueCount, id, maxSetSize = 10000) {
  if (!uniqueSet.has(id)) {
    uniqueSet.add(id)
    uniqueCount++
    // Clear Set periodically to prevent memory issues
    if (uniqueSet.size > maxSetSize) {
      uniqueSet.clear()
      // Note: uniqueCount continues to accumulate
    }
  }
  return uniqueCount
}

// Aggregate events in-memory with optimizations
async function aggregateEvents(events, chunkSize = 5000) {
  // Early exit if no events
  if (!events || events.length === 0) {
    console.log('ℹ️ No events to process')
    return createAggregateStructure()
  }

  const aggregates = createAggregateStructure()
  
  // Process events in chunks to manage memory
  for (let i = 0; i < events.length; i += chunkSize) {
    const chunk = events.slice(i, i + chunkSize)
    await processEventChunk(chunk, aggregates, i)
  }

  // Convert Maps to objects for compatibility with existing code
  return {
    listings: Object.fromEntries(aggregates.listings),
    users: Object.fromEntries(aggregates.users),
    developments: Object.fromEntries(aggregates.developments),
    leads: Object.fromEntries(aggregates.leads)
  }
}

// Process a chunk of events
async function processEventChunk(chunk, aggregates, offset = 0) {
  // Early exit if chunk is empty
  if (!chunk || chunk.length === 0) return

  // CRITICAL: Pre-fetch lister_ids for all listings that appear in events but don't have lister_id
  // This ensures we always have lister_id when processing events
  const listingIdsNeedingListerId = new Set()
  chunk.forEach(event => {
    const props = event.properties || {}
    const listingId = props.listing_id || props.listingId || props.listing_uuid || props.property_id
    const listerId = props.lister_id || props.listerId || props.developer_id || props.developerId || props.agent_id || props.agentId
    
    if (listingId && !listerId) {
      listingIdsNeedingListerId.add(listingId)
    }
  })
  
  // Batch fetch lister_ids from listings table
  const listingToListerMap = {}
  if (listingIdsNeedingListerId.size > 0) {
    const uniqueListingIds = Array.from(listingIdsNeedingListerId)
    console.log(`🔍 [AGGREGATE] Pre-fetching lister_id for ${uniqueListingIds.length} listings missing lister_id in events`)
    
    const { data: listingsData, error: listingsError } = await supabaseAdmin
      .from('listings')
      .select('id, user_id, account_type')
      .in('id', uniqueListingIds)
    
    if (!listingsError && listingsData) {
      for (const listing of listingsData) {
        listingToListerMap[listing.id] = {
          lister_id: listing.user_id,
          lister_type: listing.account_type || 'developer'
        }
      }
      console.log(`✅ [AGGREGATE] Pre-fetched lister_id for ${Object.keys(listingToListerMap).length} listings`)
    } else if (listingsError) {
      console.error(`❌ [AGGREGATE] Error pre-fetching lister_ids:`, listingsError)
    }
  }

  for (const event of chunk) {
    const { event: eventName, properties = {}, distinct_id, timestamp } = event
    const eventDate = new Date(timestamp)
    const dayKey = formatDayKey(eventDate)
    const eventHour = eventDate.getUTCHours() // Get hour (0-23) for hourly tracking
    
    // Common properties
    // Try multiple property name variations for listing_id (PostHog may store as camelCase or snake_case)
    const listingId = properties.listing_id || properties.listingId || properties.listing_uuid || properties.property_id
    let listerId = properties.lister_id || properties.listerId || properties.developer_id || properties.developerId || properties.agent_id || properties.agentId
    let listerType = properties.lister_type || properties.listerType || (properties.developer_id || properties.developerId ? 'developer' : null) || (properties.agent_id || properties.agentId ? 'agent' : null)
    
    // CRITICAL: If lister_id is missing but listing_id exists, try to get it from pre-fetched map
    if (!listerId && listingId && listingToListerMap[listingId]) {
      listerId = listingToListerMap[listingId].lister_id
      listerType = listingToListerMap[listingId].lister_type
      console.log(`✅ [LISTER_ID_FALLBACK] Derived lister_id=${listerId} (${listerType}) from listing_id=${listingId}`)
    }
    
    // CRITICAL: Always provide seeker_id - default to "anonymous" if not available
    // Priority: seeker_id from properties > distinct_id > "anonymous"
    const seekerIdFromProps = properties.seeker_id || properties.seekerId
    const seekerId = seekerIdFromProps || (distinct_id ? distinct_id : 'anonymous')
    
    const isLoggedIn = properties.is_logged_in === true || properties.is_logged_in === 'true' || properties.isLoggedIn === true || properties.isLoggedIn === 'true'
    const viewedFrom = properties.viewed_from || properties.viewedFrom
    const profileId = properties.profile_id || properties.profileId
    const contextType = properties.context_type || properties.contextType

    // Initialize aggregates if needed (using Map)
    if (listingId && !aggregates.listings.has(listingId)) {
      aggregates.listings.set(listingId, {
        total_views: 0,
        unique_views: new Set(),
        unique_views_count: 0, // Counter for unique views
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
        unique_leads_count: 0 // Counter for unique leads
        // Note: total_sales removed - sales are tracked in sales_listings table, not via PostHog
      })
      if (aggregates.listings.size <= 5) {
        console.log(`✅ Initialized listing aggregate for ${listingId}`)
      }
    }

    // Process events
    switch (eventName) {

      case 'listing_impression': {
        // listing_impression is for detailed impression tracking (engagement/interaction)
        // This is separate from property_view - it tracks impressions, NOT views
        // Views are tracked separately via property_view event
        if (!listingId) {
          console.log(`⚠️ Skipping listing_impression: missing listingId`, { properties: Object.keys(properties) })
          break
        }
        const listing = aggregates.listings.get(listingId)
        if (!listing) {
          console.error(`❌ CRITICAL: listing ${listingId} not initialized in aggregates for listing_impression!`)
          break
        }
        // Only increment impressions, NOT views (views are tracked via property_view)
        listing.total_impressions++
        // Note: We don't increment total_views here to avoid double-counting
        // property_view already tracks views, listing_impression tracks impressions/engagement
        break
      }

      case 'impression_social_media': {
        // Can be listing-based or profile-based
        if (contextType === 'profile' && listerId) {
          // Profile-based impression - track in user aggregates
          if (!aggregates.users.has(listerId)) {
            aggregates.users.set(listerId, {
              user_type: listerType || 'unknown',
              profile_views: 0,
              unique_profile_viewers: new Set(),
              profile_views_from_home: 0,
              profile_views_from_listings: 0,
              profile_views_from_search: 0,
              searches_performed: 0,
              properties_viewed: 0,
              unique_properties_viewed: new Set(),
              properties_saved: 0,
              leads_initiated: 0,
              appointments_booked: 0,
              profile_impressions: 0,
              profile_impression_social_media: 0,
              profile_impression_website_visit: 0,
              profile_impression_share: 0
            })
          }
          const user = aggregates.users.get(listerId)
          if (!user) break
          user.profile_impressions++
          user.profile_impression_social_media++
        } else if (listingId) {
          // Listing-based impression - track in listing aggregates
        const listing = aggregates.listings.get(listingId)
        if (listing) {
        listing.impression_social_media++
        listing.total_impressions++
        }
        }
        break
      }

      case 'impression_website_visit': {
        // Can be listing-based or profile-based
        if (contextType === 'profile' && listerId) {
          // Profile-based impression - track in user aggregates
          if (!aggregates.users.has(listerId)) {
            aggregates.users.set(listerId, {
              user_type: listerType || 'unknown',
              profile_views: 0,
              unique_profile_viewers: new Set(),
              profile_views_from_home: 0,
              profile_views_from_listings: 0,
              profile_views_from_search: 0,
              searches_performed: 0,
              properties_viewed: 0,
              unique_properties_viewed: new Set(),
              properties_saved: 0,
              leads_initiated: 0,
              appointments_booked: 0,
              profile_impressions: 0,
              profile_impression_social_media: 0,
              profile_impression_website_visit: 0,
              profile_impression_share: 0
            })
            }
          const user = aggregates.users.get(listerId)
          if (user) {
          user.profile_impressions++
          user.profile_impression_website_visit++
          }
        } else if (listingId) {
          // Listing-based impression - track in listing aggregates
        const listing = aggregates.listings.get(listingId)
        if (listing) {
        listing.impression_website_visit++
        listing.total_impressions++
        }
        }
        break
      }

      case 'impression_share': {
        // Can be listing-based or profile-based
        // Check share_type property or context_type
        const shareType = properties.share_type || properties.shareType || contextType
        if (shareType === 'profile' && listerId) {
          // Profile-based share - track in user aggregates
          if (!aggregates.users.has(listerId)) {
            aggregates.users.set(listerId, {
              user_type: listerType || 'unknown',
              profile_views: 0,
              unique_profile_viewers: new Set(),
              profile_views_from_home: 0,
              profile_views_from_listings: 0,
              profile_views_from_search: 0,
              searches_performed: 0,
              properties_viewed: 0,
              unique_properties_viewed: new Set(),
              properties_saved: 0,
              leads_initiated: 0,
              appointments_booked: 0,
              profile_impressions: 0,
              profile_impression_social_media: 0,
              profile_impression_website_visit: 0,
              profile_impression_share: 0
            })
            }
          const user = aggregates.users.get(listerId)
          if (user) {
          user.profile_impressions++
          user.profile_impression_share++
          }
        } else if (listingId) {
          // Listing-based share - track in listing aggregates
        const listing = aggregates.listings.get(listingId)
        if (listing) {
        listing.impression_share++
        listing.total_impressions++
        }
        }
        break
      }

      case 'impression_saved_listing': {
        if (!listingId) break
        const listing = aggregates.listings.get(listingId)
        if (listing) {
        listing.impression_saved_listing++
        listing.total_impressions++
        }
        
        // Track saved listings for property_seekers
        if (seekerId) {
          if (!aggregates.users.has(seekerId)) {
            aggregates.users.set(seekerId, {
              user_type: 'property_seeker',
              profile_views: 0,
              unique_profile_viewers: new Set(),
              profile_views_from_home: 0,
              profile_views_from_listings: 0,
              profile_views_from_search: 0,
              searches_performed: 0,
              properties_viewed: 0,
              unique_properties_viewed: new Set(),
              properties_saved: 0,
              leads_initiated: 0,
              appointments_booked: 0
            })
            }
          const seekerUser = aggregates.users.get(seekerId)
          if (seekerUser) seekerUser.properties_saved++
        }
        break
      }

      case 'lead':
      // Backward compatibility: handle old event names
      case 'lead_phone':
      case 'lead_message':
      case 'lead_appointment': {
        // Unified lead event - extract lead_type from properties
        // If event is old format (lead_phone, lead_message, lead_appointment), derive lead_type from event name
        let leadType = properties.lead_type || properties.leadType
        if (!leadType) {
          // Backward compatibility: derive lead_type from old event names
          if (eventName === 'lead_phone') {
            leadType = 'phone'
          } else if (eventName === 'lead_message') {
            leadType = 'message'
          } else if (eventName === 'lead_appointment') {
            leadType = 'appointment'
          }
        }
        
        // For lead events, listing_id might be missing if it's from customer care or profile
        // Try to get it from context_type or profile_id
        let finalListingId = listingId
        if (!finalListingId && properties.context_type === 'listing' && properties.listing_uuid) {
          finalListingId = properties.listing_uuid
          console.log(`🔍 [LEAD_DEBUG] Found listing_id from listing_uuid: ${finalListingId}`)
        }
        
        if (!finalListingId && !seekerId) {
          console.log(`⚠️ [LEAD_DEBUG] Skipping lead (${leadType}): No listingId AND no seekerId`, {
            properties: Object.keys(properties),
            distinct_id,
            has_listing_id: !!properties.listing_id,
            has_listing_uuid: !!properties.listing_uuid,
            has_seeker_id: !!properties.seeker_id,
            context_type: properties.context_type,
            profile_id: properties.profile_id,
            lead_type: leadType
          })
          break
        }
        
        // If no listingId but we have seekerId and listerId, we can still track the lead
        // but we need to skip listing aggregation
        if (!finalListingId) {
          console.warn(`⚠️ [LEAD_DEBUG] lead (${leadType}) event missing listing_id but has seekerId=${seekerId}, listerId=${listerId}`)
          console.warn(`⚠️ [LEAD_DEBUG] This lead will be tracked for user analytics but NOT for listing analytics`)
          // Still track for user analytics but skip listing aggregation
          if (seekerId) {
            if (!aggregates.users.has(seekerId)) {
              aggregates.users.set(seekerId, {
                user_type: 'property_seeker',
                profile_views: 0,
                unique_profile_viewers: new Set(),
                profile_views_from_home: 0,
                profile_views_from_listings: 0,
                profile_views_from_search: 0,
                searches_performed: 0,
                properties_viewed: 0,
                unique_properties_viewed: new Set(),
                properties_saved: 0,
                leads_initiated: 0,
                appointments_booked: 0
              })
              }
            const seekerUser = aggregates.users.get(seekerId)
            if (seekerUser) {
              seekerUser.leads_initiated++
            // Track appointments booked for appointment leads
            if (leadType === 'appointment') {
                seekerUser.appointments_booked++
              }
            }
          }
          break
        }
        
        console.log(`✅ [LEAD_DEBUG] Processing lead (${leadType}) event:`, {
          listingId: finalListingId,
          seekerId,
          listerId,
          listerType,
          dayKey,
          timestamp,
          lead_type: leadType
        })
        
        // Initialize listing aggregate if needed
        if (finalListingId && !aggregates.listings.has(finalListingId)) {
          aggregates.listings.set(finalListingId, {
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
            unique_leads: new Set()
            // Note: total_sales removed - sales are tracked in sales_listings table, not via PostHog
          })
        }
        
        const listing = aggregates.listings.get(finalListingId)
        if (!listing) break
        
        // Process based on lead_type
        if (leadType === 'phone') {
        listing.phone_leads++
        listing.total_leads++
        if (seekerId) listing.unique_leads.add(seekerId)
          
          // Track leads initiated for property_seekers
          if (seekerId) {
            if (!aggregates.users.has(seekerId)) {
              aggregates.users.set(seekerId, {
                user_type: 'property_seeker',
                profile_views: 0,
                unique_profile_viewers: new Set(),
                profile_views_from_home: 0,
                profile_views_from_listings: 0,
                profile_views_from_search: 0,
                searches_performed: 0,
                properties_viewed: 0,
                unique_properties_viewed: new Set(),
                properties_saved: 0,
                leads_initiated: 0,
                appointments_booked: 0
              })
            }
            const seekerUser = aggregates.users.get(seekerId)
            if (seekerUser) seekerUser.leads_initiated++
          }
        
        // Track lead actions
          const leadKey = `${finalListingId}_${seekerId}`
        if (!aggregates.leads.has(leadKey)) {
          aggregates.leads.set(leadKey, {
              listing_id: finalListingId,
            lister_id: listerId,
            lister_type: listerType,
            seeker_id: seekerId,
            actions: []
          })
            console.log(`📝 [LEAD_DEBUG] Created new lead aggregate for ${leadKey}:`, aggregates.leads.get(leadKey))
        }
          const action = {
          action_id: crypto.randomUUID(),
          action_type: 'lead_phone',
          action_date: dayKey,
          action_hour: eventHour, // Add hour for hourly tracking
          action_timestamp: timestamp,
          action_metadata: {
            action: properties.action || 'click',
            context_type: properties.context_type || 'listing'
          }
      }
          const lead = aggregates.leads.get(leadKey)
          if (lead) {
            lead.actions.push(action)
            console.log(`✅ [LEAD_DEBUG] Added action to lead ${leadKey}. Total actions: ${lead.actions.length}`)
          }

        } else if (leadType === 'message') {
        const messageType = String(properties.message_type || '').toLowerCase()
        if (messageType === 'email') {
          listing.email_leads++
        } else {
          listing.message_leads++
        }
        listing.total_leads++
        if (seekerId) listing.unique_leads.add(seekerId)
        
          // Track leads initiated for property_seekers
          if (seekerId) {
            if (!aggregates.users.has(seekerId)) {
              aggregates.users.set(seekerId, {
                user_type: 'property_seeker',
                profile_views: 0,
                unique_profile_viewers: new Set(),
                profile_views_from_home: 0,
                profile_views_from_listings: 0,
                profile_views_from_search: 0,
                searches_performed: 0,
                properties_viewed: 0,
                unique_properties_viewed: new Set(),
                properties_saved: 0,
                leads_initiated: 0,
                appointments_booked: 0
              })
            }
            const seekerUser = aggregates.users.get(seekerId)
            if (seekerUser) seekerUser.leads_initiated++
          }
          
          const leadKey = `${finalListingId}_${seekerId}`
        if (!aggregates.leads.has(leadKey)) {
          aggregates.leads.set(leadKey, {
              listing_id: finalListingId,
            lister_id: listerId,
            lister_type: listerType,
            seeker_id: seekerId,
            actions: []
          })
            console.log(`📝 [LEAD_DEBUG] Created new lead aggregate for ${leadKey}`)
        }
          const action = {
          action_id: crypto.randomUUID(),
          action_type: 'lead_message',
          action_date: dayKey,
          action_hour: eventHour, // Add hour for hourly tracking
          action_timestamp: timestamp,
          action_metadata: {
            context_type: properties.context_type || 'listing',
            message_type: properties.message_type || 'direct_message'
          }
      }
          const lead = aggregates.leads.get(leadKey)
          if (lead) {
            lead.actions.push(action)
            console.log(`✅ [LEAD_DEBUG] Added action to lead ${leadKey}. Total actions: ${lead.actions.length}`)
          }

        } else if (leadType === 'appointment') {
        listing.appointment_leads++
        listing.total_leads++
        if (seekerId) listing.unique_leads.add(seekerId)
        
          // Track appointments booked and leads initiated for property_seekers
          if (seekerId) {
            if (!aggregates.users.has(seekerId)) {
              aggregates.users.set(seekerId, {
                user_type: 'property_seeker',
                profile_views: 0,
                unique_profile_viewers: new Set(),
                profile_views_from_home: 0,
                profile_views_from_listings: 0,
                profile_views_from_search: 0,
                searches_performed: 0,
                properties_viewed: 0,
                unique_properties_viewed: new Set(),
                properties_saved: 0,
                leads_initiated: 0,
                appointments_booked: 0
              })
            }
            const seekerUser = aggregates.users.get(seekerId)
            if (seekerUser) {
              seekerUser.leads_initiated++
              seekerUser.appointments_booked++
            }
          }
          
          const leadKey = `${finalListingId}_${seekerId}`
        if (!aggregates.leads.has(leadKey)) {
          aggregates.leads.set(leadKey, {
              listing_id: finalListingId,
            lister_id: listerId,
            lister_type: listerType,
            seeker_id: seekerId,
            actions: []
          })
            console.log(`📝 [LEAD_DEBUG] Created new lead aggregate for ${leadKey}`)
        }
          const action = {
          action_id: crypto.randomUUID(),
          action_type: 'lead_appointment',
          action_date: dayKey,
          action_hour: eventHour, // Add hour for hourly tracking
          action_timestamp: timestamp,
          action_metadata: {
            context_type: properties.context_type || 'listing',
            appointment_type: properties.appointment_type || 'viewing'
          }
          }
          const lead = aggregates.leads.get(leadKey)
          if (lead) {
            lead.actions.push(action)
            console.log(`✅ [LEAD_DEBUG] Added action to lead ${leadKey}. Total actions: ${lead.actions.length}`)
          }
        } else {
          console.warn(`⚠️ [LEAD_DEBUG] Unknown lead_type: ${leadType}, skipping`)
        }
        break
      }

      // Note: listing_sold event removed - sales are tracked in sales_listings table, not via PostHog
      // case 'listing_sold': {
      //   if (!listingId) break
      //   const listing = aggregates.listings[listingId]
      //   listing.total_sales++
      //   const saleValue = Number(properties.price) || 0
      //   listing.sales_value += saleValue
      //   break
      // }

      case 'profile_view': {
        const profileId = properties.profile_id
        const profileType = properties.profile_type
        if (!profileId) break
        
        if (!aggregates.users.has(profileId)) {
          aggregates.users.set(profileId, {
            user_type: profileType || 'unknown',
            profile_views: 0,
            unique_profile_viewers: new Set(),
            profile_views_from_home: 0,
            profile_views_from_listings: 0,
            profile_views_from_search: 0,
            searches_performed: 0,
            properties_viewed: 0,
            unique_properties_viewed: new Set(),
            properties_saved: 0,
            leads_initiated: 0,
            appointments_booked: 0,
            profile_impressions: 0,
            profile_impression_social_media: 0,
            profile_impression_website_visit: 0,
            profile_impression_share: 0
          })
        }
        const user = aggregates.users.get(profileId)
        if (user) {
          user.profile_views++
          if (distinct_id) user.unique_profile_viewers.add(distinct_id)
          const from = properties.viewed_from || properties.viewedFrom
          if (from === 'home') user.profile_views_from_home++
          else if (from === 'listings') user.profile_views_from_listings++
          else if (from === 'search') user.profile_views_from_search++
        }
        break
      }

      case 'property_search': {
        if (!seekerId) break
        if (!aggregates.users.has(seekerId)) {
          aggregates.users.set(seekerId, {
            user_type: 'property_seeker',
            profile_views: 0,
            unique_profile_viewers: new Set(),
            profile_views_from_home: 0,
            profile_views_from_listings: 0,
            profile_views_from_search: 0,
            searches_performed: 0,
            properties_viewed: 0,
            unique_properties_viewed: new Set(),
            properties_saved: 0,
            leads_initiated: 0,
              appointments_booked: 0
            })
          }
        const seekerUser = aggregates.users.get(seekerId)
        if (seekerUser) seekerUser.searches_performed++
        break
      }

      case 'property_view': {
        // Track property views for property_seekers
        if (seekerId && listingId) {
          if (!aggregates.users.has(seekerId)) {
            aggregates.users.set(seekerId, {
              user_type: 'property_seeker',
              profile_views: 0,
              unique_profile_viewers: new Set(),
              profile_views_from_home: 0,
              profile_views_from_listings: 0,
              profile_views_from_search: 0,
              searches_performed: 0,
              properties_viewed: 0,
              unique_properties_viewed: new Set(),
              properties_saved: 0,
              leads_initiated: 0,
              appointments_booked: 0
            })
          }
          const seekerUser = aggregates.users.get(seekerId)
          if (seekerUser) {
            seekerUser.properties_viewed++
            seekerUser.unique_properties_viewed.add(listingId)
          }
        }
        // Continue with existing listing aggregation logic
        if (!listingId) {
          console.log(`⚠️ Skipping property_view: missing listingId`, { properties: Object.keys(properties) })
          break
        }
        const listing = aggregates.listings.get(listingId)
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

      case 'development_view': {
        const developmentId = properties.development_id || properties.developmentId
        if (!developmentId) break
        
        if (!aggregates.developments.has(developmentId)) {
          aggregates.developments.set(developmentId, {
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
            // Note: total_sales removed - sales are tracked in sales_listings table, not via PostHog
            total_shares: 0,
            saved_count: 0,
            social_media_clicks: 0,
            total_interactions: 0
          })
        }
        const dev = aggregates.developments.get(developmentId)
        if (dev) {
          dev.total_views++
          if (seekerId) dev.unique_views.add(seekerId)
          if (isLoggedIn) dev.logged_in_views++
          else dev.anonymous_views++
          if (viewedFrom) {
            const key = `views_from_${String(viewedFrom).toLowerCase()}`
            if (dev[key] !== undefined) dev[key]++
          }
        }
        break
      }

      case 'development_share': {
        const developmentId = properties.development_id || properties.developmentId
        if (!developmentId) break
        const dev = aggregates.developments.get(developmentId)
        if (dev) dev.total_shares++
        break
      }

      case 'development_saved': {
        const developmentId = properties.development_id || properties.developmentId
        if (!developmentId) break
        const dev = aggregates.developments.get(developmentId)
        if (dev) dev.saved_count++
        break
      }

      case 'development_social_click': {
        const developmentId = properties.development_id || properties.developmentId
        if (!developmentId) break
        const dev = aggregates.developments.get(developmentId)
        if (dev) dev.social_media_clicks++
        break
      }

      case 'development_interaction': {
        const developmentId = properties.development_id || properties.developmentId
        if (!developmentId) break
        
        if (!aggregates.developments.has(developmentId)) {
          aggregates.developments.set(developmentId, {
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
            // Note: total_sales removed - sales are tracked in sales_listings table, not via PostHog
            total_shares: 0,
            saved_count: 0,
            social_media_clicks: 0,
            total_interactions: 0
          })
        }
        
        const dev = aggregates.developments.get(developmentId)
        if (!dev) break
        
        const action = properties.action || properties.action_type
        
        // Handle different interaction types
        if (action === 'social_media_click' || action === 'social_click') {
          dev.social_media_clicks++
        } else if (action === 'website_visit' || action === 'website') {
          // Website visits are tracked as social_media_clicks (engagement metric)
          // Note: website_leads in development_analytics is for actual lead events, not visits
          dev.social_media_clicks++
        } else if (action === 'share') {
          dev.total_shares++
        } else if (action === 'save' || action === 'saved') {
          dev.saved_count++
        } else {
          // Generic interaction counter
          dev.total_interactions++
        }
        break
      }

      case 'development_lead': {
        const developmentId = properties.development_id || properties.developmentId
        if (!developmentId) break
        const dev = aggregates.developments.get(developmentId)
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
      // OPTIMIZATION: Mark stuck runs as failed in parallel
      if (stuckRuns.length > 0) {
        await Promise.all(
          stuckRuns.map(run => 
            failRun(run.run_id, new Error('Run stuck for more than 2 hours'))
          )
        )
      }
    }

    // 2. Get last successful run to determine start time
    // Check if we should ignore last run (for testing - add ?ignoreLastRun=true to URL)
    const { searchParams } = new URL(request.url)
    const ignoreLastRun = searchParams.get('ignoreLastRun') === 'true'
    const testMode = searchParams.get('testMode') === 'true' // Fetch last 24 hours for testing
    
    const lastRun = ignoreLastRun ? null : await getLastSuccessfulRun()
    
    // Check for failed runs between last successful run and now
    let failedRunsSinceLastSuccess = []
    if (lastRun) {
      const { data: failedRuns } = await supabaseAdmin
        .from('analytics_cron_status')
        .select('run_id, start_time, end_time, status, last_error')
        .eq('status', 'failed')
        .gt('start_time', lastRun.end_time)
        .order('start_time', { ascending: true })
      
      failedRunsSinceLastSuccess = failedRuns || []
    }
    
    console.log('🔍 Last successful run:', lastRun ? {
      run_id: lastRun.run_id,
      end_time: lastRun.end_time,
      completed_at: lastRun.completed_at
    } : 'None found (or ignored)')
    
    if (failedRunsSinceLastSuccess.length > 0) {
      console.log(`⚠️ Found ${failedRunsSinceLastSuccess.length} failed run(s) since last success. Will retry those periods.`)
      failedRunsSinceLastSuccess.forEach(fr => {
        console.log(`  - Failed run ${fr.run_id}: ${fr.start_time} to ${fr.end_time} (${fr.last_error || 'unknown error'})`)
      })
    }
    
    let startTime
    if (testMode) {
      // Test mode: fetch last 24 hours
      startTime = new Date(Date.now() - 24 * 60 * 60 * 1000)
      console.log('🧪 TEST MODE: Fetching last 24 hours')
            } else {
      // Always fetch from 1 year ago to capture all historical data
      // Using UPSERT ensures we update existing records instead of creating duplicates
      const oneYearAgo = 365 * 24 * 60 * 60 * 1000 // 1 year in milliseconds
      startTime = new Date(Date.now() - oneYearAgo)
      console.log(`📅 Fetching all events from 1 year ago (${startTime.toISOString()})`)
      console.log(`   ↳ This ensures we capture all historical data`)
      if (lastRun) {
        console.log(`   ↳ Last successful run was at ${lastRun.end_time}, but fetching from 1 year ago to ensure completeness`)
      }
        if (failedRunsSinceLastSuccess.length > 0) {
        console.log(`   ↳ Will also retry ${failedRunsSinceLastSuccess.length} failed period(s) using UPSERT (updates existing records)`)
      }
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
      currentDate: cal.date,
      currentHour: cal.hour, // Hourly tracking: current hour (0-23)
      currentTime: new Date().toISOString()
    })

    // 3. Create run record
    runRecord = await createRunRecord({
      run_id: runId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      target_date: cal.date,
      target_hour: cal.hour, // Add target hour for hourly tracking (0-23)
      run_type: 'scheduled'
    })

    console.log(`📊 Starting analytics cron run ${runId} from ${startTime.toISOString()} to ${endTime.toISOString()}`)
    console.log(`🕐 Hourly tracking: Processing data for date ${cal.date}, hour ${cal.hour} (0-23)`)

    // 4. Fetch events from PostHog
    // Define the custom events we care about
    const customEventNames = [
      'property_view',
      'listing_impression', // Also track this (found in PostHog)
      'lead', // Unified lead event (new format)
      'lead_phone', // Legacy lead events (backward compatibility)
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
      // Note: 'listing_sold' removed - sales are tracked in sales_listings table, not via PostHog
    ]

    console.log('📡 Fetching events from PostHog:', {
      eventNames: customEventNames.length,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      eventList: customEventNames,
      timeRangeMinutes: (endTime - startTime) / (1000 * 60)
    })

    // Fetch only our custom events from PostHog (filter at API level to reduce payload)
    // This excludes auto-capture events like $pageview, $autocapture, etc.
    const { success, events: allEvents, apiCalls, error } = await fetchEventsWithRetry(
      startTime,
      endTime,
      customEventNames // Pass custom event names to filter at PostHog API level
    )

    if (!success || !allEvents) {
      const errorMessage = error?.message || 'Unknown error'
      console.error(`❌ Failed to fetch events from PostHog: ${errorMessage}`)
      throw new Error(`Failed to fetch events from PostHog: ${errorMessage}`)
    }

    // Filter to only our custom events
    const events = Array.isArray(allEvents) ? allEvents.filter(e => customEventNames.includes(e.event)) : []
    
    // Detailed event breakdown by type
    const allEventsBreakdown = allEvents.reduce((acc, e) => {
        acc[e.event] = (acc[e.event] || 0) + 1
        return acc
      }, {})
    
    const customEventsBreakdown = events.reduce((acc, e) => {
      acc[e.event] = (acc[e.event] || 0) + 1
      return acc
    }, {})
    
    // Log sample lead events to see their properties (including unified 'lead' event and legacy events)
    const leadEvents = events.filter(e => ['lead', 'lead_phone', 'lead_message', 'lead_appointment'].includes(e.event))
    if (leadEvents.length > 0) {
      console.log('🔍 [LEAD_DEBUG] Sample lead events from PostHog:')
      leadEvents.slice(0, 3).forEach((event, idx) => {
        console.log(`  Lead event ${idx + 1} (${event.event}):`, {
          event: event.event,
          distinct_id: event.distinct_id,
          properties_keys: Object.keys(event.properties || {}),
          listing_id: event.properties?.listing_id,
          listingId: event.properties?.listingId,
          listing_uuid: event.properties?.listing_uuid,
          property_id: event.properties?.property_id,
          seeker_id: event.properties?.seeker_id,
          seekerId: event.properties?.seekerId,
          lister_id: event.properties?.lister_id,
          listerId: event.properties?.listerId,
          context_type: event.properties?.context_type,
          profile_id: event.properties?.profile_id,
          full_properties: JSON.stringify(event.properties, null, 2)
        })
      })
    }
    
    console.log('🔍 Event filtering:', {
      totalEventsFetched: allEvents.length,
      customEventsFound: events.length,
      allEventsBreakdown: allEventsBreakdown,
      customEventsBreakdown: customEventsBreakdown
    })
    
    // Detailed logging for each event type we care about
    console.log('📊 [EVENT_COUNT_DEBUG] Detailed event counts by type:')
    for (const eventName of customEventNames) {
      const count = customEventsBreakdown[eventName] || 0
      const percentage = events.length > 0 ? ((count / events.length) * 100).toFixed(2) : 0
      console.log(`  ${eventName}: ${count} events (${percentage}% of custom events)`)
    }
    
    // Special focus on lead events (include unified 'lead' event and legacy events)
    const leadEventNames = ['lead', 'lead_phone', 'lead_message', 'lead_appointment']
    const totalLeadEvents = leadEventNames.reduce((sum, name) => sum + (customEventsBreakdown[name] || 0), 0)
    console.log('🎯 [LEAD_EVENT_DEBUG] Lead events summary:', {
      lead: customEventsBreakdown['lead'] || 0, // Unified lead event
      lead_phone: customEventsBreakdown['lead_phone'] || 0,
      lead_message: customEventsBreakdown['lead_message'] || 0,
      lead_appointment: customEventsBreakdown['lead_appointment'] || 0,
      total_lead_events: totalLeadEvents,
      percentage_of_all_events: events.length > 0 ? ((totalLeadEvents / events.length) * 100).toFixed(2) + '%' : '0%'
    })
    
    if (totalLeadEvents === 0) {
      console.warn('⚠️ [LEAD_EVENT_DEBUG] WARNING: No lead events found in PostHog!')
      console.warn('⚠️ [LEAD_EVENT_DEBUG] This means leads table will be empty.')
      console.warn('⚠️ [LEAD_EVENT_DEBUG] Check if lead (unified) or lead_phone, lead_message, lead_appointment events are being sent to PostHog.')
    }

    console.log('📡 PostHog API response:', {
      success,
      totalEventsFetched: allEvents?.length || 0,
      customEventsFound: events?.length || 0,
      apiCalls: apiCalls || 0,
      error: error?.message || null,
      customEventsBreakdown: customEventsBreakdown,
      sampleCustomEvents: events?.slice(0, 3).map(e => ({
        event: e.event,
        timestamp: e.timestamp,
        listing_id: e.properties?.listing_id,
        seeker_id: e.properties?.seeker_id,
        distinct_id: e.distinct_id
      })) || []
    })

    await updateRunProgress(runId, {
      events_fetched: allEvents.length, // Total events fetched
      posthog_api_calls: apiCalls || 0
    })

    console.log(`✅ Fetched ${allEvents.length} total events, ${events.length} custom events from PostHog (${apiCalls} API calls)`)
    
    // Summary of what we got from PostHog
    console.log('📈 [POSTHOG_DATA_SUMMARY] What PostHog returned:')
    console.log(`  Total events fetched: ${allEvents.length}`)
    console.log(`  Custom events found: ${events.length}`)
    console.log(`  Lead events: ${totalLeadEvents}`)
    console.log(`  Property views: ${customEventsBreakdown['property_view'] || 0}`)
    console.log(`  Profile views: ${customEventsBreakdown['profile_view'] || 0}`)
    console.log(`  Impressions: ${(customEventsBreakdown['impression_social_media'] || 0) + (customEventsBreakdown['impression_website_visit'] || 0) + (customEventsBreakdown['impression_share'] || 0) + (customEventsBreakdown['impression_saved_listing'] || 0)}`)
    
    if (events.length === 0) {
      console.warn('⚠️ WARNING: No custom events found! This might indicate:')
      console.warn(`  1. No custom events in the time range (found ${allEvents.length} total events, but none match our custom event names)`)
      console.warn('  2. Events are being sent with different names')
      console.warn('  3. Time range is too narrow')
      console.warn(`  4. All events in PostHog: ${JSON.stringify(Object.keys(allEventsBreakdown))}`)
    }
    
    if (totalLeadEvents === 0 && events.length > 0) {
      console.warn('⚠️ WARNING: Custom events found but NO lead events!')
      console.warn('⚠️ This means PostHog has data, but lead events are missing.')
      console.warn('⚠️ Check if lead (unified) or lead_phone, lead_message, lead_appointment events are being tracked.')
    }

    // 5. Aggregate events in-memory
    console.log(`🔄 Aggregating ${events.length} custom events...`)
    console.log('📋 Sample events before aggregation:', events.slice(0, 3).map(e => ({
      event: e.event,
      listing_id: e.properties?.listing_id || e.properties?.listingId,
      lister_id: e.properties?.lister_id || e.properties?.listerId,
      seeker_id: e.properties?.seeker_id || e.properties?.seekerId
    })))
    
    const aggregates = await aggregateEvents(events)
    
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
        lister_id: lead.lister_id,
        lister_type: lead.lister_type
      }))
    })
    
    // Detailed leads debugging
    console.log('🔍 [LEAD_DEBUG] Detailed leads aggregation:', {
      totalLeads: Object.keys(aggregates.leads).length,
      leadsBreakdown: Object.entries(aggregates.leads).map(([key, lead]) => ({
        leadKey: key,
        listing_id: lead.listing_id,
        seeker_id: lead.seeker_id,
        lister_id: lead.lister_id,
        lister_type: lead.lister_type,
        actionsCount: lead.actions.length,
        actionTypes: lead.actions.map(a => a.action_type),
        firstActionDate: lead.actions[0]?.action_date,
        lastActionDate: lead.actions[lead.actions.length - 1]?.action_date
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
    
    // Get previous period's listing_analytics for change calculations
    // For hourly tracking: get previous hour (or same day previous hour, or previous day if hour 0)
    const previousHour = cal.hour > 0 ? cal.hour - 1 : 23
    const previousDate = cal.hour > 0 ? cal.date : calendarParts(new Date(endTime.getTime() - 24 * 60 * 60 * 1000)).date
    
    const { data: previousListingAnalytics } = await supabaseAdmin
      .from('listing_analytics')
      .select('listing_id, total_views, total_impressions, total_leads, conversion_rate')
      .eq('date', previousDate)
      .eq('hour', previousHour)
    
    const previousListingMap = {}
    if (previousListingAnalytics) {
      for (const prev of previousListingAnalytics) {
        previousListingMap[prev.listing_id] = prev
      }
    }
    
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
        unique_leads: new Set()
        // Note: total_sales removed - sales are tracked in sales_listings table, not via PostHog
      }

      // ============================================
      // CONVERSION RATE CALCULATION FOR LISTING ANALYTICS
      // ============================================
      // For listings, conversion rates are calculated as follows:
      // 
      // 1. conversion_rate = (total_leads / total_views) * 100
      //    - Shows % of listing views that convert to leads
      //    - Formula: (leads / views) * 100
      //
        // Note: lead_to_sale_rate removed - sales are tracked in sales_listings table, not via PostHog
      //
      // Example: If a listing has 100 views, 5 leads, and 1 sale:
      //   - conversion_rate = (5/100) * 100 = 5%
      //   - lead_to_sale_rate = (1/5) * 100 = 20%
      // ============================================

      const total_views = listing.total_views
      const unique_views = listing.unique_views instanceof Set ? listing.unique_views.size : (listing.unique_views || 0)
      const total_leads = listing.total_leads
      const unique_leads = listing.unique_leads instanceof Set ? listing.unique_leads.size : (listing.unique_leads || 0)
      // Note: total_sales and lead_to_sale_rate removed - sales are tracked in sales_listings table, not via PostHog
      const conversion_rate = total_views > 0 ? Number(((total_leads / total_views) * 100).toFixed(2)) : 0

      // Calculate changes from previous period
      const previous = previousListingMap[listingId] || {}
      const prevViews = previous.total_views || 0
      const prevImpressions = previous.total_impressions || 0
      const prevLeads = previous.total_leads || 0
      const prevConversion = previous.conversion_rate || 0
      
      const viewsChange = prevViews > 0
        ? Number((((total_views - prevViews) / prevViews) * 100).toFixed(2))
        : (total_views > 0 ? 100 : 0)
      
      const impressionsChange = prevImpressions > 0
        ? Number((((listing.total_impressions - prevImpressions) / prevImpressions) * 100).toFixed(2))
        : (listing.total_impressions > 0 ? 100 : 0)
      
      const leadsChange = prevLeads > 0
        ? Number((((total_leads - prevLeads) / prevLeads) * 100).toFixed(2))
        : (total_leads > 0 ? 100 : 0)
      
      const conversionChange = prevConversion > 0
        ? Number((((conversion_rate - prevConversion) / prevConversion) * 100).toFixed(2))
        : (conversion_rate > 0 ? 100 : 0)

      listingRows.push({
        listing_id: listingId,
        date: cal.date,
        hour: cal.hour, // Add hour for hourly tracking
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
        // Note: total_sales, lead_to_sale_rate, and avg_days_to_sale removed - sales are tracked in sales_listings table
        conversion_rate,
        views_change: {
          previous: prevViews,
          current: total_views,
          change: viewsChange,
          change_percentage: viewsChange
        },
        impressions_change: {
          previous: prevImpressions,
          current: listing.total_impressions,
          change: impressionsChange,
          change_percentage: impressionsChange
        },
        leads_change: {
          previous: prevLeads,
          current: total_leads,
          change: leadsChange,
          change_percentage: leadsChange
        },
        conversion_change: {
          previous: prevConversion,
          current: conversion_rate,
          change: conversionChange,
          change_percentage: conversionChange
        }
        // Note: revenue_change removed - revenue is tracked in sales_listings table, not via PostHog
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
    const allUserIds = new Set([...user_ids, ...Object.keys(aggregates.users)])
    
    // Get previous period's user_analytics for change calculations
    // For hourly tracking: get previous hour (or same day previous hour, or previous day if hour 0)
    const previousUserHour = cal.hour > 0 ? cal.hour - 1 : 23
    const previousUserDate = cal.hour > 0 ? cal.date : calendarParts(new Date(endTime.getTime() - 24 * 60 * 60 * 1000)).date
    
    const { data: previousUserAnalytics } = await supabaseAdmin
      .from('user_analytics')
      .select('user_id, user_type, profile_views, total_listing_views, total_views, total_listing_leads, total_leads, total_impressions_received, leads_initiated, impression_social_media_received, impression_website_visit_received, impression_share_received')
      .eq('date', previousUserDate)
      .eq('hour', previousUserHour)
    
    const previousAnalyticsMap = {}
    if (previousUserAnalytics) {
      for (const prev of previousUserAnalytics) {
        const key = `${prev.user_id}_${prev.user_type}`
        previousAnalyticsMap[key] = prev
      }
    }
    
    // Get leads data for the current hour only (not entire day)
    // Filter by created_at timestamp to get only leads from this hour
    const currentHourStart = new Date(Date.UTC(
      parseInt(cal.date.split('-')[0]),
      parseInt(cal.date.split('-')[1]) - 1,
      parseInt(cal.date.split('-')[2]),
      cal.hour,
      0,
      0
    ))
    const currentHourEnd = new Date(currentHourStart)
    currentHourEnd.setUTCHours(currentHourEnd.getUTCHours() + 1)
    
    const { data: currentDateLeads } = await supabaseAdmin
      .from('leads')
      .select('seeker_id, lister_id, lister_type, listing_id, lead_actions, created_at')
      .gte('created_at', currentHourStart.toISOString())
      .lt('created_at', currentHourEnd.toISOString())
    
    // Aggregate leads by seeker_id and lister_id
    const leadsBySeeker = {}
    const leadsByLister = {}
    const profileLeadsByLister = {} // Profile leads (listing_id IS NULL) by lister_id
    if (currentDateLeads) {
      for (const lead of currentDateLeads) {
        // For property_seekers
        if (lead.seeker_id) {
          if (!leadsBySeeker[lead.seeker_id]) {
            leadsBySeeker[lead.seeker_id] = {
              leads_initiated: 0,
              appointments_booked: 0
            }
          }
          leadsBySeeker[lead.seeker_id].leads_initiated++
          const hasAppointment = lead.lead_actions?.some(action => action.action_type === 'lead_appointment')
          if (hasAppointment) {
            leadsBySeeker[lead.seeker_id].appointments_booked++
          }
        }
        
        // For developers/agents (leads generated)
        if (lead.lister_id) {
          const key = `${lead.lister_id}_${lead.lister_type}`
          if (!leadsByLister[key]) {
            leadsByLister[key] = {
              total_leads: 0,
              phone_leads: 0,
              message_leads: 0,
              website_leads: 0
            }
          }
          leadsByLister[key].total_leads++
          const phoneAction = lead.lead_actions?.some(action => action.action_type === 'lead_phone')
          const messageAction = lead.lead_actions?.some(action => action.action_type === 'lead_message')
          const websiteAction = lead.lead_actions?.some(action => action.action_type === 'lead_website')
          if (phoneAction) leadsByLister[key].phone_leads++
          if (messageAction) leadsByLister[key].message_leads++
          if (websiteAction) leadsByLister[key].website_leads++
          
          // Track profile leads separately (listing_id IS NULL)
          if (!lead.listing_id) {
            if (!profileLeadsByLister[key]) {
              profileLeadsByLister[key] = 0
            }
            profileLeadsByLister[key]++
          }
        }
      }
    }
    
    // REMOVED: cumulativeLeadsByLister query - no longer needed since we use hourly data only
    // We now use leadsByLister which contains only current hour's leads
    
    // OPTIMIZATION: Batch fetch all listings for developers/agents at once (fixes N+1 query issue)
    const listerUserIds = []
    for (const userId of allUserIds) {
      const user = aggregates.users[userId]
      if (user && (user.user_type === 'developer' || user.user_type === 'agent')) {
        listerUserIds.push(userId)
      }
    }
    
    // Batch fetch all listings for all listers in one query
    let listingsByUserId = {}
    let allListerListingIds = []
    if (listerUserIds.length > 0) {
      const { data: allListings } = await supabaseAdmin
        .from('listings')
        .select('id, user_id, listing_status')
        .in('user_id', listerUserIds)
        .eq('listing_status', 'active') // Only active listings
        // Note: 'sold' and 'rented' status removed - sales are tracked in sales_listings table
      
      if (allListings) {
        // Group listings by user_id
        for (const listing of allListings) {
          if (!listingsByUserId[listing.user_id]) {
            listingsByUserId[listing.user_id] = []
          }
          listingsByUserId[listing.user_id].push(listing)
          allListerListingIds.push(listing.id)
        }
      }
    }
    
    // Batch fetch all listing analytics for all listings in one query
    // For user_analytics: we need current hour's data only
    let listingAnalyticsByListingId = {}
    if (allListerListingIds.length > 0) {
      const { data: allListingAnalytics } = await supabaseAdmin
        .from('listing_analytics')
        .select('listing_id, total_views, total_leads, total_impressions, impression_social_media, impression_website_visit, impression_share, impression_saved_listing')
        .in('listing_id', allListerListingIds)
        .eq('date', cal.date)
        .eq('hour', cal.hour) // Only get current hour's data for user_analytics
      
      if (allListingAnalytics) {
        // Group analytics by listing_id
        for (const analytics of allListingAnalytics) {
          listingAnalyticsByListingId[analytics.listing_id] = analytics
        }
      }
    }
    
    // OPTIMIZATION: Calculate cumulative listing views using SQL aggregation (replaces 2000+ queries with 1 query)
    // Strategy: Use SQL function to aggregate all historical data, fallback to PostHog if database is empty
    let cumulativeListingViewsByListingId = {}
    let cumulativeListingViewsFromPostHog = {} // Fallback: count from PostHog events by lister_id
    
    if (allListerListingIds.length > 0) {
      try {
        // Use SQL aggregation function - much faster than nested chunking
        const { data: cumulativeViews, error: cumulativeError } = await supabaseAdmin.rpc(
          'get_cumulative_listing_views',
          { listing_ids: allListerListingIds }
        )
        
        if (cumulativeError) {
          console.error('❌ Error fetching cumulative listing views via SQL:', cumulativeError)
          // Fallback to PostHog calculation
        } else if (cumulativeViews && cumulativeViews.length > 0) {
          // Convert array to map for O(1) lookup
          for (const row of cumulativeViews) {
            cumulativeListingViewsByListingId[row.listing_id] = Number(row.total_views) || 0
          }
          console.log(`✅ Fetched cumulative views for ${cumulativeViews.length} listings via SQL aggregation`)
        }
      } catch (err) {
        console.error('❌ Exception calling get_cumulative_listing_views:', err)
        // Will fallback to PostHog calculation
      }
    }
    
    // FALLBACK: Always calculate from PostHog events as backup (PostHog → Database, not Database → Database)
    // This ensures we have data even if listing_analytics is empty (first run) or incomplete
    // Count property_view events where lister_id matches developer_id
    if (events.length > 0) {
      // Group property_view events by lister_id (count all property_view events for each lister)
      for (const event of events) {
        if (event.event === 'property_view' && event.properties?.lister_id) {
          const listerId = event.properties.lister_id
          if (!cumulativeListingViewsFromPostHog[listerId]) {
            cumulativeListingViewsFromPostHog[listerId] = 0
          }
          cumulativeListingViewsFromPostHog[listerId]++
        }
      }
      
      if (Object.keys(cumulativeListingViewsFromPostHog).length > 0) {
        console.log(`📊 PostHog fallback: Calculated views for ${Object.keys(cumulativeListingViewsFromPostHog).length} listers from PostHog events`)
      }
    }
    
    for (const userId of allUserIds) {
      const user = aggregates.users[userId] || {
        user_type: 'unknown',
        profile_views: 0,
        unique_profile_viewers: new Set(),
        profile_views_from_home: 0,
        profile_views_from_listings: 0,
        profile_views_from_search: 0,
        searches_performed: 0,
        properties_viewed: 0,
        unique_properties_viewed: new Set(),
        properties_saved: 0,
        leads_initiated: 0,
        appointments_booked: 0
      }

      // Skip if user_type is unknown or property_seeker - user_analytics is only for listers (developers, agents, agencies)
      let user_type = user.user_type
      if (!user_type || user_type === 'unknown' || user_type === 'property_seeker') {
        // Skip unknown users and property_seekers - user_analytics is only for listers
        continue
      }

      // Initialize default values
      let total_listings = 0
      let active_listings = 0
      let rented_listings = 0
      // Note: sold_listings and total_listing_sales removed - sales are tracked in sales_listings table
      let total_listing_views = 0
      let total_listing_leads = 0
      let total_leads = 0 // Total leads (listing + profile) for developers/agents
      // Note: total_revenue removed - revenue is tracked in sales_listings table, not via PostHog
      let total_leads_generated = 0
      let phone_leads_generated = 0
      let message_leads_generated = 0
      let website_leads_generated = 0
      let total_impressions_received = 0
      let impression_social_media_received = 0
      let impression_website_visit_received = 0
      let impression_share_received = 0
      let impression_saved_listing_received = 0
      let properties_viewed = user.properties_viewed || 0
      let unique_properties_viewed = user.unique_properties_viewed instanceof Set ? user.unique_properties_viewed.size : (user.unique_properties_viewed || 0)
      let leads_initiated = user.leads_initiated || 0
      let appointments_booked = user.appointments_booked || 0
      let properties_saved = user.properties_saved || 0
      // Note: total_revenue removed - revenue is tracked in sales_listings table, not via PostHog

      // For developers/agents: aggregate from their listings (using pre-fetched data)
      if (user_type === 'developer' || user_type === 'agent') {
        // Use pre-fetched listings data
        const userListings = listingsByUserId[userId] || []

        total_listings = userListings.length
        active_listings = userListings.filter(l => l.listing_status === 'active').length
        rented_listings = userListings.filter(l => l.listing_status === 'rented').length
        // Note: sold_listings removed - sales are tracked in sales_listings table

        // Aggregate views, leads, impressions from pre-fetched listing analytics
        if (userListings.length > 0) {
          for (const listing of userListings) {
            const analytics = listingAnalyticsByListingId[listing.id]
            if (analytics) {
              total_listing_views += analytics.total_views || 0
              total_listing_leads += analytics.total_leads || 0
              // Note: total_listing_sales removed - sales are tracked in sales_listings table
              total_impressions_received += analytics.total_impressions || 0
              impression_social_media_received += analytics.impression_social_media || 0
              impression_website_visit_received += analytics.impression_website_visit || 0
              impression_share_received += analytics.impression_share || 0
              impression_saved_listing_received += analytics.impression_saved_listing || 0
            }
          }
        }

        // Get leads generated from leads table for CURRENT HOUR ONLY (both listing and profile leads)
        const listerKey = `${userId}_${user_type}`
        const listerLeads = leadsByLister[listerKey]
        if (listerLeads) {
          total_leads_generated = listerLeads.total_leads
          phone_leads_generated = listerLeads.phone_leads
          message_leads_generated = listerLeads.message_leads
          website_leads_generated = listerLeads.website_leads
        }
        
        // FIXED: Calculate total_leads = CURRENT HOUR leads only (listing + profile)
        // Use leadsByLister which contains only current hour's leads, not cumulativeLeadsByLister
        const total_leads = listerLeads?.total_leads || 0
        
        // DEBUG: Log total_leads calculation
        console.log(`📊 [TOTAL_LEADS_DEBUG] User ${userId} (${user_type}): total_leads=${total_leads} (CURRENT HOUR ONLY), listerKey=${listerKey}, leadsByLister[${listerKey}]=${listerLeads?.total_leads || 0}`)

        // Add profile-based impressions from user aggregates
        // Profile impressions are tracked directly in aggregates.users during event processing
        const profileImpressions = user.profile_impressions || 0
        const profileImpressionSocialMedia = user.profile_impression_social_media || 0
        const profileImpressionWebsiteVisit = user.profile_impression_website_visit || 0
        const profileImpressionShare = user.profile_impression_share || 0
        
        // Total impressions = listing impressions + profile impressions
        total_impressions_received += profileImpressions
        impression_social_media_received += profileImpressionSocialMedia
        impression_website_visit_received += profileImpressionWebsiteVisit
        impression_share_received += profileImpressionShare
        
        // Total views = listing views + profile views
        const total_views = total_listing_views + (user.profile_views || 0)

        // Get previous period data for change calculations (previous hour)
        const prevKey = `${userId}_${user_type}`
        const previous = previousAnalyticsMap[prevKey] || {}
        const prevProfileViews = previous.profile_views || 0
        const prevImpressions = previous.total_impressions_received || 0
        const prevLeads = previous.total_leads || previous.total_listing_leads || 0 // Previous hour's total_leads
        const prevTotalViews = previous.total_views || previous.total_listing_views || 0 // Previous hour's total_views

        // ============================================
        // CONVERSION RATE CALCULATION FOR USER ANALYTICS (CURRENT HOUR ONLY)
        // ============================================
        // For developers/agents, conversion rates are calculated from CURRENT HOUR data only:
        // 
        // 1. overall_conversion_rate = (total_leads / total_views) * 100
        //    - total_views = listing views (this hour) + profile views (this hour)
        //    - total_leads = listing leads (this hour) + profile leads (this hour)
        //    - This shows conversion rate for THIS HOUR ONLY, not cumulative
        //
        // 2. view_to_lead_rate = (total_leads / total_views) * 100
        //    - Same as overall_conversion_rate (duplicate metric)
        //
        // Note: lead_to_sale_rate removed - sales are tracked in sales_listings table, not via PostHog
        //
        // 4. profile_to_lead_rate = (total_leads / total_views) * 100
        //    - Same as overall_conversion_rate (duplicate metric)
        // ============================================
        
        // Calculate conversion rates (for developers/agents only) - CURRENT HOUR ONLY
        const totalViewsForConversion = total_views // Total views (listing views + profile views) for this hour
        const totalLeadsForConversion = total_leads // Total leads (listing + profile) for this hour
        
        // Overall conversion rate: total leads / total views (for developers/agents) - THIS HOUR ONLY
        const overall_conversion_rate = totalViewsForConversion > 0
          ? Number(((totalLeadsForConversion / totalViewsForConversion) * 100).toFixed(2))
          : 0
        
        // View to lead rate: same as overall conversion rate for developers/agents
        const view_to_lead_rate = totalViewsForConversion > 0
          ? Number(((totalLeadsForConversion / totalViewsForConversion) * 100).toFixed(2))
          : 0
        
        // Note: lead_to_sale_rate removed - sales are tracked in sales_listings table, not via PostHog
        
        // Profile to lead rate: total leads / total views (for developers/agents) - THIS HOUR ONLY
        const profile_to_lead_rate = totalViewsForConversion > 0
          ? Number(((totalLeadsForConversion / totalViewsForConversion) * 100).toFixed(2))
          : 0

        // Calculate changes (percentage change from previous hour)
        const profileViewsChange = prevProfileViews > 0
          ? Number((((user.profile_views - prevProfileViews) / prevProfileViews) * 100).toFixed(2))
          : (user.profile_views > 0 ? 100 : 0)
        
        const impressionsChange = prevImpressions > 0
          ? Number((((total_impressions_received - prevImpressions) / prevImpressions) * 100).toFixed(2))
          : (total_impressions_received > 0 ? 100 : 0)
        
        // Calculate total views change (for developers/agents: listing views + profile views)
        const currentTotalViews = total_views // Current hour's total views
        const viewsChange = prevTotalViews > 0
          ? Number((((currentTotalViews - prevTotalViews) / prevTotalViews) * 100).toFixed(2))
          : (currentTotalViews > 0 ? 100 : 0)
        
        // For developers/agents: use total_leads (listing + profile) - CURRENT HOUR
        const currentLeadsForChange = total_leads
        const leadsChange = prevLeads > 0
          ? Number((((currentLeadsForChange - prevLeads) / prevLeads) * 100).toFixed(2))
          : (currentLeadsForChange > 0 ? 100 : 0)

        // Calculate conversion change (for developers/agents) - comparing this hour to previous hour
        const prevTotalViewsForConversion = previous.total_views || previous.total_listing_views || 0
        const prevTotalLeadsForConversion = previous.total_leads || previous.total_listing_leads || 0
        
        const prevConversion = prevTotalViewsForConversion > 0
          ? Number(((prevTotalLeadsForConversion / prevTotalViewsForConversion) * 100).toFixed(2))
          : 0
        const currentConversion = profile_to_lead_rate
        const conversionChange = prevConversion > 0
          ? Number((((currentConversion - prevConversion) / prevConversion) * 100).toFixed(2))
          : (currentConversion > 0 ? 100 : 0)

        // Store hourly totals for updating developers table (will be added to cumulative totals)
        // These are CURRENT HOUR values only, not cumulative
        if (user_type === 'developer') {
          // Calculate cumulative total_listing_views from ALL historical listing_analytics data
          // FALLBACK: If database is empty, use PostHog events directly (first run scenario)
          let cumulativeTotalListingViews = 0
          
          // Method 1: Sum from listing_analytics (preferred - already aggregated in database)
          if (userListings && userListings.length > 0) {
            for (const listing of userListings) {
              cumulativeTotalListingViews += cumulativeListingViewsByListingId[listing.id] || 0
            }
          }
          
          // Method 2: FALLBACK - If database is empty/incomplete, use PostHog events directly (source of truth)
          // Priority: PostHog → Database (not Database → Database)
          if (cumulativeTotalListingViews === 0 && cumulativeListingViewsFromPostHog[userId]) {
            cumulativeTotalListingViews = cumulativeListingViewsFromPostHog[userId]
            console.log(`📊 Using PostHog fallback for developer ${userId}: ${cumulativeTotalListingViews} total listing views (from PostHog events)`)
          } else if (cumulativeTotalListingViews > 0 && cumulativeListingViewsFromPostHog[userId]) {
            // Log comparison for debugging (database vs PostHog)
            const posthogCount = cumulativeListingViewsFromPostHog[userId]
            if (Math.abs(cumulativeTotalListingViews - posthogCount) > 10) {
              console.log(`⚠️ Discrepancy for developer ${userId}: DB=${cumulativeTotalListingViews}, PostHog=${posthogCount}`)
            }
          }
          
          developerTotals[userId] = {
            hourly_views: total_views, // Current hour: listing views + profile views
            hourly_listing_views: total_listing_views, // Current hour: listing views only
            cumulative_listing_views: cumulativeTotalListingViews, // ALL TIME: from listing_analytics OR PostHog fallback
            hourly_profile_views: user.profile_views || 0, // Current hour: profile views only
            hourly_leads: total_leads, // Current hour: listing leads + profile leads
            hourly_impressions: total_impressions_received, // Current hour: listing + profile impressions
            profile_to_lead_rate: profile_to_lead_rate, // Current hour rate
            views_change: viewsChange, // Change from previous hour
            leads_change: leadsChange, // Change from previous hour
            impressions_change: impressionsChange // Change from previous hour
          }
        }

      userRows.push({
        user_id: userId,
        user_type,
        date: cal.date,
          hour: cal.hour, // Add hour for hourly tracking
        week: cal.week,
        month: cal.month,
        quarter: cal.quarter,
        year: cal.year,
        profile_views: user.profile_views,
          unique_profile_viewers: user.unique_profile_viewers instanceof Set ? user.unique_profile_viewers.size : (user.unique_profile_viewers || 0),
        profile_views_from_home: user.profile_views_from_home,
        profile_views_from_listings: user.profile_views_from_listings,
        profile_views_from_search: user.profile_views_from_search,
          total_listings,
          active_listings,
          rented_listings,
          // Note: sold_listings and total_listing_sales removed - sales are tracked in sales_listings table
          total_listing_views,
          total_views: currentTotalViews, // Total views (listing views + profile views) for developers/agents
          total_leads: total_leads, // Total leads (listing + profile) for developers/agents
          total_listing_leads,
          // Note: total_revenue is not in user_analytics schema, so we don't insert it
          total_impressions_received, // Includes both listing and profile impressions
          impression_social_media_received, // Includes both listing and profile social media clicks
          impression_website_visit_received, // Includes both listing and profile website clicks
          impression_share_received, // Includes both listing and profile shares
          impression_saved_listing_received: impression_saved_listing_received,
          properties_viewed,
          unique_properties_viewed,
          leads_initiated,
          appointments_booked,
          properties_saved,
        searches_performed: user.searches_performed,
          overall_conversion_rate,
          view_to_lead_rate,
          // Note: lead_to_sale_rate removed - sales are tracked in sales_listings table, not via PostHog
          profile_to_lead_rate,
          profile_views_change: {
            previous: prevProfileViews,
            current: user.profile_views,
            change: profileViewsChange,
            change_percentage: profileViewsChange
          },
          impressions_change: {
            previous: prevImpressions,
            current: total_impressions_received,
            change: impressionsChange,
            change_percentage: impressionsChange
          },
          views_change: {
            previous: prevTotalViews,
            current: currentTotalViews,
            change: viewsChange,
            change_percentage: viewsChange
          },
          leads_change: {
            previous: prevLeads,
            current: total_leads, // Use total_leads (listing + profile) for developers/agents
            change: leadsChange,
            change_percentage: leadsChange
          },
          conversion_change: {
            previous: prevConversion,
            current: currentConversion,
            change: conversionChange,
            change_percentage: conversionChange
          }
        })
      }
    }

    // 8. Build development analytics rows
    // CRITICAL: Only create records for developments that had events (not all active developments)
    // This prevents creating empty records with all zeros
    const developmentRows = []
    const developmentIdsWithEvents = Object.keys(aggregates.developments)
    console.log(`📊 [DEVELOPMENT_ANALYTICS] Found ${developmentIdsWithEvents.length} developments with events (out of ${development_ids.length} active developments)`)
    
    // OPTIMIZATION: Batch fetch all developer_ids for developments at once (fixes N+1 query issue)
    let developerIdByDevelopmentId = {}
    if (developmentIdsWithEvents.length > 0) {
      const { data: allDevelopmentData } = await supabaseAdmin
        .from('developments')
        .select('id, developer_id')
        .in('id', developmentIdsWithEvents)
      
      if (allDevelopmentData) {
        for (const devData of allDevelopmentData) {
          developerIdByDevelopmentId[devData.id] = devData.developer_id
        }
      }
    }
    
    for (const developmentId of developmentIdsWithEvents) {
      const dev = aggregates.developments[developmentId]
      if (!dev) {
        console.warn(`⚠️ [DEVELOPMENT_ANALYTICS] Skipping ${developmentId}: not in aggregates`)
        continue
      }

      // Use pre-fetched developer_id
      const devData = { developer_id: developerIdByDevelopmentId[developmentId] || null }

      const total_views = dev.total_views
      const unique_views = dev.unique_views.size
      const total_leads = dev.total_leads
      const unique_leads = dev.unique_leads.size
      // Note: total_sales and lead_to_sale_rate removed - sales are tracked in sales_listings table, not via PostHog
      const conversion_rate = total_views > 0 ? Number(((total_leads / total_views) * 100).toFixed(2)) : 0
      const engagement_rate = total_views > 0 ? Number((((dev.total_shares + dev.saved_count + dev.social_media_clicks) / total_views) * 100).toFixed(2)) : 0

      developmentRows.push({
        development_id: developmentId,
        developer_id: devData?.developer_id || null,
        date: cal.date,
        hour: cal.hour, // Add hour for hourly tracking
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
        // Note: total_sales, lead_to_sale_rate, and avg_days_to_sale removed - sales are tracked in sales_listings table
        conversion_rate,
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
    
    console.log(`📝 [LEAD_DEBUG] Starting to build lead rows from ${Object.keys(aggregates.leads).length} lead combinations`)
    console.log(`📝 [LEAD_DEBUG] Aggregates.leads keys:`, Object.keys(aggregates.leads))
    if (Object.keys(aggregates.leads).length === 0) {
      console.warn(`⚠️ [LEAD_DEBUG] WARNING: No leads found in aggregates! This means no lead events were processed.`)
      console.warn(`⚠️ [LEAD_DEBUG] Check if lead_phone, lead_message, or lead_appointment events exist in PostHog`)
    }
    
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
      console.log(`🔍 [LEAD_DEBUG] Processing lead ${leadKey}:`, {
        listing_id: lead.listing_id,
        seeker_id: lead.seeker_id,
        lister_id: lead.lister_id,
        lister_type: lead.lister_type,
        actions_count: lead.actions.length
      })
      
      if (lead.actions.length === 0) {
        console.warn(`⚠️ [LEAD_DEBUG] Skipping lead ${leadKey}: no actions`)
        continue
      }
      
      // Get lister_id from event or from database lookup
      let finalListerId = lead.lister_id
      let finalListerType = lead.lister_type
      
      if (!finalListerId && lead.listing_id) {
        console.log(`🔍 [LEAD_DEBUG] Lead ${leadKey} missing lister_id, looking up from listing ${lead.listing_id}`)
        const listingInfo = listingToListerMap[lead.listing_id]
        if (listingInfo) {
          finalListerId = listingInfo.lister_id
          finalListerType = listingInfo.lister_type
          console.log(`✅ [LEAD_DEBUG] Resolved lister_id for lead ${leadKey}: ${finalListerId} (${finalListerType})`)
        } else {
          console.warn(`⚠️ [LEAD_DEBUG] Could not find lister_id for listing ${lead.listing_id}, skipping lead ${leadKey}`)
          console.warn(`⚠️ [LEAD_DEBUG] Listing not found in listingToListerMap. Available listings:`, Object.keys(listingToListerMap))
          continue
        }
      }
      
      if (!finalListerId) {
        console.warn(`⚠️ [LEAD_DEBUG] Skipping lead ${leadKey}: no lister_id available after lookup`)
        continue
      }

      // Sort actions by timestamp
      const sortedActions = lead.actions.sort((a, b) => 
        new Date(a.action_timestamp) - new Date(b.action_timestamp)
      )

      console.log(`✅ [LEAD_DEBUG] Creating lead record for ${leadKey}: ${sortedActions.length} actions, lister_id=${finalListerId}`)

      // Create one lead record per seeker+listing combination for this cron run
      // This allows tracking: "User interacted with listing X in run 1, then again in run 2"
      // Note: first_action_date and last_action_date should be in DATE format (YYYY-MM-DD), not YYYYMMDD
      const firstActionDate = sortedActions[0]?.action_date 
        ? (sortedActions[0].action_date.length === 8 
            ? `${sortedActions[0].action_date.substring(0, 4)}-${sortedActions[0].action_date.substring(4, 6)}-${sortedActions[0].action_date.substring(6, 8)}`
            : sortedActions[0].action_date)
        : cal.date
      const lastActionDate = sortedActions[sortedActions.length - 1]?.action_date
        ? (sortedActions[sortedActions.length - 1].action_date.length === 8
            ? `${sortedActions[sortedActions.length - 1].action_date.substring(0, 4)}-${sortedActions[sortedActions.length - 1].action_date.substring(4, 6)}-${sortedActions[sortedActions.length - 1].action_date.substring(6, 8)}`
            : sortedActions[sortedActions.length - 1].action_date)
        : cal.date
      
      // Extract date and hour from first action or use current time
      const actionDate = firstActionDate || cal.date
      const actionHour = sortedActions[0]?.action_hour !== undefined 
        ? sortedActions[0].action_hour 
        : cal.hour
      
      // Determine context_type from first action metadata or listing_id
      // Priority: action metadata > listing_id check
      const firstActionContext = sortedActions[0]?.action_metadata?.context_type
      let contextType = firstActionContext || (lead.listing_id ? 'listing' : 'profile')
      
      const leadRow = {
        listing_id: lead.listing_id,
        lister_id: finalListerId,
        lister_type: finalListerType,
        seeker_id: lead.seeker_id,
        context_type: contextType, // 'listing', 'profile', or 'customer_care'
        date: actionDate, // Add date for hourly queries
        hour: actionHour, // Add hour for hourly queries
        lead_actions: sortedActions, // All actions from this cron run
        total_actions: sortedActions.length,
        first_action_date: firstActionDate,
        last_action_date: lastActionDate,
        last_action_type: sortedActions[sortedActions.length - 1]?.action_type || 'unknown',
        status: 'new',
        notes: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log(`✅ [LEAD_DEBUG] Lead row prepared:`, {
        listing_id: leadRow.listing_id,
        seeker_id: leadRow.seeker_id,
        lister_id: leadRow.lister_id,
        lister_type: leadRow.lister_type,
        total_actions: leadRow.total_actions,
        first_action_date: leadRow.first_action_date,
        last_action_date: leadRow.last_action_date,
        last_action_type: leadRow.last_action_type
      })
      
      leadRows.push(leadRow)
    }
    
    console.log(`📊 [LEAD_DEBUG] Lead rows built: ${leadRows.length} records ready to insert`)
    if (leadRows.length > 0) {
      console.log(`📊 [LEAD_DEBUG] Sample lead row (first):`, JSON.stringify(leadRows[0], null, 2))
    } else {
      console.warn(`⚠️ [LEAD_DEBUG] WARNING: No lead rows built! Check if leads were aggregated and if lister_id resolution worked.`)
    }

    // 10. Write to database
    const insertResults = {
      listings: { inserted: 0, errors: [] },
      users: { inserted: 0, errors: [] },
      developments: { inserted: 0, errors: [] },
      leads: { inserted: 0, errors: [] },
      developers: { updated: 0, errors: 0, details: [] } // Track developers table updates
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
        
        // Use upsert for hourly tracking - update if record exists for this listing+date+hour
        // This handles retries of failed runs: if a run partially inserted data then failed,
        // the next run will update those records instead of creating duplicates
        const { data, error } = await supabaseAdmin
          .from('listing_analytics')
          .upsert(listingRows, {
            onConflict: 'listing_id,date,hour', // Update if record exists for this listing+date+hour
            ignoreDuplicates: false // Update existing records (important for retrying failed runs)
          })
          .select()
        
        if (error) {
          console.error('❌ Error upserting listing analytics:', error)
          console.error('❌ Error details:', JSON.stringify(error, null, 2))
          insertResults.listings.errors.push(error.message)
        } else {
          console.log(`✅ Successfully upserted ${listingRows.length} listing analytics records`)
          console.log(`✅ Upserted data sample:`, data?.[0] || 'No data returned')
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

    // Upsert user analytics (hourly tracking - one record per user per hour)
    // Use upsert to handle multiple cron runs per hour, recalculations, or retries of failed runs
    // If a previous run partially inserted data then failed, this will update those records
    if (userRows.length > 0) {
      try {
        const { error } = await supabaseAdmin
          .from('user_analytics')
          .upsert(userRows, {
            onConflict: 'user_id,user_type,date,hour', // Update if record exists for this user+type+date+hour
            ignoreDuplicates: false // Update existing records (important for retrying failed runs)
          })
        
        if (error) {
          insertResults.users.errors.push(error.message)
        } else {
          insertResults.users.inserted = userRows.length
        }
      } catch (err) {
        insertResults.users.errors.push(err.message)
      }
    }

    // Upsert development analytics (hourly tracking - one record per development per hour)
    // Use upsert to handle multiple cron runs per hour, recalculations, or retries of failed runs
    // If a previous run partially inserted data then failed, this will update those records
    if (developmentRows.length > 0) {
      try {
        const { error } = await supabaseAdmin
          .from('development_analytics')
          .upsert(developmentRows, {
            onConflict: 'development_id,date,hour', // Update if record exists for this development+date+hour
            ignoreDuplicates: false // Update existing records (important for retrying failed runs)
          })
        
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
    // The unique constraint on (listing_id, seeker_id) has been removed
    // This allows multiple lead records for the same seeker+listing combination
    // Each cron run creates new lead records, enabling time series tracking
    console.log(`💾 [LEAD_DEBUG] Attempting to insert ${leadRows.length} lead records...`)
    if (leadRows.length > 0) {
      try {
        console.log('📤 [LEAD_DEBUG] Sample lead row (first):', JSON.stringify(leadRows[0], null, 2))
        console.log('📤 [LEAD_DEBUG] All lead rows summary:', leadRows.map(r => ({
          listing_id: r.listing_id,
          seeker_id: r.seeker_id,
          lister_id: r.lister_id,
          total_actions: r.total_actions,
          first_action_date: r.first_action_date
        })))
        
        const { data, error } = await supabaseAdmin
          .from('leads')
          .insert(leadRows)
          .select()
        
        if (error) {
          console.error('❌ [LEAD_DEBUG] Error inserting leads:', error)
          console.error('❌ [LEAD_DEBUG] Error details:', JSON.stringify(error, null, 2))
          console.error('❌ [LEAD_DEBUG] Error code:', error.code)
          console.error('❌ [LEAD_DEBUG] Error message:', error.message)
          console.error('❌ [LEAD_DEBUG] Error hint:', error.hint)
          insertResults.leads.errors.push(error.message)
        } else {
          console.log(`✅ [LEAD_DEBUG] Successfully inserted ${data?.length || leadRows.length} lead records`)
          console.log(`✅ [LEAD_DEBUG] Inserted data sample:`, data?.[0] || 'No data returned')
          insertResults.leads.inserted = data?.length || leadRows.length
        }
      } catch (err) {
        console.error('❌ [LEAD_DEBUG] Exception inserting leads:', err)
        console.error('❌ [LEAD_DEBUG] Exception stack:', err.stack)
        console.error('❌ [LEAD_DEBUG] Exception message:', err.message)
        insertResults.leads.errors.push(err.message)
      }
    } else {
      console.warn('⚠️ [LEAD_DEBUG] No lead rows to insert!')
      console.warn('⚠️ [LEAD_DEBUG] This could mean:')
      console.warn('  1. No lead events (lead_phone, lead_message, lead_appointment) were found in PostHog')
      console.warn('  2. Lead events were found but had missing listing_id or seeker_id')
      console.warn('  3. Lead events were found but lister_id resolution failed')
      console.warn('  4. All leads were filtered out due to missing data')
    }

    // 11. Update listings table with cumulative totals
    // Only update listings that had events in this run
    console.log(`🔄 Updating listings table with cumulative totals (only listings with events)...`)
    let listingUpdatesData = {} // Store for response
    let developerUpdatesData = {} // Store for response
    try {
      // Get unique listing IDs from events
      const listingIdsToUpdate = Object.keys(aggregates.listings)
      
      if (listingIdsToUpdate.length === 0) {
        console.log('ℹ️ No listings found in events to update')
      } else {
        console.log(`📊 Found ${listingIdsToUpdate.length} listings to update`)

        // OPTIMIZATION: Use SQL aggregation function instead of batch fetching (replaces 200+ queries with 1 query)
        const listingTotals = {}
        try {
          const { data: aggregatedTotals, error: analyticsError } = await supabaseAdmin.rpc(
            'get_cumulative_listing_analytics',
            { listing_ids: listingIdsToUpdate }
          )

        if (analyticsError) {
            console.error(`❌ Error fetching listing analytics via SQL:`, analyticsError)
          } else if (aggregatedTotals && aggregatedTotals.length > 0) {
            // Convert array to map
            for (const row of aggregatedTotals) {
              listingTotals[row.listing_id] = {
                total_views: Number(row.total_views) || 0,
                total_leads: Number(row.total_leads) || 0
              }
            }
            console.log(`✅ Fetched aggregated totals for ${aggregatedTotals.length} listings via SQL`)
          }
        } catch (err) {
          console.error('❌ Exception calling get_cumulative_listing_analytics:', err)
        }
        
        if (Object.keys(listingTotals).length > 0) {

          // Batch update listings
          const listingUpdates = []
          for (const listingId in listingTotals) {
            const totals = listingTotals[listingId]
            listingUpdates.push({
              id: listingId,
              total_views: totals.total_views,
              total_leads: totals.total_leads
            })
            // Store for response
            listingUpdatesData[listingId] = {
              total_views: totals.total_views,
              total_leads: totals.total_leads
            }
          }

          if (listingUpdates.length > 0) {
          // OPTIMIZATION: Use batch upsert instead of individual updates (much faster)
          let updateResults = []
            let successCount = 0
            let errorCount = 0
          
          try {
            const { data: upsertData, error: upsertError } = await supabaseAdmin
              .from('listings')
              .upsert(listingUpdates, { onConflict: 'id' })
            
            if (upsertError) {
              console.error('❌ Error batch upserting listings:', upsertError)
              // Fallback to individual updates
              const updatePromises = listingUpdates.map(update =>
                supabaseAdmin
                .from('listings')
                .update({
                  total_views: update.total_views,
                  total_leads: update.total_leads
                })
                .eq('id', update.id)
                  .then(({ error }) => ({ id: update.id, error }))
                  .catch(error => ({ id: update.id, error }))
              )
              updateResults = await Promise.all(updatePromises)
              successCount = updateResults.filter(r => !r.error).length
              errorCount = updateResults.filter(r => r.error).length
              console.log(`✅ Updated ${successCount} listings via fallback (${errorCount} errors)`)
              } else {
              // All successful if upsert worked
              updateResults = listingUpdates.map(u => ({ id: u.id, error: null }))
              successCount = listingUpdates.length
              errorCount = 0
              console.log(`✅ Batch upserted ${listingUpdates.length} listings`)
            }
          } catch (err) {
            console.error('❌ Exception batch upserting listings:', err)
            errorCount = listingUpdates.length
            successCount = 0
          }
          
          if (errorCount > 0) {
            const errors = updateResults.filter(r => r.error)
            console.error(`❌ Errors updating ${errorCount} listings:`, errors.slice(0, 5)) // Log first 5 errors
            }
            console.log(`✅ Updated ${successCount} listings (${errorCount} errors)`)
          }
        }
      }
    } catch (err) {
      console.error('❌ Exception updating listings:', err)
    }

    // 12. Update developers table with cumulative totals
    // Only update developers whose lister_id appeared in the events we just processed
    console.log(`🔄 Updating developers table with cumulative totals (only developers with events)...`)
    try {
      // Get unique developer IDs from events (lister_ids with user_type = 'developer')
      const developerIdsToUpdate = new Set()
      for (const userId of allUserIds) {
        const user = aggregates.users[userId]
        if (user && user.user_type === 'developer') {
          developerIdsToUpdate.add(userId)
        }
      }

      if (developerIdsToUpdate.size === 0) {
        console.log('ℹ️ No developers found in events to update')
        insertResults.developers = {
          updated: 0,
          errors: 0,
          details: [],
          message: 'No developers found in events to update'
        }
      } else {
        console.log(`📊 Found ${developerIdsToUpdate.size} developers to update`)

        // Batch fetch user_analytics for all developers at once (for views and impressions)
        // For total_leads, query directly from leads table (more accurate)
        const developerIdsArray = Array.from(developerIdsToUpdate)
        
        // Get current cumulative values from developers table
        const { data: currentDevelopers, error: fetchError } = await supabaseAdmin
          .from('developers')
          .select('developer_id, total_views, total_listings_views, total_profile_views, total_leads, total_impressions, conversion_rate')
          .in('developer_id', developerIdsArray)

        if (fetchError) {
          console.error('❌ Error fetching current developer data:', fetchError)
        }

        // Create map of current values
        const currentDeveloperMap = {}
        if (currentDevelopers) {
          for (const dev of currentDevelopers) {
            currentDeveloperMap[dev.developer_id] = {
              total_views: dev.total_views || 0,
              total_listings_views: dev.total_listings_views || 0,
              total_profile_views: dev.total_profile_views || 0,
              total_leads: dev.total_leads || 0,
              total_impressions: dev.total_impressions || 0,
              conversion_rate: dev.conversion_rate || 0
            }
          }
        }

        // Calculate cumulative leads breakdown using SQL aggregation (much faster than JS loops)
        // Uses PostgreSQL SUM and percentage calculations - all done in database
        let leadsBreakdownMap = {}
        try {
          const { data: leadsBreakdownData, error: breakdownError } = await supabaseAdmin
            .rpc('get_developer_leads_breakdown', { developer_ids: developerIdsArray })

          if (breakdownError) {
            console.error('❌ Error calling get_developer_leads_breakdown:', breakdownError)
            // Fallback: set empty breakdowns for all developers
            for (const devId of developerIdsArray) {
              leadsBreakdownMap[devId] = {
                phone_leads: { total: 0, percentage: 0 },
                message_leads: { total: 0, percentage: 0 },
                website_leads: { total: 0, percentage: 0 },
                appointment_leads: { total: 0, percentage: 0 },
                email_leads: { total: 0, percentage: 0 },
                total_leads: 0
              }
            }
          } else if (leadsBreakdownData && leadsBreakdownData.length > 0) {
            // Convert SQL results to JSONB structure
            for (const row of leadsBreakdownData) {
              leadsBreakdownMap[row.user_id] = {
                phone_leads: {
                  total: Number(row.phone_leads) || 0,
                  percentage: Number(row.phone_percentage) || 0
                },
                message_leads: {
                  total: Number(row.message_leads) || 0,
                  percentage: Number(row.message_percentage) || 0
                },
                website_leads: {
                  total: Number(row.website_leads) || 0,
                  percentage: Number(row.website_percentage) || 0
                },
                appointment_leads: {
                  total: Number(row.appointment_leads) || 0,
                  percentage: Number(row.appointment_percentage) || 0
                },
                email_leads: {
                  total: Number(row.email_leads) || 0,
                  percentage: Number(row.email_percentage) || 0
                },
                total_leads: Number(row.total_leads) || 0
              }
            }
            console.log(`✅ Calculated leads breakdown for ${leadsBreakdownData.length} developers via SQL aggregation`)
          } else {
            // No data found - set empty breakdowns
            for (const devId of developerIdsArray) {
              leadsBreakdownMap[devId] = {
                phone_leads: { total: 0, percentage: 0 },
                message_leads: { total: 0, percentage: 0 },
                website_leads: { total: 0, percentage: 0 },
                appointment_leads: { total: 0, percentage: 0 },
                email_leads: { total: 0, percentage: 0 },
                total_leads: 0
              }
            }
          }
        } catch (err) {
          console.error('❌ Exception calling get_developer_leads_breakdown:', err)
          // Fallback: set empty breakdowns
          for (const devId of developerIdsArray) {
            leadsBreakdownMap[devId] = {
              phone_leads: { total: 0, percentage: 0 },
              message_leads: { total: 0, percentage: 0 },
              website_leads: { total: 0, percentage: 0 },
              appointment_leads: { total: 0, percentage: 0 },
              email_leads: { total: 0, percentage: 0 },
              total_leads: 0
            }
          }
        }

        // Store for response
        developerUpdatesData = {}
        
        // OPTIMIZATION: Prepare all updates first, then execute in parallel using Promise.all
        const developerUpdatePromises = []
        for (const developerId in developerTotals) {
          const hourly = developerTotals[developerId]
          const current = currentDeveloperMap[developerId] || { 
              total_views: 0,
            total_listings_views: 0,
            total_profile_views: 0,
              total_leads: 0,
            total_impressions: 0, 
            conversion_rate: 0 
          }
          
          // For total_listings_views: use cumulative value from ALL historical listing_analytics data
          // This ensures we have the complete sum of all views across all time periods
          // For other metrics: add hourly values to existing cumulative totals
          const newTotalListingViews = hourly.cumulative_listing_views !== undefined 
            ? hourly.cumulative_listing_views  // Use cumulative value from all listing_analytics
            : (current.total_listings_views + (hourly.hourly_listing_views || 0)) // Fallback: add hourly to existing
          const newTotalProfileViews = current.total_profile_views + (hourly.hourly_profile_views || 0)
          const newTotalViews = newTotalListingViews + newTotalProfileViews // Total = listing + profile
          const newTotalLeads = current.total_leads + (hourly.hourly_leads || 0)
          const newTotalImpressions = current.total_impressions + (hourly.hourly_impressions || 0)
          
          // Calculate conversion_rate from cumulative totals
          const conversion_rate = newTotalViews > 0 
            ? Number(((newTotalLeads / newTotalViews) * 100).toFixed(2))
            : 0
          
          // Store for response
          developerUpdatesData[developerId] = {
            total_views: newTotalViews,
            total_listings_views: newTotalListingViews,
            total_profile_views: newTotalProfileViews,
            total_leads: newTotalLeads,
            total_impressions: newTotalImpressions,
            conversion_rate: conversion_rate,
            views_change: hourly.views_change || 0,
            leads_change: hourly.leads_change || 0,
            impressions_change: hourly.impressions_change || 0
          }
          
          // Get leads breakdown for this developer (cumulative from all user_analytics)
          const leadsBreakdown = leadsBreakdownMap[developerId] || {
            phone_leads: { total: 0, percentage: 0 },
            message_leads: { total: 0, percentage: 0 },
            website_leads: { total: 0, percentage: 0 },
            appointment_leads: { total: 0, percentage: 0 },
            email_leads: { total: 0, percentage: 0 },
            total_leads: 0
          }

          // Add to parallel update promises
          developerUpdatePromises.push(
            supabaseAdmin
                .from('developers')
                .update({
                total_views: newTotalViews,
                total_listings_views: newTotalListingViews,
                total_profile_views: newTotalProfileViews,
                total_leads: newTotalLeads,
                total_impressions: newTotalImpressions,
                conversion_rate: conversion_rate,
                views_change: hourly.views_change || 0,
                leads_change: hourly.leads_change || 0,
                impressions_change: hourly.impressions_change || 0,
                leads_breakdown: leadsBreakdown
            })
            .eq('developer_id', developerId)
              .then(({ error }) => ({ developer_id: developerId, error, totals: developerUpdatesData[developerId] }))
              .catch(error => ({ developer_id: developerId, error, totals: developerUpdatesData[developerId] }))
          )
        }
        
        // Execute all updates in parallel
        const updateResults = await Promise.all(developerUpdatePromises)
        const successCount = updateResults.filter(r => !r.error).length
        const errorCount = updateResults.filter(r => r.error).length
        
        if (errorCount > 0) {
          const errors = updateResults.filter(r => r.error)
          console.error(`❌ Errors updating ${errorCount} developers:`, errors.slice(0, 5)) // Log first 5 errors
        }
        console.log(`✅ Updated ${successCount} developers (${errorCount} errors)`)
        
        // Store update results for API response
        insertResults.developers = {
          updated: successCount,
          errors: errorCount,
          details: updateResults
        }
      }
    } catch (err) {
      console.error('❌ Exception updating developers:', err)
    }

    // 13. Update admin_analytics table with platform-wide aggregations
    console.log(`🔄 Updating admin_analytics for date ${cal.date}, hour ${cal.hour}, day ${cal.day}...`)
    let adminAnalyticsData = null // Declare outside try block
    try {
      // Get current hour's data (for hourly tracking and change calculations)
      // Only select columns we need
      const { data: currentHourListingAnalytics, error: listingAnalyticsError } = await supabaseAdmin
        .from('listing_analytics')
        .select('total_views, total_impressions')
        .eq('date', cal.date)
        .eq('hour', cal.hour)

      // OPTIMIZATION: Use SQL aggregation function instead of batch fetching (replaces 100+ queries with 1 query)
      // For admin analytics, we aggregate across ALL hours for the current date to get full day totals
      let platformAggregates = null
      try {
        const { data: aggregates, error: aggregateError } = await supabaseAdmin.rpc(
          'get_platform_analytics_aggregates',
          { target_date: cal.date }
        )
        
        if (aggregateError) {
          console.error('❌ Error fetching platform aggregates via SQL:', aggregateError)
        } else if (aggregates && aggregates.length > 0) {
          platformAggregates = aggregates[0]
          console.log('✅ Fetched platform aggregates via SQL aggregation')
        }
      } catch (err) {
        console.error('❌ Exception calling get_platform_analytics_aggregates:', err)
      }
      
      // Fallback: If SQL function fails, fetch manually (shouldn't happen, but safety net)
      let allListingAnalytics = []
      if (!platformAggregates) {
        console.warn('⚠️ SQL aggregation failed, falling back to manual fetching')
        const batchSize = 100
        let offset = 0
        let hasMore = true
        
        while (hasMore) {
          const { data: batch, error: allListingAnalyticsError } = await supabaseAdmin
        .from('listing_analytics')
            .select('total_views, unique_views, logged_in_views, anonymous_views, views_from_home, views_from_explore, views_from_search, views_from_direct, total_impressions, impression_social_media, impression_website_visit, impression_share, impression_saved_listing')
        .eq('date', cal.date)
            .range(offset, offset + batchSize - 1)
          
          if (allListingAnalyticsError) {
            console.error('❌ Error fetching listing_analytics for admin analytics:', allListingAnalyticsError)
            break
          }
          
          if (batch && batch.length > 0) {
            allListingAnalytics = allListingAnalytics.concat(batch)
            offset += batchSize
            hasMore = batch.length === batchSize
          } else {
            hasMore = false
          }
        }
      }

      // Query leads for current hour (for change calculations)
      const currentHourStart = new Date(Date.UTC(
        parseInt(cal.date.split('-')[0]),
        parseInt(cal.date.split('-')[1]) - 1,
        parseInt(cal.date.split('-')[2]),
        cal.hour,
        0,
        0
      ))
      const currentHourEnd = new Date(currentHourStart)
      currentHourEnd.setUTCHours(currentHourEnd.getUTCHours() + 1)

      // For current hour leads, we only need the count
      const { count: currentHourLeadsCount } = await supabaseAdmin
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', currentHourStart.toISOString())
        .lt('created_at', currentHourEnd.toISOString())

      // OPTIMIZATION: Use SQL aggregation for leads breakdown instead of fetching all leads
      // This replaces fetching thousands of rows and filtering in JavaScript
      let leadsBreakdownData = null
      try {
        const { data: leadsData, error: leadsError } = await supabaseAdmin
          .rpc('get_admin_leads_breakdown', { target_date: cal.date })
        
        if (leadsError) {
          console.error('❌ Error calling get_admin_leads_breakdown:', leadsError)
        } else if (leadsData && leadsData.length > 0) {
          leadsBreakdownData = leadsData[0]
          console.log('✅ Fetched leads breakdown via SQL aggregation')
        }
      } catch (err) {
        console.error('❌ Exception calling get_admin_leads_breakdown:', err)
      }
      
      // Fallback: Fetch all leads if SQL function fails (shouldn't happen, but safety net)
      let allLeads = null
      if (!leadsBreakdownData) {
        console.warn('⚠️ SQL aggregation failed, falling back to manual fetching')
        const { data: fallbackLeads, error: leadsError } = await supabaseAdmin
          .from('leads')
          .select('lead_actions, lister_type, context_type, seeker_id')
          .or(`date.eq.${cal.date},first_action_date.eq.${cal.date}`)
        allLeads = fallbackLeads
      }

      // Get previous hour's admin_analytics for change calculations
      let previousHourDate = cal.date
      let previousHour = cal.hour - 1
      if (previousHour < 0) {
        // If current hour is 0, get previous day's hour 23
        const prevDate = new Date(cal.date + 'T00:00:00Z')
        prevDate.setUTCDate(prevDate.getUTCDate() - 1)
        previousHourDate = `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, '0')}-${String(prevDate.getUTCDate()).padStart(2, '0')}`
        previousHour = 23
      }

      const { data: previousAdminAnalytics, error: previousAdminError } = await supabaseAdmin
        .from('admin_analytics')
        .select('leads, impressions, views, user_signups')
        .eq('date', previousHourDate)
        .eq('hour', previousHour)
        .maybeSingle()

      // OPTIMIZATION: Get all user signups in a single SQL query instead of 4 separate queries
      let developerSignups = 0
      let agentSignups = 0
      let propertySeekerSignups = 0
      let agencySignups = 0
      
      try {
        const { data: signupsData, error: signupsError } = await supabaseAdmin
          .rpc('get_user_signups_for_hour', {
            signup_start: currentHourStart.toISOString(),
            signup_end: currentHourEnd.toISOString()
          })
        
        if (signupsError) {
          console.error('❌ Error calling get_user_signups_for_hour:', signupsError)
          // Fallback to individual queries
          const { count: devCount } = await supabaseAdmin
            .from('developers')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', currentHourStart.toISOString())
            .lt('created_at', currentHourEnd.toISOString())
          developerSignups = devCount || 0
          
          const { count: agentCount } = await supabaseAdmin
            .from('agents')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', currentHourStart.toISOString())
            .lt('created_at', currentHourEnd.toISOString())
          agentSignups = agentCount || 0
          
          const { count: seekerCount } = await supabaseAdmin
            .from('property_seekers')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', currentHourStart.toISOString())
            .lt('created_at', currentHourEnd.toISOString())
          propertySeekerSignups = seekerCount || 0
        } else if (signupsData && signupsData.length > 0) {
          developerSignups = Number(signupsData[0].developer_signups) || 0
          agentSignups = Number(signupsData[0].agent_signups) || 0
          propertySeekerSignups = Number(signupsData[0].property_seeker_signups) || 0
          agencySignups = Number(signupsData[0].agency_signups) || 0
          console.log('✅ Fetched all user signups via SQL aggregation')
        }
      } catch (err) {
        console.error('❌ Exception calling get_user_signups_for_hour:', err)
      }

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

      // OPTIMIZATION: Use SQL aggregation for platform engagement (already have get_platform_analytics_aggregates)
      // Fallback to JS reduce only if SQL function fails
      const platformEngagement = platformAggregates ? {
        total_views: platformAggregates.total_views || 0,
        unique_views: platformAggregates.unique_views || 0,
        logged_in_views: 0, // Not in SQL function yet, calculate from allListingAnalytics if needed
        anonymous_views: 0, // Not in SQL function yet, calculate from allListingAnalytics if needed
        views_by_source: {
          home: platformAggregates.views_from_home || 0,
          explore: platformAggregates.views_from_explore || 0,
          search: platformAggregates.views_from_search || 0,
          direct: platformAggregates.views_from_direct || 0
        }
      } : {
        // Fallback: calculate from allListingAnalytics array
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

      // OPTIMIZATION: Use SQL aggregation for platform impressions
      const platformImpressions = platformAggregates ? {
        total: platformAggregates.total_impressions || 0,
        social_media: platformAggregates.impression_social_media || 0,
        website_visit: platformAggregates.impression_website_visit || 0,
        share: platformAggregates.impression_share || 0,
        saved_listing: platformAggregates.impression_saved_listing || 0
      } : {
        // Fallback: calculate from allListingAnalytics array
        total: allListingAnalytics?.reduce((sum, row) => sum + (row.total_impressions || 0), 0) || 0,
        social_media: allListingAnalytics?.reduce((sum, row) => sum + (row.impression_social_media || 0), 0) || 0,
        website_visit: allListingAnalytics?.reduce((sum, row) => sum + (row.impression_website_visit || 0), 0) || 0,
        share: allListingAnalytics?.reduce((sum, row) => sum + (row.impression_share || 0), 0) || 0,
        saved_listing: allListingAnalytics?.reduce((sum, row) => sum + (row.impression_saved_listing || 0), 0) || 0
      }

      // OPTIMIZATION: Use SQL aggregation for leads breakdown (replaces multiple JS filters and Set operations)
      let phoneLeads, messageLeads, emailLeads, appointmentLeads, websiteLeads, totalLeadsCount
      
      if (leadsBreakdownData) {
        // Use SQL aggregated data
        totalLeadsCount = Number(leadsBreakdownData.total_leads) || 0
        phoneLeads = {
          total: Number(leadsBreakdownData.phone_leads_total) || 0,
          unique: Number(leadsBreakdownData.phone_leads_unique) || 0,
          percentage: totalLeadsCount > 0 ? Number(((leadsBreakdownData.phone_leads_total / totalLeadsCount) * 100).toFixed(2)) : 0,
          by_context: {} // Could be added to SQL function if needed
        }
        messageLeads = {
          total: Number(leadsBreakdownData.message_leads_total) || 0,
          unique: Number(leadsBreakdownData.message_leads_unique) || 0,
          percentage: totalLeadsCount > 0 ? Number(((leadsBreakdownData.message_leads_total / totalLeadsCount) * 100).toFixed(2)) : 0,
          by_context: {}
        }
        emailLeads = {
          total: Number(leadsBreakdownData.email_leads_total) || 0,
          unique: Number(leadsBreakdownData.email_leads_unique) || 0,
          percentage: totalLeadsCount > 0 ? Number(((leadsBreakdownData.email_leads_total / totalLeadsCount) * 100).toFixed(2)) : 0,
          by_context: {}
        }
        appointmentLeads = {
          total: Number(leadsBreakdownData.appointment_leads_total) || 0,
          unique: Number(leadsBreakdownData.appointment_leads_unique) || 0,
          percentage: totalLeadsCount > 0 ? Number(((leadsBreakdownData.appointment_leads_total / totalLeadsCount) * 100).toFixed(2)) : 0,
          by_context: {}
        }
        websiteLeads = {
          total: Number(leadsBreakdownData.website_leads_total) || 0,
          unique: Number(leadsBreakdownData.website_leads_unique) || 0,
          percentage: totalLeadsCount > 0 ? Number(((leadsBreakdownData.website_leads_total / totalLeadsCount) * 100).toFixed(2)) : 0,
          by_context: {}
        }
        console.log('✅ Used SQL aggregation for leads breakdown')
      } else {
        // Fallback: Calculate from allLeads array (inefficient, but safety net)
        console.warn('⚠️ Using fallback JS aggregation for leads (SQL function failed)')
        phoneLeads = {
          total: allLeads?.filter(lead => 
            lead.lead_actions?.some(action => action.action_type === 'lead_phone')
          ).length || 0,
          unique: new Set(allLeads?.filter(lead => 
            lead.lead_actions?.some(action => action.action_type === 'lead_phone')
          ).map(lead => lead.seeker_id)).size || 0,
          percentage: 0,
          by_context: {}
        }
        messageLeads = {
          total: allLeads?.filter(lead => 
            lead.lead_actions?.some(action => action.action_type === 'lead_message')
          ).length || 0,
          unique: new Set(allLeads?.filter(lead => 
            lead.lead_actions?.some(action => action.action_type === 'lead_message')
          ).map(lead => lead.seeker_id)).size || 0,
          percentage: 0,
          by_context: {}
        }
        emailLeads = {
          total: allLeads?.filter(lead => 
            lead.lead_actions?.some(action => action.action_type === 'lead_email')
          ).length || 0,
          unique: new Set(allLeads?.filter(lead => 
            lead.lead_actions?.some(action => action.action_type === 'lead_email')
          ).map(lead => lead.seeker_id)).size || 0,
          percentage: 0,
          by_context: {}
        }
        appointmentLeads = {
          total: allLeads?.filter(lead => 
            lead.lead_actions?.some(action => action.action_type === 'lead_appointment')
          ).length || 0,
          unique: new Set(allLeads?.filter(lead => 
            lead.lead_actions?.some(action => action.action_type === 'lead_appointment')
          ).map(lead => lead.seeker_id)).size || 0,
          percentage: 0,
          by_context: {}
        }
        websiteLeads = {
          total: allLeads?.filter(lead => 
            lead.lead_actions?.some(action => action.action_type === 'lead_website')
          ).length || 0,
          unique: new Set(allLeads?.filter(lead => 
            lead.lead_actions?.some(action => action.action_type === 'lead_website')
          ).map(lead => lead.seeker_id)).size || 0,
          percentage: 0,
          by_context: {}
        }
        totalLeadsCount = allLeads?.length || 0
        if (totalLeadsCount > 0) {
          phoneLeads.percentage = Number(((phoneLeads.total / totalLeadsCount) * 100).toFixed(2))
          messageLeads.percentage = Number(((messageLeads.total / totalLeadsCount) * 100).toFixed(2))
          emailLeads.percentage = Number(((emailLeads.total / totalLeadsCount) * 100).toFixed(2))
          appointmentLeads.percentage = Number(((appointmentLeads.total / totalLeadsCount) * 100).toFixed(2))
          websiteLeads.percentage = Number(((websiteLeads.total / totalLeadsCount) * 100).toFixed(2))
        }
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
        // Note: total_sales and total_revenue removed - sales are tracked in sales_listings table, not via PostHog
        total_leads_generated: leadsBreakdownData ? Number(leadsBreakdownData.developer_leads) || 0 : (allLeads?.filter(lead => lead.lister_type === 'developer').length || 0)
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
        // Note: total_sales and total_revenue removed - sales are tracked in sales_listings table, not via PostHog
        total_leads_generated: leadsBreakdownData ? Number(leadsBreakdownData.agent_leads) || 0 : (allLeads?.filter(lead => lead.lister_type === 'agent').length || 0)
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

      // Note: totalSales and leadToSaleRate removed - sales are tracked in sales_listings table, not via PostHog

      // Calculate current hour totals for change calculations
      const currentHourTotalLeads = currentHourLeadsCount || 0
      const currentHourTotalImpressions = currentHourListingAnalytics?.reduce((sum, row) => sum + (row.total_impressions || 0), 0) || 0
      const currentHourTotalViews = currentHourListingAnalytics?.reduce((sum, row) => sum + (row.total_views || 0), 0) || 0
      const currentHourTotalSignups = (developerSignups || 0) + (agentSignups || 0) + (agencySignups || 0) + (propertySeekerSignups || 0)

      // Calculate changes vs previous hour
      const calculateChange = (current, previous) => {
        if (!previous || previous === 0) {
          return current > 0 ? 100 : 0
        }
        return Number((((current - previous) / previous) * 100).toFixed(2))
      }

      const previousTotalLeads = previousAdminAnalytics?.leads?.total_leads || 0
      const previousTotalImpressions = previousAdminAnalytics?.impressions?.total_impressions || 0
      const previousTotalViews = previousAdminAnalytics?.views?.total_views || 0
      const previousTotalSignups = previousAdminAnalytics?.user_signups?.total_signups || 0

      const leadsChange = calculateChange(currentHourTotalLeads, previousTotalLeads)
      const impressionsChange = calculateChange(currentHourTotalImpressions, previousTotalImpressions)
      const viewsChange = calculateChange(currentHourTotalViews, previousTotalViews)
      const signupsChange = calculateChange(currentHourTotalSignups, previousTotalSignups)

      // Build consolidated leads object
      const consolidatedLeads = {
        total_leads: currentHourTotalLeads,
        total_leads_change: leadsChange,
        phone_leads: phoneLeads,
        message_leads: messageLeads,
        email_leads: emailLeads,
        appointment_leads: appointmentLeads,
        website_leads: websiteLeads
      }

      // Build consolidated impressions object
      const consolidatedImpressions = {
        total_impressions: currentHourTotalImpressions,
        total_impressions_change: impressionsChange,
        social_media: platformImpressions.social_media,
        website_visit: platformImpressions.website_visit,
        share: platformImpressions.share,
        saved_listing: platformImpressions.saved_listing
      }

      // Build enhanced views object
      const enhancedViews = {
        total_views: currentHourTotalViews,
        total_views_change: viewsChange,
        unique_views: platformEngagement.unique_views,
        anonymous_views: platformEngagement.anonymous_views,
        logged_in_views: platformEngagement.logged_in_views,
        views_by_source: platformEngagement.views_by_source
      }

      // Build user signups object
      const userSignups = {
        total_signups: currentHourTotalSignups,
        total_signups_change: signupsChange,
        developers: developerSignups || 0,
        agents: agentSignups || 0,
        agencies: agencySignups || 0,
        property_seekers: propertySeekerSignups || 0
      }

      // Upsert admin_analytics
      const adminAnalyticsData = {
        date: cal.date,
        hour: cal.hour, // Add hour for hourly tracking
        day: cal.day, // Day of week (1=Monday, 7=Sunday)
        week: cal.week,
        month: cal.month,
        quarter: cal.quarter,
        year: cal.year,
        // New consolidated fields
        leads: consolidatedLeads,
        impressions: consolidatedImpressions,
        views: enhancedViews,
        user_signups: userSignups,
        // Keep existing fields for backward compatibility
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
        // Note: sales_metrics removed - sales are tracked in sales_listings table, not via PostHog
        conversion_rates: {
          conversion_rate: conversionRate
          // Note: lead_to_sale_rate removed - sales are tracked in sales_listings table, not via PostHog
        },
        updated_at: new Date().toISOString()
      }

      // Use upsert for admin_analytics with hourly constraint
      // If a previous run partially inserted data then failed, this will update those records
      const { data: upsertedAdmin, error: upsertError } = await supabaseAdmin
        .from('admin_analytics')
        .upsert(adminAnalyticsData, {
          onConflict: 'date,hour', // Update if record exists for this date+hour
          ignoreDuplicates: false // Update existing records (important for retrying failed runs)
        })
        .select()

      if (upsertError) {
        console.error('❌ Error upserting admin_analytics:', upsertError)
      } else {
        console.log(`✅ Upserted admin_analytics for date ${cal.date}, hour ${cal.hour}`)
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

    // Serialize Sets to numbers for JSON response
    const serializeListingRows = listingRows.map(row => ({
      ...row,
      unique_views: typeof row.unique_views === 'number' ? row.unique_views : (row.unique_views?.size || 0),
      unique_leads: typeof row.unique_leads === 'number' ? row.unique_leads : (row.unique_leads?.size || 0)
    }))

    const serializeUserRows = userRows.map(row => ({
      ...row,
      unique_profile_viewers: typeof row.unique_profile_viewers === 'number' ? row.unique_profile_viewers : (row.unique_profile_viewers?.size || 0),
      unique_properties_viewed: typeof row.unique_properties_viewed === 'number' ? row.unique_properties_viewed : (row.unique_properties_viewed?.size || 0)
    }))

    return NextResponse.json({
      success: true,
      message: 'Analytics processing completed successfully',
      timestamp: new Date().toISOString(),
      run_id: runId,
      date: cal.date,
      hour: cal.hour, // Add hour for hourly tracking
      timeRange: {
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        hours: ((endTime - startTime) / (1000 * 60 * 60)).toFixed(2)
      },
      events: {
        total: allEvents?.length || 0,
        custom: events.length,
        lead_events: totalLeadEvents,
        breakdown: customEventsBreakdown
      },
      processed: {
        events: events.length,
        listings: listingRows.length,
        users: userRows.length,
        developments: developmentRows.length,
        leads: leadRows.length
      },
      inserted: insertResults,
      posthog: {
        api_calls: apiCalls,
        total_events_fetched: allEvents?.length || 0
      },
      // Include all calculated data for frontend display
      data: {
        listing_analytics: serializeListingRows,
        user_analytics: serializeUserRows,
        development_analytics: developmentRows,
        leads: leadRows,
        listing_updates: listingUpdatesData,
        developer_updates: developerUpdatesData,
        admin_analytics: adminAnalyticsData || null
      }
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

