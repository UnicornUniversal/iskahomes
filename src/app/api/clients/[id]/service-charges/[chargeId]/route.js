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
    const chargeId = resolvedParams?.chargeId
    if (!clientId || !chargeId) return NextResponse.json({ error: 'Client ID and charge ID required' }, { status: 400 })

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
    console.log('[PUT service-charges] body:', JSON.stringify(body))
    const { unitId, amount, periodStart, periodEnd, status: chargeStatus, paidAt, billingReference } = body

    const update = {}
    if (unitId !== undefined) update.unit_id = unitId
    if (amount !== undefined) update.amount = parseFloat(amount)
    if (periodStart !== undefined) update.period_start = periodStart || null
    if (periodEnd !== undefined) {
      update.period_end = periodEnd || null
      update.next_due_date = periodEnd ? (() => {
        const d = new Date(periodEnd + 'T00:00:00')
        d.setDate(d.getDate() + 1)
        return d.toISOString().slice(0, 10)
      })() : null
    }
    if (chargeStatus !== undefined) update.status = chargeStatus
    if (paidAt !== undefined) update.paid_at = paidAt || null
    if (billingReference !== undefined) update.billing_reference = billingReference || null

    const { data, error } = await supabaseAdmin
      .from('client_service_charges')
      .update(update)
      .eq('id', chargeId)
      .eq('client_id', clientId)
      .select()
      .single()

    if (error) {
      console.error('Service charge update error:', error)
      return NextResponse.json({ error: 'Failed to update service charge' }, { status: 500 })
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
      billingReference: data.billing_reference
    }
    if (data.unit_id) {
      const { data: l } = await supabaseAdmin.from('listings').select('title').eq('id', data.unit_id).single()
      out.unitName = l?.title || '—'
    }

    captureAuditEvent('service_charge_updated', {
      user_id: userInfo.user_id,
      user_type: userInfo.user_type || userInfo.organization_type || 'developer',
      timestamp: new Date().toISOString(),
      success: true,
      api_route: '/api/clients/[id]/service-charges/[chargeId]',
      metadata: { client_id: clientId, service_charge_id: chargeId, status: data?.status || null }
    }, userInfo.user_id)

    return NextResponse.json({ success: true, data: out })
  } catch (err) {
    console.error('Service charge update error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const clientId = resolvedParams?.id
    const chargeId = resolvedParams?.chargeId
    if (!clientId || !chargeId) return NextResponse.json({ error: 'Client ID and charge ID required' }, { status: 400 })

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
      .from('client_service_charges')
      .delete()
      .eq('id', chargeId)
      .eq('client_id', clientId)

    if (error) {
      console.error('Service charge delete error:', error)
      return NextResponse.json({ error: 'Failed to delete service charge' }, { status: 500 })
    }

    captureAuditEvent('service_charge_deleted', {
      user_id: userInfo.user_id,
      user_type: userInfo.user_type || userInfo.organization_type || 'developer',
      timestamp: new Date().toISOString(),
      success: true,
      api_route: '/api/clients/[id]/service-charges/[chargeId]',
      metadata: { client_id: clientId, service_charge_id: chargeId }
    }, userInfo.user_id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Service charge delete error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
