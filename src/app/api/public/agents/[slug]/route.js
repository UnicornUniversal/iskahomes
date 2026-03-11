import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request, { params }) {
  const { slug } = await params
  
  if (!slug) {
    return NextResponse.json(
      { error: 'Agent slug is required' },
      { status: 400 }
    )
  }

  console.log(`[API] Fetching agent with slug: ${slug}`);

  try {
    // 1. Fetch Agent details - display fields only, no analytics
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select(`
        id,
        agent_id,
        agency_id,
        name,
        email,
        phone,
        secondary_email,
        secondary_phone,
        profile_image,
        bio,
        slug,
        website,
        address,
        city,
        region,
        state,
        country,
        social_media,
        account_status,
        agent_status,
        total_listings,
        created_at
      `)
      .eq('slug', slug)
      .eq('account_status', 'active')
      .eq('agent_status', 'active')
      .single()

    if (agentError) {
      console.error('[API] Error fetching agent:', agentError)
      return NextResponse.json(
        { error: 'Agent not found', details: agentError.message },
        { status: 404 }
      )
    }
    
    if (!agent) {
        console.warn('[API] No agent found');
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    console.log('[API] Agent found:', agent.id);

    // 2. Fetch Agency details if associated
    let agency = null;
    if (agent.agency_id) {
        console.log(`[API] Fetching agency: ${agent.agency_id}`);
        const { data: agencyData, error: agencyError } = await supabase
            .from('agencies')
            .select(`
              agency_id,
              name,
              slug,
              profile_image,
              email,
              phone,
              website,
              address,
              city,
              country,
              social_media,
              description,
              total_listings,
              total_agents
            `)
            .eq('agency_id', agent.agency_id)
            .single();
        
        if (agencyError) {
            console.error('[API] Error fetching agency:', agencyError);
            // Don't fail the request if agency fetch fails, just return null agency
        } else {
            agency = agencyData;
        }
    }

    // 3. Fetch Agent's Listings - display fields only, no analytics
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select(`
        id,
        slug,
        listing_type,
        title,
        description,
        price,
        currency,
        price_type,
        duration,
        media,
        specifications,
        types,
        city,
        state,
        country,
        purposes,
        status,
        is_featured,
        is_verified,
        is_premium,
        available_from,
        created_at
      `)
      .eq('user_id', agent.agent_id)
      .eq('listing_status', 'active')
      .eq('listing_condition', 'completed')
      .order('created_at', { ascending: false })
      .limit(20)

    if (listingsError) {
      console.error('[API] Error fetching listings:', listingsError)
    }

    // 4. Return combined data
    return NextResponse.json({
      success: true,
      data: {
        agent,
        agency,
        listings: listings || []
      }
    })

  } catch (error) {
    console.error('[API] Internal server error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
