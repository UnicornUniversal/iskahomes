import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request, { params }) {
  try {
    const { slug } = await params
    
    console.log('🔍 Public API - Fetching agent with slug:', slug)

    if (!slug) {
      return NextResponse.json(
        { error: 'Agent slug is required' },
        { status: 400 }
      )
    }

    // 1. Fetch agent details by slug
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select(`
        id,
        agent_id,
        agency_id,
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
        social_media,
        created_at
      `)
      .eq('slug', slug)
      .eq('account_status', 'active')
      .eq('agent_status', 'active')
      .single()

    if (agentError || !agent) {
      console.error('Error fetching agent:', agentError)
      return NextResponse.json(
        { error: 'Agent not found', details: agentError?.message },
        { status: 404 }
      )
    }

    console.log('✅ Agent found:', agent.name)

    // 2. Fetch agent's agency
    let agency = null
    if (agent.agency_id) {
      const { data: agencyData, error: agencyError } = await supabase
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
          slug,
          verified,
          account_status
        `)
        .eq('agency_id', agent.agency_id)
        .eq('account_status', 'active')
        .single()

      if (!agencyError && agencyData) {
        agency = agencyData
      }
    }

    // 3. Fetch agent's listings
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', agent.agent_id)
      .eq('listing_status', 'active')
      .order('created_at', { ascending: false })
      .limit(20)

    if (listingsError) {
      console.error('Error fetching listings:', listingsError)
      // Don't fail the request, just return empty listings
    }

    // 4. Return combined data
    return NextResponse.json({
      success: true,
      data: {
        agent: {
          id: agent.id,
          agent_id: agent.agent_id,
          agency_id: agent.agency_id,
          name: agent.name,
          email: agent.email,
          phone: agent.phone,
          profile_image: agent.profile_image,
          cover_image: agent.cover_image,
          bio: agent.bio,
          slug: agent.slug,
          account_status: agent.account_status,
          agent_status: agent.agent_status,
          total_listings: agent.total_listings,
          location_id: agent.location_id,
          social_media: agent.social_media,
          created_at: agent.created_at
        },
        agency: agency,
        listings: listings || []
      }
    })

  } catch (error) {
    console.error('Public agent fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

