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
    const { unitId, amount, periodStart, periodEnd, status: chargeStatus, paidAt, billingReference } = body

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

    const insert = {
      client_id: clientId,
      unit_id: unitId,
      amount: parseFloat(amount),
      period_start: periodStart || null,
      period_end: periodEnd || null,
      next_due_date: nextDueDate,
      status: chargeStatus || 'Pending',
      paid_at: paidAt || null,
      billing_reference: billingReference || null
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

    const out = {
      id: data.id,
      unitId: data.unit_id,
      unitName: '—',
      amount: parseFloat(data.amount),
      periodStart: data.period_start?.slice?.(0, 10) || null,
      periodEnd: data.period_end?.slice?.(0, 10) || null,
      nextDueDate: data.next_due_date?.slice?.(0, 10) || null,
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

    return NextResponse.json({ success: true, data: out })
  } catch (err) {
    console.error('Service charge create error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
