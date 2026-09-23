import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  addDays,
  addInterval,
  buildChargeableEvent,
  listingCover,
  listingLocation,
  mapChargeableEntry,
  normalizeServiceChargeTime,
  parseChargeablesList,
  resolveAmountAndInterval
} from '@/lib/chargeables'
import { NOTIFICATION_TYPES } from '@/lib/notifications/constants'
import { scheduleNotificationFromRecord } from '@/lib/notifications/scheduler'
import { startNotificationWorker } from '@/lib/notifications/worker'
import { cancelNotificationJob, ensureNotificationQueueReady } from '@/lib/notifications/queue'
import { markChargeablePaid } from '@/lib/notifications/records'
import { requireChargeableOwner } from '../_auth'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function applyEntryFilters(query, { typeId, unitId, clientId, status, fromDate, toDate, filter }) {
  if (typeId) query = query.eq('chargeable_type', typeId)
  if (unitId) query = query.eq('unit_id', unitId)
  if (clientId) query = query.eq('client_id', clientId)
  if (status) query = query.ilike('status', status)
  if (fromDate) query = query.gte('next_due_date', fromDate)
  if (toDate) query = query.lte('next_due_date', toDate)
  if (filter === 'overdue') {
    query = query
      .not('next_due_status', 'eq', 'paid')
      .lt('next_due_date', todayStr())
  }
  return query
}

function computeEntryStats(rows) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1)
  const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0)
  let totalDueThisMonth = 0
  let totalDueNextMonth = 0
  let totalOverdue = 0
  ;(rows || []).forEach((row) => {
    if (String(row.next_due_status || '').toLowerCase() === 'paid') return
    if (!row.next_due_date) return
    const dueDate = new Date(`${String(row.next_due_date).slice(0, 10)}T00:00:00`)
    if (Number.isNaN(dueDate.getTime())) return
    const amount = parseFloat(row.amount) || 0
    if (dueDate < today) totalOverdue += amount
    else if (dueDate >= thisMonthStart && dueDate <= thisMonthEnd) totalDueThisMonth += amount
    else if (dueDate >= nextMonthStart && dueDate <= nextMonthEnd) totalDueNextMonth += amount
  })
  return { totalDueThisMonth, totalDueNextMonth, totalOverdue }
}

async function enrichEntries(rows) {
  const typeIds = [...new Set(rows.map((r) => r.chargeable_type).filter(Boolean))]
  const unitIds = [...new Set(rows.map((r) => r.unit_id).filter(Boolean))]
  const clientIds = [...new Set(rows.map((r) => r.client_id).filter(Boolean))]

  const [typesRes, listingsRes, clientsRes] = await Promise.all([
    typeIds.length
      ? supabaseAdmin.from('chargeable_types').select('id, name').in('id', typeIds)
      : Promise.resolve({ data: [] }),
    unitIds.length
      ? supabaseAdmin.from('listings').select('id, title, media, town, city, state, full_address, currency').in('id', unitIds)
      : Promise.resolve({ data: [] }),
    clientIds.length
      ? supabaseAdmin.from('clients').select('id, name').in('id', clientIds)
      : Promise.resolve({ data: [] })
  ])

  const typeMap = Object.fromEntries((typesRes.data || []).map((t) => [t.id, t.name]))
  const listingMap = Object.fromEntries((listingsRes.data || []).map((l) => [l.id, l]))
  const clientMap = Object.fromEntries((clientsRes.data || []).map((c) => [c.id, c.name]))

  return rows.map((row) => {
    const listing = listingMap[row.unit_id]
    return mapChargeableEntry(row, {
      typeName: typeMap[row.chargeable_type] || 'Chargeable',
      unitName: listing?.title || '—',
      unitCover: listingCover(listing),
      unitLocation: listingLocation(listing),
      clientName: row.client_id ? clientMap[row.client_id] || '—' : 'Unassigned'
    })
  })
}

export async function GET(request) {
  try {
    const auth = await requireChargeableOwner(request)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { searchParams } = new URL(request.url)
    const typeId = searchParams.get('typeId')
    const unitId = searchParams.get('unitId')
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')
    const filter = searchParams.get('filter')
    const exportAll = searchParams.get('export') === '1'
    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const limit = exportAll ? 500 : Math.min(50, Math.max(1, Number(searchParams.get('limit') || 10)))
    const from = (page - 1) * limit

    let query = supabaseAdmin
      .from('chargeable_entries')
      .select('*', { count: 'exact' })
      .eq('user_id', auth.owner.userId)
      .eq('user_type', auth.owner.userType)
      .order('next_due_date', { ascending: true, nullsFirst: false })

    if (!exportAll) {
      query = query.range(from, from + limit - 1)
    }

    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const filters = { typeId, unitId, clientId, status, fromDate, toDate, filter }
    query = applyEntryFilters(query, filters)

    const statsQuery = applyEntryFilters(
      supabaseAdmin
        .from('chargeable_entries')
        .select('amount, next_due_date, next_due_status')
        .eq('user_id', auth.owner.userId)
        .eq('user_type', auth.owner.userType),
      filters
    )

    const [{ data, error, count }, statsRes] = await Promise.all([
      query,
      statsQuery
    ])
    if (error) {
      console.error('chargeable entries list error:', error)
      return NextResponse.json({ error: 'Failed to load entries' }, { status: 500 })
    }

    const entries = await enrichEntries(data || [])

    let clients = []
    if (auth.owner.userType === 'developer') {
      const { data: clientRows } = await supabaseAdmin
        .from('clients')
        .select('id, name, clients_properties')
        .eq('developer_id', auth.owner.userId)
        .order('name', { ascending: true })
      clients = clientRows || []
    }

    const { data: types } = await supabaseAdmin
      .from('chargeable_types')
      .select('id, name')
      .eq('user_id', auth.owner.userId)
      .eq('user_type', auth.owner.userType)
      .order('name', { ascending: true })

    return NextResponse.json({
      success: true,
      data: entries,
      types: types || [],
      clients,
      stats: computeEntryStats(statsRes.data || []),
      page,
      limit,
      total: count || 0,
      totalPages: Math.max(1, Math.ceil((count || 0) / limit))
    })
  } catch (err) {
    console.error('chargeable entries GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function findOccupant(owner, unitId) {
  if (owner.userType !== 'developer' || !unitId) return null
  const { data: clients } = await supabaseAdmin
    .from('clients')
    .select('id, clients_properties')
    .eq('developer_id', owner.userId)

  return (clients || []).find((client) => {
    const props = Array.isArray(client.clients_properties) ? client.clients_properties : []
    return props.some((prop) => {
      const id = typeof prop === 'string' ? prop : prop?.id
      return String(id) === String(unitId)
    })
  })?.id || null
}

export async function POST(request) {
  try {
    const auth = await requireChargeableOwner(request)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const body = await request.json()
    const unitId = body.unitId
    const typeId = body.chargeableType
    if (!unitId) return NextResponse.json({ error: 'Unit is required' }, { status: 400 })
    if (!typeId) return NextResponse.json({ error: 'Chargeable type is required' }, { status: 400 })

    const { data: listing } = await supabaseAdmin
      .from('listings')
      .select('id, chargeables')
      .eq('id', unitId)
      .eq('user_id', auth.owner.userId)
      .maybeSingle()

    if (!listing) return NextResponse.json({ error: 'Unit not found' }, { status: 404 })

    const listingItem = parseChargeablesList(listing.chargeables).find((item) => item.id === typeId)
    if (!listingItem) {
      return NextResponse.json({ error: 'This chargeable is not attached to the unit' }, { status: 400 })
    }

    const { data: type } = await supabaseAdmin
      .from('chargeable_types')
      .select('*')
      .eq('id', typeId)
      .eq('user_id', auth.owner.userId)
      .eq('user_type', auth.owner.userType)
      .maybeSingle()

    if (!type) return NextResponse.json({ error: 'Chargeable type not found' }, { status: 404 })

    const resolved = resolveAmountAndInterval(type, listingItem, {
      new_amount: body.newAmount
    })

    const periodStart = body.periodStart || todayStr()
    const periodEnd = body.periodEnd || addInterval(periodStart, resolved.interval_value, resolved.interval_unit)
    const nextDueDate = addDays(periodEnd, 1)
    const nextDueTime = normalizeServiceChargeTime(body.nextDueTime) || '08:00:00'
    const nextDueStatus = 'not_due'
    const shouldSchedule = !!nextDueDate && nextDueStatus !== 'paid'
    const clientId = body.clientId || (await findOccupant(auth.owner, unitId))

    const { data: previousEntry } = await supabaseAdmin
      .from('chargeable_entries')
      .select('*')
      .eq('user_id', auth.owner.userId)
      .eq('user_type', auth.owner.userType)
      .eq('unit_id', unitId)
      .eq('chargeable_type', typeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let entryReference = previousEntry?.id || null
    if (entryReference) {
      const { data: existingChild } = await supabaseAdmin
        .from('chargeable_entries')
        .select('id')
        .eq('entry_reference', entryReference)
        .maybeSingle()
      if (existingChild) entryReference = null
    }

    const createdEvent = buildChargeableEvent('created', {
      status: body.status || 'Pending',
      next_due_status: nextDueStatus,
      paid_at: body.paidAt || null,
      period_start: periodStart,
      period_end: periodEnd,
      next_due_date: nextDueDate,
      next_due_time: nextDueTime,
      amount: resolved.amount,
      overdue_time: 0,
      notification_status: shouldSchedule ? 'pending' : 'cancelled'
    })

    const insert = {
      user_id: auth.owner.userId,
      user_type: auth.owner.userType,
      chargeable_type: typeId,
      unit_id: unitId,
      client_id: clientId || null,
      created_by_user_id: auth.userInfo.user_id,
      created_by_user_type: auth.userInfo.user_type || auth.owner.userType,
      amount: resolved.amount,
      interval_value: resolved.interval_value,
      interval_unit: resolved.interval_unit,
      new_amount: resolved.new_amount,
      new_interval_value: resolved.new_interval_value,
      new_interval_unit: resolved.new_interval_unit,
      period_start: periodStart,
      period_end: periodEnd,
      status: body.status || 'Pending',
      paid_at: body.paidAt || null,
      billing_reference: body.billingReference || null,
      next_due_date: nextDueDate,
      next_due_time: nextDueTime,
      next_due_status: nextDueStatus,
      overdue_time: 0,
      notification_status: shouldSchedule ? 'pending' : 'cancelled',
      sms_notification_status: shouldSchedule ? 'pending' : 'cancelled',
      email_notification_status: shouldSchedule ? 'pending' : 'cancelled',
      event_series: [createdEvent],
      entry_reference: entryReference
    }

    if (shouldSchedule) {
      try {
        await ensureNotificationQueueReady()
      } catch (redisError) {
        console.error('chargeable entry redis unavailable:', redisError)
        return NextResponse.json(
          { error: 'Reminder service is unavailable. The entry was not saved.' },
          { status: 503 }
        )
      }
    }

    const { data, error } = await supabaseAdmin
      .from('chargeable_entries')
      .insert(insert)
      .select()
      .single()

    if (error) {
      console.error('chargeable entry create error:', error)
      return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 })
    }

    if (shouldSchedule) {
      try {
        await scheduleNotificationFromRecord({
          notificationType: NOTIFICATION_TYPES.CHARGEABLE,
          recordId: data.id,
          userId: auth.userInfo.user_id,
          userType: auth.userInfo.user_type || auth.owner.userType
        })
        startNotificationWorker()
      } catch (scheduleError) {
        console.error('Failed to schedule chargeable notification:', scheduleError)
        await supabaseAdmin.from('chargeable_entries').delete().eq('id', data.id)
        return NextResponse.json(
          { error: 'Reminder service is unavailable. The entry was not saved.' },
          { status: 503 }
        )
      }
    }

    if (previousEntry?.id) {
      const effectiveDate = body.paidAt || periodStart || todayStr()
      let overdueDays = 0
      if (previousEntry.next_due_date) {
        const due = new Date(`${previousEntry.next_due_date}T00:00:00`)
        const paid = new Date(`${effectiveDate}T00:00:00`)
        const diff = paid.getTime() - due.getTime()
        overdueDays = diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0
      }

      try {
        await markChargeablePaid(previousEntry, { overdue_time: overdueDays, paid_at: effectiveDate })
      } catch (paidError) {
        console.error('Failed to close previous chargeable cycle:', paidError)
        await supabaseAdmin
          .from('chargeable_entries')
          .update({ next_due_status: 'paid', overdue_time: overdueDays })
          .eq('id', previousEntry.id)
      }

      try {
        await cancelNotificationJob(NOTIFICATION_TYPES.CHARGEABLE, previousEntry.id)
      } catch (cancelError) {
        console.error('Failed to cancel previous chargeable notification:', cancelError)
      }
    }

    const [mapped] = await enrichEntries([data])
    return NextResponse.json({ success: true, data: mapped }, { status: 201 })
  } catch (err) {
    console.error('chargeable entries POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
