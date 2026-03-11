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

function toCamel(e) {
  if (!e) return null
  return {
    id: e.id,
    heading: e.heading,
    note: e.note,
    dateTime: e.date_time,
    isReminder: e.is_reminder,
    status: e.status,
    createdBy: e.created_by,
    createdAt: e.created_at
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
      .from('client_engagement_log')
      .select('*')
      .eq('client_id', clientId)
      .order('date_time', { ascending: false })

    if (error) {
      console.error('Engagement fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch engagement' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: (data || []).map(toCamel) })
  } catch (err) {
    console.error('Engagement get error:', err)
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
    const { heading, note, dateTime, isReminder, status: engStatus } = body

    if (!heading?.trim() || !dateTime) {
      return NextResponse.json({ error: 'heading and dateTime are required' }, { status: 400 })
    }

    const insert = {
      client_id: clientId,
      heading: heading.trim(),
      note: note || null,
      date_time: dateTime,
      is_reminder: !!isReminder,
      status: engStatus || null,
      created_by: userInfo.user_id
    }

    const { data, error } = await supabaseAdmin
      .from('client_engagement_log')
      .insert(insert)
      .select()
      .single()

    if (error) {
      console.error('Engagement create error:', error)
      return NextResponse.json({ error: 'Failed to create engagement' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: toCamel(data) })
  } catch (err) {
    console.error('Engagement create error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
