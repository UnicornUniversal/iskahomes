import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateRequest } from '@/lib/apiPermissionMiddleware'
import { getDeveloperId } from '@/lib/developerIdHelper'
import { captureAuditEvent } from '@/lib/auditLogger'

function toCamelClient(obj) {
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

async function getDeveloperOrgId(developerId) {
  const { data } = await supabaseAdmin
    .from('developers')
    .select('id')
    .eq('developer_id', developerId)
    .single()
  return data?.id || null
}

export async function GET(request, { params }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const clientId = resolvedParams?.id
    if (!clientId) return NextResponse.json({ error: 'Client ID required' }, { status: 400 })

    const auth = await authenticateRequest(request)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 })

    const userInfo = auth.userInfo
    if (userInfo.organization_type !== 'developer') {
      return NextResponse.json({ error: 'Invalid organization type' }, { status: 403 })
    }

    const developerId = await getDeveloperId(userInfo)
    if (!developerId) return NextResponse.json({ error: 'Developer not found' }, { status: 404 })

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('developer_id', developerId)
      .single()

    if (error || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Super Admin or Admin: full access. Others: must be assigned to this client to view
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
    if (!isFullAccess) {
      const { data: myAssignment } = await supabaseAdmin
        .from('client_user_assignments')
        .select('id')
        .eq('client_id', clientId)
        .eq('user_id', userInfo.user_id)
        .maybeSingle()
      if (!myAssignment) {
        return NextResponse.json({ error: 'Access denied. You are not assigned to this client.' }, { status: 403 })
      }
    }

    const orgId = await getDeveloperOrgId(developerId)

    const { data: assignments } = await supabaseAdmin
      .from('client_user_assignments')
      .select('*')
      .eq('client_id', clientId)

    const { data: transactions } = await supabaseAdmin
      .from('client_transactions')
      .select('*')
      .eq('client_id', clientId)
      .order('transaction_date', { ascending: false })

    const { data: engagement } = await supabaseAdmin
      .from('client_engagement_log')
      .select('*')
      .eq('client_id', clientId)
      .order('date_time', { ascending: false })

    const { data: documents } = await supabaseAdmin
      .from('client_documents')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    let serviceChargesRaw = []
    const { data: scData, error: scError } = await supabaseAdmin
      .from('client_service_charges')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
    if (scError) {
      console.warn('client_service_charges fetch failed (table may not exist – run create_client_service_charges_table.sql):', scError.message)
    } else {
      serviceChargesRaw = scData || []
    }

    let assignedUsers = []
    if (assignments?.length && orgId) {
      const userIds = [...new Set(assignments.map(a => a.user_id))]
      const { data: teamMembers } = await supabaseAdmin
        .from('organization_team_members')
        .select('user_id, first_name, last_name')
        .eq('organization_type', 'developer')
        .eq('organization_id', orgId)
        .in('user_id', userIds)

      const nameMap = {}
      ;(teamMembers || []).forEach(t => {
        nameMap[t.user_id] = [t.first_name, t.last_name].filter(Boolean).join(' ').trim() || 'Unknown'
      })

      assignedUsers = assignments.map(a => ({
        id: a.user_id,
        name: nameMap[a.user_id] || 'Unknown',
        role: a.role,
        permissions: a.permissions || {}
      }))
    }

    const clientsProperties = client.clients_properties || []
    let units = []
    if (clientsProperties.length) {
      const listingIds = clientsProperties.map(p => (typeof p === 'object' ? p?.id : p)).filter(Boolean)
      if (listingIds.length) {
        const { data: listings } = await supabaseAdmin
          .from('listings')
          .select('id, title, development_id, media, country, state, city, town, full_address, price, currency, price_type, status, estimated_revenue')
          .in('id', listingIds)
        const { data: sales } = await supabaseAdmin
          .from('sales_listings')
          .select('listing_id, sale_date, sale_price, currency')
          .in('listing_id', listingIds)
          .order('sale_date', { ascending: false })
        const saleMap = (sales || []).reduce((m, s) => {
          if (!m[s.listing_id]) m[s.listing_id] = s
          return m
        }, {})
        const { data: devs } = listings?.length
          ? await supabaseAdmin.from('developments').select('id, name').in('id', (listings || []).map(l => l.development_id).filter(Boolean))
          : { data: [] }
        const devMap = (devs || []).reduce((m, d) => { m[d.id] = d.name; return m }, {})
        units = (listings || []).map(l => {
          const sale = saleMap[l.id]
          const rev = l.estimated_revenue || {}
          const amount = sale?.sale_price ?? rev?.estimated_revenue ?? rev?.price ?? l.price ?? 0
          const curr = sale?.currency ?? rev?.currency ?? l.currency ?? 'GHS'
          return {
            id: l.id,
            title: l.title,
            development: devMap[l.development_id] || null,
            media: l.media,
            city: l.city || '',
            state: l.state || '',
            town: l.town || '',
            country: l.country || '',
            full_address: l.full_address || '',
            price: parseFloat(amount) || 0,
            currency: curr,
            price_type: l.price_type || 'sale',
            status: l.status || 'Sold',
            saleDate: sale?.sale_date || null,
            pricing: { price: parseFloat(amount) || 0, currency: curr, price_type: l.price_type || 'sale' }
          }
        })
      }
    }

    const purchaseTransactions = (transactions || []).map(t => ({
        id: t.id,
        unitId: t.unit_id,
        unitName: null,
        amount: parseFloat(t.amount),
        transactionDate: t.transaction_date,
        transactionType: t.transaction_type,
        paymentMethod: t.payment_method,
        reference: t.reference,
        status: t.status,
        attachments: t.attachments || []
      })).filter(t => t.transactionType !== 'service_charge')

    const serviceCharges = (serviceChargesRaw || []).map(c => ({
      id: c.id,
      unitId: c.unit_id,
      unitName: null,
      amount: parseFloat(c.amount),
      periodStart: c.period_start?.slice?.(0, 10) || null,
      periodEnd: c.period_end?.slice?.(0, 10) || null,
      nextDueDate: c.next_due_date?.slice?.(0, 10) || null,
      status: c.status,
      paidAt: c.paid_at?.slice?.(0, 10) || null,
      billingReference: c.billing_reference
    }))

    const currentUserAssignment = (assignments || []).find(a => a.user_id === userInfo.user_id)
    const currentUserPermissions = currentUserAssignment?.permissions || null

    const payload = {
      ...toCamelClient(client),
      assignedUserIds: assignedUsers.map(u => u.id),
      assignedUsers,
      currentUserAssignment: currentUserAssignment ? { id: currentUserAssignment.user_id, role: currentUserAssignment.role, permissions: currentUserAssignment.permissions } : null,
      currentUserPermissions,
      units,
      purchaseTransactions,
      serviceCharges,
      engagementLog: (engagement || []).map(e => ({
        id: e.id,
        heading: e.heading,
        note: e.note,
        dateTime: e.date_time,
        isReminder: e.is_reminder,
        status: e.status,
        createdAt: e.created_at
      })),
      documents: (documents || []).map(d => ({
        id: d.id,
        fileName: d.file_name,
        fileUrl: d.file_url
      }))
    }

    const txListingIds = [...new Set((transactions || []).map(t => t.unit_id).filter(Boolean))]
    const scListingIds = [...new Set((serviceChargesRaw || []).map(c => c.unit_id).filter(Boolean))]
    const allListingIds = [...new Set([...txListingIds, ...scListingIds])]
    if (allListingIds.length) {
      const { data: listingData } = await supabaseAdmin
        .from('listings')
        .select('id, title, media, city, town, state, country, full_address')
        .in('id', allListingIds)
      const listingMap = (listingData || []).reduce((m, l) => {
        m[l.id] = {
          id: l.id,
          title: l.title,
          media: l.media,
          city: l.city,
          town: l.town,
          state: l.state,
          country: l.country,
          full_address: l.full_address
        }
        return m
      }, {})
      payload.purchaseTransactions = payload.purchaseTransactions.map(t => {
        const unit = listingMap[t.unitId]
        return {
          ...t,
          unitName: unit?.title || '—',
          unitDetails: unit || null
        }
      })
      payload.serviceCharges = payload.serviceCharges.map(s => {
        const unit = listingMap[s.unitId]
        return {
          ...s,
          unitName: unit?.title || '—',
          unitDetails: unit || null
        }
      })
    }

    captureAuditEvent('client_viewed', {
      user_id: userInfo.user_id,
      user_type: userInfo.user_type || userInfo.organization_type || 'developer',
      timestamp: new Date().toISOString(),
      success: true,
      api_route: '/api/clients/[id]',
      metadata: { client_id: clientId }
    }, userInfo.user_id)

    return NextResponse.json({ success: true, data: payload })
  } catch (err) {
    console.error('Client get error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const clientId = resolvedParams?.id
    if (!clientId) return NextResponse.json({ error: 'Client ID required' }, { status: 400 })

    const auth = await authenticateRequest(request)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 })

    const userInfo = auth.userInfo
    if (userInfo.organization_type !== 'developer') {
      return NextResponse.json({ error: 'Invalid organization type' }, { status: 403 })
    }

    const developerId = await getDeveloperId(userInfo)
    if (!developerId) return NextResponse.json({ error: 'Developer not found' }, { status: 404 })

    const { data: existing } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('developer_id', developerId)
      .single()

    if (!existing) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

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
      tags,
      clientsProperties
    } = body

    const tagsArr = Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined)

    const update = {}
    if (name !== undefined) update.name = name?.trim() || null
    if (clientCode !== undefined) update.client_code = clientCode || null
    if (clientType !== undefined) update.client_type = clientType || null
    if (clientStatus !== undefined) update.status = clientStatus || null
    if (sourceChannel !== undefined) update.source_channel = sourceChannel || null
    if (sourceUserId !== undefined) update.source_user_id = sourceUserId || null
    if (emails !== undefined) update.emails = Array.isArray(emails) ? emails : []
    if (phones !== undefined) update.phones = Array.isArray(phones) ? phones : []
    if (address !== undefined) update.address = address && typeof address === 'object' ? address : {}
    if (firstContactDate !== undefined) update.first_contact_date = firstContactDate || null
    if (convertedDate !== undefined) update.converted_date = convertedDate || null
    if (notes !== undefined) update.notes = notes || null
    if (tagsArr !== undefined) update.tags = tagsArr
    if (clientsProperties !== undefined) update.clients_properties = Array.isArray(clientsProperties) ? clientsProperties : []

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .update(update)
      .eq('id', clientId)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Client code already exists' }, { status: 400 })
      console.error('Client update error:', error)
      return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
    }

    const payload = toCamelClient(client)
    captureAuditEvent('client_updated', {
      user_id: userInfo.user_id,
      user_type: userInfo.user_type || userInfo.organization_type || 'developer',
      timestamp: new Date().toISOString(),
      success: true,
      api_route: '/api/clients/[id]',
      metadata: { client_id: clientId }
    }, userInfo.user_id)

    return NextResponse.json({ success: true, data: payload })
  } catch (err) {
    console.error('Client update error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const clientId = resolvedParams?.id
    if (!clientId) return NextResponse.json({ error: 'Client ID required' }, { status: 400 })

    const auth = await authenticateRequest(request)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 })

    const userInfo = auth.userInfo
    if (userInfo.organization_type !== 'developer') {
      return NextResponse.json({ error: 'Invalid organization type' }, { status: 403 })
    }

    const developerId = await getDeveloperId(userInfo)
    if (!developerId) return NextResponse.json({ error: 'Developer not found' }, { status: 404 })

    const { error } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('id', clientId)
      .eq('developer_id', developerId)

    if (error) {
      console.error('Client delete error:', error)
      return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
    }

    captureAuditEvent('client_deleted', {
      user_id: userInfo.user_id,
      user_type: userInfo.user_type || userInfo.organization_type || 'developer',
      timestamp: new Date().toISOString(),
      success: true,
      api_route: '/api/clients/[id]',
      metadata: { client_id: clientId }
    }, userInfo.user_id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Client delete error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
