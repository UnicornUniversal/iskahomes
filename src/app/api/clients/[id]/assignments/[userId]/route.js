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

export async function PUT(request, { params }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const clientId = resolvedParams?.id
    const userId = resolvedParams?.userId
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

    const body = await request.json()
    const { role, permissions } = body

    const update = {}
    if (role !== undefined) update.role = role
    if (permissions !== undefined) update.permissions = permissions

    const { data, error } = await supabaseAdmin
      .from('client_user_assignments')
      .update(update)
      .eq('client_id', clientId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Assignment update error:', error)
      return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 })
    }

    captureAuditEvent('client_assignment_updated', {
      user_id: userInfo.user_id,
      user_type: userInfo.user_type || userInfo.organization_type || 'developer',
      timestamp: new Date().toISOString(),
      success: true,
      api_route: '/api/clients/[id]/assignments/[userId]',
      metadata: { client_id: clientId, assigned_user_id: userId }
    }, userInfo.user_id)

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('Assignment update error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
