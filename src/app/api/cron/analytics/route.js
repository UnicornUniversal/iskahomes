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

// Error Tracker - Collects all errors during cron execution
class ErrorTracker {
  constructor() {
    this.errors = []
    this.warnings = []
  }

  addError(category, message, details = {}) {
    const error = {
      category,
      message,
      details,
      timestamp: new Date().toISOString()
    }
    this.errors.push(error)
    // Only log errors to console
    console.error(`[ERROR] ${category}: ${message}`, details)
    return error
  }

  addWarning(category, message, details = {}) {
    const warning = {
      category,
      message,
      details,
      timestamp: new Date().toISOString()
}
    this.warnings.push(warning)
    return warning
  }

  getSummary() {
    return {
      total_errors: this.errors.length,
      total_warnings: this.warnings.length,
      errors: this.errors,
      warnings: this.warnings,
      errors_by_category: this.errors.reduce((acc, err) => {
        acc[err.category] = (acc[err.category] || 0) + 1
        return acc
      }, {})
    }
  }

  hasErrors() {
    return this.errors.length > 0
  }
}

// Only log successful operations (brief messages, no full data)
function logSuccess(message) {
  console.log(`✅ ${message}`)
}

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
async function aggregateEvents(events, chunkSize = 5000, errorTracker = null) {
  // Early exit if no events
  if (!events || events.length === 0) {
    return createAggregateStructure()
  }

  const aggregates = createAggregateStructure()
  
  // PERFORMANCE OPTIMIZATION: Skip chunking for small datasets (< 10k events)
  if (events.length < 10000) {
    await processEventChunk(events, aggregates, 0, errorTracker)
  } else {
  for (let i = 0; i < events.length; i += chunkSize) {
    const chunk = events.slice(i, i + chunkSize)
      if (chunk.length > 0) {
    await processEventChunk(chunk, aggregates, i, errorTracker)
  }
    }
  }

  // PERFORMANCE OPTIMIZATION: Keep Maps, only convert when necessary
  // Return Maps directly - convert to objects only when needed for JSON serialization
  return aggregates
}

// Calculate lead_score from lead_actions array
// Scoring: Appointment=40, Phone=30, Direct Messaging=20, WhatsApp=15, Email=10
function calculateLeadScore(leadActions) {
  if (!Array.isArray(leadActions) || leadActions.length === 0) {
    return 0
  }

  let score = 0

  leadActions.forEach(action => {
    const actionType = action?.action_type || ''
    const metadata = action?.action_metadata || {}

    if (actionType === 'lead_appointment') {
      score += 40
    } else if (actionType === 'lead_phone') {
      score += 30
    } else if (actionType === 'lead_message') {
      // Check message_type in action_metadata
      const messageType = String(metadata.message_type || metadata.messageType || 'direct_message').toLowerCase()
      
      if (messageType === 'email') {
        score += 10
      } else if (messageType === 'whatsapp') {
        score += 15
      } else {
        // Default to direct messaging
        score += 20
      }
    }
  })

  return score
}

// Process a chunk of events
async function processEventChunk(chunk, aggregates, offset = 0, errorTracker = null) {
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
    } else if (listingsError) {
      errorTracker.addError('AGGREGATE', 'Error pre-fetching lister_ids', { error: listingsError })
    }
  }

  for (const event of chunk) {
    try {
    const { event: eventName, properties = {}, distinct_id, timestamp } = event
      
      // Validate event structure
      if (!eventName || !timestamp) {
        if (errorTracker) {
          errorTracker.addError('EVENT_PROCESSING', 'Event missing required fields', { event: JSON.stringify(event).substring(0, 200) })
        }
        continue
      }
      
    const eventDate = new Date(timestamp)
      if (isNaN(eventDate.getTime())) {
        if (errorTracker) {
          errorTracker.addError('EVENT_PROCESSING', 'Invalid event timestamp', { eventName, timestamp, distinct_id })
        }
        continue
      }
      
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
        // Share platform breakdown tracking
        share_platforms: {
          facebook: 0,
          whatsapp: 0,
          twitter: 0,
          instagram: 0,
          copy_link: 0,
          email: 0,
          linkedin: 0,
          telegram: 0
        },
        total_leads: 0,
        phone_leads: 0,
        message_leads: 0,
        email_leads: 0,
        appointment_leads: 0,
        website_leads: 0,
        // Lead type breakdown tracking
        lead_types: {
          phone: 0,
          whatsapp: 0,
          direct_message: 0,
          email: 0,
          appointment: 0,
          website: 0
        },
        unique_leads: new Set(),
        unique_leads_count: 0 // Counter for unique leads
        // Note: total_sales removed - sales are tracked in sales_listings table, not via PostHog
      })
    }

    // Process events
    switch (eventName) {

      case 'listing_impression': {
        // UPDATED: listing_impression is NOT an impression - it's just a view with more metadata
        // Impressions = Engagement = Interactions only (saves, shares, website clicks, social media clicks)
        // Views (property_view, listing_impression, profile_view) are tracked separately and do NOT count as impressions
        // This event is kept for backward compatibility but does NOT increment impressions
        if (!listingId) {
          break
        }
        const listing = aggregates.listings.get(listingId)
        if (!listing) {
          if (errorTracker) {
            errorTracker.addError('AGGREGATE', `Listing ${listingId} not initialized for listing_impression`, { listingId, eventName })
          }
          break
        }
        // DO NOT increment impressions - this is just a view, not an interaction
        // Views are tracked via property_view, impressions are only for interactions (saves, shares, clicks)
        
        // CRITICAL FIX: Ensure lister is tracked in aggregates.users for user_analytics
        // This ensures users with only listing events (no profile events) are still processed
        if (listerId && listerType) {
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
              profile_leads: 0,
              profile_impressions: 0,
              profile_impression_social_media: 0,
              profile_impression_website_visit: 0,
              profile_impression_share: 0
            })
          }
        }
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
        
        // Track platform breakdown
        const platform = String(properties.platform || '').toLowerCase()
        if (platform && listing.share_platforms.hasOwnProperty(platform)) {
          listing.share_platforms[platform]++
        } else if (platform === 'link') {
          // Handle 'link' as 'copy_link' for consistency
          listing.share_platforms.copy_link++
        }
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
        }
        
        if (!finalListingId && !seekerId) {
          break
        }
        
        // If no listingId but we have seekerId and listerId, this is a PROFILE LEAD
        // Profile leads: user went to developer/agent profile and sent message/copied number
        // CRITICAL: Track for BOTH property_seekers AND developers/agents (lister)
        if (!finalListingId) {
          
          // Track for property_seekers
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
          
          // CRITICAL FIX: Track profile leads for developers/agents (lister) in aggregates.users
          // This ensures profile leads are included in user_analytics.total_leads
          if (listerId && listerType) {
            if (!aggregates.users.has(listerId)) {
              aggregates.users.set(listerId, {
                user_type: listerType, // 'developer' or 'agent'
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
                // Profile-specific metrics for developers/agents
                profile_leads: 0, // Track profile leads separately
                profile_impressions: 0,
                profile_impression_social_media: 0,
                profile_impression_website_visit: 0,
                profile_impression_share: 0
              })
            }
            const listerUser = aggregates.users.get(listerId)
            if (listerUser) {
              // Track profile leads for the lister (developer/agent)
              // This will be used in user_analytics.total_leads calculation
              if (!listerUser.profile_leads) listerUser.profile_leads = 0
              listerUser.profile_leads++
            }
          }
          
          // Still create lead record in leadsMap for leads table (with listing_id = null)
          // This ensures profile leads are stored in the leads table
          const leadKey = `profile_${listerId}_${seekerId}`
          if (!aggregates.leads.has(leadKey)) {
            aggregates.leads.set(leadKey, {
              listing_id: null, // Explicitly null for profile leads
              lister_id: listerId,
              lister_type: listerType,
              seeker_id: seekerId,
              context_type: 'profile',
              actions: []
            })
          }
          const lead = aggregates.leads.get(leadKey)
          if (lead) {
            const action = {
              action_id: crypto.randomUUID(),
              action_type: `lead_${leadType}`,
              action_date: dayKey,
              action_hour: eventHour,
              action_timestamp: timestamp,
              action_metadata: {
                context_type: 'profile',
                lead_type: leadType
              }
            }
            lead.actions.push(action)
          }
          
          break
        }
        
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
        listing.lead_types.phone++
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
          }

        } else if (leadType === 'message') {
        const messageType = String(properties.message_type || properties.messageType || '').toLowerCase()
        if (messageType === 'email') {
          listing.email_leads++
          listing.lead_types.email++
        } else if (messageType === 'whatsapp') {
          listing.message_leads++
          listing.lead_types.whatsapp++
        } else {
          // Default to direct_message
          listing.message_leads++
          listing.lead_types.direct_message++
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
          }

        } else if (leadType === 'appointment') {
        listing.appointment_leads++
        listing.lead_types.appointment++
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
          }
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
          break
        }
        const listing = aggregates.listings.get(listingId)
        if (!listing) {
          if (errorTracker) {
            errorTracker.addError('AGGREGATE', `Listing ${listingId} not initialized in aggregates`, { listingId, eventName })
          }
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
        
        // CRITICAL FIX: Ensure lister is tracked in aggregates.users for user_analytics
        // This ensures users with only listing events (no profile events) are still processed
        if (listerId && listerType) {
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
              profile_leads: 0,
              profile_impressions: 0,
              profile_impression_social_media: 0,
              profile_impression_website_visit: 0,
              profile_impression_share: 0
            })
          }
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
      
      default: {
        // Unknown event type - track but don't error
        if (errorTracker && eventName && !eventName.startsWith('$')) {
          // Only track non-auto-capture events
          errorTracker.addWarning('EVENT_PROCESSING', `Unknown event type: ${eventName}`, { eventName, timestamp, distinct_id })
        }
        break
      }
    }
    } catch (eventError) {
      // Track events that fail to process
      if (errorTracker) {
        errorTracker.addError('EVENT_PROCESSING', `Failed to process event: ${eventName || 'unknown'}`, {
          error: eventError.message,
          stack: eventError.stack,
          eventName: eventName || 'unknown',
          timestamp: timestamp || 'unknown',
          distinct_id: distinct_id || 'unknown',
          eventPreview: JSON.stringify(event).substring(0, 300)
        })
      }
      // Continue processing other events
      continue
    }
  }

  return aggregates
}

// Main cron handler
export async function POST(request) {
  const runId = crypto.randomUUID()
  let runRecord = null
  const errorTracker = new ErrorTracker()

  try {
    // PERFORMANCE OPTIMIZATION: Early exit check - skip if last run was recent
    const { searchParams } = new URL(request.url)
    const forceRun = searchParams.get('forceRun') === 'true'
    const ignoreLastRun = searchParams.get('ignoreLastRun') === 'true'
    const testMode = searchParams.get('testMode') === 'true'
    const testTimeSeries = searchParams.get('testTimeSeries') === 'true'
    
    if (!forceRun && !testMode && !testTimeSeries && !ignoreLastRun) {
      const lastRun = await getLastSuccessfulRun()
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      
      if (lastRun && new Date(lastRun.end_time) > oneHourAgo) {
        return NextResponse.json({
          success: true,
          message: 'Skipped: Last run was less than 1 hour ago',
          skipped: true,
          lastRunTime: lastRun.end_time,
          errors: errorTracker.getSummary()
        })
      }
    }

    // 1. Check for incomplete/stuck runs
    const incompleteRuns = await getIncompleteRuns()
    const stuckRuns = await getStuckRuns()
    
    if (incompleteRuns.length > 0 || stuckRuns.length > 0) {
      errorTracker.addWarning('CRON_STATUS', `Found ${incompleteRuns.length} incomplete and ${stuckRuns.length} stuck runs`, { incompleteRuns: incompleteRuns.length, stuckRuns: stuckRuns.length })
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
    
    // TIME SERIES TEST MODE: Process days from Nov 1-21, group events by hour
    let simulatedDate = null
    let simulatedHour = null
    let simulatedEndTime = null
    let simulationStartDate = null
    
    if (testTimeSeries) {
      // Start date: November 1, 2025
      const testYear = 2025
      const testMonth = 11 // November
      const startDay = 1
      const baseDate = new Date(Date.UTC(testYear, testMonth - 1, startDay, 0, 0, 0, 0))
      
      // End date: Today (or allow query params to override)
      const testYearEnd = Number(searchParams.get('testYearEnd')) || new Date().getUTCFullYear()
      const testMonthEnd = Number(searchParams.get('testMonthEnd')) || new Date().getUTCMonth() + 1
      const testDayEnd = Number(searchParams.get('testDayEnd')) || new Date().getUTCDate()
      const endDate = new Date(Date.UTC(testYearEnd, testMonthEnd - 1, testDayEnd, 23, 59, 59, 999))
      
      
      // Get last successful test_time_series run to determine which day to process next
      let lastRunForTest = null
      if (!ignoreLastRun) {
        const { data: testRuns } = await supabaseAdmin
          .from('analytics_cron_status')
          .select('*')
          .eq('status', 'completed')
          .eq('run_type', 'test_time_series')
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        
        lastRunForTest = testRuns || null
      }
      
      // Extract last processed date from metadata or start from base date
      let currentDateObj
      if (lastRunForTest && lastRunForTest.metadata?.lastProcessedDate) {
        currentDateObj = new Date(lastRunForTest.metadata.lastProcessedDate)
        // Move to next day
        currentDateObj.setUTCDate(currentDateObj.getUTCDate() + 1)
      } else {
        currentDateObj = new Date(baseDate)
      }
      
      // Check if we've reached or passed the end date
      if (currentDateObj > endDate) {
        return NextResponse.json({
          success: true,
          message: `Time series test complete. Reached end date ${endDate.toISOString().split('T')[0]}`,
          testMode: true,
          completed: true
        })
      }
      
      // Set the simulated date for this run
      simulationStartDate = baseDate
      simulatedDate = `${currentDateObj.getUTCFullYear()}-${String(currentDateObj.getUTCMonth() + 1).padStart(2, '0')}-${String(currentDateObj.getUTCDate()).padStart(2, '0')}`
      
    }
    
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
    
    
    let startTime
    let endTimeForFetch // Separate variable for fetching events vs inserting data
    let endTime // End time for inserting data (used for calendar parts)
    
    if (testTimeSeries) {
      // Time series test: fetch ALL events for the entire day from PostHog
      // Then group by hour and create entries only for hours with events
      const actualDateObj = new Date(simulatedDate + 'T00:00:00Z')
      // Fetch the entire day (00:00:00 to 23:59:59)
      startTime = new Date(actualDateObj)
      startTime.setUTCHours(0, 0, 0, 0)
      endTimeForFetch = new Date(actualDateObj)
      endTimeForFetch.setUTCHours(23, 59, 59, 999) // End of the day
      // Set endTime to the end of the day for testTimeSeries
      endTime = new Date(endTimeForFetch)
    } else if (testMode) {
      // Test mode: fetch last 24 hours
      startTime = new Date(Date.now() - 24 * 60 * 60 * 1000)
      endTimeForFetch = new Date()
      endTime = new Date() // Use current time for test mode
            } else {
      // PERFORMANCE OPTIMIZATION: Fetch only since last run or 24 hours max (not 1 year!)
      // This dramatically reduces PostHog API calls and processing time
      if (lastRun && !ignoreLastRun) {
        startTime = new Date(lastRun.end_time)
      } else {
        // Default to 24 hours for first run or when ignoring last run
        const twentyFourHoursAgo = 24 * 60 * 60 * 1000
        startTime = new Date(Date.now() - twentyFourHoursAgo)
      }
      endTimeForFetch = new Date()
      endTime = new Date() // Use current time for normal mode
      
    }
    
    // Use simulated date/hour for time series test, otherwise use actual current time
    let targetDate, cal
    if (testTimeSeries) {
      // Create calendar parts from simulated date (use start of day for initial calendar parts)
      const simulatedDateObj = new Date(simulatedDate + 'T00:00:00Z')
      targetDate = formatDayKey(simulatedDateObj)
      cal = calendarParts(simulatedDateObj)
      cal.date = simulatedDate
      // Hour will be set per hour during processing
    } else {
      targetDate = formatDayKey(endTime)
      cal = calendarParts(endTime)
    }

    // PRODUCTION MODE: Always fetch the full UTC day for the target date (00:00 → 23:59)
    // This ensures user_analytics rows represent the entire day, not just a single hour
    if (!testTimeSeries) {
      const dayStart = new Date(`${cal.date}T00:00:00.000Z`)
      const dayEnd = new Date(dayStart)
      dayEnd.setUTCHours(23, 59, 59, 999)
      startTime = dayStart
      endTimeForFetch = dayEnd
    }


    // 3. Create run record
    // For time series test: end_time tracks the full period fetched (Nov 1-15), but target_date/hour track what we're inserting
    runRecord = await createRunRecord({
      run_id: runId,
      start_time: startTime.toISOString(),
      end_time: endTimeForFetch.toISOString(), // Use endTimeForFetch to track the full period fetched
      target_date: cal.date, // Simulated date for inserting data
      target_hour: cal.hour, // Simulated hour for inserting data (0-23, or 0-14 for time series test)
      run_type: testTimeSeries ? 'test_time_series' : 'scheduled'
    })


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


    // Fetch only our custom events from PostHog (filter at API level to reduce payload)
    // This excludes auto-capture events like $pageview, $autocapture, etc.
    // Use endTimeForFetch for fetching events (covers full period), but endTime for inserting (simulated for time series)
    const { success, events: allEvents, apiCalls, error } = await fetchEventsWithRetry(
      startTime,
      endTimeForFetch, // Use endTimeForFetch to get all events in the period
      customEventNames // Pass custom event names to filter at PostHog API level
    )

    if (!success || !allEvents) {
      const errorMessage = error?.message || 'Unknown error'
      errorTracker.addError('POSTHOG', `Failed to fetch events from PostHog`, { error: errorMessage })
      throw new Error(`Failed to fetch events from PostHog: ${errorMessage}`)
    }

    // Filter to only our custom events
    let events = Array.isArray(allEvents) ? allEvents.filter(e => customEventNames.includes(e.event)) : []
    
    // In testTimeSeries mode, filter events to match the simulated date (entire day)
    // Then group by hour - we'll process each hour separately
    let eventsByHour = new Map() // Map<hour, events[]>
    if (testTimeSeries && simulatedDate) {
      const simulatedDateObj = new Date(simulatedDate + 'T00:00:00Z')
      const dayStart = new Date(simulatedDateObj)
      dayStart.setUTCHours(0, 0, 0, 0)
      const dayEnd = new Date(simulatedDateObj)
      dayEnd.setUTCHours(23, 59, 59, 999)
      
      const beforeFilter = events.length
      events = events.filter(e => {
        const eventTimestamp = new Date(e.timestamp)
        return eventTimestamp >= dayStart && eventTimestamp <= dayEnd
      })
      
      
      // Group events by hour (0-23)
      for (const event of events) {
        const eventTimestamp = new Date(event.timestamp)
        const hour = eventTimestamp.getUTCHours()
        if (!eventsByHour.has(hour)) {
          eventsByHour.set(hour, [])
        }
        eventsByHour.get(hour).push(event)
      }
      
      const hoursWithEvents = Array.from(eventsByHour.keys()).sort((a, b) => a - b)
      
      // If no events, exit early
      if (hoursWithEvents.length === 0) {
        await completeRun(runId, {
          events_processed: 0,
          metadata: { lastProcessedDate: simulatedDate }
        })
        return NextResponse.json({
          success: true,
          message: `No events found for day ${simulatedDate}`,
          testMode: true,
          dayProcessed: simulatedDate,
          hoursProcessed: 0
        })
      }
    }
    
    // Detailed event breakdown by type
    const allEventsBreakdown = allEvents.reduce((acc, e) => {
        acc[e.event] = (acc[e.event] || 0) + 1
        return acc
      }, {})
    
    const customEventsBreakdown = events.reduce((acc, e) => {
      acc[e.event] = (acc[e.event] || 0) + 1
      return acc
    }, {})
    
    // CRITICAL: Detect days/hours with events but potentially missing from database
    // Group events by date and hour to identify what should be processed
    const eventsByDateHour = new Map()
    for (const event of allEvents) {
      try {
        const eventDate = new Date(event.timestamp)
        if (isNaN(eventDate.getTime())) continue
        
        const dateKey = formatDayKey(eventDate)
        const hour = eventDate.getUTCHours()
        const key = `${dateKey}_${hour}`
        
        if (!eventsByDateHour.has(key)) {
          eventsByDateHour.set(key, {
            date: dateKey,
            hour: hour,
            count: 0,
            eventTypes: {}
          })
        }
        const entry = eventsByDateHour.get(key)
        entry.count++
        entry.eventTypes[event.event] = (entry.eventTypes[event.event] || 0) + 1
      } catch (err) {
        errorTracker.addError('EVENT_GROUPING', 'Error grouping event by date/hour', { error: err.message, event: JSON.stringify(event).substring(0, 200) })
      }
    }
    
    // Check which date/hour combinations have events but might be missing from database
    if (eventsByDateHour.size > 0) {
      const dateHourKeys = Array.from(eventsByDateHour.keys())
      const dateHourParts = dateHourKeys.map(key => {
        const [date, hour] = key.split('_')
        return { date, hour: parseInt(hour) }
      })
      
      // Check database for existing entries
      const datesToCheck = [...new Set(dateHourParts.map(d => d.date))]
      
      for (const date of datesToCheck) {
        const hoursForDate = dateHourParts.filter(d => d.date === date).map(d => d.hour)
        const { data: existingEntries, error: checkError } = await supabaseAdmin
          .from('listing_analytics')
          .select('date, hour')
          .eq('date', date)
          .in('hour', hoursForDate)
          .limit(1000)
        
        if (checkError) {
          errorTracker.addWarning('MISSING_DATA_CHECK', `Error checking database for date ${date}`, { error: checkError.message, date })
        } else {
          const existingHours = new Set((existingEntries || []).map(e => e.hour))
          const missingHours = hoursForDate.filter(h => !existingHours.has(h))
          
          if (missingHours.length > 0) {
            const missingHoursData = missingHours.map(h => {
              const key = `${date}_${h}`
              const eventData = eventsByDateHour.get(key)
              return {
                hour: h,
                eventCount: eventData?.count || 0,
                eventTypes: eventData?.eventTypes || {}
              }
            })
            
            errorTracker.addError('MISSING_DATA', `Date ${date} has ${missingHours.length} hours with events but no database entries`, {
              date,
              missingHours: missingHours.length,
              totalHoursWithEvents: hoursForDate.length,
              hoursWithData: existingHours.size,
              missingHoursDetails: missingHoursData
            })
          }
        }
      }
    }
    
    // Special focus on lead events (include unified 'lead' event and legacy events)
    const leadEventNames = ['lead', 'lead_phone', 'lead_message', 'lead_appointment']
    const totalLeadEvents = leadEventNames.reduce((sum, name) => sum + (customEventsBreakdown[name] || 0), 0)


    await updateRunProgress(runId, {
      events_fetched: allEvents.length, // Total events fetched
      posthog_api_calls: apiCalls || 0
    })
    
    if (events.length === 0) {
      errorTracker.addWarning('POSTHOG', 'No custom events found in PostHog', {
        totalEvents: allEvents.length,
        allEventTypes: Object.keys(allEventsBreakdown)
      })
    }
    
    if (totalLeadEvents === 0 && events.length > 0) {
      errorTracker.addWarning('POSTHOG', 'Custom events found but NO lead events in PostHog', { totalCustomEvents: events.length })
    }

    // 5. Process events - in testTimeSeries mode, process each hour separately
    // For non-testTimeSeries, group events by hour and process each hour separately
    // CRITICAL FIX: Process ALL hours that have events, not just the current hour
    let hoursToProcess = []
    if (testTimeSeries && eventsByHour.size > 0) {
      hoursToProcess = Array.from(eventsByHour.keys()).sort((a, b) => a - b)
    } else {
      // Normal mode: Group events by hour and process each hour
      // This ensures we process all hours that have events, not just the current hour
      const normalModeEventsByHour = new Map()
      for (const event of events) {
        try {
          const eventDate = new Date(event.timestamp)
          if (isNaN(eventDate.getTime())) continue
          const hour = eventDate.getUTCHours()
          if (!normalModeEventsByHour.has(hour)) {
            normalModeEventsByHour.set(hour, [])
          }
          normalModeEventsByHour.get(hour).push(event)
        } catch (err) {
          errorTracker.addError('EVENT_GROUPING', 'Error grouping event by hour in normal mode', { error: err.message })
        }
      }
      
      if (normalModeEventsByHour.size > 0) {
        hoursToProcess = Array.from(normalModeEventsByHour.keys()).sort((a, b) => a - b)
        // Store for use in processing loop
        eventsByHour = normalModeEventsByHour
        errorTracker.addWarning('PROCESSING', `Processing ${hoursToProcess.length} hours with events (normal mode)`, {
          hours: hoursToProcess,
          totalEvents: events.length
        })
      } else {
        // Fallback to current hour if no events found
        hoursToProcess = [cal.hour]
        errorTracker.addWarning('PROCESSING', 'No events found to group by hour, using current hour only', { currentHour: cal.hour })
      }
    }
    
    
    // Store all rows to insert (will be batched at the end)
    const allListingRows = []
    const allUserRows = []
    const allDevelopmentRows = []
    // COMMENTED OUT: allLeadRows - leads are now created in real-time via /api/leads/create
    // const allLeadRows = []
    let totalEventsProcessed = 0
    
    // Accumulate data across all hours for final updates
    const allListingIdsSet = new Set() // For updating listings table
    const allUserIdsSet = new Set() // For updating developers/agents table
    const allDeveloperTotals = {} // Accumulate developer totals across all hours
    
    // CRITICAL: Fetch leads data BEFORE the hour loop (used inside the loop)
    // Get leads data for ALL hours of the date (not just current hour)
    // Similar to listing_analytics, we aggregate all hours to get complete daily metrics
    // The leads table has `date` and `hour` fields that represent when the event happened,
    // NOT `created_at` which is when the cron created the record
    // This ensures we get leads for the correct date, aggregating across all hours
    // UPDATED: Now includes development_id for development leads (created in real-time)
    const { data: currentDateLeads } = await supabaseAdmin
      .from('leads')
      .select('seeker_id, lister_id, lister_type, listing_id, development_id, context_type, lead_actions, date, hour')
      .eq('date', cal.date)
      // REMOVED: .eq('hour', cal.hour) - Now aggregate ALL hours for the date (like listing_analytics)
    
    // Aggregate leads by seeker_id (for property_seekers - all hours aggregated)
    // NOTE: leadsByLister is now built inside the hour loop (per-hour) to match total_listing_leads
    const leadsBySeeker = {}
    if (currentDateLeads) {
      for (const lead of currentDateLeads) {
        // For property_seekers (aggregate all hours)
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
      }
    }
    
    // Process each hour separately (or just once for normal mode)
    for (const processHour of hoursToProcess) {
      // Get events for this hour
      const hourEvents = eventsByHour.get(processHour) || []
      
      if (hourEvents.length === 0) {
        errorTracker.addWarning('PROCESSING', `No events found for hour ${processHour} on date ${cal.date}`, {
          hour: processHour,
          date: cal.date
        })
        continue
      }
      
      // Update calendar parts for this hour
      if (testTimeSeries) {
        const simulatedDateObj = new Date(simulatedDate + 'T00:00:00Z')
        simulatedDateObj.setUTCHours(processHour, 0, 0, 0)
        targetDate = formatDayKey(simulatedDateObj)
        cal = calendarParts(simulatedDateObj)
        cal.hour = processHour
        cal.date = simulatedDate
      } else {
        // For normal mode, ensure cal.hour is set to processHour
        cal.hour = processHour
      }
      
      // CRITICAL FIX: Build leadsByLister and profileLeadsByLister for CURRENT HOUR ONLY
      // This ensures consistency with total_listing_leads which is per-hour (from PostHog events)
      // Filter currentDateLeads (fetched once outside loop) by the current hour
      const leadsByLister = {}
      const profileLeadsByLister = {}
      if (currentDateLeads) {
        for (const lead of currentDateLeads) {
          // Only process leads for the current hour being processed
          if (lead.hour === cal.hour && lead.lister_id) {
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
            
            // Track profile leads separately (listing_id IS NULL) - FOR CURRENT HOUR ONLY
            if (!lead.listing_id) {
              if (!profileLeadsByLister[key]) {
                profileLeadsByLister[key] = 0
              }
              profileLeadsByLister[key]++
            }
          }
        }
      }
      
      // Aggregate events for this hour
    
      const aggregates = await aggregateEvents(hourEvents, 5000, errorTracker)
      totalEventsProcessed += hourEvents.length
    
    // PERFORMANCE OPTIMIZATION: Convert Maps to objects only for logging
    const listingsMap = aggregates.listings instanceof Map ? aggregates.listings : new Map(Object.entries(aggregates.listings))
    const usersMap = aggregates.users instanceof Map ? aggregates.users : new Map(Object.entries(aggregates.users))
    const developmentsMap = aggregates.developments instanceof Map ? aggregates.developments : new Map(Object.entries(aggregates.developments))
    const leadsMap = aggregates.leads instanceof Map ? aggregates.leads : new Map(Object.entries(aggregates.leads))
    
    // CRITICAL FIX: Extract all lister_ids from events to ensure they're processed
    // This is a safety net in case lister wasn't added to aggregates.users during event processing
    for (const event of hourEvents) {
      const props = event.properties || {}
      const listerId = props.lister_id || props.listerId || props.developer_id || props.developerId || props.agent_id || props.agentId
      if (listerId) {
        allUserIdsSet.add(listerId)
      }
    }
    
    // Accumulate IDs across all hours for final updates
    for (const listingId of listingsMap.keys()) {
      allListingIdsSet.add(listingId)
    }
    for (const userId of usersMap.keys()) {
      allUserIdsSet.add(userId)
    }
    
    
    // Get active entities
    const { listing_ids, user_ids, development_ids } = await getAllActiveEntities()


    // PERFORMANCE OPTIMIZATION: Maps already created above, reuse them here
    // 6. Build listing analytics rows
    // IMPORTANT: Create rows for BOTH active listings AND listings with events
    // This ensures we capture all activity, even if a listing is temporarily inactive
    const allListingIds = new Set([...listing_ids, ...Array.from(listingsMap.keys())])
    
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
    
    const listingRows = [] // Will push to allListingRows at end of hour processing
    const listingTotals = {} // For updating listings table
    
    for (const listingId of allListingIds) {
      // PERFORMANCE: Use Map.get() instead of object access (Map already created above)
      const listing = listingsMap.get(listingId) || {
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
        share_platforms: {
          facebook: 0, whatsapp: 0, twitter: 0, instagram: 0,
          copy_link: 0, email: 0, linkedin: 0, telegram: 0
        },
        total_leads: 0,
        phone_leads: 0,
        message_leads: 0,
        email_leads: 0,
        appointment_leads: 0,
        website_leads: 0,
        lead_types: {
          phone: 0, whatsapp: 0, direct_message: 0,
          email: 0, appointment: 0, website: 0
        },
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

      // Build share_breakdown JSONB object
      const totalShares = listing.impression_share || 0
      const shareBreakdown = {}
      const sharePlatforms = listing.share_platforms || {
        facebook: 0, whatsapp: 0, twitter: 0, instagram: 0,
        copy_link: 0, email: 0, linkedin: 0, telegram: 0
      }
      
      for (const [platform, count] of Object.entries(sharePlatforms)) {
        const percentage = totalShares > 0 ? Number(((count / totalShares) * 100).toFixed(2)) : 0
        shareBreakdown[platform] = {
          total: count,
          percentage: percentage
        }
      }

      // Build leads_breakdown JSONB object with nested messaging structure
      const leadTypes = listing.lead_types || {
        phone: 0, whatsapp: 0, direct_message: 0,
        email: 0, appointment: 0, website: 0
      }
      
      const whatsappTotal = leadTypes.whatsapp || 0
      const directMessageTotal = leadTypes.direct_message || 0
      const messageTotal = whatsappTotal + directMessageTotal
      
      const leadsBreakdown = {
        phone: {
          total: leadTypes.phone || 0,
          percentage: total_leads > 0 ? Number(((leadTypes.phone || 0) / total_leads) * 100).toFixed(2) : 0
        },
        messaging: {
          total: messageTotal,
          percentage: total_leads > 0 ? Number(((messageTotal / total_leads) * 100).toFixed(2)) : 0,
          direct_message: {
            total: directMessageTotal,
            percentage: messageTotal > 0 ? Number(((directMessageTotal / messageTotal) * 100).toFixed(2)) : 0
          },
          whatsapp: {
            total: whatsappTotal,
            percentage: messageTotal > 0 ? Number(((whatsappTotal / messageTotal) * 100).toFixed(2)) : 0
          }
        },
        whatsapp: {
          total: whatsappTotal,
          percentage: total_leads > 0 ? Number(((whatsappTotal / total_leads) * 100).toFixed(2)) : 0
        },
        direct_message: {
          total: directMessageTotal,
          percentage: total_leads > 0 ? Number(((directMessageTotal / total_leads) * 100).toFixed(2)) : 0
        },
        email: {
          total: leadTypes.email || 0,
          percentage: total_leads > 0 ? Number(((leadTypes.email || 0) / total_leads) * 100).toFixed(2) : 0
        },
        appointment: {
          total: leadTypes.appointment || 0,
          percentage: total_leads > 0 ? Number(((leadTypes.appointment || 0) / total_leads) * 100).toFixed(2) : 0
        },
        website: {
          total: leadTypes.website || 0,
          percentage: total_leads > 0 ? Number(((leadTypes.website || 0) / total_leads) * 100).toFixed(2) : 0
        },
        // Backward compatibility
        message_leads: {
          total: messageTotal,
          percentage: total_leads > 0 ? Number(((messageTotal / total_leads) * 100).toFixed(2)) : 0
        }
      }

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

      // CRITICAL: All metrics here are for THIS SPECIFIC HOUR ONLY
      // This creates a time series where each hour has its own independent data point
      listingRows.push({
        listing_id: listingId,
        date: cal.date,
        hour: cal.hour, // HOUR-SPECIFIC: This hour's data (0-23)
        week: cal.week,
        month: cal.month,
        quarter: cal.quarter,
        year: cal.year,
        // HOUR-SPECIFIC METRICS: All values are for this hour only
        total_views, // Views in this hour
        unique_views, // Unique viewers in this hour
        logged_in_views: listing.logged_in_views, // Logged-in views in this hour
        anonymous_views: listing.anonymous_views, // Anonymous views in this hour
        views_from_home: listing.views_from_home, // Views from home in this hour
        views_from_explore: listing.views_from_explore, // Views from explore in this hour
        views_from_search: listing.views_from_search, // Views from search in this hour
        views_from_direct: listing.views_from_direct, // Direct views in this hour
        total_impressions: listing.total_impressions, // Impressions in this hour
        impression_social_media: listing.impression_social_media, // Social media impressions in this hour
        impression_website_visit: listing.impression_website_visit, // Website visits in this hour
        impression_share: listing.impression_share, // Shares in this hour
        impression_saved_listing: listing.impression_saved_listing, // Saves in this hour
        share_breakdown: shareBreakdown, // JSONB breakdown by platform for this hour
        total_leads, // Leads in this hour
        phone_leads: listing.phone_leads, // Phone leads in this hour
        message_leads: listing.message_leads, // Message leads in this hour
        email_leads: listing.email_leads, // Email leads in this hour
        appointment_leads: listing.appointment_leads, // Appointment leads in this hour
        website_leads: listing.website_leads, // Website leads in this hour
        leads_breakdown: leadsBreakdown, // JSONB breakdown by lead type for this hour
        unique_leads, // Unique leads in this hour
        // Note: total_sales, lead_to_sale_rate, and avg_days_to_sale removed - sales are tracked in sales_listings table
        conversion_rate, // Conversion rate for THIS HOUR: (total_leads / total_views) * 100
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
    

    // 7. Build user analytics rows
    const userRows = []
    // Note: developerTotals is now accumulated in allDeveloperTotals (outside the hour loop)
    // PERFORMANCE: Use Map.keys() instead of Object.keys()
    // CRITICAL FIX: Include allUserIdsSet (which now includes lister_ids from events) to ensure users with listing events are processed
    const allUserIds = new Set([...user_ids, ...Array.from(usersMap.keys()), ...Array.from(allUserIdsSet)])
    
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
    
    // OPTIMIZATION: Batch fetch all listings for developers/agents at once (fixes N+1 query issue)
    const listerUserIds = []
    for (const userId of allUserIds) {
      // PERFORMANCE: Use Map.get() instead of object access (Map already created above)
      const user = usersMap.get(userId)
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
    
    // NOTE: This section fetches listing_analytics from database for validation/comparison
    // However, user_analytics now calculates DIRECTLY from PostHog events (listingsMap)
    // This makes user_analytics independent and more reliable
    // Batch fetch all listing analytics for all listings in one query
    // CRITICAL FIX: Aggregate ALL hours for the date (not just current hour)
    // This ensures total_listing_views reflects all views for the day, not just one hour
    let listingAnalyticsByListingId = {} // Used for validation/comparison, not for user_analytics calculation
    let listingAnalyticsFromPostHog = {} // Fallback: calculate from PostHog events if listing_analytics is missing
    
    if (allListerListingIds.length > 0) {
      // Fetch ALL hours for the current date and aggregate them
      const { data: allListingAnalytics, error: listingAnalyticsError } = await supabaseAdmin
        .from('listing_analytics')
        .select('listing_id, total_views, total_leads, total_impressions, impression_social_media, impression_website_visit, impression_share, impression_saved_listing')
        .in('listing_id', allListerListingIds)
        .eq('date', cal.date)
        // REMOVED: .eq('hour', cal.hour) - Now aggregate ALL hours for the date
      
      if (listingAnalyticsError) {
        errorTracker.addError('LISTING_ANALYTICS', `Error fetching listing_analytics for date ${cal.date}`, { error: listingAnalyticsError.message, date: cal.date })
      }
      
      if (allListingAnalytics && allListingAnalytics.length > 0) {
        // Group and SUM analytics by listing_id (aggregate across all hours)
        for (const analytics of allListingAnalytics) {
          if (!listingAnalyticsByListingId[analytics.listing_id]) {
            listingAnalyticsByListingId[analytics.listing_id] = {
              total_views: 0,
              total_leads: 0,
              total_impressions: 0,
              impression_social_media: 0,
              impression_website_visit: 0,
              impression_share: 0,
              impression_saved_listing: 0
            }
          }
          // Sum values across all hours for this listing
          listingAnalyticsByListingId[analytics.listing_id].total_views += analytics.total_views || 0
          listingAnalyticsByListingId[analytics.listing_id].total_leads += analytics.total_leads || 0
          listingAnalyticsByListingId[analytics.listing_id].total_impressions += analytics.total_impressions || 0
          listingAnalyticsByListingId[analytics.listing_id].impression_social_media += analytics.impression_social_media || 0
          listingAnalyticsByListingId[analytics.listing_id].impression_website_visit += analytics.impression_website_visit || 0
          listingAnalyticsByListingId[analytics.listing_id].impression_share += analytics.impression_share || 0
          listingAnalyticsByListingId[analytics.listing_id].impression_saved_listing += analytics.impression_saved_listing || 0
        }
      } else {
      }
      
      // FALLBACK: Calculate from PostHog events if listing_analytics is missing or incomplete
      // This ensures user_analytics has data even if listing_analytics hasn't been created yet
      if (events.length > 0 && (Object.keys(listingAnalyticsByListingId).length === 0 || Object.keys(listingAnalyticsByListingId).length < allListerListingIds.length * 0.5)) {
        
        // Create a map of listing_id -> lister_id for quick lookup
        const listingToListerMap = {}
        for (const [userId, listings] of Object.entries(listingsByUserId)) {
          for (const listing of listings) {
            listingToListerMap[listing.id] = userId
          }
        }
        
        // Count events by listing_id for the current date
        for (const event of events) {
          const eventDate = new Date(event.timestamp)
          const eventDayKey = formatDayKey(eventDate)
          
          // Only process events for the current date
          if (eventDayKey !== cal.date) continue
          
          const listingId = event.properties?.listing_id || event.properties?.listingId
          if (!listingId || !allListerListingIds.includes(listingId)) continue
          
          // Initialize if needed
          if (!listingAnalyticsFromPostHog[listingId]) {
            listingAnalyticsFromPostHog[listingId] = {
              total_views: 0,
              total_leads: 0,
              total_impressions: 0,
              impression_social_media: 0,
              impression_website_visit: 0,
              impression_share: 0,
              impression_saved_listing: 0
            }
          }
          
          // Count different event types
          if (event.event === 'property_view') {
            listingAnalyticsFromPostHog[listingId].total_views++
          } else if (event.event === 'lead') {
            listingAnalyticsFromPostHog[listingId].total_leads++
          } else if (event.event === 'listing_impression') {
            // UPDATED: listing_impression is NOT an impression - it's just a view with metadata
            // Do NOT increment total_impressions here - impressions are only for interactions
            // This event is kept for backward compatibility but doesn't count as impression
          } else if (event.event === 'impression_social_media') {
            listingAnalyticsFromPostHog[listingId].impression_social_media++
            listingAnalyticsFromPostHog[listingId].total_impressions++
          } else if (event.event === 'impression_website_visit') {
            listingAnalyticsFromPostHog[listingId].impression_website_visit++
            listingAnalyticsFromPostHog[listingId].total_impressions++
          } else if (event.event === 'impression_share') {
            listingAnalyticsFromPostHog[listingId].impression_share++
            listingAnalyticsFromPostHog[listingId].total_impressions++
          } else if (event.event === 'impression_saved_listing') {
            listingAnalyticsFromPostHog[listingId].impression_saved_listing++
            listingAnalyticsFromPostHog[listingId].total_impressions++
          }
        }
        
        // Merge PostHog fallback data with database data (PostHog takes precedence for missing listings)
        for (const [listingId, posthogData] of Object.entries(listingAnalyticsFromPostHog)) {
          if (!listingAnalyticsByListingId[listingId]) {
            listingAnalyticsByListingId[listingId] = posthogData
          } else {
            // Merge: use max of database or PostHog (database might be incomplete)
            listingAnalyticsByListingId[listingId].total_views = Math.max(
              listingAnalyticsByListingId[listingId].total_views,
              posthogData.total_views
            )
            listingAnalyticsByListingId[listingId].total_leads = Math.max(
              listingAnalyticsByListingId[listingId].total_leads,
              posthogData.total_leads
            )
            listingAnalyticsByListingId[listingId].total_impressions = Math.max(
              listingAnalyticsByListingId[listingId].total_impressions,
              posthogData.total_impressions
            )
          }
        }
        
      }
      
      // Validation: Log if we still have missing data
      const listingsWithData = Object.keys(listingAnalyticsByListingId).length
      const listingsWithoutData = allListerListingIds.length - listingsWithData
      if (listingsWithoutData > 0) {
        errorTracker.addWarning('LISTING_ANALYTICS', `${listingsWithoutData} listings have no analytics data`, { date: cal.date })
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
          errorTracker.addError('LISTING_ANALYTICS', 'Error fetching cumulative listing views via SQL', { error: cumulativeError.message })
          // Fallback to PostHog calculation
        } else if (cumulativeViews && cumulativeViews.length > 0) {
          // Convert array to map for O(1) lookup
          for (const row of cumulativeViews) {
            cumulativeListingViewsByListingId[row.listing_id] = Number(row.total_views) || 0
          }
        }
      } catch (err) {
        errorTracker.addError('LISTING_ANALYTICS', 'Exception calling get_cumulative_listing_views', { error: err.message, stack: err.stack })
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
      
    }
    
    for (const userId of allUserIds) {
      // PERFORMANCE: Use Map.get() instead of object access (Map already created above)
      const user = usersMap.get(userId) || {
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

      // For developers/agents: calculate DIRECTLY from PostHog events (independent of listing_analytics table)
      // OPTIMIZED: Single-pass aggregation using O(1) Map lookups - no database queries, no redundant iterations
      // This ensures user_analytics is always accurate and doesn't depend on listing_analytics being created first
      if (user_type === 'developer' || user_type === 'agent') {
        // Use pre-fetched listings data for listing counts
        const userListings = listingsByUserId[userId] || []

        total_listings = userListings.length
        
        // OPTIMIZATION: Single pass to count statuses and aggregate metrics (instead of multiple filter() calls)
        let listingsWithEvents = 0
        let listingsWithoutEvents = 0
        
        // CRITICAL FIX: Count leads, profile_views, and impressions only from events where user matches (like comparison logic)
        // The comparison tool uses matchesUser() which checks: lister_id, developer_id, agent_id, user_id, userId, profile_id, profileId, distinct_id, person_id
        // This ensures we only count events where the user is the target (not just owner of listing)
        let userListingLeads = 0
        let userProfileViews = 0
        let userLeadsInitiated = 0
        let userImpressionShare = 0
        let userImpressionSavedListing = 0
        let userTotalImpressions = 0
        let userImpressionSocialMedia = 0
        let userImpressionWebsiteVisit = 0
        
        // Helper function to match user (same logic as comparison tool)
        const matchesUser = (event, targetUserId) => {
          if (!targetUserId) return false
          const needle = String(targetUserId).toLowerCase()
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
        
        // Re-process hourEvents to count only events where user matches (like comparison logic)
        for (const event of hourEvents) {
          const props = event.properties || {}
          const eventListingId = props.listing_id || props.listingId || props.listing_uuid || props.property_id
          const eventName = event.event
          
          // Only count events where user matches (using same logic as comparison)
          if (matchesUser(event, userId)) {
            // Count listing leads (only if listing_id exists)
            if ((eventName === 'lead' || eventName === 'lead_phone' || eventName === 'lead_message' || eventName === 'lead_appointment') 
                && eventListingId) {
              userListingLeads++
            }
            
            // Count profile views
            if (eventName === 'profile_view') {
              userProfileViews++
            }
            
            // Count leads initiated (lead_message or lead_phone events where user is the lister)
            if ((eventName === 'lead_message' || eventName === 'lead_phone')) {
              userLeadsInitiated++
            }
            
            // UPDATED: Impressions = Engagement = Interactions only
            // listing_impression and property_view are NOT impressions - they are views
            // Only interaction-based events count as impressions:
            // - impression_social_media (social media clicks)
            // - impression_website_visit (website clicks)
            // - impression_share (shares)
            // - impression_saved_listing (saves)
            if (eventName === 'impression_social_media') {
              userImpressionSocialMedia++
              userTotalImpressions++
            }
            if (eventName === 'impression_website_visit') {
              userImpressionWebsiteVisit++
              userTotalImpressions++
            }
            if (eventName === 'impression_share') {
              userImpressionShare++
              userTotalImpressions++
            }
            // CRITICAL FIX: Only count impression_saved_listing if listing_id exists (matches cron logic line 509 and comparison tool)
            if (eventName === 'impression_saved_listing' && eventListingId) {
              userImpressionSavedListing++
              userTotalImpressions++
            }
          }
        }
        
          for (const listing of userListings) {
          // Count listing statuses in the same loop
          if (listing.listing_status === 'active') active_listings++
          if (listing.listing_status === 'rented') rented_listings++
          // Note: sold_listings removed - sales are tracked in sales_listings table

          // OPTIMIZED: O(1) Map lookup - get listing data directly from PostHog event aggregates
          // listingsMap is already populated from aggregateEvents() - no additional processing needed
          const listingAggregate = listingsMap.get(listing.id)
          if (listingAggregate) {
            listingsWithEvents++
            // Sum up all metrics from PostHog events for this listing (already aggregated, just sum)
            total_listing_views += listingAggregate.total_views || 0
            // NOTE: We don't use listingAggregate metrics here because they count ALL events for the listing
            // regardless of lister_id. Instead, we use filtered counts which match comparison logic
              // Note: total_listing_sales removed - sales are tracked in sales_listings table
          } else {
            listingsWithoutEvents++
            // This is normal if the listing had no events in the current time range
          }
        }
        
        // CRITICAL FIX: Use filtered counts that match comparison logic (filtered by user match)
        // This ensures user_analytics matches the comparison tool's counting exactly
        total_listing_leads = userListingLeads
        
        // CRITICAL FIX: Override profile_views with filtered count to match comparison logic
        // The comparison counts profile_view events where user matches (via lister_id, profile_id, etc.)
        // Not just where profile_id matches (which might count views from other sources)
        if (userProfileViews > 0 || user.profile_views === 0) {
          // Override with filtered count to ensure we match the comparison tool's counting logic
          // If userProfileViews is 0 but user.profile_views has a value, it means the comparison
          // didn't find matching events, so we should use 0 to match
          user.profile_views = userProfileViews
        }
        
        // CRITICAL FIX: Track leads_initiated for developers/agents (currently only tracked for property_seekers)
        // For developers/agents, leads_initiated = count of lead_message or lead_phone events where user matches
        // This matches the comparison tool's logic which counts lead_message/lead_phone events
        leads_initiated = userLeadsInitiated
        
        // CRITICAL FIX: Override impressions with filtered counts to match comparison logic
        // The comparison tool counts impression events where user matches, not just impressions for listings owned by user
        // This ensures we only count impressions where the event's lister_id matches the user
        total_impressions_received = userTotalImpressions
        impression_social_media_received = userImpressionSocialMedia
        impression_website_visit_received = userImpressionWebsiteVisit
        impression_share_received = userImpressionShare
        impression_saved_listing_received = userImpressionSavedListing
        
        // Track warnings for users with no events
          if (total_listing_views === 0 && userListings.length > 0 && listingsWithEvents === 0) {
          errorTracker.addWarning('USER_ANALYTICS', `User ${userId} (${user_type}): No events found for any of ${userListings.length} listings`, { userId, user_type, date: cal.date, hour: cal.hour })
        }

        // Get leads generated from leads table for ALL HOURS of the date (both listing and profile leads)
        // CRITICAL FIX: Now aggregates all hours for the date (like listing_analytics), not just current hour
        // This ensures user_analytics has complete daily metrics even if cron only runs once per day
        const listerKey = `${userId}_${user_type}`
        const listerLeads = leadsByLister[listerKey]
        if (listerLeads) {
          total_leads_generated = listerLeads.total_leads
          phone_leads_generated = listerLeads.phone_leads
          message_leads_generated = listerLeads.message_leads
          website_leads_generated = listerLeads.website_leads
        }
        
        // Calculate profile leads from TWO sources:
        // 1. Leads table (profileLeadsByLister) - PRIMARY SOURCE (real-time, persisted data)
        // 2. PostHog events (aggregates.users.profile_leads) - FALLBACK/VERIFICATION (analytics only)
        // UPDATED: Prefer leads table as source of truth since leads are now created in real-time via /api/leads/create
        const profile_leads_from_db = profileLeadsByLister[listerKey] || 0 // From leads table (real-time)
        const profile_leads_from_posthog = user.profile_leads || 0 // From PostHog events (analytics)
        // Use leads table as primary source (real-time data), PostHog as fallback
        const profile_leads = profile_leads_from_db || profile_leads_from_posthog
        if (profile_leads_from_posthog !== profile_leads_from_db && profile_leads_from_posthog > 0) {
          errorTracker.addWarning('USER_ANALYTICS', `Profile leads mismatch for user ${userId}`, { userId, posthog: profile_leads_from_posthog, db: profile_leads_from_db })
        }
        
        // UPDATED: total_leads = total_listing_leads (from leads table) + profile_leads (from leads table)
        // Since leads are now created in real-time, the leads table is the source of truth
        // Get listing leads from leads table (aggregated by listerKey)
        const listing_leads_from_db = listerLeads?.total_leads || 0
        // Use leads table as primary source, PostHog as fallback for listing leads
        const total_listing_leads_final = listing_leads_from_db || total_listing_leads
        const total_leads = total_listing_leads_final + profile_leads
        

        // NOTE: Profile-based impressions are already included in the filtered counts above
        // The filtered counts (userImpressionShare, userTotalImpressions, etc.) include ALL impression events 
        // where user matches, regardless of whether they're listing-based or profile-based. 
        // This matches the comparison tool's logic which counts all impression events where user matches.
        // We don't need to add profile impressions separately because they're already counted in the filtered totals.
        
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
          } else if (cumulativeTotalListingViews > 0 && cumulativeListingViewsFromPostHog[userId]) {
            // Log comparison for debugging (database vs PostHog)
            const posthogCount = cumulativeListingViewsFromPostHog[userId]
            if (Math.abs(cumulativeTotalListingViews - posthogCount) > 10) {
              errorTracker.addWarning('DEVELOPERS', `Discrepancy for developer ${userId}`, { userId, db: cumulativeTotalListingViews, posthog: posthogCount })
            }
          }
          
          // Accumulate developer totals across all hours
          if (!allDeveloperTotals[userId]) {
            allDeveloperTotals[userId] = {
              hourly_views: 0,
              hourly_listing_views: 0,
              cumulative_listing_views: cumulativeTotalListingViews, // Use the latest cumulative value
              hourly_profile_views: 0,
              hourly_leads: 0,
              hourly_impressions: 0,
              profile_to_lead_rate: profile_to_lead_rate, // Use the latest rate
              views_change: viewsChange, // Use the latest change
              leads_change: leadsChange, // Use the latest change
              impressions_change: impressionsChange // Use the latest change
            }
          }
          // Sum hourly values across all hours
          allDeveloperTotals[userId].hourly_views += total_views
          allDeveloperTotals[userId].hourly_listing_views += total_listing_views
          allDeveloperTotals[userId].hourly_profile_views += (user.profile_views || 0)
          allDeveloperTotals[userId].hourly_leads += total_leads
          allDeveloperTotals[userId].hourly_impressions += total_impressions_received
          // Update cumulative and latest values (these should be the same across hours, but update to latest)
          allDeveloperTotals[userId].cumulative_listing_views = cumulativeTotalListingViews
          allDeveloperTotals[userId].profile_to_lead_rate = profile_to_lead_rate
          allDeveloperTotals[userId].views_change = viewsChange
          allDeveloperTotals[userId].leads_change = leadsChange
          allDeveloperTotals[userId].impressions_change = impressionsChange
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
    // PERFORMANCE: Use Map.keys() instead of Object.keys()
    const developmentIdsWithEvents = Array.from(developmentsMap.keys())
    
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
      // PERFORMANCE: Use Map.get() instead of object access (Map already created above)
      const dev = developmentsMap.get(developmentId)
      if (!dev) {
        debugWarn(`⚠️ [DEVELOPMENT_ANALYTICS] Skipping ${developmentId}: not in aggregates`)
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
      
      // Calculate total impressions (engagement/interactions only)
      // Impressions = social_media_clicks + website_visits + shares + saves
      // Note: website_visits are tracked as social_media_clicks in development_interaction (line 1127)
      const total_impressions = dev.social_media_clicks + dev.total_shares + dev.saved_count
      const engagement_rate = total_views > 0 ? Number(((total_impressions / total_views) * 100).toFixed(2)) : 0

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
        total_impressions: total_impressions, // Total impressions (engagement/interactions)
        // total_interactions: dev.total_interactions, // Column doesn't exist in schema
        engagement_rate
      })
    }

    // 9. Build leads rows (time series - new record per cron run)
    // COMMENTED OUT: Leads are now created in real-time via /api/leads/create endpoint
    // The cron job no longer inserts leads - it only aggregates from existing leads table for user_analytics
    // This ensures leads are created immediately when actions occur, not waiting for hourly cron
    /*
    const leadRows = []
    
    if (leadsMap.size === 0) {
      errorTracker.addWarning('LEADS', 'No leads found in aggregates - no lead events were processed', {})
    }
    
    // Fetch lister_id for leads that don't have it (e.g., lead_phone from customer care)
    const leadsNeedingListerId = []
    for (const [leadKey, lead] of leadsMap.entries()) {
      // PERFORMANCE: lead already extracted from Map.entries() above
      if (!lead || lead.actions.length === 0) {
        errorTracker.addWarning('LEADS', `Skipping lead ${leadKey}: no actions or not found`, { leadKey })
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
      } else if (listingsError) {
        errorTracker.addError('LISTINGS', 'Error fetching lister_ids', { error: listingsError.message })
      }
    }
    
    for (const [leadKey, lead] of leadsMap.entries()) {
      // PERFORMANCE: Use Map.entries() instead of for...in loop
      if (lead.actions.length === 0) {
        errorTracker.addWarning('LEADS', `Skipping lead ${leadKey}: no actions`, { leadKey })
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
        } else {
          errorTracker.addWarning('LEADS', `Could not find lister_id for listing ${lead.listing_id}`, { leadKey, listing_id: lead.listing_id, availableListings: Object.keys(listingToListerMap).length })
          continue
        }
      }
      
      if (!finalListerId) {
        errorTracker.addWarning('LEADS', `Skipping lead ${leadKey}: no lister_id available after lookup`, { leadKey })
        continue
      }

      // Sort actions by timestamp
      const sortedActions = lead.actions.sort((a, b) => 
        new Date(a.action_timestamp) - new Date(b.action_timestamp)
      )

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
      
      // Calculate lead_score from sorted actions
      const leadScore = calculateLeadScore(sortedActions)

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
        lead_score: leadScore, // Calculate score from all actions
        first_action_date: firstActionDate,
        last_action_date: lastActionDate,
        last_action_type: sortedActions[sortedActions.length - 1]?.action_type || 'unknown',
        status: 'new',
        status_tracker: ['new'], // Initialize status tracker with 'new' status
        notes: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Lead row prepared
      leadRows.push(leadRow)
    }
    
    if (leadRows.length === 0 && leadsMap.size > 0) {
      errorTracker.addWarning('LEADS', 'No lead rows built despite leads in aggregates - lister_id resolution may have failed', { leadsMapSize: leadsMap.size })
    }
    */

    // Collect rows for this hour into the all* arrays
    allListingRows.push(...listingRows)
    allUserRows.push(...userRows)
    allDevelopmentRows.push(...developmentRows)
    // COMMENTED OUT: Lead rows are no longer collected (leads created in real-time)
    // allLeadRows.push(...leadRows)
    } // End of hour processing loop

    // 10. Write to database (using all* arrays that contain rows from all hours)
    const insertResults = {
      listings: { inserted: 0, errors: [] },
      users: { inserted: 0, errors: [] },
      developments: { inserted: 0, errors: [] },
      leads: { inserted: 0, errors: [] },
      developers: { updated: 0, errors: 0, details: [] } // Track developers table updates
    }

    // Insert listing analytics (time series - always insert new records)
    // Each cron run creates new records, allowing time series analysis
    if (allListingRows.length > 0) {
      try {
        // Use upsert for hourly tracking - update if record exists for this listing+date+hour
        // This handles retries of failed runs: if a run partially inserted data then failed,
        // the next run will update those records instead of creating duplicates
        const { data, error } = await supabaseAdmin
          .from('listing_analytics')
          .upsert(allListingRows, {
            onConflict: 'listing_id,date,hour', // Update if record exists for this listing+date+hour
            ignoreDuplicates: false // Update existing records (important for retrying failed runs)
          })
          .select()
        
        if (error) {
          errorTracker.addError('LISTING_ANALYTICS', 'Error upserting listing analytics', { 
            error: error.message, 
            code: error.code, 
            hint: error.hint,
            rowsAttempted: allListingRows.length,
            sampleRow: allListingRows[0] ? {
              listing_id: allListingRows[0].listing_id,
              date: allListingRows[0].date,
              hour: allListingRows[0].hour
            } : null
          })
          insertResults.listings.errors.push(error.message)
        } else {
          const insertedCount = data?.length || allListingRows.length
          if (insertedCount !== allListingRows.length) {
            errorTracker.addWarning('LISTING_ANALYTICS', `Partial insert: ${insertedCount} of ${allListingRows.length} rows inserted`, {
              attempted: allListingRows.length,
              inserted: insertedCount
            })
          }
          logSuccess(`Upserted ${insertedCount} listing analytics records`)
          insertResults.listings.inserted = insertedCount
        }
      } catch (err) {
        errorTracker.addError('LISTING_ANALYTICS', 'Exception inserting listing analytics', { error: err.message, stack: err.stack })
        insertResults.listings.errors.push(err.message)
      }
    } else {
      errorTracker.addWarning('LISTING_ANALYTICS', 'No listing rows to insert', { 
        possibleReasons: [
          'No active listings in database',
          'No events with listing_id in PostHog',
          'Issue with getAllActiveEntities()'
        ]
      })
    }

    // Upsert user analytics (hourly tracking - one record per user per hour)
    // Use upsert to handle multiple cron runs per hour, recalculations, or retries of failed runs
    // If a previous run partially inserted data then failed, this will update those records
    if (allUserRows.length > 0) {
      try {
        // First, insert/update the user_analytics rows
        const { error } = await supabaseAdmin
          .from('user_analytics')
          .upsert(allUserRows, {
            onConflict: 'user_id,user_type,date,hour', // Update if record exists for this user+type+date+hour
            ignoreDuplicates: false // Update existing records (important for retrying failed runs)
          })
        
        if (error) {
          errorTracker.addError('USER_ANALYTICS', 'Error upserting user analytics', {
            error: error.message,
            code: error.code,
            hint: error.hint,
            rowsAttempted: allUserRows.length,
            sampleRow: allUserRows[0] ? {
              user_id: allUserRows[0].user_id,
              user_type: allUserRows[0].user_type,
              date: allUserRows[0].date,
              hour: allUserRows[0].hour
            } : null
          })
          insertResults.users.errors.push(error.message)
        } else {
          const insertedCount = allUserRows.length
          logSuccess(`Upserted ${insertedCount} user analytics records`)
          insertResults.users.inserted = insertedCount
          
          // CRITICAL FIX: After listing_analytics is inserted, update user_analytics with aggregated daily totals
          // This ensures total_listing_views, total_listing_leads, etc. reflect ALL hours of the day, not just the current hour
          if (allListingRows.length > 0) {
            // Updating user_analytics with aggregated daily totals from listing_analytics
            
            // Get all unique user_ids and dates from user_analytics rows
            const userDates = new Set()
            const userIdsByDate = new Map()
            for (const row of allUserRows) {
              const key = `${row.user_id}_${row.user_type}_${row.date}`
              if (!userDates.has(key)) {
                userDates.add(key)
                if (!userIdsByDate.has(row.date)) {
                  userIdsByDate.set(row.date, new Set())
                }
                userIdsByDate.get(row.date).add(row.user_id)
              }
            }
            
            // For each date, aggregate listing_analytics and update user_analytics
            for (const [date, userIds] of userIdsByDate.entries()) {
              // Get all listings for these users
              const allUserListingIds = []
              for (const userId of userIds) {
                const userListings = listingsByUserId[userId] || []
                allUserListingIds.push(...userListings.map(l => l.id))
              }
              
              if (allUserListingIds.length === 0) continue
              
              // Query listing_analytics for ALL hours of this date and aggregate by listing_id
              const { data: dailyListingAnalytics } = await supabaseAdmin
                .from('listing_analytics')
                .select('listing_id, total_views, total_leads, total_impressions, impression_social_media, impression_website_visit, impression_share, impression_saved_listing')
                .in('listing_id', allUserListingIds)
                .eq('date', date)
              
              if (!dailyListingAnalytics || dailyListingAnalytics.length === 0) continue
              
              // Aggregate by listing_id (sum across all hours)
              const aggregatedByListing = {}
              for (const analytics of dailyListingAnalytics) {
                if (!aggregatedByListing[analytics.listing_id]) {
                  aggregatedByListing[analytics.listing_id] = {
                    total_views: 0,
                    total_leads: 0,
                    total_impressions: 0,
                    impression_social_media: 0,
                    impression_website_visit: 0,
                    impression_share: 0,
                    impression_saved_listing: 0
                  }
                }
                aggregatedByListing[analytics.listing_id].total_views += analytics.total_views || 0
                aggregatedByListing[analytics.listing_id].total_leads += analytics.total_leads || 0
                aggregatedByListing[analytics.listing_id].total_impressions += analytics.total_impressions || 0
                aggregatedByListing[analytics.listing_id].impression_social_media += analytics.impression_social_media || 0
                aggregatedByListing[analytics.listing_id].impression_website_visit += analytics.impression_website_visit || 0
                aggregatedByListing[analytics.listing_id].impression_share += analytics.impression_share || 0
                aggregatedByListing[analytics.listing_id].impression_saved_listing += analytics.impression_saved_listing || 0
              }
              
              // For each user, sum up their listings' aggregated totals
              for (const userId of userIds) {
                const userListings = listingsByUserId[userId] || []
                let total_listing_views = 0
                let total_listing_leads = 0
                let total_impressions_received = 0
                let impression_social_media_received = 0
                let impression_website_visit_received = 0
                let impression_share_received = 0
                let impression_saved_listing_received = 0
                
                for (const listing of userListings) {
                  const aggregated = aggregatedByListing[listing.id]
                  if (aggregated) {
                    total_listing_views += aggregated.total_views
                    total_listing_leads += aggregated.total_leads
                    total_impressions_received += aggregated.total_impressions
                    impression_social_media_received += aggregated.impression_social_media
                    impression_website_visit_received += aggregated.impression_website_visit
                    impression_share_received += aggregated.impression_share
                    impression_saved_listing_received += aggregated.impression_saved_listing
                  }
                }
                
                // Get profile data from existing user_analytics rows (sum across all hours)
                const userRowsForDate = allUserRows.filter(r => r.user_id === userId && r.date === date)
                const total_profile_views = userRowsForDate.reduce((sum, r) => sum + (r.profile_views || 0), 0)
                const total_profile_leads = userRowsForDate.reduce((sum, r) => sum + (r.leads_initiated || 0), 0)
                
                // Get user_type from the first row
                const firstRow = userRowsForDate[0]
                if (!firstRow) continue
                const user_type = firstRow.user_type
                
                // Calculate total views and leads (listing + profile)
                const total_views = total_listing_views + total_profile_views
                const total_leads = total_listing_leads + total_profile_leads
                
                // Update all hours for this user+date
                const { error: updateError } = await supabaseAdmin
                  .from('user_analytics')
                  .update({
                    total_listing_views: total_listing_views,
                    total_listing_leads: total_listing_leads,
                    total_views: total_views,
                    total_leads: total_leads,
                    total_impressions_received: total_impressions_received,
                    impression_social_media_received: impression_social_media_received,
                    impression_website_visit_received: impression_website_visit_received,
                    impression_share_received: impression_share_received,
                    impression_saved_listing_received: impression_saved_listing_received,
                    // Recalculate conversion rates with correct totals
                    overall_conversion_rate: total_views > 0 ? Number(((total_leads / total_views) * 100).toFixed(2)) : 0,
                    view_to_lead_rate: total_views > 0 ? Number(((total_leads / total_views) * 100).toFixed(2)) : 0,
                    profile_to_lead_rate: total_profile_views > 0 ? Number(((total_leads / total_profile_views) * 100).toFixed(2)) : 0
                  })
                  .eq('user_id', userId)
                  .eq('user_type', user_type)
                  .eq('date', date)
                
                if (updateError) {
                  errorTracker.addError('USER_ANALYTICS', `Error updating user_analytics for ${userId} on ${date}`, { userId, date, error: updateError.message })
                } else {
                  logSuccess(`Updated user_analytics for ${userId} (${user_type}) on ${date}`)
                }
              }
            }
          }
        }
      } catch (err) {
        insertResults.users.errors.push(err.message)
      }
    }

    // Upsert development analytics (hourly tracking - one record per development per hour)
    // Use upsert to handle multiple cron runs per hour, recalculations, or retries of failed runs
    // If a previous run partially inserted data then failed, this will update those records
    if (allDevelopmentRows.length > 0) {
      try {
        const { error } = await supabaseAdmin
          .from('development_analytics')
          .upsert(allDevelopmentRows, {
            onConflict: 'development_id,date,hour', // Update if record exists for this development+date+hour
            ignoreDuplicates: false // Update existing records (important for retrying failed runs)
          })
        
        if (error) {
          errorTracker.addError('DEVELOPMENT_ANALYTICS', 'Error upserting development analytics', {
            error: error.message,
            code: error.code,
            hint: error.hint,
            rowsAttempted: allDevelopmentRows.length,
            sampleRow: allDevelopmentRows[0] ? {
              development_id: allDevelopmentRows[0].development_id,
              date: allDevelopmentRows[0].date,
              hour: allDevelopmentRows[0].hour
            } : null
          })
          insertResults.developments.errors.push(error.message)
        } else {
          const insertedCount = allDevelopmentRows.length
          logSuccess(`Upserted ${insertedCount} development analytics records`)
          insertResults.developments.inserted = insertedCount
          
          // Update developments table with cumulative totals and impressions breakdown
          if (insertedCount > 0) {
            try {
              // Get all unique development IDs
              const developmentIdsToUpdate = [...new Set(allDevelopmentRows.map(row => row.development_id))]
              
              // Aggregate development_analytics for impressions breakdown
              const { data: allDevelopmentAnalytics, error: devAnalyticsError } = await supabaseAdmin
                .from('development_analytics')
                .select('development_id, total_views, total_leads, total_impressions, social_media_clicks, total_shares, saved_count')
                .in('development_id', developmentIdsToUpdate)
              
              if (!devAnalyticsError && allDevelopmentAnalytics && allDevelopmentAnalytics.length > 0) {
                // Aggregate by development_id
                const devAggregates = {}
                for (const row of allDevelopmentAnalytics) {
                  const devId = row.development_id
                  if (!devAggregates[devId]) {
                    devAggregates[devId] = {
                      total_views: 0,
                      total_leads: 0,
                      total_impressions: 0,
                      social_media_clicks: 0,
                      total_shares: 0,
                      saved_count: 0
                    }
                  }
                  devAggregates[devId].total_views += Number(row.total_views) || 0
                  devAggregates[devId].total_leads += Number(row.total_leads) || 0
                  devAggregates[devId].total_impressions += Number(row.total_impressions) || 0
                  devAggregates[devId].social_media_clicks += Number(row.social_media_clicks) || 0
                  devAggregates[devId].total_shares += Number(row.total_shares) || 0
                  devAggregates[devId].saved_count += Number(row.saved_count) || 0
                }
                
                // Build impressions breakdown and update developments table
                const developmentUpdates = []
                for (const devId of developmentIdsToUpdate) {
                  const agg = devAggregates[devId]
                  if (!agg) continue
                  
                  // Calculate impressions breakdown with percentages
                  const impressionsBreakdown = {
                    social_media: {
                      total: agg.social_media_clicks || 0,
                      percentage: agg.total_impressions > 0 ? Number(((agg.social_media_clicks || 0) / agg.total_impressions) * 100).toFixed(2) : 0
                    },
                    website_visit: {
                      total: 0, // Website visits are tracked as social_media_clicks for developments
                      percentage: 0
                    },
                    share: {
                      total: agg.total_shares || 0,
                      percentage: agg.total_impressions > 0 ? Number(((agg.total_shares || 0) / agg.total_impressions) * 100).toFixed(2) : 0
                    },
                    saved: {
                      total: agg.saved_count || 0,
                      percentage: agg.total_impressions > 0 ? Number(((agg.saved_count || 0) / agg.total_impressions) * 100).toFixed(2) : 0
                    }
                  }
                  
                  developmentUpdates.push({
                    id: devId,
                    total_views: agg.total_views,
                    total_leads: agg.total_leads,
                    total_impressions: agg.total_impressions,
                    impressions_breakdown: impressionsBreakdown
                  })
                }
                
                // Batch update developments table
                if (developmentUpdates.length > 0) {
                  const updatePromises = developmentUpdates.map(update =>
                    supabaseAdmin
                      .from('developments')
                      .update({
                        total_views: update.total_views,
                        total_leads: update.total_leads,
                        total_impressions: update.total_impressions,
                        impressions_breakdown: update.impressions_breakdown
                      })
                      .eq('id', update.id)
                      .then(({ error }) => ({ id: update.id, error }))
                      .catch(error => ({ id: update.id, error }))
                  )
                  
                  const updateResults = await Promise.all(updatePromises)
                  const successCount = updateResults.filter(r => !r.error).length
                  const errorCount = updateResults.filter(r => r.error).length
                  
                  if (errorCount > 0) {
                    errorTracker.addError('DEVELOPMENTS', `Error updating ${errorCount} developments`, {
                      errors: updateResults.filter(r => r.error).map(r => ({ id: r.id, error: r.error?.message }))
                    })
                  }
                  
                  if (successCount > 0) {
                    logSuccess(`Updated ${successCount} developments with impressions breakdown`)
                  }
                }
              }
            } catch (err) {
              errorTracker.addError('DEVELOPMENTS', 'Exception updating developments table', { error: err.message, stack: err.stack })
            }
          }
        }
      } catch (err) {
        insertResults.developments.errors.push(err.message)
      }
    }

    // COMMENTED OUT: Lead insertion - leads are now created in real-time via /api/leads/create
    // The cron job no longer inserts leads into the database
    // Leads are created immediately when user actions occur (phone, message, appointment clicks)
    // The cron job will read from the leads table for aggregation into user_analytics
    /*
    // Insert leads (time series - always insert new records)
    // The unique constraint on (listing_id, seeker_id) has been removed
    // This allows multiple lead records for the same seeker+listing combination
    // Each cron run creates new lead records, enabling time series tracking
    if (allLeadRows.length > 0) {
      try {
        const { data, error } = await supabaseAdmin
          .from('leads')
          .insert(allLeadRows)
          .select()
        
        if (error) {
          errorTracker.addError('LEADS', 'Error inserting leads', { 
            error: error.message, 
            code: error.code, 
            hint: error.hint,
            rowsAttempted: allLeadRows.length
          })
          insertResults.leads.errors.push(error.message)
        } else {
          logSuccess(`Inserted ${data?.length || allLeadRows.length} lead records`)
          insertResults.leads.inserted = data?.length || allLeadRows.length
        }
      } catch (err) {
        errorTracker.addError('LEADS', 'Exception inserting leads', { 
          error: err.message, 
          stack: err.stack,
          rowsAttempted: allLeadRows.length
        })
        insertResults.leads.errors.push(err.message)
      }
    } else {
      errorTracker.addWarning('LEADS', 'No lead rows to insert', {
        possibleReasons: [
          'No lead events (lead_phone, lead_message, lead_appointment) were found in PostHog',
          'Lead events were found but had missing listing_id or seeker_id',
          'Lead events were found but lister_id resolution failed',
          'All leads were filtered out due to missing data'
        ]
      })
    }
    */
    // NOTE: The above commented section was the old lead insertion logic
    // Leads are now created in real-time via /api/leads/create endpoint

    // 11. Aggregate breakdowns and update listings table with cumulative totals
    // Only update listings that had events in this run
    let listingUpdatesData = {} // Store for response
    let developerUpdatesData = {} // Store for response
    try {
      // Get unique listing IDs from events (accumulated across all hours)
      const listingIdsToUpdate = Array.from(allListingIdsSet)
      
      if (listingIdsToUpdate.length === 0) {
        // No listings found in events to update
      } else {

        // Aggregate share_breakdown, leads_breakdown, and impressions breakdown from all listing_analytics records
        // Aggregating breakdowns for listings
        const { data: allListingAnalytics, error: breakdownError } = await supabaseAdmin
          .from('listing_analytics')
          .select('listing_id, share_breakdown, leads_breakdown, impression_share, impression_social_media, impression_website_visit, impression_saved_listing, total_impressions, total_leads')
          .in('listing_id', listingIdsToUpdate)

        if (breakdownError) {
          errorTracker.addError('LISTINGS', 'Error fetching breakdowns', { error: breakdownError.message })
        }

        // Aggregate breakdowns per listing
        const breakdownAggregates = {}
        if (allListingAnalytics && allListingAnalytics.length > 0) {
          for (const row of allListingAnalytics) {
            const listingId = row.listing_id
            if (!breakdownAggregates[listingId]) {
              breakdownAggregates[listingId] = {
                share_breakdown: {
                  facebook: 0, whatsapp: 0, twitter: 0, instagram: 0,
                  copy_link: 0, email: 0, linkedin: 0, telegram: 0
                },
                leads_breakdown: {
                  phone: 0, whatsapp: 0, direct_message: 0,
                  email: 0, appointment: 0, website: 0
                },
                impressions_breakdown: {
                  social_media: 0,
                  website_visit: 0,
                  share: 0,
                  saved_listing: 0
                },
                total_shares: 0,
                total_leads: 0,
                total_impressions: 0
              }
            }

            // Aggregate share breakdown
            if (row.share_breakdown && typeof row.share_breakdown === 'object') {
              for (const [platform, data] of Object.entries(row.share_breakdown)) {
                if (data && typeof data === 'object' && data.total) {
                  breakdownAggregates[listingId].share_breakdown[platform] = 
                    (breakdownAggregates[listingId].share_breakdown[platform] || 0) + data.total
                }
              }
            }
            breakdownAggregates[listingId].total_shares += row.impression_share || 0

            // Aggregate impressions breakdown (engagement/interactions only)
            breakdownAggregates[listingId].impressions_breakdown.social_media += row.impression_social_media || 0
            breakdownAggregates[listingId].impressions_breakdown.website_visit += row.impression_website_visit || 0
            breakdownAggregates[listingId].impressions_breakdown.share += row.impression_share || 0
            breakdownAggregates[listingId].impressions_breakdown.saved_listing += row.impression_saved_listing || 0
            breakdownAggregates[listingId].total_impressions += row.total_impressions || 0

            // Aggregate leads breakdown - handle both nested messaging structure and flat structure
            if (row.leads_breakdown && typeof row.leads_breakdown === 'object') {
              // Check if it has nested messaging structure
              if (row.leads_breakdown.messaging && typeof row.leads_breakdown.messaging === 'object') {
                // Handle nested structure
                const messaging = row.leads_breakdown.messaging
                if (messaging.whatsapp && messaging.whatsapp.total) {
                  breakdownAggregates[listingId].leads_breakdown.whatsapp += messaging.whatsapp.total
                }
                if (messaging.direct_message && messaging.direct_message.total) {
                  breakdownAggregates[listingId].leads_breakdown.direct_message += messaging.direct_message.total
                }
                // Also handle top-level whatsapp/direct_message for backward compatibility
                if (row.leads_breakdown.whatsapp && row.leads_breakdown.whatsapp.total) {
                  breakdownAggregates[listingId].leads_breakdown.whatsapp += row.leads_breakdown.whatsapp.total
                }
                if (row.leads_breakdown.direct_message && row.leads_breakdown.direct_message.total) {
                  breakdownAggregates[listingId].leads_breakdown.direct_message += row.leads_breakdown.direct_message.total
                }
              }
              
              // Aggregate all lead types (handles both nested and flat structures)
              for (const [leadType, data] of Object.entries(row.leads_breakdown)) {
                // Skip messaging object as we handle it separately above
                if (leadType === 'messaging') continue
                
                if (data && typeof data === 'object' && data.total) {
                  // Only aggregate if it's a valid lead type
                  if (['phone', 'whatsapp', 'direct_message', 'email', 'appointment', 'website', 'message_leads'].includes(leadType)) {
                    breakdownAggregates[listingId].leads_breakdown[leadType] = 
                      (breakdownAggregates[listingId].leads_breakdown[leadType] || 0) + data.total
                  }
                }
              }
            }
            breakdownAggregates[listingId].total_leads += row.total_leads || 0
          }
        }

        // Calculate percentages and build final breakdown objects
        const finalBreakdowns = {}
        for (const listingId in breakdownAggregates) {
          const agg = breakdownAggregates[listingId]
          
          // Build share breakdown with percentages
          const shareBreakdown = {}
          for (const [platform, total] of Object.entries(agg.share_breakdown)) {
            const percentage = agg.total_shares > 0 ? Number(((total / agg.total_shares) * 100).toFixed(2)) : 0
            shareBreakdown[platform] = { total, percentage }
          }

          // Build impressions breakdown with percentages
          const impressionsBreakdown = {
            social_media: {
              total: agg.impressions_breakdown.social_media || 0,
              percentage: agg.total_impressions > 0 ? Number(((agg.impressions_breakdown.social_media || 0) / agg.total_impressions) * 100).toFixed(2) : 0
            },
            website_visit: {
              total: agg.impressions_breakdown.website_visit || 0,
              percentage: agg.total_impressions > 0 ? Number(((agg.impressions_breakdown.website_visit || 0) / agg.total_impressions) * 100).toFixed(2) : 0
            },
            share: {
              total: agg.impressions_breakdown.share || 0,
              percentage: agg.total_impressions > 0 ? Number(((agg.impressions_breakdown.share || 0) / agg.total_impressions) * 100).toFixed(2) : 0
            },
            saved_listing: {
              total: agg.impressions_breakdown.saved_listing || 0,
              percentage: agg.total_impressions > 0 ? Number(((agg.impressions_breakdown.saved_listing || 0) / agg.total_impressions) * 100).toFixed(2) : 0
            }
          }

          // Build leads breakdown with percentages and nested messaging structure
          const whatsappTotal = agg.leads_breakdown.whatsapp || 0
          const directMessageTotal = agg.leads_breakdown.direct_message || 0
          const messageTotal = whatsappTotal + directMessageTotal
          
          const leadsBreakdown = {
            phone: {
              total: agg.leads_breakdown.phone || 0,
              percentage: agg.total_leads > 0 ? Number(((agg.leads_breakdown.phone || 0) / agg.total_leads) * 100).toFixed(2) : 0
            },
            messaging: {
              total: messageTotal,
              percentage: agg.total_leads > 0 ? Number(((messageTotal / agg.total_leads) * 100).toFixed(2)) : 0,
              direct_message: {
                total: directMessageTotal,
                percentage: messageTotal > 0 ? Number(((directMessageTotal / messageTotal) * 100).toFixed(2)) : 0
              },
              whatsapp: {
                total: whatsappTotal,
                percentage: messageTotal > 0 ? Number(((whatsappTotal / messageTotal) * 100).toFixed(2)) : 0
              }
            },
            whatsapp: {
              total: whatsappTotal,
              percentage: agg.total_leads > 0 ? Number(((whatsappTotal / agg.total_leads) * 100).toFixed(2)) : 0
            },
            direct_message: {
              total: directMessageTotal,
              percentage: agg.total_leads > 0 ? Number(((directMessageTotal / agg.total_leads) * 100).toFixed(2)) : 0
            },
            email: {
              total: agg.leads_breakdown.email || 0,
              percentage: agg.total_leads > 0 ? Number(((agg.leads_breakdown.email || 0) / agg.total_leads) * 100).toFixed(2) : 0
            },
            appointment: {
              total: agg.leads_breakdown.appointment || 0,
              percentage: agg.total_leads > 0 ? Number(((agg.leads_breakdown.appointment || 0) / agg.total_leads) * 100).toFixed(2) : 0
            },
            website: {
              total: agg.leads_breakdown.website || 0,
              percentage: agg.total_leads > 0 ? Number(((agg.leads_breakdown.website || 0) / agg.total_leads) * 100).toFixed(2) : 0
            },
            // Backward compatibility
            message_leads: {
              total: messageTotal,
              percentage: agg.total_leads > 0 ? Number(((messageTotal / agg.total_leads) * 100).toFixed(2)) : 0
            }
          }

          finalBreakdowns[listingId] = {
            listing_share_breakdown: shareBreakdown,
            listing_leads_breakdown: leadsBreakdown,
            listing_impressions_breakdown: impressionsBreakdown
          }
        }

        // OPTIMIZATION: Use SQL aggregation function instead of batch fetching (replaces 200+ queries with 1 query)
        const listingTotals = {}
        try {
          const { data: aggregatedTotals, error: analyticsError } = await supabaseAdmin.rpc(
            'get_cumulative_listing_analytics',
            { listing_ids: listingIdsToUpdate }
          )

        if (analyticsError) {
            errorTracker.addError('LISTINGS', 'Error fetching listing analytics via SQL', { error: analyticsError.message })
          } else if (aggregatedTotals && aggregatedTotals.length > 0) {
            // Convert array to map
            for (const row of aggregatedTotals) {
              listingTotals[row.listing_id] = {
                total_views: Number(row.total_views) || 0,
                total_leads: Number(row.total_leads) || 0
              }
            }
            logSuccess(`Fetched aggregated totals for ${aggregatedTotals.length} listings`)
          }
        } catch (err) {
          errorTracker.addError('LISTINGS', 'Exception calling get_cumulative_listing_analytics', { error: err.message, stack: err.stack })
        }
        
        if (Object.keys(listingTotals).length > 0 || Object.keys(finalBreakdowns).length > 0) {

          // Batch update listings
          const listingUpdates = []
          for (const listingId in listingTotals) {
            const totals = listingTotals[listingId]
            const breakdowns = finalBreakdowns[listingId] || {
              listing_share_breakdown: {},
              listing_leads_breakdown: {},
              listing_impressions_breakdown: {}
            }
            listingUpdates.push({
              id: listingId,
              total_views: totals.total_views,
              total_leads: totals.total_leads,
              listing_share_breakdown: breakdowns.listing_share_breakdown,
              listing_leads_breakdown: breakdowns.listing_leads_breakdown,
              listing_impressions_breakdown: breakdowns.listing_impressions_breakdown
            })
            // Store for response
            listingUpdatesData[listingId] = {
              total_views: totals.total_views,
              total_leads: totals.total_leads,
              share_breakdown: breakdowns.listing_share_breakdown,
              leads_breakdown: breakdowns.listing_leads_breakdown,
              impressions_breakdown: breakdowns.listing_impressions_breakdown
            }
          }

          if (listingUpdates.length > 0) {
          // OPTIMIZATION: Use batch update (only update existing listings, don't insert)
          // Using individual updates to avoid issues with missing required fields like account_type
          let updateResults = []
            let successCount = 0
            let errorCount = 0
          
          try {
            // Update listings individually to avoid null constraint violations
              const updatePromises = listingUpdates.map(update =>
                supabaseAdmin
                .from('listings')
                .update({
                  total_views: update.total_views,
                  total_leads: update.total_leads,
                  listing_share_breakdown: update.listing_share_breakdown,
                  listing_leads_breakdown: update.listing_leads_breakdown,
                  listing_impressions_breakdown: update.listing_impressions_breakdown
                })
                .eq('id', update.id)
                  .then(({ error }) => ({ id: update.id, error }))
                  .catch(error => ({ id: update.id, error }))
              )
              updateResults = await Promise.all(updatePromises)
              successCount = updateResults.filter(r => !r.error).length
              errorCount = updateResults.filter(r => r.error).length
            
            if (errorCount > 0) {
              const errors = updateResults.filter(r => r.error)
              // Track each individual failure
              errors.forEach((err, idx) => {
                if (idx < 10) { // Track first 10 errors in detail
                  errorTracker.addError('LISTINGS', `Failed to update listing ${err.id}`, {
                    listing_id: err.id,
                    error: err.error?.message || err.error || 'Unknown error',
                    errorCode: err.error?.code,
                    errorHint: err.error?.hint
                  })
                }
              })
              // Summary error for all failures
              errorTracker.addError('LISTINGS', `Errors updating ${errorCount} listings`, { 
                totalErrors: errorCount,
                successCount,
                errorSample: errors.slice(0, 5).map(e => ({ id: e.id, error: e.error?.message || e.error }))
              })
            }
            logSuccess(`Updated ${successCount} listings with breakdowns`)
            if (errorCount > 0) {
              errorTracker.addWarning('LISTINGS', `${errorCount} listings failed to update`, { successCount, errorCount })
            }
          } catch (err) {
            errorTracker.addError('LISTINGS', 'Exception updating listings', { error: err.message, stack: err.stack })
            errorCount = listingUpdates.length
            successCount = 0
          }
          }
        }
      }
    } catch (err) {
      errorTracker.addError('LISTINGS', 'Exception in listing updates section', { error: err.message, stack: err.stack })
    }

    // 12. Update developers table with cumulative totals
    // Only update developers whose lister_id appeared in the events we just processed
    // Updating developers table with cumulative totals
    try {
      // Get unique developer IDs from events (lister_ids with user_type = 'developer')
      // Query developers table to get user types for accumulated user IDs
      const developerIdsToUpdate = new Set()
      if (allUserIdsSet.size > 0) {
        const { data: usersData } = await supabaseAdmin
          .from('developers')
          .select('developer_id')
          .in('developer_id', Array.from(allUserIdsSet))
        
        if (usersData) {
          for (const user of usersData) {
            developerIdsToUpdate.add(user.developer_id)
          }
        }
        
        // Also check agents table (if it exists)
        try {
          const { data: agentsData } = await supabaseAdmin
            .from('agents')
            .select('agent_id, agency_id')
            .in('agent_id', Array.from(allUserIdsSet))
          
          // Note: Agents are handled separately, not in developers table
        } catch (agentsError) {
          // Agents table doesn't exist yet - this is expected
          errorTracker.addWarning('AGENTS', 'Agents table not found (will be created later)', {})
        }
      }

      if (developerIdsToUpdate.size === 0) {
        insertResults.developers = {
          updated: 0,
          errors: 0,
          details: [],
          message: 'No developers found in events to update'
        }
      } else {

        // Batch fetch user_analytics for all developers at once (for views and impressions)
        // For total_leads, query directly from leads table (more accurate)
        const developerIdsArray = Array.from(developerIdsToUpdate)
        
        // Get current cumulative values from developers table
        const { data: currentDevelopers, error: fetchError } = await supabaseAdmin
          .from('developers')
          .select('developer_id, total_views, total_listings_views, total_profile_views, total_leads, total_impressions, conversion_rate')
          .in('developer_id', developerIdsArray)

        if (fetchError) {
          errorTracker.addError('DEVELOPERS', 'Error fetching current developer data', { error: fetchError.message, code: fetchError.code })
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
            errorTracker.addError('DEVELOPERS', 'Error calling get_developer_leads_breakdown', { error: breakdownError.message, code: breakdownError.code })
            // Fallback: set empty breakdowns for all developers
            for (const devId of developerIdsArray) {
              leadsBreakdownMap[devId] = {
                phone: { total: 0, percentage: 0 },
                whatsapp: { total: 0, percentage: 0 },
                direct_message: { total: 0, percentage: 0 },
                email: { total: 0, percentage: 0 },
                appointment: { total: 0, percentage: 0 },
                website: { total: 0, percentage: 0 },
                // Backward compatibility
                phone_leads: { total: 0, percentage: 0 },
                message_leads: { total: 0, percentage: 0 },
                website_leads: { total: 0, percentage: 0 },
                appointment_leads: { total: 0, percentage: 0 },
                email_leads: { total: 0, percentage: 0 },
                total_leads: 0
              }
            }
          } else if (leadsBreakdownData && leadsBreakdownData.length > 0) {
            logSuccess(`Fetched leads breakdown for ${leadsBreakdownData.length} developers`)
            // Convert SQL results to JSONB structure with proper message type breakdown
            for (const row of leadsBreakdownData) {
              const whatsappTotal = Number(row.whatsapp_leads) || 0
              const directMessageTotal = Number(row.direct_message_leads) || 0
              const messageTotal = whatsappTotal + directMessageTotal // Sum for backward compatibility
              const totalLeads = Number(row.total_leads) || 0
              
              leadsBreakdownMap[row.user_id] = {
                phone: {
                  total: Number(row.phone_leads) || 0,
                  percentage: Number(row.phone_percentage) || 0
                },
                messaging: {
                  total: messageTotal,
                  percentage: totalLeads > 0 ? Number(((messageTotal / totalLeads) * 100).toFixed(2)) : 0,
                  direct_message: {
                    total: directMessageTotal,
                    percentage: Number(row.direct_message_percentage) || 0
                  },
                  whatsapp: {
                    total: whatsappTotal,
                    percentage: Number(row.whatsapp_percentage) || 0
                  }
                },
                whatsapp: {
                  total: whatsappTotal,
                  percentage: Number(row.whatsapp_percentage) || 0
                },
                direct_message: {
                  total: directMessageTotal,
                  percentage: Number(row.direct_message_percentage) || 0
                },
                email: {
                  total: Number(row.email_leads) || 0,
                  percentage: Number(row.email_percentage) || 0
                },
                appointment: {
                  total: Number(row.appointment_leads) || 0,
                  percentage: Number(row.appointment_percentage) || 0
                },
                website: {
                  total: Number(row.website_leads) || 0,
                  percentage: Number(row.website_percentage) || 0
                },
                // Backward compatibility fields
                phone_leads: {
                  total: Number(row.phone_leads) || 0,
                  percentage: Number(row.phone_percentage) || 0
                },
                message_leads: {
                  total: messageTotal,
                  percentage: totalLeads > 0 ? Number(((messageTotal / totalLeads) * 100).toFixed(2)) : 0
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
                total_leads: totalLeads
              }
            }
            logSuccess(`Calculated leads breakdown for ${leadsBreakdownData.length} developers via SQL aggregation`)
          } else {
            // No data found - set empty breakdowns
            for (const devId of developerIdsArray) {
              leadsBreakdownMap[devId] = {
                phone: { total: 0, percentage: 0 },
                messaging: {
                  total: 0,
                  percentage: 0,
                  direct_message: { total: 0, percentage: 0 },
                  whatsapp: { total: 0, percentage: 0 }
                },
                whatsapp: { total: 0, percentage: 0 },
                direct_message: { total: 0, percentage: 0 },
                email: { total: 0, percentage: 0 },
                appointment: { total: 0, percentage: 0 },
                website: { total: 0, percentage: 0 },
                // Backward compatibility
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
          errorTracker.addError('DEVELOPERS', 'Exception calling get_developer_leads_breakdown', { error: err.message, stack: err.stack })
          // Fallback: set empty breakdowns
          for (const devId of developerIdsArray) {
            leadsBreakdownMap[devId] = {
              phone: { total: 0, percentage: 0 },
              messaging: {
                total: 0,
                percentage: 0,
                direct_message: { total: 0, percentage: 0 },
                whatsapp: { total: 0, percentage: 0 }
              },
              whatsapp: { total: 0, percentage: 0 },
              direct_message: { total: 0, percentage: 0 },
              email: { total: 0, percentage: 0 },
              appointment: { total: 0, percentage: 0 },
              website: { total: 0, percentage: 0 },
              // Backward compatibility
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
        
        // CRITICAL FIX: Calculate cumulative totals from user_analytics table (atomic recalculation)
        // This ensures data integrity by recalculating from scratch, not adding to potentially wrong DB values
        // Use total_views directly from user_analytics (which already = total_listing_views + profile_views)
        const developerIdsForCumulative = Object.keys(allDeveloperTotals)
        let cumulativeUserAnalytics = {} // Map<developerId, {total_views, total_listing_views, profile_views, total_leads, total_impressions}>
        
        if (developerIdsForCumulative.length > 0) {
          try {
            // Use SQL aggregation to get cumulative totals from user_analytics table
            // This sums ALL historical data, ensuring atomic recalculation
            // IMPORTANT: Fetch total_views directly (it already contains listing + profile views)
            // Also fetch total_listing_views and profile_views separately for breakdown display
            // Fetch impressions breakdown fields for impressions_breakdown calculation
            const { data: cumulativeData, error: cumulativeError } = await supabaseAdmin
              .from('user_analytics')
              .select('user_id, total_views, total_listing_views, profile_views, total_leads, total_impressions_received, impression_social_media_received, impression_website_visit_received, impression_share_received, impression_saved_listing_received')
              .in('user_id', developerIdsForCumulative)
              .eq('user_type', 'developer')
            
            if (cumulativeError) {
              errorTracker.addError('DEVELOPERS', 'Error fetching cumulative user analytics', { error: cumulativeError.message })
            } else if (cumulativeData && cumulativeData.length > 0) {
              // Aggregate by user_id (sum all hours/dates for each developer)
              for (const row of cumulativeData) {
                const userId = row.user_id
                if (!cumulativeUserAnalytics[userId]) {
                  cumulativeUserAnalytics[userId] = {
                    total_views: 0,
                    total_listing_views: 0,
                    profile_views: 0,
                    total_leads: 0,
                    total_impressions: 0,
                    impressions_breakdown: {
                      social_media: 0,
                      website_visit: 0,
                      share: 0,
                      saved_listing: 0
                    }
                  }
                }
                // Use total_views directly from user_analytics (source of truth)
                cumulativeUserAnalytics[userId].total_views += Number(row.total_views) || 0
                // Also track breakdown for display purposes
                cumulativeUserAnalytics[userId].total_listing_views += Number(row.total_listing_views) || 0
                cumulativeUserAnalytics[userId].profile_views += Number(row.profile_views) || 0
                cumulativeUserAnalytics[userId].total_leads += Number(row.total_leads) || 0
                cumulativeUserAnalytics[userId].total_impressions += Number(row.total_impressions_received) || 0
                // Aggregate impressions breakdown
                cumulativeUserAnalytics[userId].impressions_breakdown.social_media += Number(row.impression_social_media_received) || 0
                cumulativeUserAnalytics[userId].impressions_breakdown.website_visit += Number(row.impression_website_visit_received) || 0
                cumulativeUserAnalytics[userId].impressions_breakdown.share += Number(row.impression_share_received) || 0
                cumulativeUserAnalytics[userId].impressions_breakdown.saved_listing += Number(row.impression_saved_listing_received) || 0
              }
              logSuccess(`Calculated cumulative totals from user_analytics for ${Object.keys(cumulativeUserAnalytics).length} developers`)
            }
          } catch (err) {
            errorTracker.addError('DEVELOPERS', 'Exception calculating cumulative user analytics', { error: err.message, stack: err.stack })
          }
        }
        
        // OPTIMIZATION: Prepare all updates first, then execute in parallel using Promise.all
        const developerUpdatePromises = []
        for (const developerId in allDeveloperTotals) {
          const hourly = allDeveloperTotals[developerId]
          
          // CRITICAL FIX: Use cumulative values from user_analytics (atomic recalculation)
          // DO NOT reference current DB values - recalculate from scratch to ensure data integrity
          // This fixes the compounding error issue where wrong DB values would stay wrong
          const cumulative = cumulativeUserAnalytics[developerId] || {
            total_views: 0,
            total_listing_views: 0,
            profile_views: 0,
            total_leads: 0,
            total_impressions: 0,
            impressions_breakdown: {
              social_media: 0,
              website_visit: 0,
              share: 0,
              saved_listing: 0
            }
          }
          
          // CRITICAL FIX: Use total_views directly from user_analytics (source of truth)
          // user_analytics.total_views already = total_listing_views + profile_views per row
          // Summing all total_views from user_analytics ensures consistency and fixes discrepancies
          // This is the authoritative source - don't recalculate from listing_analytics + profile_views
          // because that can lead to mismatches if the two sources get out of sync
          const newTotalViews = cumulative.total_views
          
          // For breakdown display: use cumulative values from user_analytics
          // Prefer user_analytics values over listing_analytics to ensure consistency
          const newTotalListingViews = cumulative.total_listing_views > 0
            ? cumulative.total_listing_views  // Use from user_analytics (source of truth)
            : (hourly.cumulative_listing_views !== undefined 
                ? hourly.cumulative_listing_views  // Fallback to listing_analytics if user_analytics is 0
                : 0)
          
          // CRITICAL FIX: Use cumulative profile_views from user_analytics (not current DB + hourly)
          // This ensures atomic recalculation - if DB was wrong, it gets corrected
          const newTotalProfileViews = cumulative.profile_views
          
          // CRITICAL FIX: Use cumulative total_leads from user_analytics (not current DB + hourly)
          const newTotalLeads = cumulative.total_leads
          
          // CRITICAL FIX: Use cumulative total_impressions from user_analytics (not current DB + hourly)
          const newTotalImpressions = cumulative.total_impressions
          
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
          
          // Calculate impressions breakdown with percentages
          const totalImpressions = cumulative.total_impressions || 0
          const impressionsBreakdown = {
            social_media: {
              total: cumulative.impressions_breakdown.social_media || 0,
              percentage: totalImpressions > 0 ? Number(((cumulative.impressions_breakdown.social_media || 0) / totalImpressions) * 100).toFixed(2) : 0
            },
            website_visit: {
              total: cumulative.impressions_breakdown.website_visit || 0,
              percentage: totalImpressions > 0 ? Number(((cumulative.impressions_breakdown.website_visit || 0) / totalImpressions) * 100).toFixed(2) : 0
            },
            share: {
              total: cumulative.impressions_breakdown.share || 0,
              percentage: totalImpressions > 0 ? Number(((cumulative.impressions_breakdown.share || 0) / totalImpressions) * 100).toFixed(2) : 0
            },
            saved_listing: {
              total: cumulative.impressions_breakdown.saved_listing || 0,
              percentage: totalImpressions > 0 ? Number(((cumulative.impressions_breakdown.saved_listing || 0) / totalImpressions) * 100).toFixed(2) : 0
            }
          }

          // Get leads breakdown for this developer (cumulative from ALL leads in leads table)
          // This aggregates all leads across all time, not just the current run
          const leadsBreakdown = leadsBreakdownMap[developerId] || {
            phone: { total: 0, percentage: 0 },
            messaging: {
              total: 0,
              percentage: 0,
              direct_message: { total: 0, percentage: 0 },
              whatsapp: { total: 0, percentage: 0 }
            },
            whatsapp: { total: 0, percentage: 0 },
            direct_message: { total: 0, percentage: 0 },
            email: { total: 0, percentage: 0 },
            appointment: { total: 0, percentage: 0 },
            website: { total: 0, percentage: 0 },
            // Backward compatibility
            phone_leads: { total: 0, percentage: 0 },
            message_leads: { total: 0, percentage: 0 },
            website_leads: { total: 0, percentage: 0 },
            appointment_leads: { total: 0, percentage: 0 },
            email_leads: { total: 0, percentage: 0 },
            total_leads: 0
          }
          
          // Developer leads breakdown calculated

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
                leads_breakdown: leadsBreakdown, // This aggregates ALL leads from leads table
                impressions_breakdown: impressionsBreakdown // This aggregates ALL impressions from user_analytics
            })
            .eq('developer_id', developerId)
              .then(({ error, data }) => {
                if (error) {
                  errorTracker.addError('DEVELOPERS', `Error updating developer ${developerId}`, {
                    developer_id: developerId,
                    error: error.message,
                    code: error.code,
                    hint: error.hint
                  })
                } else {
                  logSuccess(`Updated developer ${developerId.substring(0, 8)}... with leads_breakdown`)
                }
                return { developer_id: developerId, error, totals: developerUpdatesData[developerId] }
              })
              .catch(error => {
                errorTracker.addError('DEVELOPERS', `Exception updating developer ${developerId}`, {
                  developer_id: developerId,
                  error: error.message,
                  stack: error.stack
                })
                return { developer_id: developerId, error, totals: developerUpdatesData[developerId] }
              })
          )
        }
        
        // Execute all updates in parallel
        const updateResults = await Promise.all(developerUpdatePromises)
        const successCount = updateResults.filter(r => !r.error).length
        const errorCount = updateResults.filter(r => r.error).length
        
        if (errorCount > 0) {
          const errors = updateResults.filter(r => r.error)
          // Track each individual failure
          errors.forEach((err, idx) => {
            if (idx < 10) { // Track first 10 errors in detail
              errorTracker.addError('DEVELOPERS', `Failed to update developer ${err.developer_id}`, {
                developer_id: err.developer_id,
                error: err.error?.message || err.error || 'Unknown error',
                errorCode: err.error?.code,
                errorHint: err.error?.hint
              })
            }
          })
          // Summary error
          errorTracker.addError('DEVELOPERS', `Errors updating ${errorCount} developers`, {
            totalErrors: errorCount,
            successCount,
            errorSample: errors.slice(0, 5).map(e => ({ developer_id: e.developer_id, error: e.error?.message || e.error }))
          })
        }
        logSuccess(`Updated ${successCount} developers`)
        if (errorCount > 0) {
          errorTracker.addWarning('DEVELOPERS', `${errorCount} developers failed to update`, { successCount, errorCount })
        }
        
        // Store update results for API response
        insertResults.developers = {
          updated: successCount,
          errors: errorCount,
          details: updateResults
        }
      }
    } catch (err) {
      errorTracker.addError('DEVELOPERS', 'Exception updating developers', { error: err.message, stack: err.stack })
    }

    // 13. Update admin_analytics table with platform-wide aggregations
    // Updating admin_analytics
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
          errorTracker.addError('ADMIN_ANALYTICS', 'Error fetching platform aggregates via SQL', { error: aggregateError.message, code: aggregateError.code })
        } else if (aggregates && aggregates.length > 0) {
          platformAggregates = aggregates[0]
          logSuccess('Fetched platform aggregates via SQL aggregation')
        }
      } catch (err) {
        errorTracker.addError('ADMIN_ANALYTICS', 'Exception calling get_platform_analytics_aggregates', { error: err.message, stack: err.stack })
      }
      
      // Fallback: If SQL function fails, fetch manually (shouldn't happen, but safety net)
      let allListingAnalytics = []
      if (!platformAggregates) {
        errorTracker.addWarning('ADMIN_ANALYTICS', 'SQL aggregation failed, falling back to manual fetching', {})
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
            errorTracker.addError('ADMIN_ANALYTICS', 'Error fetching listing_analytics for admin analytics', { error: allListingAnalyticsError.message })
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

      // CRITICAL FIX: Query leads for current hour using date and hour fields (not created_at)
      // The leads table has `date` and `hour` fields that represent when the event happened,
      // NOT `created_at` which is when the cron created the record
      // For current hour leads, we only need the count
      const { count: currentHourLeadsCount } = await supabaseAdmin
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('date', cal.date)
        .eq('hour', cal.hour) // Use the hour field, not created_at timestamp

      // OPTIMIZATION: Use SQL aggregation for leads breakdown instead of fetching all leads
      // This replaces fetching thousands of rows and filtering in JavaScript
      let leadsBreakdownData = null
      try {
        const { data: leadsData, error: leadsError } = await supabaseAdmin
          .rpc('get_admin_leads_breakdown', { target_date: cal.date })
        
        if (leadsError) {
          errorTracker.addError('ADMIN_ANALYTICS', 'Error calling get_admin_leads_breakdown', { error: leadsError.message, code: leadsError.code })
        } else if (leadsData && leadsData.length > 0) {
          leadsBreakdownData = leadsData[0]
          logSuccess('Fetched leads breakdown via SQL aggregation')
        }
      } catch (err) {
        errorTracker.addError('ADMIN_ANALYTICS', 'Exception calling get_admin_leads_breakdown', { error: err.message, stack: err.stack })
      }
      
      // Fallback: Fetch all leads if SQL function fails (shouldn't happen, but safety net)
      let allLeads = null
      if (!leadsBreakdownData) {
        errorTracker.addWarning('ADMIN_ANALYTICS', 'SQL aggregation failed, falling back to manual fetching', {})
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
      
      // Calculate current hour start and end times
      const currentHourStart = new Date(cal.date + 'T00:00:00Z')
      currentHourStart.setUTCHours(cal.hour, 0, 0, 0)
      const currentHourEnd = new Date(currentHourStart)
      currentHourEnd.setUTCHours(cal.hour, 59, 59, 999)
      
      try {
        const { data: signupsData, error: signupsError } = await supabaseAdmin
          .rpc('get_user_signups_for_hour', {
            signup_start: currentHourStart.toISOString(),
            signup_end: currentHourEnd.toISOString()
          })
        
        if (signupsError) {
          errorTracker.addError('ADMIN_ANALYTICS', 'Error calling get_user_signups_for_hour', { error: signupsError.message, code: signupsError.code })
          // Fallback to individual queries
          const { count: devCount } = await supabaseAdmin
            .from('developers')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', currentHourStart.toISOString())
            .lt('created_at', currentHourEnd.toISOString())
          developerSignups = devCount || 0
          
          // Try to query agents table (may not exist yet)
          try {
          const { count: agentCount } = await supabaseAdmin
            .from('agents')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', currentHourStart.toISOString())
            .lt('created_at', currentHourEnd.toISOString())
          agentSignups = agentCount || 0
          } catch (agentsError) {
            // Agents table doesn't exist yet - this is expected
            agentSignups = 0
            errorTracker.addWarning('AGENTS', 'Agents table not found (will be created later)', {})
          }
          
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
          logSuccess('Fetched all user signups via SQL aggregation')
        }
      } catch (err) {
        errorTracker.addError('ADMIN_ANALYTICS', 'Exception calling get_user_signups_for_hour', { error: err.message, stack: err.stack })
      }

      // Get counts from database
      const { count: totalDevelopers } = await supabaseAdmin
        .from('developers')
        .select('*', { count: 'exact', head: true })

      // Try to query agents table (may not exist yet)
      let totalAgents = 0
      try {
        const { count: agentCount } = await supabaseAdmin
        .from('agents')
        .select('*', { count: 'exact', head: true })
        totalAgents = agentCount || 0
      } catch (agentsError) {
        // Agents table doesn't exist yet - this is expected
        totalAgents = 0
        errorTracker.addWarning('AGENTS', 'Agents table not found (will be created later)', {})
      }

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
      let phoneLeads, messageLeads, messagingLeads, emailLeads, appointmentLeads, websiteLeads, totalLeadsCount
      
      if (leadsBreakdownData) {
        // Use SQL aggregated data
        totalLeadsCount = Number(leadsBreakdownData.total_leads) || 0
        const messageTotal = Number(leadsBreakdownData.message_leads_total) || 0
        
        phoneLeads = {
          total: Number(leadsBreakdownData.phone_leads_total) || 0,
          unique: Number(leadsBreakdownData.phone_leads_unique) || 0,
          percentage: totalLeadsCount > 0 ? Number(((leadsBreakdownData.phone_leads_total / totalLeadsCount) * 100).toFixed(2)) : 0,
          by_context: {} // Could be added to SQL function if needed
        }
        messageLeads = {
          total: messageTotal,
          unique: Number(leadsBreakdownData.message_leads_unique) || 0,
          percentage: totalLeadsCount > 0 ? Number(((messageTotal / totalLeadsCount) * 100).toFixed(2)) : 0,
          by_context: {}
        }
        // Create nested messaging structure
        // Note: SQL function doesn't break down whatsapp/direct_message yet, so we'll calculate from fallback if available
        // For now, set to 0 and will be calculated from fallback data if SQL doesn't provide breakdown
        const whatsappTotal = Number(leadsBreakdownData.whatsapp_leads_total) || 0
        const directMessageTotal = Number(leadsBreakdownData.direct_message_leads_total) || 0
        messagingLeads = {
          total: messageTotal,
          percentage: totalLeadsCount > 0 ? Number(((messageTotal / totalLeadsCount) * 100).toFixed(2)) : 0,
          direct_message: {
            total: directMessageTotal,
            percentage: messageTotal > 0 ? Number(((directMessageTotal / messageTotal) * 100).toFixed(2)) : 0
          },
          whatsapp: {
            total: whatsappTotal,
            percentage: messageTotal > 0 ? Number(((whatsappTotal / messageTotal) * 100).toFixed(2)) : 0
          }
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
        logSuccess('Used SQL aggregation for leads breakdown')
      } else {
        // Fallback: Calculate from allLeads array (inefficient, but safety net)
        errorTracker.addWarning('ADMIN_ANALYTICS', 'Using fallback JS aggregation for leads (SQL function failed)', {})
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
        const messageLeadsList = allLeads?.filter(lead => 
          lead.lead_actions?.some(action => action.action_type === 'lead_message')
        ) || []
        const messageTotal = messageLeadsList.length
        const whatsappLeadsList = messageLeadsList.filter(lead =>
          lead.lead_actions?.some(action => 
            action.action_type === 'lead_message' &&
            String(action.action_metadata?.message_type || action.action_metadata?.messageType || '').toLowerCase() === 'whatsapp'
          )
        )
        const directMessageLeadsList = messageLeadsList.filter(lead =>
          lead.lead_actions?.some(action => 
            action.action_type === 'lead_message' &&
            String(action.action_metadata?.message_type || action.action_metadata?.messageType || '').toLowerCase() !== 'whatsapp' &&
            String(action.action_metadata?.message_type || action.action_metadata?.messageType || '').toLowerCase() !== 'email'
          )
        )
        const whatsappTotal = whatsappLeadsList.length
        const directMessageTotal = directMessageLeadsList.length
        
        messageLeads = {
          total: messageTotal,
          unique: new Set(messageLeadsList.map(lead => lead.seeker_id)).size || 0,
          percentage: 0,
          by_context: {}
        }
        messagingLeads = {
          total: messageTotal,
          percentage: 0,
          direct_message: {
            total: directMessageTotal,
            percentage: messageTotal > 0 ? Number(((directMessageTotal / messageTotal) * 100).toFixed(2)) : 0
          },
          whatsapp: {
            total: whatsappTotal,
            percentage: messageTotal > 0 ? Number(((whatsappTotal / messageTotal) * 100).toFixed(2)) : 0
          }
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
          messagingLeads.percentage = Number(((messagingLeads.total / totalLeadsCount) * 100).toFixed(2))
          emailLeads.percentage = Number(((emailLeads.total / totalLeadsCount) * 100).toFixed(2))
          appointmentLeads.percentage = Number(((appointmentLeads.total / totalLeadsCount) * 100).toFixed(2))
          websiteLeads.percentage = Number(((websiteLeads.total / totalLeadsCount) * 100).toFixed(2))
        }
      }
      
      // If messagingLeads wasn't created (shouldn't happen, but safety check)
      if (!messagingLeads) {
        const messageTotal = messageLeads?.total || 0
        messagingLeads = {
          total: messageTotal,
          percentage: messageLeads?.percentage || 0,
          direct_message: {
            total: 0,
            percentage: 0
          },
          whatsapp: {
            total: 0,
            percentage: 0
          }
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
        messaging: messagingLeads,
        message_leads: messageLeads, // Backward compatibility
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
        message_leads: messageLeads, // Backward compatibility (messaging is inside leads.messaging)
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
        errorTracker.addError('ADMIN_ANALYTICS', 'Error upserting admin_analytics', { error: upsertError.message, date: cal.date, hour: cal.hour })
      } else {
        logSuccess(`Upserted admin_analytics for date ${cal.date}, hour ${cal.hour}`)
      }
    } catch (err) {
      errorTracker.addError('ADMIN_ANALYTICS', 'Exception updating admin_analytics', { error: err.message, stack: err.stack })
    }

    // 13. Mark run as completed
    await completeRun(runId, {
      events_processed: totalEventsProcessed,
      listings_processed: allListingRows.length,
      users_processed: allUserRows.length,
      developments_processed: allDevelopmentRows.length,
      leads_processed: 0, // COMMENTED OUT: allLeadRows.length - leads are now created in real-time, not in cron
      listings_inserted: insertResults.listings.inserted,
      users_inserted: insertResults.users.inserted,
      developments_inserted: insertResults.developments.inserted,
      leads_inserted: 0, // COMMENTED OUT: insertResults.leads.inserted - leads are now created in real-time
      ...(testTimeSeries ? { metadata: { lastProcessedDate: simulatedDate, hoursProcessed: hoursToProcess.length } } : {})
    })

    logSuccess(`Cron run ${runId} completed successfully`)

    // Serialize Sets to numbers for JSON response
    const serializeListingRows = allListingRows.map(row => ({
      ...row,
      unique_views: typeof row.unique_views === 'number' ? row.unique_views : (row.unique_views?.size || 0),
      unique_leads: typeof row.unique_leads === 'number' ? row.unique_leads : (row.unique_leads?.size || 0)
    }))

    const serializeUserRows = allUserRows.map(row => ({
      ...row,
      unique_profile_viewers: typeof row.unique_profile_viewers === 'number' ? row.unique_profile_viewers : (row.unique_profile_viewers?.size || 0),
      unique_properties_viewed: typeof row.unique_properties_viewed === 'number' ? row.unique_properties_viewed : (row.unique_properties_viewed?.size || 0)
    }))

    // Serialize development and lead rows (no Sets in these, but ensure they're serializable)
    const serializeDevelopmentRows = allDevelopmentRows.map(row => ({ ...row }))
    // COMMENTED OUT: serializeLeadRows - leads are now created in real-time, not in cron
    // const serializeLeadRows = allLeadRows.map(row => ({ ...row }))
    const serializeLeadRows = [] // Empty array since leads are created in real-time

    return NextResponse.json({
      success: true,
      message: 'Analytics processing completed successfully',
      timestamp: new Date().toISOString(),
      run_id: runId,
      date: cal.date,
      hour: cal.hour, // Add hour for hourly tracking
      ...(testTimeSeries ? {
        testTimeSeries: true,
        dayProcessed: simulatedDate,
        hoursProcessed: hoursToProcess.length,
        hoursWithEvents: hoursToProcess
      } : {}),
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
        events: totalEventsProcessed,
        listings: allListingRows.length,
        users: allUserRows.length,
        developments: allDevelopmentRows.length,
        leads: 0 // COMMENTED OUT: allLeadRows.length - leads are now created in real-time
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
        development_analytics: serializeDevelopmentRows,
        leads: serializeLeadRows,
        listing_updates: listingUpdatesData,
        developer_updates: developerUpdatesData,
        admin_analytics: adminAnalyticsData || null
      },
      // Include all errors and warnings for tracking
      errors: errorTracker.getSummary()
    })

  } catch (error) {
    errorTracker.addError('CRON', 'Fatal error in cron execution', { error: error.message, stack: error.stack })
    
    // Mark run as failed
    if (runRecord) {
      await failRun(runId, error)
    }
    
    return NextResponse.json({
      success: false,
      error: error.message,
      run_id: runId,
      errors: errorTracker.getSummary()
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

