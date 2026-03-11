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
    const clientId = searchParams.get('clientId') || ''
    const statusFilter = searchParams.get('status') || ''
    const filter = searchParams.get('filter') || 'all' // all | overdue

    const { data: clients, error: clientsError } = await supabaseAdmin
      .from('clients')
      .select('id, name')
      .eq('developer_id', developerId)

    if (clientsError || !clients?.length) {
      return NextResponse.json({ success: true, data: [], clients: [] })
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

    let query = supabaseAdmin
      .from('client_service_charges')
      .select('*')
      .in('client_id', clientIds)

    if (clientId) query = query.eq('client_id', clientId)
    if (statusFilter) query = query.eq('status', statusFilter)
    if (filter === 'overdue') {
      const todayStr = new Date().toISOString().slice(0, 10)
      query = query.lt('next_due_date', todayStr)
    }

    const { data: charges, error } = await query
      .order('next_due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Service charges all fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch service charges' }, { status: 500 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const oneWeekFromNow = new Date(today)
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7)

    const parseDate = (d) => {
      if (!d) return null
      const parsed = new Date(d)
      parsed.setHours(0, 0, 0, 0)
      return parsed
    }

    const unitIds = [...new Set((charges || []).map((c) => c.unit_id).filter(Boolean))]
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

    const data = (charges || []).map((c) => {
      const dueDate = parseDate(c.next_due_date || c.period_end)
      const isOverdue = dueDate && dueDate < today
      const isDueSoon = dueDate && dueDate >= today && dueDate <= oneWeekFromNow

      return {
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
        isOverdue,
        isDueSoon,
        createdAt: c.created_at
      }
    })

    const clientList = clients
      .filter((c) => clientIds.includes(c.id))
      .map((c) => ({ id: c.id, name: c.name }))

    return NextResponse.json({ success: true, data, clients: clientList })
  } catch (err) {
    console.error('Service charges all API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
