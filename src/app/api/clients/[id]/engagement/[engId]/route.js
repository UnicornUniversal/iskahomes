import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateRequest } from '@/lib/apiPermissionMiddleware'
import { getDeveloperId } from '@/lib/developerIdHelper'

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
    const engId = resolvedParams?.engId
    if (!clientId || !engId) return NextResponse.json({ error: 'Client ID and engagement ID required' }, { status: 400 })

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
    if (body.heading !== undefined) update.heading = body.heading
    if (body.note !== undefined) update.note = body.note
    if (body.dateTime !== undefined) update.date_time = body.dateTime
    if (body.isReminder !== undefined) update.is_reminder = body.isReminder
    if (body.status !== undefined) update.status = body.status

    const { data, error } = await supabaseAdmin
      .from('client_engagement_log')
      .update(update)
      .eq('id', engId)
      .eq('client_id', clientId)
      .select()
      .single()

    if (error) {
      console.error('Engagement update error:', error)
      return NextResponse.json({ error: 'Failed to update engagement' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('Engagement update error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const clientId = resolvedParams?.id
    const engId = resolvedParams?.engId
    if (!clientId || !engId) return NextResponse.json({ error: 'Client ID and engagement ID required' }, { status: 400 })

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
      .from('client_engagement_log')
      .delete()
      .eq('id', engId)
      .eq('client_id', clientId)

    if (error) {
      console.error('Engagement delete error:', error)
      return NextResponse.json({ error: 'Failed to delete engagement' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Engagement delete error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
