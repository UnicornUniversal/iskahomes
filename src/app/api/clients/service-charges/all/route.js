import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateRequest } from '@/lib/apiPermissionMiddleware'
import { getDeveloperId } from '@/lib/developerIdHelper'

function getListingCoverUrl(media) {
  if (!media) return null
  let m = media
  if (typeof m === 'string') {
    try {
      m = JSON.parse(m)
    } catch {
      return null
    }
  }
  if (typeof m !== 'object') return null
  if (Array.isArray(media.albums)) {
    for (const album of media.albums) {
      if (album?.images?.length) {
        const url = album.images[0]?.url
        if (url) return url
      }
    }
  }
  if (Array.isArray(media.mediaFiles) && media.mediaFiles[0]?.url) {
    return media.mediaFiles[0].url
  }
  return null
}

function formatListingLocation(row) {
  if (!row) return '—'
  const full = row.full_address != null ? String(row.full_address).trim() : ''
  if (full) return full
  const parts = [row.town, row.city, row.state, row.country].filter(Boolean)
  return parts.length ? parts.join(', ') : '—'
}

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
    const unitId = searchParams.get('unitId') || ''
    const statusFilter = searchParams.get('status') || ''
    const filter = searchParams.get('filter') || 'all' // all | overdue

    const { data: clients, error: clientsError } = await supabaseAdmin
      .from('clients')
      .select('id, name')
      .eq('developer_id', developerId)

    if (clientsError || !clients?.length) {
      return NextResponse.json({ success: true, data: [], clients: [], properties: [] })
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

    let unitRefQuery = supabaseAdmin
      .from('client_service_charges')
      .select('unit_id')
      .in('client_id', clientIds)
      .not('unit_id', 'is', null)
    if (clientId) unitRefQuery = unitRefQuery.eq('client_id', clientId)
    const { data: unitRefRows } = await unitRefQuery

    const distinctUnitIds = [
      ...new Set((unitRefRows || []).map((r) => r.unit_id).filter(Boolean)),
    ]

    let properties = []
    if (distinctUnitIds.length) {
      const { data: listings } = await supabaseAdmin
        .from('listings')
        .select('id, title')
        .in('id', distinctUnitIds)
      properties = (listings || [])
        .map((l) => ({ id: l.id, name: l.title || 'Property' }))
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    }

    let query = supabaseAdmin
      .from('client_service_charges')
      .select('*')
      .in('client_id', clientIds)

    if (clientId) query = query.eq('client_id', clientId)
    if (unitId) query = query.eq('unit_id', unitId)
    if (statusFilter) query = query.eq('status', statusFilter)
    if (filter === 'overdue') {
      const todayStr = new Date().toISOString().slice(0, 10)
      query = query
        .not('next_due_status', 'eq', 'paid')
        .lt('next_due_date', todayStr)
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
    let listingById = {}
    if (unitIds.length) {
      const { data: listings } = await supabaseAdmin
        .from('listings')
        .select('id, title, media, city, state, country, town, full_address')
        .in('id', unitIds)
      listingById = (listings || []).reduce((m, l) => {
        m[l.id] = l
        return m
      }, {})
    }

    const data = (charges || []).map((c) => {
      const dueDate = parseDate(c.next_due_date || c.period_end)
      const normalizedNextDueStatus = String(c.next_due_status || 'not_due').toLowerCase()
      const isClosed = normalizedNextDueStatus === 'paid'
      const isOverdue = !isClosed && dueDate && dueDate < today
      const isDueSoon = !isClosed && dueDate && dueDate >= today && dueDate <= oneWeekFromNow
      const computedNextDueStatus = isClosed
        ? 'paid'
        : isOverdue
          ? 'overdue'
          : (dueDate && dueDate.getTime() === today.getTime() ? 'due' : 'not_due')

      const listingRow = c.unit_id ? listingById[c.unit_id] : null
      return {
        id: c.id,
        clientId: c.client_id,
        clientName: clientMap[c.client_id] || 'Unknown',
        unitId: c.unit_id,
        unitName: listingRow?.title || '—',
        unitCoverImage: listingRow ? getListingCoverUrl(listingRow.media) : null,
        unitLocation: listingRow ? formatListingLocation(listingRow) : '—',
        amount: parseFloat(c.amount),
        periodStart: c.period_start?.slice?.(0, 10) || null,
        periodEnd: c.period_end?.slice?.(0, 10) || null,
        nextDueDate: c.next_due_date?.slice?.(0, 10) || null,
        nextDueTime: c.next_due_time?.slice?.(0, 5) || '08:00',
        nextDueStatus: computedNextDueStatus,
        overdueTime: c.overdue_time ?? 0,
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

    return NextResponse.json({ success: true, data, clients: clientList, properties })
  } catch (err) {
    console.error('Service charges all API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
