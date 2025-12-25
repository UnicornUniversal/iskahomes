import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

// Helper to check if string is UUID
function isUUID(value) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

// GET - Fetch agent by slug or ID
export async function GET(request, { params }) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!decoded || decoded.user_type !== 'agency') {
      return NextResponse.json({ error: 'Invalid token or user type' }, { status: 401 })
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const { agentSlug } = resolvedParams || {}

    if (!agentSlug) {
      return NextResponse.json(
        { error: 'Agent slug or ID is required' },
        { status: 400 }
      )
    }

    // Determine if agentSlug is a UUID or slug
    const searchField = isUUID(agentSlug) ? 'id' : 'slug'

    // Fetch agent - must belong to the agency
    const { data: agent, error } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq(searchField, agentSlug)
      .eq('agency_id', decoded.user_id) // Ensure agent belongs to this agency
      .single()

    if (error || !agent) {
      console.error('Error fetching agent:', error)
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Fetch agency to get company_locations
    const { data: agency, error: agencyError } = await supabaseAdmin
      .from('agencies')
      .select('company_locations')
      .eq('agency_id', decoded.user_id)
      .single()

    // If agent has location_id, find the location in agency's company_locations
    if (agent.location_id && agency?.company_locations) {
      const location = Array.isArray(agency.company_locations)
        ? agency.company_locations.find(loc => loc.id === agent.location_id)
        : null
      
      if (location) {
        agent.location_data = location
      }
    }

    return NextResponse.json({
      success: true,
      data: agent
    })
  } catch (error) {
    console.error('Error in GET /api/agencies/agents/[agentSlug]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update agent (for decommissioning)
export async function PUT(request, { params }) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!decoded || decoded.user_type !== 'agency') {
      return NextResponse.json({ error: 'Invalid token or user type' }, { status: 401 })
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const { agentSlug } = resolvedParams || {}

    if (!agentSlug) {
      return NextResponse.json(
        { error: 'Agent slug or ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { commission_status, agent_status } = body

    // Determine if agentSlug is a UUID or slug
    const searchField = isUUID(agentSlug) ? 'id' : 'slug'

    // Update agent - must belong to the agency
    const updateData = {
      updated_at: new Date().toISOString()
    }

    if (commission_status !== undefined) {
      updateData.commission_status = commission_status
    }

    if (agent_status !== undefined) {
      updateData.agent_status = agent_status
    }

    const { data: updatedAgent, error: updateError } = await supabaseAdmin
      .from('agents')
      .update(updateData)
      .eq(searchField, agentSlug)
      .eq('agency_id', decoded.user_id) // Ensure agent belongs to this agency
      .select()
      .single()

    if (updateError || !updatedAgent) {
      console.error('Error updating agent:', updateError)
      return NextResponse.json(
        { error: 'Failed to update agent' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Agent updated successfully',
      data: updatedAgent
    })
  } catch (error) {
    console.error('Error in PUT /api/agencies/agents/[agentSlug]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

