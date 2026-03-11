import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateRequest } from '@/lib/apiPermissionMiddleware'
import { getDeveloperId } from '@/lib/developerIdHelper'
import { captureAuditEvent } from '@/lib/auditLogger'

function toCamel(obj) {
  if (!obj) return null
  return {
    id: obj.id,
    name: obj.name,
    clientCode: obj.client_code,
    clientType: obj.client_type,
    status: obj.status,
    sourceChannel: obj.source_channel,
    sourceUserId: obj.source_user_id,
    emails: obj.emails || [],
    phones: obj.phones || [],
    address: obj.address || {},
    firstContactDate: obj.first_contact_date,
    convertedDate: obj.converted_date,
    notes: obj.notes,
    tags: Array.isArray(obj.tags) ? obj.tags : (obj.tags ? [obj.tags] : []),
    clientsProperties: obj.clients_properties || [],
    totalIncomeUsd: parseFloat(obj.total_income_usd || 0),
    developerId: obj.developer_id,
    createdAt: obj.created_at,
    updatedAt: obj.updated_at
  }
}

export async function GET(request) {
  try {
    const { userInfo, error: authError, status: authStatus } = await authenticateRequest(request)
    if (authError) return NextResponse.json({ error: authError }, { status: authStatus ?? 401 })

    if (userInfo.organization_type !== 'developer') {
      return NextResponse.json({ error: 'Invalid organization type' }, { status: 403 })
    }

    const developerId = await getDeveloperId(userInfo)
    if (!developerId) return NextResponse.json({ error: 'Developer not found' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const statusFilter = searchParams.get('status') || ''
    const sourceFilter = searchParams.get('source') || ''

    let query = supabaseAdmin
      .from('clients')
      .select('*')
      .eq('developer_id', developerId)
      .order('created_at', { ascending: false })

    if (statusFilter) query = query.eq('status', statusFilter)
    if (sourceFilter) query = query.eq('source_channel', sourceFilter)
    if (search) query = query.or(`name.ilike.%${search}%,client_code.ilike.%${search}%`)

    const { data: rawData, error } = await query
    if (error) {
      console.error('Clients fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    let data = rawData || []

    // Super Admin or Admin: see all clients. Others: only clients assigned to this user
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
    if (!isFullAccess && data.length > 0) {
      const clientIds = data.map(c => c.id)
      const { data: assignments } = await supabaseAdmin
        .from('client_user_assignments')
        .select('client_id')
        .eq('user_id', userInfo.user_id)
        .in('client_id', clientIds)
      const assignedClientIds = new Set((assignments || []).map(a => a.client_id))
      data = data.filter(c => assignedClientIds.has(c.id))
    }

    if (search) {
      const s = search.toLowerCase()
      data = data.filter(c => {
        const emails = c.emails || []
        const emailMatch = Array.isArray(emails) && emails.some(e => String(e).toLowerCase().includes(s))
        return emailMatch || (c.name && c.name.toLowerCase().includes(s)) || (c.client_code && c.client_code.toLowerCase().includes(s))
      })
    }

    const mappedData = data.map(toCamel)
    captureAuditEvent('client_listed', {
      user_id: userInfo.user_id,
      user_type: userInfo.user_type || userInfo.organization_type || 'developer',
      timestamp: new Date().toISOString(),
      success: true,
      api_route: '/api/clients',
      metadata: {
        result_count: mappedData.length,
        search,
        status: statusFilter,
        source: sourceFilter
      }
    }, userInfo.user_id)

    return NextResponse.json({ success: true, data: mappedData })
  } catch (err) {
    console.error('Clients API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { userInfo, error: authError, status: authStatus } = await authenticateRequest(request)
    if (authError) return NextResponse.json({ error: authError }, { status: authStatus ?? 401 })

    if (userInfo.organization_type !== 'developer') {
      return NextResponse.json({ error: 'Invalid organization type' }, { status: 403 })
    }

    const developerId = await getDeveloperId(userInfo)
    if (!developerId) return NextResponse.json({ error: 'Developer not found' }, { status: 404 })

    const body = await request.json()
    const {
      name,
      clientCode,
      clientType,
      status: clientStatus,
      sourceChannel,
      sourceUserId,
      emails,
      phones,
      address,
      firstContactDate,
      convertedDate,
      notes,
      tags
    } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const tagsArr = Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : [])

    const insert = {
      name: name.trim(),
      client_code: clientCode || null,
      client_type: clientType || null,
      status: clientStatus || null,
      source_channel: sourceChannel || null,
      source_user_id: sourceUserId || null,
      emails: Array.isArray(emails) ? emails.filter(Boolean) : [],
      phones: Array.isArray(phones) ? phones.filter(Boolean) : [],
      address: address && typeof address === 'object' ? address : {},
      first_contact_date: firstContactDate || null,
      converted_date: convertedDate || null,
      notes: notes || null,
      tags: tagsArr,
      clients_properties: [],
      total_income_usd: 0,
      developer_id: developerId
    }

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .insert(insert)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Client code already exists for this developer' }, { status: 400 })
      console.error('Client create error:', error)
      return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
    }

    const payload = toCamel(client)
    captureAuditEvent('client_created', {
      user_id: userInfo.user_id,
      user_type: userInfo.user_type || userInfo.organization_type || 'developer',
      timestamp: new Date().toISOString(),
      success: true,
      api_route: '/api/clients',
      metadata: {
        client_id: client?.id,
        client_code: client?.client_code || null
      }
    }, userInfo.user_id)

    return NextResponse.json({ success: true, data: payload })
  } catch (err) {
    console.error('Client create API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
