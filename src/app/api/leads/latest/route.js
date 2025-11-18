import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const listerId = searchParams.get('lister_id')
    const limit = parseInt(searchParams.get('limit')) || 7

    if (!listerId) {
      return NextResponse.json(
        { error: 'Lister ID is required' },
        { status: 400 }
      )
    }

    // Fetch latest leads for the developer/agent
    // Note: We fetch all records first, then group them to avoid duplicates
    const { data: allLeads, error: leadsError } = await supabase
      .from('leads')
      .select('id, listing_id, seeker_id, lister_id, lister_type, context_type, total_actions, lead_score, lead_actions, first_action_date, last_action_date, last_action_type, status, status_tracker, created_at')
      .eq('lister_id', listerId)
      .order('last_action_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (leadsError) {
      console.error('Error fetching latest leads:', leadsError)
      return NextResponse.json(
        { error: 'Failed to fetch latest leads', details: leadsError.message },
        { status: 500 }
      )
    }

    if (!allLeads || allLeads.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0
      })
    }

    // Group leads by (seeker_id, listing_id) to merge duplicate records
    const groupedLeadsMap = {}
    allLeads.forEach(lead => {
      const groupKey = `${lead.seeker_id}_${lead.listing_id || 'null'}`
      if (!groupedLeadsMap[groupKey]) {
        groupedLeadsMap[groupKey] = []
      }
      groupedLeadsMap[groupKey].push(lead)
    })

    // Merge each group into a single lead record
    const mergedLeads = Object.values(groupedLeadsMap).map(group => {
      // Sort by last_action_date DESC
      group.sort((a, b) => {
        const dateA = new Date(a.last_action_date || a.created_at || 0)
        const dateB = new Date(b.last_action_date || b.created_at || 0)
        return dateB - dateA
      })

      const primary = group[0]
      
      // Merge all lead_actions from all records in the group
      const allActions = group.flatMap(l => Array.isArray(l.lead_actions) ? l.lead_actions : [])
      // Sort actions by timestamp
      allActions.sort((a, b) => {
        const tsA = new Date(a.action_timestamp || a.action_date || 0)
        const tsB = new Date(b.action_timestamp || b.action_date || 0)
        return tsA - tsB
      })

      // Calculate lead_score from merged actions
      const mergedLeadScore = calculateLeadScore(allActions)
      
      // Sum total_actions
      const totalActionsSum = group.reduce((sum, l) => sum + (l.total_actions || 0), 0)
      
      // Get earliest first_action_date and latest last_action_date
      const firstActionDates = group.map(l => l.first_action_date).filter(Boolean).sort()
      const lastActionDates = group.map(l => l.last_action_date).filter(Boolean).sort().reverse()
      
      // Merge status_tracker
      const allStatusTrackers = group.flatMap(l => Array.isArray(l.status_tracker) ? l.status_tracker : [])
      const uniqueStatusHistory = [...new Set(allStatusTrackers.map(s => String(s).trim()).filter(Boolean))]

      return {
        ...primary,
        id: primary.id,
        lead_actions: allActions,
        total_actions: totalActionsSum,
        lead_score: mergedLeadScore,
        first_action_date: firstActionDates[0] || primary.first_action_date,
        last_action_date: lastActionDates[0] || primary.last_action_date,
        status_tracker: uniqueStatusHistory
      }
    })

    // Sort merged leads and limit
    mergedLeads.sort((a, b) => {
      const dateA = new Date(a.last_action_date || a.created_at || 0)
      const dateB = new Date(b.last_action_date || b.created_at || 0)
      return dateB - dateA
    })

    const leads = mergedLeads.slice(0, limit)

    // Fetch listings separately if we have listing_ids (excluding nulls for profile-based leads)
    const listingIds = leads?.filter(l => l.listing_id).map(l => l.listing_id) || []
    let listingsMap = {}
    
    if (listingIds.length > 0) {
      const { data: listings, error: listingsError } = await supabase
        .from('listings')
        .select('id, title, slug, price, currency, media')
        .in('id', listingIds)

      if (!listingsError && listings) {
        listingsMap = listings.reduce((acc, listing) => {
          acc[listing.id] = listing
          return acc
        }, {})
      }
    }

    // Transform the data
    const transformedLeads = leads?.map(lead => {
      const listing = lead.listing_id ? listingsMap[lead.listing_id] || null : null
      return {
        id: lead.id,
        listingId: lead.listing_id,
        seekerId: lead.seeker_id,
        listerId: lead.lister_id,
        listerType: lead.lister_type,
        contextType: lead.context_type,
        totalActions: lead.total_actions,
        leadScore: lead.lead_score || 0,
        firstActionDate: lead.first_action_date,
        lastActionDate: lead.last_action_date,
        lastActionType: lead.last_action_type,
        status: lead.status,
        statusTracker: Array.isArray(lead.status_tracker) ? lead.status_tracker : [],
        createdAt: lead.created_at,
        listing: listing ? {
          id: listing.id,
          title: listing.title || 'Unknown Property',
          slug: listing.slug,
          price: listing.price,
          currency: listing.currency || 'GHS',
          image: listing.media?.banner?.url || 
                 listing.media?.mediaFiles?.[0]?.url || 
                 null
        } : null,
        // For profile-based leads (listing_id is null)
        isProfileLead: !lead.listing_id && lead.context_type === 'profile'
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: transformedLeads,
      total: transformedLeads.length
    })

  } catch (error) {
    console.error('Latest leads fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

