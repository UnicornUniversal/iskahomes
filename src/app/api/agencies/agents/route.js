import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'
import { captureAuditEvent } from '@/lib/auditLogger'

// GET - Fetch all agents for an agency
export async function GET(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get agency_id: owner has agency_id; team members have organization_id (= agencies.id)
    let agencyId = decoded.agency_id || decoded.user_id
    if (!agencyId && decoded.user_type === 'team_member' && decoded.organization_type === 'agency' && decoded.organization_id) {
      const { data: agency } = await supabaseAdmin
        .from('agencies')
        .select('agency_id')
        .eq('id', decoded.organization_id)
        .single()
      agencyId = agency?.agency_id
    }
    if (!agencyId) {
      return NextResponse.json({ error: 'Invalid token or user type' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'all', 'active', 'inactive', 'pending'
    const search = searchParams.get('search') || ''

    // Build query
    let query = supabaseAdmin
      .from('agents')
      .select('*')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false })

    // Apply status filter
    if (status && status !== 'all') {
      if (status === 'pending') {
        query = query.eq('invitation_status', 'pending').or('invitation_status.eq.sent')
      } else {
        query = query.eq('agent_status', status)
      }
    }

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: agents, error } = await query

    if (error) {
      console.error('Error fetching agents:', error)
      return NextResponse.json(
        { error: 'Failed to fetch agents', details: error.message },
        { status: 500 }
      )
    }

    // Format agents data for frontend
    const formattedAgents = (agents || []).map(agent => ({
      id: agent.id,
      agent_id: agent.agent_id,
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      status: agent.agent_status || agent.account_status,
      invitation_status: agent.invitation_status,
      properties: agent.total_listings || 0,
      deals: agent.properties_sold || 0,
      revenue: agent.total_revenue || 0,
      leads: agent.total_leads || 0,
      joinDate: agent.invitation_accepted_at || agent.created_at,
      avatar: agent.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2),
      location_id: agent.location_id,
      profile_image: agent.profile_image,
      slug: agent.slug
    }))

    const auditId = decoded.agency_id || decoded.user_id
    captureAuditEvent('agency_agents_listed', {
      user_id: auditId,
      user_type: decoded.user_type || 'agency',
      timestamp: new Date().toISOString(),
      success: true,
      api_route: '/api/agencies/agents',
      metadata: {
        result_count: formattedAgents.length,
        status: status || 'all',
        search
      }
    }, auditId)

    return NextResponse.json({
      success: true,
      data: formattedAgents
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

