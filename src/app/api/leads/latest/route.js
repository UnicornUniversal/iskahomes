import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, listing_id, seeker_id, lister_id, lister_type, context_type, total_actions, first_action_date, last_action_date, last_action_type, status, created_at')
      .eq('lister_id', listerId)
      .order('last_action_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (leadsError) {
      console.error('Error fetching latest leads:', leadsError)
      return NextResponse.json(
        { error: 'Failed to fetch latest leads', details: leadsError.message },
        { status: 500 }
      )
    }

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
        firstActionDate: lead.first_action_date,
        lastActionDate: lead.last_action_date,
        lastActionType: lead.last_action_type,
        status: lead.status,
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

