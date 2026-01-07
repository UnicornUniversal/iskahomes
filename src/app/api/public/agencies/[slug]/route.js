import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request, { params }) {
  try {
    const { slug } = await params
    
    console.log('🔍 Public API - Fetching agency with slug:', slug)

    if (!slug) {
      return NextResponse.json(
        { error: 'Agency slug is required' },
        { status: 400 }
      )
    }

    // 1. Fetch agency details by slug
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select(`
        id,
        agency_id,
        name,
        email,
        phone,
        website,
        address,
        city,
        region,
        state,
        country,
        description,
        profile_image,
        cover_image,
        social_media,
        customer_care,
        account_status,
        slug,
        verified,
        company_locations,
        company_statistics,
        total_listings,
        total_agents,
        company_size,
        founded_year,
        license_number,
        latitude,
        longitude,
        created_at
      `)
      .eq('slug', slug)
      .eq('account_status', 'active')
      .single()

    if (agencyError || !agency) {
      console.error('Error fetching agency:', agencyError)
      return NextResponse.json(
        { error: 'Agency not found', details: agencyError?.message },
        { status: 404 }
      )
    }

    console.log('✅ Agency found:', agency.name)

    // 2. Fetch agency's agents
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select(`
        id,
        agent_id,
        name,
        email,
        phone,
        profile_image,
        cover_image,
        bio,
        slug,
        account_status,
        agent_status,
        total_listings,
        location_id,
        created_at
      `)
      .eq('agency_id', agency.agency_id)
      .eq('account_status', 'active')
      .eq('agent_status', 'active')
      .order('created_at', { ascending: false })

    if (agentsError) {
      console.error('Error fetching agents:', agentsError)
      // Don't fail the request, just return empty agents
    }

    // 3. Fetch agency's listings - show ALL listings regardless of status (for now)
    let listings = []
    
    console.log('🔍 Fetching listings for agency_id:', agency.agency_id)
    
    // First try to get listings directly by listing_agency_id
    const { data: directListings, error: directListingsError } = await supabase
      .from('listings')
      .select('*')
      .eq('listing_agency_id', agency.agency_id)
      .order('created_at', { ascending: false })
      .limit(50)

    console.log('📊 Direct listings by listing_agency_id:', {
      count: directListings?.length || 0,
      error: directListingsError?.message,
      agency_id: agency.agency_id
    })

    if (!directListingsError && directListings && directListings.length > 0) {
      listings = directListings
      console.log('✅ Using direct listings:', listings.length)
    } else {
      // Fallback: Get listings from all agents in the agency
      console.log('🔄 Trying fallback: getting listings from agents')
      if (agents && agents.length > 0) {
        const agentIds = agents.map(a => a.agent_id).filter(Boolean)
        console.log('👥 Agent IDs:', agentIds)
        
        if (agentIds.length > 0) {
          const { data: agentListings, error: agentListingsError } = await supabase
            .from('listings')
            .select('*')
            .in('user_id', agentIds)
            .order('created_at', { ascending: false })
            .limit(50)

          console.log('📊 Agent listings:', {
            count: agentListings?.length || 0,
            error: agentListingsError?.message
          })

          if (!agentListingsError && agentListings && agentListings.length > 0) {
            listings = agentListings
            console.log('✅ Using agent listings:', listings.length)
          }
        }
      }
    }

    // Also try combining both approaches - get all listings and merge
    if (listings.length === 0) {
      console.log('⚠️ No listings found with either method. Trying combined approach...')
      const allAgentIds = agents?.map(a => a.agent_id).filter(Boolean) || []
      
      if (allAgentIds.length > 0) {
        // Get listings by listing_agency_id
        const { data: agencyListings } = await supabase
          .from('listings')
          .select('*')
          .eq('listing_agency_id', agency.agency_id)
        
        // Get listings by agent user_ids
        const { data: agentListings } = await supabase
          .from('listings')
          .select('*')
          .in('user_id', allAgentIds)
        
        // Combine and deduplicate by id
        const allListings = [...(agencyListings || []), ...(agentListings || [])]
        const uniqueListings = Array.from(
          new Map(allListings.map(listing => [listing.id, listing])).values()
        )
        
        console.log('📊 Combined listings:', {
          agencyListings: agencyListings?.length || 0,
          agentListings: agentListings?.length || 0,
          unique: uniqueListings.length
        })
        
        if (uniqueListings.length > 0) {
          listings = uniqueListings.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          ).slice(0, 50)
          console.log('✅ Using combined listings:', listings.length)
        }
      }
    }

    console.log('📦 Final listings count:', listings.length)

    // 4. Return combined data
    return NextResponse.json({
      success: true,
      data: {
        agency: {
          id: agency.id,
          agency_id: agency.agency_id,
          name: agency.name,
          email: agency.email,
          phone: agency.phone,
          website: agency.website,
          address: agency.address,
          city: agency.city,
          region: agency.region,
          state: agency.state,
          country: agency.country,
          description: agency.description,
          profile_image: agency.profile_image,
          cover_image: agency.cover_image,
          social_media: agency.social_media,
          customer_care: agency.customer_care,
          account_status: agency.account_status,
          slug: agency.slug,
          verified: agency.verified,
          company_locations: agency.company_locations,
          company_statistics: agency.company_statistics,
          total_listings: agency.total_listings,
          total_agents: agency.total_agents,
          company_size: agency.company_size,
          founded_year: agency.founded_year,
          license_number: agency.license_number,
          latitude: agency.latitude,
          longitude: agency.longitude,
          created_at: agency.created_at
        },
        agents: agents || [],
        listings: listings
      }
    })

  } catch (error) {
    console.error('Public agency fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

