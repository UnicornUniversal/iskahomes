import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateRequest } from '@/lib/apiPermissionMiddleware'
import { getDeveloperId } from '@/lib/developerIdHelper'
import { captureAuditEvent } from '@/lib/auditLogger'

async function verifyClientAccess(clientId, developerId) {
  const { data } = await supabaseAdmin
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('developer_id', developerId)
    .single()
  return !!data
}

async function getDeveloperOrgId(developerId) {
  const { data } = await supabaseAdmin
    .from('developers')
    .select('id')
    .eq('developer_id', developerId)
    .single()
  return data?.id || null
}

export async function GET(request, { params }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const clientId = resolvedParams?.id
    if (!clientId) return NextResponse.json({ error: 'Client ID required' }, { status: 400 })

    const { userInfo, error: authError, status } = await authenticateRequest(request)
    if (authError) return NextResponse.json({ error: authError }, { status })
    if (userInfo.organization_type !== 'developer') {
      return NextResponse.json({ error: 'Invalid organization type' }, { status: 403 })
    }

    const developerId = await getDeveloperId(userInfo)
    if (!developerId) return NextResponse.json({ error: 'Developer not found' }, { status: 404 })
    if (!(await verifyClientAccess(clientId, developerId))) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const { data: assignments } = await supabaseAdmin
      .from('client_user_assignments')
      .select('*')
      .eq('client_id', clientId)

    const orgId = await getDeveloperOrgId(developerId)
    let result = (assignments || []).map(a => ({ userId: a.user_id, role: a.role, permissions: a.permissions || {} }))
    if (orgId && result.length) {
      const { data: teamMembers } = await supabaseAdmin
        .from('organization_team_members')
        .select('user_id, first_name, last_name')
        .eq('organization_type', 'developer')
        .eq('organization_id', orgId)
        .in('user_id', result.map(r => r.userId))
      const nameMap = {}
      ;(teamMembers || []).forEach(t => {
        nameMap[t.user_id] = [t.first_name, t.last_name].filter(Boolean).join(' ').trim() || 'Unknown'
      })
      result = result.map(r => ({ ...r, name: nameMap[r.userId] || 'Unknown' }))
    }

    captureAuditEvent('client_assignment_listed', {
      user_id: userInfo.user_id,
      user_type: userInfo.user_type || userInfo.organization_type || 'developer',
      timestamp: new Date().toISOString(),
      success: true,
      api_route: '/api/clients/[id]/assignments',
      metadata: { client_id: clientId, result_count: result.length }
    }, userInfo.user_id)

    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    console.error('Assignments get error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const clientId = resolvedParams?.id
    if (!clientId) return NextResponse.json({ error: 'Client ID required' }, { status: 400 })

    const { userInfo, error: authError, status } = await authenticateRequest(request)
    if (authError) return NextResponse.json({ error: authError }, { status })
    if (userInfo.organization_type !== 'developer') {
      return NextResponse.json({ error: 'Invalid organization type' }, { status: 403 })
    }

    const developerId = await getDeveloperId(userInfo)
    if (!developerId) return NextResponse.json({ error: 'Developer not found' }, { status: 404 })
    if (!(await verifyClientAccess(clientId, developerId))) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const body = await request.json()
    const { userId, role, permissions } = body
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('client_user_assignments')
      .upsert(
        {
          client_id: clientId,
          user_id: userId,
          role: role || null,
          permissions: permissions || {}
        },
        { onConflict: 'client_id,user_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('Assignment create error:', error)
      return NextResponse.json({ error: 'Failed to add assignment' }, { status: 500 })
    }

    captureAuditEvent('client_assignment_created', {
      user_id: userInfo.user_id,
      user_type: userInfo.user_type || userInfo.organization_type || 'developer',
      timestamp: new Date().toISOString(),
      success: true,
      api_route: '/api/clients/[id]/assignments',
      metadata: { client_id: clientId, assigned_user_id: userId }
    }, userInfo.user_id)

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('Assignment create error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const clientId = resolvedParams?.id
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!clientId || !userId) return NextResponse.json({ error: 'Client ID and userId required' }, { status: 400 })

    const { userInfo, error: authError, status } = await authenticateRequest(request)
    if (authError) return NextResponse.json({ error: authError }, { status })
    if (userInfo.organization_type !== 'developer') {
      return NextResponse.json({ error: 'Invalid organization type' }, { status: 403 })
    }

    const developerId = await getDeveloperId(userInfo)
    if (!developerId) return NextResponse.json({ error: 'Developer not found' }, { status: 404 })
    if (!(await verifyClientAccess(clientId, developerId))) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const { error } = await supabaseAdmin
      .from('client_user_assignments')
      .delete()
      .eq('client_id', clientId)
      .eq('user_id', userId)

    if (error) {
      console.error('Assignment delete error:', error)
      return NextResponse.json({ error: 'Failed to remove assignment' }, { status: 500 })
    }

    captureAuditEvent('client_assignment_removed', {
      user_id: userInfo.user_id,
      user_type: userInfo.user_type || userInfo.organization_type || 'developer',
      timestamp: new Date().toISOString(),
      success: true,
      api_route: '/api/clients/[id]/assignments',
      metadata: { client_id: clientId, removed_user_id: userId }
    }, userInfo.user_id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Assignment delete error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
