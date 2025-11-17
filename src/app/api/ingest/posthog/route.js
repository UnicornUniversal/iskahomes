import { NextResponse } from 'next/server'
import { client, connectRedis, isRedisConnected } from '@/lib/redis'

// Helper: normalize ISO timestamp to UTC YYYYMMDD
function toDayKey(ts) {
  const d = ts ? new Date(ts) : new Date()
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

// Helper: safe number
function toNumber(val, def = 0) {
  const n = Number(val)
  return Number.isFinite(n) ? n : def
}

// TTL configuration for analytics data (7 days in seconds)
const ANALYTICS_TTL = 7 * 24 * 60 * 60 // 604800 seconds

// Helper: increment counter with TTL
async function incrWithTTL(key) {
  const pipeline = client.multi()
  pipeline.incr(key)
  pipeline.expire(key, ANALYTICS_TTL)
  return pipeline.exec()
}

// Helper: increment counter by float with TTL
async function incrByFloatWithTTL(key, value) {
  const pipeline = client.multi()
  pipeline.incrByFloat(key, value)
  pipeline.expire(key, ANALYTICS_TTL)
  return pipeline.exec()
}

// Helper: add to HyperLogLog with TTL
async function pfAddWithTTL(key, value) {
  const pipeline = client.multi()
  pipeline.pfAdd(key, value)
  pipeline.expire(key, ANALYTICS_TTL)
  return pipeline.exec()
}

// Helper: increment hash field with TTL
async function hIncrByWithTTL(key, field, value) {
  const pipeline = client.multi()
  pipeline.hIncrBy(key, field, value)
  pipeline.expire(key, ANALYTICS_TTL)
  return pipeline.exec()
}

// Build Redis keys
function kListing(listingId, day, metric) {
  return `listing:${listingId}:day:${day}:${metric}`
}
function kUser(userId, day, metric) {
  return `user:${userId}:day:${day}:${metric}`
}

function kDevelopment(developmentId, day, metric) {
  return `development:${developmentId}:day:${day}:${metric}`
}

function kLead(listingId, seekerId, metric) {
  return `lead:${listingId}:${seekerId}:${metric}`
}

function kLeadAgg(listingId, day, metric) {
  return `lead:${listingId}:day:${day}:${metric}`
}

// Helper: Store user_type in Redis for efficient lookup in cron job
function storeUserTypeInRedis(userId, userType) {
  if (!userId || !userType) return null
  const pipeline = client.multi()
  pipeline.set(`user:${userId}:user_type`, userType)
  pipeline.expire(`user:${userId}:user_type`, ANALYTICS_TTL)
  return pipeline.exec()
}

// Process a single PostHog event → Redis ops
async function processEvent(e) {
  const { event, properties = {}, distinct_id, timestamp } = e || {}
  const day = toDayKey(timestamp)

  // Common props
  const listingId = properties.listing_id || properties.listingId
  const listerId = properties.lister_id || properties.listerId
  const listerType = properties.lister_type || properties.listerType
  const seekerId = properties.seeker_id || distinct_id
  const viewedFrom = properties.viewed_from || properties.viewedFrom
  const isLoggedIn = properties.is_logged_in === true || properties.is_logged_in === 'true'
  
  // Legacy support for backward compatibility
  const userId = listerId || properties.developer_id || properties.agent_id

  const ops = []

  // Ensure Redis is connected
  if (!isRedisConnected()) {
    await connectRedis()
  }

  switch (event) {
    case 'property_view': {
      if (!listingId) break
      ops.push(incrWithTTL(kListing(listingId, day, 'total_views')))
      if (isLoggedIn) ops.push(incrWithTTL(kListing(listingId, day, 'logged_in_views')))
      else ops.push(incrWithTTL(kListing(listingId, day, 'anonymous_views')))
      if (viewedFrom) ops.push(incrWithTTL(kListing(listingId, day, `views_from_${String(viewedFrom).toLowerCase()}`)))
      if (seekerId) ops.push(pfAddWithTTL(kListing(listingId, day, 'unique_views'), seekerId))
      
      // Store user_type in Redis based on lister_type (for the listing owner)
      if (listerId && listerType) {
        const storeOp = storeUserTypeInRedis(listerId, listerType)
        if (storeOp) ops.push(storeOp)
      }
      break
    }

    case 'listing_impression': {
      if (!listingId) break
      ops.push(incrWithTTL(kListing(listingId, day, 'total_impressions')))
      // Also count towards views family if you consider impression as soft view (optional) – skipped by default
      break
    }

    case 'impression_social_media': {
      if (!listingId) break
      ops.push(incrWithTTL(kListing(listingId, day, 'impression_social_media')))
      // Optional platform breakdown hash increment
      if (properties.platform) {
        ops.push(hIncrByWithTTL(kListing(listingId, day, 'impression_social_media_breakdown'), String(properties.platform).toLowerCase(), 1))
      }
      ops.push(incrWithTTL(kListing(listingId, day, 'total_impressions')))
      
      // Store user_type in Redis based on lister_type (from profile_id if context is profile)
      if (listerId && listerType) {
        const storeOp = storeUserTypeInRedis(listerId, listerType)
        if (storeOp) ops.push(storeOp)
      } else if (properties.profile_id && properties.context_type === 'profile') {
        // For profile context, profile_id is the user
        const profileId = properties.profile_id
        const profileType = properties.profile_type || listerType
        if (profileId && profileType) {
          const storeOp = storeUserTypeInRedis(profileId, profileType)
          if (storeOp) ops.push(storeOp)
        }
      }
      break
    }

    case 'impression_website_visit': {
      if (!listingId) break
      ops.push(incrWithTTL(kListing(listingId, day, 'impression_website_visit')))
      ops.push(incrWithTTL(kListing(listingId, day, 'total_impressions')))
      
      // Store user_type in Redis based on lister_type
      if (listerId && listerType) {
        const storeOp = storeUserTypeInRedis(listerId, listerType)
        if (storeOp) ops.push(storeOp)
      } else if (properties.profile_id && properties.context_type === 'profile') {
        const profileId = properties.profile_id
        const profileType = properties.profile_type || listerType
        if (profileId && profileType) {
          const storeOp = storeUserTypeInRedis(profileId, profileType)
          if (storeOp) ops.push(storeOp)
        }
      }
      break
    }

    case 'impression_share': {
      if (!listingId) break
      ops.push(incrWithTTL(kListing(listingId, day, 'impression_share')))
      ops.push(incrWithTTL(kListing(listingId, day, 'total_impressions')))
      
      // Store user_type in Redis based on lister_type
      if (listerId && listerType) {
        const storeOp = storeUserTypeInRedis(listerId, listerType)
        if (storeOp) ops.push(storeOp)
      } else if (properties.profile_id && properties.context_type === 'profile') {
        const profileId = properties.profile_id
        const profileType = properties.profile_type || listerType
        if (profileId && profileType) {
          const storeOp = storeUserTypeInRedis(profileId, profileType)
          if (storeOp) ops.push(storeOp)
        }
      }
      break
    }

    case 'impression_saved_listing': {
      if (!listingId) break
      ops.push(incrWithTTL(kListing(listingId, day, 'impression_saved_listing')))
      ops.push(incrWithTTL(kListing(listingId, day, 'total_impressions')))
      
      // Store user_type in Redis based on lister_type
      if (listerId && listerType) {
        const storeOp = storeUserTypeInRedis(listerId, listerType)
        if (storeOp) ops.push(storeOp)
      }
      break
    }

    // Development-specific events
    case 'development_view': {
      const developmentId = properties.development_id || properties.developmentId
      if (!developmentId) break
      ops.push(incrWithTTL(kDevelopment(developmentId, day, 'total_views')))
      if (isLoggedIn) ops.push(incrWithTTL(kDevelopment(developmentId, day, 'logged_in_views')))
      else ops.push(incrWithTTL(kDevelopment(developmentId, day, 'anonymous_views')))
      if (viewedFrom) ops.push(incrWithTTL(kDevelopment(developmentId, day, `views_from_${String(viewedFrom).toLowerCase()}`)))
      if (seekerId) ops.push(pfAddWithTTL(kDevelopment(developmentId, day, 'unique_views'), seekerId))
      break
    }

    case 'development_share': {
      const developmentId = properties.development_id || properties.developmentId
      if (!developmentId) break
      ops.push(incrWithTTL(kDevelopment(developmentId, day, 'total_shares')))
      break
    }

    case 'development_saved': {
      const developmentId = properties.development_id || properties.developmentId
      if (!developmentId) break
      ops.push(incrWithTTL(kDevelopment(developmentId, day, 'saved_count')))
      break
    }

    case 'development_social_click': {
      const developmentId = properties.development_id || properties.developmentId
      if (!developmentId) break
      ops.push(incrWithTTL(kDevelopment(developmentId, day, 'social_media_clicks')))
      break
    }

    case 'development_lead': {
      const developmentId = properties.development_id || properties.developmentId
      if (!developmentId) break
      const leadType = properties.lead_type || 'message'
      if (leadType === 'phone') ops.push(incrWithTTL(kDevelopment(developmentId, day, 'phone_leads')))
      else if (leadType === 'email') ops.push(incrWithTTL(kDevelopment(developmentId, day, 'email_leads')))
      else if (leadType === 'appointment') ops.push(incrWithTTL(kDevelopment(developmentId, day, 'appointment_leads')))
      else if (leadType === 'website') ops.push(incrWithTTL(kDevelopment(developmentId, day, 'website_leads')))
      else ops.push(incrWithTTL(kDevelopment(developmentId, day, 'message_leads')))
      ops.push(incrWithTTL(kDevelopment(developmentId, day, 'total_leads')))
      if (seekerId) ops.push(pfAddWithTTL(kDevelopment(developmentId, day, 'unique_leads'), seekerId))
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
        if (event === 'lead_phone') {
          leadType = 'phone'
        } else if (event === 'lead_message') {
          leadType = 'message'
        } else if (event === 'lead_appointment') {
          leadType = 'appointment'
        }
      }
      
      if (!listingId || !seekerId) break
      
      // Use generic lister system with legacy fallback
      let finalListerId = listerId
      let finalListerType = listerType
      
      // Legacy fallback for backward compatibility
      if (!finalListerId) {
        if (properties.developer_id) {
          finalListerId = properties.developer_id
          finalListerType = 'developer'
        } else if (properties.agent_id) {
          finalListerId = properties.agent_id
          finalListerType = 'agent'
        }
      }
      
      if (!finalListerId) break // Skip if no lister identified
      
      // Store user_type in Redis based on lister_type
      if (finalListerId && finalListerType) {
        const storeOp = storeUserTypeInRedis(finalListerId, finalListerType)
        if (storeOp) ops.push(storeOp)
      }
      
      // Determine action_type based on lead_type
      let actionType = 'lead'
      let lastActionType = 'lead'
      if (leadType === 'phone') {
        actionType = 'lead_phone'
        lastActionType = 'lead_phone'
      } else if (leadType === 'message') {
        actionType = 'lead_message'
        lastActionType = 'lead_message'
      } else if (leadType === 'appointment') {
        actionType = 'lead_appointment'
        lastActionType = 'lead_appointment'
      }
      
      // Create action data
      const actionData = {
        action_id: crypto.randomUUID(),
        action_type: actionType,
        action_date: day,
        action_timestamp: timestamp,
        action_metadata: {
          action: properties.action || null,
          context_type: properties.context_type || 'listing',
          message_type: properties.message_type || properties.messageType || null,
          appointment_type: properties.appointment_type || properties.appointmentType || null
        }
      }
      
      // Add action to seeker's action array
      ops.push(() => client.lPush(kLead(listingId, seekerId, 'actions'), JSON.stringify(actionData)))
      ops.push(() => client.expire(kLead(listingId, seekerId, 'actions'), ANALYTICS_TTL))
      
      // Update metadata
      const metadata = {
        lister_id: finalListerId,
        lister_type: finalListerType,
        first_action_date: day,
        last_action_date: day,
        total_actions: 1,
        last_action_type: lastActionType,
        status: 'new'
      }
      ops.push(() => client.hSet(kLead(listingId, seekerId, 'metadata'), metadata))
      ops.push(() => client.expire(kLead(listingId, seekerId, 'metadata'), ANALYTICS_TTL))
      
      // Update aggregation counters based on lead_type
      ops.push(incrWithTTL(kLeadAgg(listingId, day, 'total_leads')))
      ops.push(pfAddWithTTL(kLeadAgg(listingId, day, 'unique_leads'), seekerId))
      
      if (leadType === 'phone') {
        ops.push(incrWithTTL(kLeadAgg(listingId, day, 'phone_leads')))
        // Keep existing listing analytics
        ops.push(incrWithTTL(kListing(listingId, day, 'phone_leads')))
        ops.push(incrWithTTL(kListing(listingId, day, 'total_leads')))
        if (seekerId) ops.push(pfAddWithTTL(kListing(listingId, day, 'unique_leads'), seekerId))
        // Also store in Set for retrieval in cron job (HyperLogLog doesn't support member retrieval)
        if (seekerId) {
          ops.push(() => client.sAdd(kLeadAgg(listingId, day, 'seekers'), seekerId))
          ops.push(() => client.expire(kLeadAgg(listingId, day, 'seekers'), ANALYTICS_TTL))
        }
      } else if (leadType === 'message') {
        const mt = String(properties.message_type || properties.messageType || '').toLowerCase()
        if (mt === 'email') {
          ops.push(incrWithTTL(kLeadAgg(listingId, day, 'email_leads')))
          ops.push(incrWithTTL(kListing(listingId, day, 'email_leads')))
        } else {
          ops.push(incrWithTTL(kLeadAgg(listingId, day, 'message_leads')))
          ops.push(incrWithTTL(kListing(listingId, day, 'message_leads')))
        }
        ops.push(incrWithTTL(kListing(listingId, day, 'total_leads')))
        if (seekerId) ops.push(pfAddWithTTL(kListing(listingId, day, 'unique_leads'), seekerId))
      } else if (leadType === 'appointment') {
        ops.push(incrWithTTL(kLeadAgg(listingId, day, 'appointment_leads')))
        // Keep existing listing analytics
        ops.push(incrWithTTL(kListing(listingId, day, 'appointment_leads')))
        ops.push(incrWithTTL(kListing(listingId, day, 'total_leads')))
        if (seekerId) ops.push(pfAddWithTTL(kListing(listingId, day, 'unique_leads'), seekerId))
      }
      break
    }

    // Optional: sales ingestion if emitted as an event (otherwise handled by DB/ledger)
    case 'listing_sold': {
      if (!listingId) break
      const saleValue = toNumber(properties.price, 0)
      ops.push(incrWithTTL(kListing(listingId, day, 'total_sales')))
      if (saleValue > 0) ops.push(incrByFloatWithTTL(kListing(listingId, day, 'sales_value'), saleValue))
      break
    }

    // Profile views (for user_analytics aggregation if you choose Redis for users)
    case 'profile_view': {
      const profileId = properties.profile_id
      const profileType = properties.profile_type // 'developer' | 'agent'
      if (profileId) {
        ops.push(incrWithTTL(kUser(profileId, day, 'profile_views')))
        if (distinct_id) ops.push(pfAddWithTTL(kUser(profileId, day, 'unique_profile_viewers'), distinct_id))
        const from = properties.viewed_from || properties.viewedFrom
        if (from === 'home') ops.push(incrWithTTL(kUser(profileId, day, 'profile_views_from_home')))
        else if (from === 'listings') ops.push(incrWithTTL(kUser(profileId, day, 'profile_views_from_listings')))
        else if (from === 'search') ops.push(incrWithTTL(kUser(profileId, day, 'profile_views_from_search')))
        
        // Store user_type in Redis based on profile_type
        if (profileType) {
          const storeOp = storeUserTypeInRedis(profileId, profileType)
          if (storeOp) ops.push(storeOp)
        }
      }
      break
    }

    case 'property_search': {
      if (!seekerId) break
      ops.push(incrWithTTL(kUser(seekerId, day, 'searches_performed')))
      break
    }

    case 'listing_created': {
      const listingId = properties.listing_id || properties.listingId
      const userId = properties.developer_id || properties.agent_id || properties.user_id || properties.userId
      const accountType = properties.account_type || properties.accountType // 'developer' | 'agent'
      
      if (!listingId || !userId) break
      
      // Track listing creation for user analytics
      ops.push(incrWithTTL(kUser(userId, day, 'total_listings')))
      ops.push(incrWithTTL(kUser(userId, day, 'active_listings')))
      
      // Store user_type in Redis based on account_type
      if (accountType) {
        const storeOp = storeUserTypeInRedis(userId, accountType)
        if (storeOp) ops.push(storeOp)
      }
      break
    }

    case 'listing_updated': {
      const listingId = properties.listing_id || properties.listingId
      const userId = properties.developer_id || properties.agent_id
      if (!listingId || !userId) break
      
      // Track listing updates (status changes, etc.)
      if (properties.status && properties.status !== 'available') {
        ops.push(incrWithTTL(kUser(userId, day, 'sold_listings')))
        ops.push(incrWithTTL(kListing(listingId, day, 'total_sales')))
        if (properties.price) {
          ops.push(incrByFloatWithTTL(kListing(listingId, day, 'sales_value'), Number(properties.price)))
        }
      }
      break
    }

    case 'listing_deleted': {
      const listingId = properties.listing_id || properties.listingId
      const userId = properties.developer_id || properties.agent_id
      if (!listingId || !userId) break
      
      // Track listing deletion
      ops.push(incrWithTTL(kUser(userId, day, 'total_listings')))
      break
    }

    case 'user_logged_in': {
      const userId = properties.user_id || properties.userId || distinct_id
      const userType = properties.user_type || properties.userType
      
      if (userId) {
        ops.push(incrWithTTL(kUser(userId, day, 'login_count')))
        
        // Store user_type in Redis if available
        if (userType) {
          const storeOp = storeUserTypeInRedis(userId, userType)
          if (storeOp) ops.push(storeOp)
        }
      }
      break
    }

    case 'user_logged_out': {
      const userId = properties.user_id || properties.userId
      if (!userId) break
      
      // Track logout events
      ops.push(incrWithTTL(kUser(userId, day, 'logout_count')))
      break
    }

    case 'development_created': {
      const developmentId = properties.development_id || properties.developmentId
      const developerId = properties.developer_id || properties.developerId
      if (!developmentId || !developerId) break
      
      // Track development creation
      ops.push(incrWithTTL(kDevelopment(developmentId, day, 'total_views'))) // Initial view count
      ops.push(incrWithTTL(kUser(developerId, day, 'total_developments')))
      break
    }

    case 'development_interaction': {
      const developmentId = properties.development_id || properties.developmentId
      if (!developmentId) break
      
      // Track development interactions (clicks, hovers, etc.)
      const interactionType = properties.action || properties.interaction_type || 'general'
      ops.push(incrWithTTL(kDevelopment(developmentId, day, 'total_interactions')))
      ops.push(hIncrByWithTTL(kDevelopment(developmentId, day, 'interaction_breakdown'), interactionType, 1))
      break
    }

    default:
      // ignore other events
      break
  }

  if (ops.length > 0) {
    await Promise.allSettled(ops)
  }

  return { event, listingId: listingId || null, day }
}

export async function POST(request) {
  // COMMENTED OUT: Redis ingestion (migrated to PostHog-only approach)
  // Return success to prevent client errors, but ingestion is disabled
  return NextResponse.json({ 
    success: true, 
    message: 'Ingestion disabled - using PostHog-only approach',
    ingested: 0 
  })

  /* COMMENTED OUT: Original Redis ingestion code
  try {
    // Verify webhook secret if configured
    const configuredSecret = process.env.POSTHOG_WEBHOOK_SECRET
    if (configuredSecret) {
      const incoming = request.headers.get('x-posthog-secret') || request.headers.get('X-Posthog-Secret')
      if (!incoming || incoming !== configuredSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Verify Redis connection first
    if (!isRedisConnected()) {
      await connectRedis()
    }

    const body = await request.json()
    const events = Array.isArray(body) ? body : Array.isArray(body?.events) ? body.events : [body]

    if (!events.length) {
      return NextResponse.json({ error: 'No events provided' }, { status: 400 })
    }

    const results = []
    for (const ev of events) {
      const r = await processEvent(ev)
      results.push(r)
    }

    // Build a compact summary for observability
    const byDay = {}
    for (const r of results) {
      if (!r) continue
      byDay[r.day] = (byDay[r.day] || 0) + 1
    }

    return NextResponse.json({
      success: true,
      ingested: results.length,
      byDay,
      sample: results.slice(0, 5)
    })
  } catch (error) {
    console.error('PostHog ingest error:', error)
    return NextResponse.json({ error: 'Ingest failed', details: error.message }, { status: 500 })
  }
  */
}

export async function GET() {
  // Simple health-check for PostHog export destination
  try {
    if (!isRedisConnected()) {
      await connectRedis()
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}


