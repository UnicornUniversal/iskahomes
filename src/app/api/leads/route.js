import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

// Helper to check if string is UUID
function isUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
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

    // Get total count before pagination
    let countQuery = supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('lister_id', finalListerId)
      .eq('lister_type', listerType)
      .not('seeker_id', 'is', null)

    if (listingId) {
      countQuery = countQuery.eq('listing_id', listingId)
    } else {
      countQuery = countQuery.not('listing_id', 'is', null)
    }

    if (status) {
      countQuery = countQuery.eq('status', status)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error counting leads:', countError)
    }

    // Apply pagination - create a new query for the actual data
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
      .not('seeker_id', 'is', null)

    if (listingId) {
      dataQuery = dataQuery.eq('listing_id', listingId)
    } else {
      dataQuery = dataQuery.not('listing_id', 'is', null)
    }

    if (status) {
      dataQuery = dataQuery.eq('status', status)
    }

    const { data: leads, error: leadsError } = await dataQuery
      .order('last_action_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (leadsError) {
      console.error('Error fetching leads:', leadsError)
      return NextResponse.json(
        { error: 'Failed to fetch leads', details: leadsError.message },
        { status: 500 }
      )
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        page,
        pageSize
      })
    }

    // Get listing IDs and fetch listings
    const listingIds = leads.filter(l => l.listing_id).map(l => l.listing_id)
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
    const seekerIds = [...new Set(leads.map(l => l.seeker_id).filter(Boolean))]
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

    // Transform the data
    let transformedLeads = leads.map(lead => {
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
        lead_actions: lead.lead_actions || [],
        total_actions: lead.total_actions || 0,
        first_action_date: lead.first_action_date,
        last_action_date: lead.last_action_date,
        last_action_type: lead.last_action_type,
        status: lead.status || 'new',
        notes: Array.isArray(lead.notes) ? lead.notes : [],
        context_type: lead.context_type || 'listing',
        created_at: lead.created_at,
        updated_at: lead.updated_at
      }
    })

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase()
      transformedLeads = transformedLeads.filter(lead =>
        (lead.seeker_name || '').toLowerCase().includes(searchLower) ||
        (lead.listing_title || '').toLowerCase().includes(searchLower) ||
        (lead.seeker_id || '').toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json({
      success: true,
      data: transformedLeads,
      total: count || transformedLeads.length,
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

