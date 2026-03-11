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

    const todayStr = new Date().toISOString().slice(0, 10)

    // Fetch only where next_due_date < today (overdue) - status not used
    const { data: charges, error } = await supabaseAdmin
      .from('client_service_charges')
      .select('*')
      .in('client_id', clientIds)
      .lt('next_due_date', todayStr)
      .order('next_due_date', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Latest service charges fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch service charges' }, { status: 500 })
    }

    const limited = charges || []

    const unitIds = [...new Set(limited.map((c) => c.unit_id).filter(Boolean))]
    let titleMap = {}
    if (unitIds.length) {
      const { data: listings } = await supabaseAdmin
        .from('listings')
        .select('id, title')
        .in('id', unitIds)
      titleMap = (listings || []).reduce((m, l) => {
        m[l.id] = l.title
        return m
      }, {})
    }

    const data = limited.map((c) => ({
      id: c.id,
      clientId: c.client_id,
      clientName: clientMap[c.client_id] || 'Unknown',
      unitId: c.unit_id,
      unitName: titleMap[c.unit_id] || '—',
      amount: parseFloat(c.amount),
      periodStart: c.period_start?.slice?.(0, 10) || null,
      periodEnd: c.period_end?.slice?.(0, 10) || null,
      nextDueDate: c.next_due_date?.slice?.(0, 10) || null,
      status: c.status,
      paidAt: c.paid_at?.slice?.(0, 10) || null,
      billingReference: c.billing_reference,
      isOverdue: true,
      createdAt: c.created_at
    }))

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('Latest service charges API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
