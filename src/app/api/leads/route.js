import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

// Helper to check if string is UUID
function isUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const listerId = searchParams.get('lister_id')
    const listerType = searchParams.get('lister_type') || 'developer'
    const listingId = searchParams.get('listing_id')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '0', 10)
    const pageSize = parseInt(searchParams.get('page_size') || '20', 10)
    const offset = page * pageSize

    if (!listerId) {
      return NextResponse.json(
        { error: 'Lister ID is required' },
        { status: 400 }
      )
    }

    // Convert slug to developer_id if needed
    let finalListerId = listerId
    if (listerType === 'developer' && !isUUID(listerId)) {
      // It's a slug, fetch developer by slug
      const { data: developer, error: devError } = await supabaseAdmin
        .from('developers')
        .select('developer_id')
        .eq('slug', listerId)
        .single()

      if (!devError && developer) {
        finalListerId = developer.developer_id
      } else {
        return NextResponse.json(
          { error: 'Developer not found' },
          { status: 404 }
        )
      }
    }

    // Build query for leads
    let query = supabase
      .from('leads')
      .select(`
        id,
        listing_id,
        lister_id,
        lister_type,
        seeker_id,
        lead_actions,
        total_actions,
        first_action_date,
        last_action_date,
        last_action_type,
        status,
        notes,
        created_at,
        updated_at,
        context_type
      `)
      .eq('lister_id', finalListerId)
      .eq('lister_type', listerType)
      .not('seeker_id', 'is', null) // Only leads with seeker_id

    // Filter by listing_id if provided
    if (listingId) {
      query = query.eq('listing_id', listingId)
    } else {
      // Only get listing-based leads (listing_id is not null)
      query = query.not('listing_id', 'is', null)
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status)
    }

    // Fetch ALL leads (no pagination yet - we'll group first)
    // We need all records to properly group by (seeker_id, listing_id)
    let dataQuery = supabase
      .from('leads')
      .select(`
        id,
        listing_id,
        lister_id,
        lister_type,
        seeker_id,
        lead_actions,
        total_actions,
        lead_score,
        first_action_date,
        last_action_date,
        last_action_type,
        status,
        notes,
        status_tracker,
        created_at,
        updated_at,
        context_type
      `)
      .eq('lister_id', finalListerId)
      .eq('lister_type', listerType)
      .not('seeker_id', 'is', null)

    if (listingId) {
      dataQuery = dataQuery.eq('listing_id', listingId)
    } else {
      dataQuery = dataQuery.not('listing_id', 'is', null)
    }

    if (status) {
      dataQuery = dataQuery.eq('status', status)
    }

    const { data: allLeads, error: leadsError } = await dataQuery
      .order('last_action_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (leadsError) {
      console.error('Error fetching leads:', leadsError)
      return NextResponse.json(
        { error: 'Failed to fetch leads', details: leadsError.message },
        { status: 500 }
      )
    }

    if (!allLeads || allLeads.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        page,
        pageSize
      })
    }

    // Group leads by (seeker_id, listing_id)
    // This merges multiple records for the same seeker+listing combination
    const groupedLeadsMap = {}
    allLeads.forEach(lead => {
      // Create unique key: seeker_id + listing_id (or 'null' if listing_id is null)
      const groupKey = `${lead.seeker_id}_${lead.listing_id || 'null'}`
      if (!groupedLeadsMap[groupKey]) {
        groupedLeadsMap[groupKey] = []
      }
      groupedLeadsMap[groupKey].push(lead)
    })

    // Merge each group into a single lead record
    const mergedLeads = Object.values(groupedLeadsMap).map(group => {
      // Sort group by last_action_date DESC (most recent first)
      group.sort((a, b) => {
        const dateA = new Date(a.last_action_date || a.created_at)
        const dateB = new Date(b.last_action_date || b.created_at)
        return dateB - dateA
      })

      const primary = group[0] // Most recent record
      
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

      // Merge all notes from all records (deduplicate)
      const allNotes = group.flatMap(l => Array.isArray(l.notes) ? l.notes : [])
      const uniqueNotes = [...new Set(allNotes.map(n => String(n).trim()).filter(Boolean))]

      // Merge status_tracker from all records
      const allStatusTrackers = group.flatMap(l => Array.isArray(l.status_tracker) ? l.status_tracker : [])
      const uniqueStatusHistory = [...new Set(allStatusTrackers.map(s => String(s).trim()).filter(Boolean))]

      // Get earliest first_action_date and latest last_action_date
      const firstActionDates = group.map(l => l.first_action_date).filter(Boolean).sort()
      const lastActionDates = group.map(l => l.last_action_date).filter(Boolean).sort().reverse()
      
      // Sum total_actions from all records
      const totalActionsSum = group.reduce((sum, l) => sum + (l.total_actions || 0), 0)

      // Get most recently updated status (check updated_at)
      const mostRecentRecord = group.reduce((latest, current) => {
        const latestDate = new Date(latest.updated_at || latest.created_at || 0)
        const currentDate = new Date(current.updated_at || current.created_at || 0)
        return currentDate > latestDate ? current : latest
      }, group[0])

      return {
        ...primary,
        // Use primary record's ID (most recent)
        id: primary.id,
        // Merge arrays
        lead_actions: allActions,
        notes: uniqueNotes,
        status_tracker: uniqueStatusHistory,
        // Aggregate counts
        total_actions: totalActionsSum,
        lead_score: mergedLeadScore, // Recalculate score from merged actions
        // Use earliest first_action_date and latest last_action_date
        first_action_date: firstActionDates[0] || primary.first_action_date,
        last_action_date: lastActionDates[0] || primary.last_action_date,
        // Use most recently updated status
        status: mostRecentRecord.status || primary.status,
        // Keep track of how many records were merged (for debugging)
        _merged_count: group.length
      }
    })

    // Apply search filter if provided (before pagination)
    let filteredLeads = mergedLeads
    if (search) {
      const searchLower = search.toLowerCase()
      filteredLeads = mergedLeads.filter(lead =>
        (lead.seeker_id || '').toLowerCase().includes(searchLower) ||
        (lead.listing_id || '').toLowerCase().includes(searchLower)
      )
    }

    // Sort merged leads by last_action_date DESC
    filteredLeads.sort((a, b) => {
      const dateA = new Date(a.last_action_date || a.created_at || 0)
      const dateB = new Date(b.last_action_date || b.created_at || 0)
      return dateB - dateA
    })

    // Get total count of unique groups (after filtering)
    const totalUniqueLeads = filteredLeads.length

    // Apply pagination to merged results
    const paginatedLeads = filteredLeads.slice(offset, offset + pageSize)

    // Get listing IDs from paginated leads and fetch listings
    const listingIds = paginatedLeads.filter(l => l.listing_id).map(l => l.listing_id)
    let listingsMap = {}
    
    if (listingIds.length > 0) {
      const { data: listings, error: listingsError } = await supabase
        .from('listings')
        .select('id, title, slug, listing_status, media, city, state, country, town, full_address')
        .in('id', listingIds)

      if (!listingsError && listings) {
        listings.forEach(listing => {
          // Extract first image from media albums
          let imageUrl = null
          if (listing.media) {
            try {
              // Parse media if it's a string
              let media = listing.media
              if (typeof media === 'string') {
                // If it's already a URL string, use it directly
                if (media.startsWith('http')) {
                  imageUrl = media
                } else {
                  // Try to parse as JSON
                  try {
                    media = JSON.parse(media)
                  } catch (parseErr) {
                    console.error('Could not parse media as JSON:', parseErr, listing.id)
                    return // Skip this listing's media processing
                  }
                }
              }

              // Only process if we don't already have an imageUrl and media is an object
              if (!imageUrl && media && typeof media === 'object') {
                // Try albums first (new structure) - media.albums[0].images[0].url
                if (media.albums && Array.isArray(media.albums) && media.albums.length > 0) {
                  const firstAlbum = media.albums[0]
                  if (firstAlbum && firstAlbum.images && Array.isArray(firstAlbum.images) && firstAlbum.images.length > 0) {
                    const firstImage = firstAlbum.images[0]
                    if (firstImage && firstImage.url) {
                      imageUrl = firstImage.url
                    }
                  }
                }
                
                // Fallback to old structure
                if (!imageUrl) {
                  imageUrl = media.banner?.url || 
                            (media.mediaFiles && Array.isArray(media.mediaFiles) && media.mediaFiles.length > 0 ? media.mediaFiles[0].url : null) || 
                            null
                }
              }
            } catch (err) {
              console.error('Error parsing listing media:', err, listing.id, listing.media)
              // If parsing fails, try to use media directly
              if (typeof listing.media === 'string' && listing.media.startsWith('http')) {
                imageUrl = listing.media
              }
            }
          }

          listingsMap[listing.id] = {
            id: listing.id,
            title: listing.title || 'Untitled Property',
            slug: listing.slug,
            status: listing.listing_status,
            image: imageUrl,
            city: listing.city,
            state: listing.state,
            country: listing.country,
            town: listing.town,
            full_address: listing.full_address
          }
        })
      }
    }

    // Get seeker IDs and fetch seeker info
    const seekerIds = [...new Set(paginatedLeads.map(l => l.seeker_id).filter(Boolean))]
    let seekersMap = {}
    
    if (seekerIds.length > 0) {
      const { data: seekers, error: seekersError } = await supabase
        .from('property_seekers')
        .select('id, name, email, phone')
        .in('id', seekerIds)

      if (!seekersError && seekers) {
        seekersMap = seekers.reduce((acc, seeker) => {
          acc[seeker.id] = {
            id: seeker.id,
            name: seeker.name || seeker.email || 'Unknown Seeker',
            email: seeker.email,
            phone: seeker.phone
          }
          return acc
        }, {})
      }
    }

    // Transform the data (add listing and seeker info)
    let transformedLeads = paginatedLeads.map(lead => {
      const listing = lead.listing_id ? listingsMap[lead.listing_id] || null : null
      const seeker = lead.seeker_id ? seekersMap[lead.seeker_id] || null : null

      return {
        id: lead.id,
        listing_id: lead.listing_id,
        listing_title: listing?.title || null,
        listing_slug: listing?.slug || null,
        listing_status: listing?.status || null,
        listing_image: listing?.image || null,
        listing_location: listing ? [listing.town, listing.city, listing.state, listing.country].filter(Boolean).join(', ') : null,
        listing_full_address: listing?.full_address || null,
        listing_town: listing?.town || null,
        listing_city: listing?.city || null,
        listing_state: listing?.state || null,
        listing_country: listing?.country || null,
        lister_id: lead.lister_id,
        lister_type: lead.lister_type,
        seeker_id: lead.seeker_id,
        seeker_name: seeker?.name || lead.seeker_id,
        seeker_email: seeker?.email || null,
        seeker_phone: seeker?.phone || null,
        lead_actions: Array.isArray(lead.lead_actions) ? lead.lead_actions : [],
        total_actions: lead.total_actions || 0,
        lead_score: lead.lead_score || 0,
        first_action_date: lead.first_action_date,
        last_action_date: lead.last_action_date,
        last_action_type: lead.last_action_type,
        status: lead.status || 'new',
        notes: Array.isArray(lead.notes) ? lead.notes : [],
        status_tracker: Array.isArray(lead.status_tracker) ? lead.status_tracker : [],
        context_type: lead.context_type || 'listing',
        created_at: lead.created_at,
        updated_at: lead.updated_at
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedLeads,
      total: totalUniqueLeads,
      page,
      pageSize
    })

  } catch (error) {
    console.error('Leads fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

