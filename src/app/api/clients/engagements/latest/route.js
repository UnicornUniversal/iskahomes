import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateRequest } from '@/lib/apiPermissionMiddleware'
import { getDeveloperId } from '@/lib/developerIdHelper'

export async function GET(request) {
  try {
    const { userInfo, error: authError, status } = await authenticateRequest(request)
    if (authError) return NextResponse.json({ error: authError }, { status })
    if (userInfo.organization_type !== 'developer') {
      return NextResponse.json({ error: 'Invalid organization type' }, { status: 403 })
    }

    const developerId = await getDeveloperId(userInfo)
    if (!developerId) return NextResponse.json({ error: 'Developer not found' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50)

    // Get all client IDs for this developer (filter to assigned only for non-super-admin)
    const { data: clients, error: clientsError } = await supabaseAdmin
      .from('clients')
      .select('id, name')
      .eq('developer_id', developerId)

    if (clientsError || !clients?.length) {
      return NextResponse.json({ success: true, data: [] })
    }

    let clientIds = clients.map((c) => c.id)
    let isFullAccess = userInfo.permissions === null
    if (!isFullAccess && userInfo.role_id) {
      const { data: role } = await supabaseAdmin
        .from('organization_roles')
        .select('name')
        .eq('id', userInfo.role_id)
        .single()
      const roleName = (role?.name || '').trim()
      isFullAccess = /^super\s*admin$/i.test(roleName) || /^admin$/i.test(roleName)
    }
    if (!isFullAccess && clientIds.length > 0) {
      const { data: assignments } = await supabaseAdmin
        .from('client_user_assignments')
        .select('client_id')
        .eq('user_id', userInfo.user_id)
        .in('client_id', clientIds)
      const assignedIds = new Set((assignments || []).map((a) => a.client_id))
      clientIds = clientIds.filter((id) => assignedIds.has(id))
    }
    const clientMap = clients.reduce((m, c) => {
      m[c.id] = c.name
      return m
    }, {})

    // Get engagements that are reminders only
    const { data: engagements, error } = await supabaseAdmin
      .from('client_engagement_log')
      .select('*')
      .in('client_id', clientIds)
      .eq('is_reminder', true)
      .order('date_time', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Latest engagements fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch engagements' }, { status: 500 })
    }

    const data = (engagements || []).map((e) => ({
      id: e.id,
      clientId: e.client_id,
      clientName: clientMap[e.client_id] || 'Unknown',
      heading: e.heading,
      note: e.note,
      dateTime: e.date_time,
      isReminder: e.is_reminder,
      status: e.status,
      createdAt: e.created_at
    }))

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('Latest engagements API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
