import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 12
    const search = searchParams.get('search') || ''
    const agencyId = searchParams.get('agency_id') || ''

    // Calculate offset
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
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
        created_at
      `)
      .eq('account_status', 'active')
      .eq('agent_status', 'active')
      .order('created_at', { ascending: false })

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,bio.ilike.%${search}%`)
    }

    // Filter by agency if provided
    if (agencyId) {
      query = query.eq('agency_id', agencyId)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: agents, error } = await query

    if (error) {
      console.error('Error fetching agents:', error)
      return NextResponse.json(
        { error: 'Failed to fetch agents', details: error.message },
        { status: 500 }
      )
    }

    // Get agency info for each agent
    const agentsWithAgency = await Promise.all(
      (agents || []).map(async (agent) => {
        if (agent.agency_id) {
          const { data: agency } = await supabase
            .from('agencies')
            .select('name, slug, profile_image')
            .eq('agency_id', agent.agency_id)
            .single()
          
          return {
            ...agent,
            agency: agency || null
          }
        }
        return { ...agent, agency: null }
      })
    )

    // Get total count
    let countQuery = supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('account_status', 'active')
      .eq('agent_status', 'active')

    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%,bio.ilike.%${search}%`)
    }

    if (agencyId) {
      countQuery = countQuery.eq('agency_id', agencyId)
    }

    const { count } = await countQuery

    return NextResponse.json({
      success: true,
      data: agentsWithAgency || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
        hasMore: offset + limit < (count || 0)
      }
    })

  } catch (error) {
    console.error('Public agents fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

