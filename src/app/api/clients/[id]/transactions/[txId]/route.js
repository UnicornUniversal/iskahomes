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
    const txId = resolvedParams?.txId
    if (!clientId || !txId) return NextResponse.json({ error: 'Client ID and transaction ID required' }, { status: 400 })

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
    const update = {}
    if (body.unitId !== undefined) update.unit_id = body.unitId
    if (body.amount !== undefined) update.amount = parseFloat(body.amount)
    if (body.transactionDate !== undefined) update.transaction_date = body.transactionDate
    if (body.transactionType !== undefined) update.transaction_type = body.transactionType
    if (body.paymentMethod !== undefined) update.payment_method = body.paymentMethod
    if (body.reference !== undefined) update.reference = body.reference
    if (body.status !== undefined) update.status = body.status
    if (body.attachments !== undefined) update.attachments = Array.isArray(body.attachments) ? body.attachments : []

    const { data, error } = await supabaseAdmin
      .from('client_transactions')
      .update(update)
      .eq('id', txId)
      .eq('client_id', clientId)
      .select()
      .single()

    if (error) {
      console.error('Transaction update error:', error)
      return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
    }

    captureAuditEvent('transaction_updated', {
      user_id: userInfo.user_id,
      user_type: userInfo.user_type || userInfo.organization_type || 'developer',
      timestamp: new Date().toISOString(),
      success: true,
      api_route: '/api/clients/[id]/transactions/[txId]',
      metadata: { client_id: clientId, transaction_id: txId }
    }, userInfo.user_id)

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('Transaction update error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const clientId = resolvedParams?.id
    const txId = resolvedParams?.txId
    if (!clientId || !txId) return NextResponse.json({ error: 'Client ID and transaction ID required' }, { status: 400 })

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
      .from('client_transactions')
      .delete()
      .eq('id', txId)
      .eq('client_id', clientId)

    if (error) {
      console.error('Transaction delete error:', error)
      return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
    }

    captureAuditEvent('transaction_deleted', {
      user_id: userInfo.user_id,
      user_type: userInfo.user_type || userInfo.organization_type || 'developer',
      timestamp: new Date().toISOString(),
      success: true,
      api_route: '/api/clients/[id]/transactions/[txId]',
      metadata: { client_id: clientId, transaction_id: txId }
    }, userInfo.user_id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Transaction delete error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
