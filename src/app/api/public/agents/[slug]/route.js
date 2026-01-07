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
    // 1. Fetch Agent details (No Join)
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
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
            .select('*')
            .eq('agency_id', agent.agency_id) // using agency_id based on previous file structure
            .single();
        
        if (agencyError) {
            console.error('[API] Error fetching agency:', agencyError);
            // Don't fail the request if agency fetch fails, just return null agency
        } else {
            agency = agencyData;
        }
    }

    // 3. Fetch Agent's Listings
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', agent.agent_id) // Using agent_id column which links to the listings
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
