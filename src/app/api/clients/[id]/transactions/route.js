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

function toCamel(t) {
  if (!t) return null
  return {
    id: t.id,
    clientId: t.client_id,
    unitId: t.unit_id,
    amount: parseFloat(t.amount),
    transactionDate: t.transaction_date,
    transactionType: t.transaction_type,
    paymentMethod: t.payment_method,
    reference: t.reference,
    status: t.status,
    attachments: t.attachments || [],
    createdAt: t.created_at
  }
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
      .from('client_transactions')
      .select('*')
      .eq('client_id', clientId)
      .order('transaction_date', { ascending: false })

    if (error) {
      console.error('Transactions fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    const transactions = (data || []).map(toCamel)
    const unitIds = [...new Set(transactions.map(t => t.unitId).filter(Boolean))]
    if (unitIds.length) {
      const { data: listings } = await supabaseAdmin
        .from('listings')
        .select('id, title')
        .in('id', unitIds)
      const titleMap = (listings || []).reduce((m, l) => { m[l.id] = l.title; return m }, {})
      transactions.forEach(t => { t.unitName = titleMap[t.unitId] || '—' })
    }

    captureAuditEvent('transaction_listed', {
      user_id: userInfo.user_id,
      user_type: userInfo.user_type || userInfo.organization_type || 'developer',
      timestamp: new Date().toISOString(),
      success: true,
      api_route: '/api/clients/[id]/transactions',
      metadata: { client_id: clientId, result_count: transactions.length }
    }, userInfo.user_id)

    return NextResponse.json({ success: true, data: transactions })
  } catch (err) {
    console.error('Transactions get error:', err)
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
    const { unitId, amount, transactionDate, transactionType, paymentMethod, reference, status: txStatus, attachments } = body

    if (amount == null || !transactionDate) {
      return NextResponse.json({ error: 'amount and transactionDate are required' }, { status: 400 })
    }

    const insert = {
      client_id: clientId,
      unit_id: unitId || null,
      amount: parseFloat(amount),
      transaction_date: transactionDate,
      transaction_type: transactionType || null,
      payment_method: paymentMethod || null,
      reference: reference || null,
      status: txStatus || null,
      attachments: Array.isArray(attachments) ? attachments : []
    }

    const { data, error } = await supabaseAdmin
      .from('client_transactions')
      .insert(insert)
      .select()
      .single()

    if (error) {
      console.error('Transaction create error:', error)
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
    }

    const out = toCamel(data)
    if (data.unit_id) {
      const { data: l } = await supabaseAdmin.from('listings').select('title').eq('id', data.unit_id).single()
      out.unitName = l?.title || '—'
    } else out.unitName = '—'

    captureAuditEvent('transaction_created', {
      user_id: userInfo.user_id,
      user_type: userInfo.user_type || userInfo.organization_type || 'developer',
      timestamp: new Date().toISOString(),
      success: true,
      api_route: '/api/clients/[id]/transactions',
      metadata: { client_id: clientId, transaction_id: data?.id, unit_id: data?.unit_id || null }
    }, userInfo.user_id)

    return NextResponse.json({ success: true, data: out })
  } catch (err) {
    console.error('Transaction create error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
