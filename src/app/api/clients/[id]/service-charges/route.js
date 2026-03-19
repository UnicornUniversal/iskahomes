import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateRequest } from '@/lib/apiPermissionMiddleware'
import { getDeveloperId } from '@/lib/developerIdHelper'
import { captureAuditEvent } from '@/lib/auditLogger'
import { NOTIFICATION_TYPES } from '@/lib/notifications/constants'
import { scheduleNotificationFromRecord } from '@/lib/notifications/scheduler'
import { startNotificationWorker } from '@/lib/notifications/worker'
import { cancelNotificationJob } from '@/lib/notifications/queue'

async function verifyClientAccess(clientId, developerId) {
  const { data } = await supabaseAdmin
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('developer_id', developerId)
    .single()
  return !!data
}

function normalizeServiceChargeTime(value) {
  if (value === undefined || value === null) return null
  const raw = String(value).trim()
  if (!raw) return null
  const match = raw.match(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/)
  if (!match) return null
  const [, hh, mm, ss] = match
  return `${hh}:${mm}:${ss || '00'}`
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

    const { data, error } = await supabaseAdmin
      .from('client_service_charges')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Service charges fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch service charges' }, { status: 500 })
    }

    const charges = (data || []).map(c => ({
      id: c.id,
      unitId: c.unit_id,
      unitName: null,
      amount: parseFloat(c.amount),
      periodStart: c.period_start?.slice?.(0, 10) || null,
      periodEnd: c.period_end?.slice?.(0, 10) || null,
      nextDueDate: c.next_due_date?.slice?.(0, 10) || null,
      nextDueTime: c.next_due_time?.slice?.(0, 5) || '08:00',
      nextDueStatus: c.next_due_status || 'not_due',
      overdueTime: c.overdue_time ?? 0,
      status: c.status,
      paidAt: c.paid_at?.slice?.(0, 10) || null,
      billingReference: c.billing_reference,
      createdAt: c.created_at
    }))

    const unitIds = [...new Set(charges.map(c => c.unitId).filter(Boolean))]
    if (unitIds.length) {
      const { data: listings } = await supabaseAdmin
        .from('listings')
        .select('id, title')
        .in('id', unitIds)
      const titleMap = (listings || []).reduce((m, l) => { m[l.id] = l.title; return m }, {})
      charges.forEach(c => { c.unitName = titleMap[c.unitId] || '—' })
    }

    captureAuditEvent('service_charge_listed', {
      user_id: userInfo.user_id,
      user_type: userInfo.user_type || userInfo.organization_type || 'developer',
      timestamp: new Date().toISOString(),
      success: true,
      api_route: '/api/clients/[id]/service-charges',
      metadata: { client_id: clientId, result_count: charges.length }
    }, userInfo.user_id)

    return NextResponse.json({ success: true, data: charges })
  } catch (err) {
    console.error('Service charges get error:', err)
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
    console.log('[POST service-charges] body:', JSON.stringify(body))
    const { unitId, amount, periodStart, periodEnd, nextDueTime, status: chargeStatus, paidAt, billingReference } = body

    if (amount == null) {
      return NextResponse.json({ error: 'amount is required' }, { status: 400 })
    }
    if (!unitId) {
      return NextResponse.json({ error: 'unit is required' }, { status: 400 })
    }

    const nextDueDate = periodEnd ? (() => {
      const d = new Date(periodEnd + 'T00:00:00')
      d.setDate(d.getDate() + 1)
      return d.toISOString().slice(0, 10)
    })() : null

    // Get previous cycle for same client + unit.
    const { data: previousEntry } = await supabaseAdmin
      .from('client_service_charges')
      .select('id, next_due_date')
      .eq('client_id', clientId)
      .eq('unit_id', unitId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const normalizedNextDueTime = normalizeServiceChargeTime(nextDueTime) || '08:00:00'

    const nextDueStatus = 'not_due'
    const shouldScheduleNotification = !!nextDueDate && String(nextDueStatus).toLowerCase() !== 'paid'

    const insert = {
      client_id: clientId,
      unit_id: unitId,
      amount: parseFloat(amount),
      period_start: periodStart || null,
      period_end: periodEnd || null,
      next_due_date: nextDueDate,
      next_due_time: normalizedNextDueTime,
      status: chargeStatus || 'Pending',
      paid_at: paidAt || null,
      billing_reference: billingReference || null,
      next_due_status: nextDueStatus,
      overdue_time: 0,
      created_by_user_id: userInfo.user_id,
      created_by_user_type: userInfo.user_type || userInfo.organization_type || 'developer',
      notification_status: shouldScheduleNotification ? 'pending' : 'cancelled'
    }

    const { data, error } = await supabaseAdmin
      .from('client_service_charges')
      .insert(insert)
      .select()
      .single()

    if (error) {
      console.error('Service charge create error:', error)
      return NextResponse.json({ error: 'Failed to create service charge' }, { status: 500 })
    }

    if (previousEntry?.id && previousEntry.id !== data.id) {
      const effectiveDate = paidAt || periodStart || new Date().toISOString().slice(0, 10)
      let overdueDays = 0

      if (previousEntry.next_due_date) {
        const due = new Date(`${previousEntry.next_due_date}T00:00:00`)
        const paid = new Date(`${effectiveDate}T00:00:00`)
        const diffMs = paid.getTime() - due.getTime()
        overdueDays = diffMs > 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 0
      }

      await supabaseAdmin
        .from('client_service_charges')
        .update({
          next_due_status: 'paid',
          overdue_time: overdueDays
        })
        .eq('id', previousEntry.id)

      try {
        await cancelNotificationJob(NOTIFICATION_TYPES.SERVICE_CHARGE, previousEntry.id)
      } catch (cancelError) {
        console.error('Failed to cancel previous service charge notification job:', cancelError)
      }
    }

    const out = {
      id: data.id,
      unitId: data.unit_id,
      unitName: '—',
      amount: parseFloat(data.amount),
      periodStart: data.period_start?.slice?.(0, 10) || null,
      periodEnd: data.period_end?.slice?.(0, 10) || null,
      nextDueDate: data.next_due_date?.slice?.(0, 10) || null,
      nextDueTime: data.next_due_time?.slice?.(0, 5) || '08:00',
      nextDueStatus: data.next_due_status || 'not_due',
      overdueTime: data.overdue_time ?? 0,
      status: data.status,
      paidAt: data.paid_at?.slice?.(0, 10) || null,
      billingReference: data.billing_reference,
      createdAt: data.created_at
    }
    if (data.unit_id) {
      const { data: l } = await supabaseAdmin.from('listings').select('title').eq('id', data.unit_id).single()
      out.unitName = l?.title || '—'
    }

    captureAuditEvent('service_charge_created', {
      user_id: userInfo.user_id,
      user_type: userInfo.user_type || userInfo.organization_type || 'developer',
      timestamp: new Date().toISOString(),
      success: true,
      api_route: '/api/clients/[id]/service-charges',
      metadata: { client_id: clientId, service_charge_id: data?.id, unit_id: data?.unit_id || null }
    }, userInfo.user_id)

    if (shouldScheduleNotification) {
      try {
        startNotificationWorker()
        await scheduleNotificationFromRecord({
          notificationType: NOTIFICATION_TYPES.SERVICE_CHARGE,
          recordId: data.id,
          userId: userInfo.user_id,
          userType: userInfo.user_type || userInfo.organization_type || 'developer'
        })
      } catch (scheduleError) {
        console.error('Failed to schedule service charge notification:', scheduleError)
      }
    }

    return NextResponse.json({ success: true, data: out })
  } catch (err) {
    console.error('Service charge create error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
