import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateIntegrationKey, integrationError } from '@/lib/integrationAuth'
import { resolvePartnerLeadSource, normalizeLeadSourceKey } from '@/lib/leadSource'
import {
  assertLeadCreationAllowed,
  assertAppointmentCreationAllowed
} from '@/lib/subscriptionLimitsServer'
import {
  AGENT_COLUMNS,
  APPOINTMENT_COLUMNS,
  APPOINTMENT_PATCH_FIELDS,
  APPOINTMENT_WRITE_FIELDS,
  CHARGEABLE_COLUMNS,
  CLIENT_COLUMNS,
  CLIENT_PATCH_FIELDS,
  CLIENT_WRITE_FIELDS,
  DEVELOPMENT_COLUMNS,
  LEAD_COLUMNS,
  LEAD_PATCH_FIELDS,
  PROPERTY_DETAIL_COLUMNS,
  PROPERTY_LIST_COLUMNS,
  isKnownIntegrationResource,
  paginationPayload,
  parsePagination,
  parseVisibilityParam,
  pickAllowedBody,
  pickFields,
  resourceAllowsMethod,
  sanitizeSearchTerm,
  selectList
} from '@/lib/integrationConstraints'

const APPOINTMENT_TYPES = new Set(['in-person', 'virtual', 'phone'])

function methodNotAllowed(resource) {
  return integrationError(`${resource} does not support this method`, 405)
}

export async function handleIntegrationCollection(request, resource) {
  if (!isKnownIntegrationResource(resource)) {
    return integrationError('Unknown resource', 404)
  }

  const method = request.method
  if (!resourceAllowsMethod(resource, method)) {
    return methodNotAllowed(resource)
  }

  const auth = await authenticateIntegrationKey(request, { resource })
  if (auth.error) return integrationError(auth.error, auth.status)

  const { searchParams } = new URL(request.url)
  const { page, limit, offset } = parsePagination(searchParams)
  const orgType = auth.organizationType
  const ownerId = auth.ownerUserId

  try {
    if (method === 'GET') {
      return await listResource({ resource, orgType, ownerId, page, limit, offset, searchParams })
    }
    if (method === 'POST') {
      const body = await request.json().catch(() => ({}))
      return await createResource({ resource, orgType, ownerId, body, platformSource: auth.platformSource })
    }
    return methodNotAllowed(resource)
  } catch (error) {
    console.error('Integration collection error:', error)
    return integrationError('Internal server error', 500)
  }
}

export async function handleIntegrationItem(request, resource, id) {
  if (!isKnownIntegrationResource(resource)) {
    return integrationError('Unknown resource', 404)
  }
  if (!id) return integrationError('Missing id', 400)

  const method = request.method
  if (method === 'PUT' || method === 'DELETE' || !resourceAllowsMethod(resource, method)) {
    return methodNotAllowed(resource)
  }

  const auth = await authenticateIntegrationKey(request, { resource })
  if (auth.error) return integrationError(auth.error, auth.status)

  const orgType = auth.organizationType
  const ownerId = auth.ownerUserId

  try {
    if (method === 'GET') {
      return await getResource({ resource, orgType, ownerId, id, detail: true })
    }
    if (method === 'PATCH') {
      const body = await request.json().catch(() => ({}))
      return await updateResource({ resource, orgType, ownerId, id, body })
    }
    return methodNotAllowed(resource)
  } catch (error) {
    console.error('Integration item error:', error)
    return integrationError('Internal server error', 500)
  }
}

function applyOwnerFilter(query, resource, orgType, ownerId) {
  if (resource === 'properties') {
    return orgType === 'developer'
      ? query.eq('user_id', ownerId)
      : query.eq('listing_agency_id', ownerId)
  }
  if (resource === 'developments') {
    return query.eq('developer_id', ownerId)
  }
  if (resource === 'leads') {
    return orgType === 'agency'
      ? query.eq('agency_id', ownerId)
      : query.eq('lister_id', ownerId).eq('lister_type', orgType)
  }
  if (resource === 'clients') {
    return query.eq('developer_id', ownerId)
  }
  if (resource === 'chargeables') {
    return query.eq('user_id', ownerId).eq('user_type', orgType)
  }
  if (resource === 'appointments') {
    return query.eq('account_id', ownerId).eq('account_type', orgType)
  }
  if (resource === 'agents') {
    return query.eq('agency_id', ownerId)
  }
  return query
}

function resourceTable(resource) {
  return {
    properties: 'listings',
    developments: 'developments',
    leads: 'leads',
    clients: 'clients',
    chargeables: 'chargeable_types',
    appointments: 'appointments',
    agents: 'agents'
  }[resource]
}

function resourceColumns(resource, detail) {
  if (resource === 'properties') return detail ? PROPERTY_DETAIL_COLUMNS : PROPERTY_LIST_COLUMNS
  if (resource === 'developments') return DEVELOPMENT_COLUMNS
  if (resource === 'leads') return LEAD_COLUMNS
  if (resource === 'clients') return CLIENT_COLUMNS
  if (resource === 'chargeables') return CHARGEABLE_COLUMNS
  if (resource === 'appointments') return APPOINTMENT_COLUMNS
  if (resource === 'agents') return AGENT_COLUMNS
  return ['id']
}

function assertAccountResource(resource, orgType) {
  if (resource === 'developments' && orgType !== 'developer') {
    return integrationError('Developments are only available for developer keys', 403)
  }
  if (resource === 'clients' && orgType !== 'developer') {
    return integrationError('Clients are only available for developer keys', 403)
  }
  if (resource === 'agents' && orgType !== 'agency') {
    return integrationError('Agents are only available for agency keys', 403)
  }
  return null
}

function applySearch(query, resource, searchParams) {
  const search = sanitizeSearchTerm(searchParams.get('search'))
  if (!search) return query
  if (resource === 'properties') return query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  if (resource === 'developments') return query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  if (resource === 'leads') {
    return query.or(`lead_name.ilike.%${search}%,lead_email.ilike.%${search}%,lead_phone.ilike.%${search}%`)
  }
  if (resource === 'clients') return query.ilike('name', `%${search}%`)
  if (resource === 'appointments') return query.ilike('client_name', `%${search}%`)
  if (resource === 'agents') return query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  if (resource === 'chargeables') return query.ilike('name', `%${search}%`)
  return query
}

function applyFilters(query, resource, searchParams) {
  if (resource === 'properties') {
    const listingStatus = sanitizeSearchTerm(searchParams.get('listing_status'))
    if (listingStatus) query = query.eq('listing_status', listingStatus)
    const visibility = parseVisibilityParam(searchParams.get('visibility'))
    if (visibility !== null) query = query.eq('visibility', visibility)
    const listingType = sanitizeSearchTerm(searchParams.get('listing_type'))
    if (listingType) query = query.eq('listing_type', listingType)
    const city = sanitizeSearchTerm(searchParams.get('city'))
    if (city) query = query.ilike('city', `%${city}%`)
    const priceType = sanitizeSearchTerm(searchParams.get('price_type'))
    if (priceType) query = query.eq('price_type', priceType)
    return query
  }
  const status = sanitizeSearchTerm(searchParams.get('status'))
  if (status && (resource === 'leads' || resource === 'appointments' || resource === 'clients')) {
    return query.eq('status', status)
  }
  const leadSource = sanitizeSearchTerm(searchParams.get('lead_source'))
  if (leadSource && resource === 'leads') {
    return query.eq('lead_source', leadSource)
  }
  return query
}

async function listResource({ resource, orgType, ownerId, page, limit, offset, searchParams }) {
  const accountError = assertAccountResource(resource, orgType)
  if (accountError) return accountError

  const columns = resourceColumns(resource, false)
  let query = supabaseAdmin.from(resourceTable(resource)).select(selectList(columns), { count: 'exact' })
  query = applyOwnerFilter(query, resource, orgType, ownerId)
  query = applySearch(query, resource, searchParams)
  query = applyFilters(query, resource, searchParams)
  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) {
    console.error('Integration list error:', error)
    return integrationError('Failed to load resource', 500)
  }

  const shaped = await shapeRows(resource, data || [], false)
  const pagination = paginationPayload({ page, limit, total: count || 0 })
  return NextResponse.json({
    success: true,
    data: shaped,
    ...pagination,
    pagination
  })
}

async function fetchOwnedRow({ resource, orgType, ownerId, id, detail }) {
  const accountError = assertAccountResource(resource, orgType)
  if (accountError) return { errorResponse: accountError }

  const columns = resourceColumns(resource, detail)
  let query = supabaseAdmin.from(resourceTable(resource)).select(selectList(columns)).eq('id', id)
  query = applyOwnerFilter(query, resource, orgType, ownerId)
  const { data, error } = await query.maybeSingle()
  if (error || !data) return { errorResponse: integrationError('Not found', 404) }
  return { row: data }
}

async function getResource({ resource, orgType, ownerId, id, detail = true }) {
  const { row, errorResponse } = await fetchOwnedRow({ resource, orgType, ownerId, id, detail })
  if (errorResponse) return errorResponse
  const [shaped] = await shapeRows(resource, [row], true)
  return NextResponse.json({ success: true, data: shaped })
}

async function createResource({ resource, orgType, ownerId, body, platformSource }) {
  const accountError = assertAccountResource(resource, orgType)
  if (accountError) return accountError

  if (resource === 'leads') {
    return createLead({ orgType, ownerId, body, platformSource })
  }
  if (resource === 'appointments') {
    return createAppointment({ orgType, ownerId, body })
  }
  if (resource === 'clients') {
    return createClient({ ownerId, body })
  }
  return methodNotAllowed(resource)
}

async function updateResource({ resource, orgType, ownerId, id, body }) {
  const { row, errorResponse } = await fetchOwnedRow({ resource, orgType, ownerId, id, detail: true })
  if (errorResponse) return errorResponse

  if (resource === 'leads') return patchLead({ orgType, ownerId, row, body })
  if (resource === 'appointments') return patchAppointment({ id, body })
  if (resource === 'clients') return patchClient({ id, body })
  return methodNotAllowed(resource)
}

async function verifyOwnedListing(orgType, ownerId, listingId) {
  if (!listingId) return { ok: true, listing: null }
  let query = supabaseAdmin.from('listings').select('id, listing_status, user_id, listing_agency_id').eq('id', listingId)
  query = orgType === 'developer' ? query.eq('user_id', ownerId) : query.eq('listing_agency_id', ownerId)
  const { data } = await query.maybeSingle()
  if (!data) return { ok: false }
  return { ok: true, listing: data }
}

async function createLead({ orgType, ownerId, body, platformSource }) {
  const input = pickAllowedBody(body, [
    'listing_id',
    'development_id',
    'context_type',
    'lead_name',
    'name',
    'contact_name',
    'lead_email',
    'email',
    'contact_email',
    'lead_phone',
    'phone',
    'contact_phone',
    'lead_source',
    'notes',
    'lead_classification'
  ])

  const leadName = input.lead_name || input.name || input.contact_name || null
  const leadEmail = input.lead_email || input.email || input.contact_email || null
  const leadPhone = input.lead_phone || input.phone || input.contact_phone || null
  if (!leadName || (!leadEmail && !leadPhone)) {
    return integrationError('lead_name and at least one of lead_email or lead_phone are required', 400)
  }

  const partnerSource = resolvePartnerLeadSource(input.lead_source)
  if (partnerSource.error) return integrationError(partnerSource.error, 400)

  if (input.listing_id) {
    const owned = await verifyOwnedListing(orgType, ownerId, input.listing_id)
    if (!owned.ok) return integrationError('listing_id is not one of your properties', 400)
  }

  const limitCheck = await assertLeadCreationAllowed({
    listerType: orgType,
    listerId: ownerId,
    agencyId: orgType === 'agency' ? ownerId : null
  })
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: limitCheck.message, code: 'SUBSCRIPTION_LIMIT', limitKey: 'leads_per_month' },
      { status: 403 }
    )
  }

  const today = new Date().toISOString().split('T')[0]
  const insert = {
    listing_id: input.listing_id || null,
    development_id: input.development_id || null,
    lister_id: ownerId,
    lister_type: orgType,
    agency_id: orgType === 'agency' ? ownerId : null,
    seeker_id: null,
    context_type: input.context_type || (input.listing_id ? 'listing' : input.development_id ? 'development' : 'profile'),
    status: 'new',
    status_tracker: ['new'],
    notes: Array.isArray(input.notes) ? input.notes : input.notes ? [input.notes] : [],
    lead_actions: [],
    total_actions: 1,
    first_action_date: today,
    last_action_date: today,
    last_action_type: 'api',
    lead_type: 'automated',
    lead_source: partnerSource.source,
    lead_origin: null,
    lead_classification: input.lead_classification || 'Standard',
    lead_name: leadName,
    lead_email: leadEmail,
    lead_phone: leadPhone,
    is_anonymous: false
  }

  const { data, error } = await supabaseAdmin.from('leads').insert(insert).select(selectList(LEAD_COLUMNS)).single()
  if (error) {
    console.error('Integration lead create error:', error)
    return integrationError(error.message || 'Failed to create lead', 400)
  }
  return NextResponse.json(
    { success: true, data: shapeLead(data), platform_source: platformSource },
    { status: 201 }
  )
}

async function patchLead({ orgType, ownerId, row, body }) {
  const input = pickAllowedBody(body, LEAD_PATCH_FIELDS)
  const patch = { updated_at: new Date().toISOString() }

  if (input.status !== undefined) {
    const status = String(input.status || '').trim().toLowerCase()
    if (!status) return integrationError('status cannot be empty', 400)
    patch.status = status
  }
  if (input.notes !== undefined) {
    patch.notes = Array.isArray(input.notes) ? input.notes : input.notes ? [input.notes] : []
  }
  if (input.lead_classification !== undefined) patch.lead_classification = input.lead_classification
  if (input.assigned_user !== undefined) patch.assigned_user = input.assigned_user || null
  if (input.lead_name !== undefined) patch.lead_name = input.lead_name
  if (input.lead_email !== undefined) patch.lead_email = input.lead_email
  if (input.lead_phone !== undefined) patch.lead_phone = input.lead_phone
  if (input.lead_source !== undefined) {
    const partnerSource = resolvePartnerLeadSource(input.lead_source)
    if (partnerSource.error) return integrationError(partnerSource.error, 400)
    patch.lead_source = partnerSource.source
  }

  if (patch.status === 'closed' && row.status !== 'closed') {
    const tracker = Array.isArray(row.status_tracker) ? row.status_tracker : []
    patch.status_tracker = tracker.includes('closed') ? tracker : [...tracker, 'closed']
  }

  const { data, error } = await supabaseAdmin
    .from('leads')
    .update(patch)
    .eq('id', row.id)
    .select(selectList(LEAD_COLUMNS))
    .single()
  if (error) return integrationError(error.message || 'Failed to update lead', 400)

  if (patch.status === 'closed' && row.status !== 'closed' && row.listing_id) {
    await markListingSoldIfClosed(orgType, ownerId, row.listing_id)
  }

  return NextResponse.json({ success: true, data: shapeLead(data) })
}

async function markListingSoldIfClosed(orgType, ownerId, listingId) {
  const owned = await verifyOwnedListing(orgType, ownerId, listingId)
  if (!owned.ok || !owned.listing) return
  if (owned.listing.listing_status === 'sold' || owned.listing.listing_status === 'rented') return
  await supabaseAdmin
    .from('listings')
    .update({ listing_status: 'sold', status: 'sold', updated_at: new Date().toISOString() })
    .eq('id', listingId)
}

async function createAppointment({ orgType, ownerId, body }) {
  const input = pickAllowedBody(body, APPOINTMENT_WRITE_FIELDS)
  if (!input.appointment_date || !input.appointment_time) {
    return integrationError('appointment_date and appointment_time are required', 400)
  }
  const clientName = input.client_name || input.name
  if (!clientName) return integrationError('client_name is required', 400)

  const appointmentType = input.appointment_type || 'in-person'
  if (!APPOINTMENT_TYPES.has(appointmentType)) {
    return integrationError('appointment_type must be in-person, virtual, or phone', 400)
  }

  if (input.listing_id) {
    const owned = await verifyOwnedListing(orgType, ownerId, input.listing_id)
    if (!owned.ok) return integrationError('listing_id is not one of your properties', 400)
  }

  const limitCheck = await assertAppointmentCreationAllowed({
    accountType: orgType,
    accountId: ownerId
  })
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: limitCheck.message, code: 'SUBSCRIPTION_LIMIT', limitKey: 'appointments_per_month' },
      { status: 403 }
    )
  }

  const insert = {
    account_type: orgType,
    account_id: ownerId,
    listing_id: input.listing_id || null,
    appointment_date: input.appointment_date,
    appointment_time: input.appointment_time,
    duration: input.duration || 60,
    appointment_type: appointmentType,
    meeting_location: input.meeting_location || null,
    client_name: clientName,
    client_email: input.client_email || input.email || null,
    client_phone: input.client_phone || input.phone || null,
    notes: input.notes || null,
    status: 'pending',
    notification_status: 'pending'
  }

  const { data, error } = await supabaseAdmin
    .from('appointments')
    .insert(insert)
    .select(selectList(APPOINTMENT_COLUMNS))
    .single()
  if (error) return integrationError(error.message || 'Failed to create appointment', 400)
  return NextResponse.json({ success: true, data: pickFields(data, APPOINTMENT_COLUMNS) }, { status: 201 })
}

async function patchAppointment({ id, body }) {
  const input = pickAllowedBody(body, APPOINTMENT_PATCH_FIELDS)
  if (input.appointment_type && !APPOINTMENT_TYPES.has(input.appointment_type)) {
    return integrationError('appointment_type must be in-person, virtual, or phone', 400)
  }
  const patch = { ...input, updated_at: new Date().toISOString() }
  const { data, error } = await supabaseAdmin
    .from('appointments')
    .update(patch)
    .eq('id', id)
    .select(selectList(APPOINTMENT_COLUMNS))
    .single()
  if (error) return integrationError(error.message || 'Failed to update appointment', 400)
  return NextResponse.json({ success: true, data: pickFields(data, APPOINTMENT_COLUMNS) })
}

function normalizeClientContacts(input) {
  const emails = Array.isArray(input.emails)
    ? input.emails.filter(Boolean)
    : input.email
      ? [input.email]
      : undefined
  const phones = Array.isArray(input.phones)
    ? input.phones.filter(Boolean)
    : input.phone
      ? [input.phone]
      : undefined
  return { emails, phones }
}

async function createClient({ ownerId, body }) {
  const input = pickAllowedBody(body, CLIENT_WRITE_FIELDS)
  if (!input.name || !String(input.name).trim()) {
    return integrationError('name is required', 400)
  }
  const { emails, phones } = normalizeClientContacts(input)
  const insert = {
    name: String(input.name).trim(),
    developer_id: ownerId,
    client_code: input.client_code || null,
    client_type: input.client_type || 'individual',
    status: input.status || 'active',
    source_channel: 'api',
    emails: emails || [],
    phones: phones || [],
    address: input.address && typeof input.address === 'object' ? input.address : {},
    notes: input.notes || null,
    tags: Array.isArray(input.tags) ? input.tags : [],
    first_contact_date: input.first_contact_date || null,
    clients_properties: [],
    total_income_usd: 0
  }
  const { data, error } = await supabaseAdmin.from('clients').insert(insert).select(selectList(CLIENT_COLUMNS)).single()
  if (error) return integrationError(error.message || 'Failed to create client', 400)
  return NextResponse.json({ success: true, data: pickFields(data, CLIENT_COLUMNS) }, { status: 201 })
}

async function patchClient({ id, body }) {
  const input = pickAllowedBody(body, CLIENT_PATCH_FIELDS)
  const { emails, phones } = normalizeClientContacts(input)
  const patch = { updated_at: new Date().toISOString() }
  if (input.name !== undefined) patch.name = String(input.name).trim()
  if (input.client_code !== undefined) patch.client_code = input.client_code
  if (input.client_type !== undefined) patch.client_type = input.client_type
  if (input.status !== undefined) patch.status = input.status
  if (emails) patch.emails = emails
  if (phones) patch.phones = phones
  if (input.address !== undefined) patch.address = input.address
  if (input.notes !== undefined) patch.notes = input.notes
  if (input.tags !== undefined) patch.tags = Array.isArray(input.tags) ? input.tags : []
  if (input.first_contact_date !== undefined) patch.first_contact_date = input.first_contact_date

  const { data, error } = await supabaseAdmin
    .from('clients')
    .update(patch)
    .eq('id', id)
    .select(selectList(CLIENT_COLUMNS))
    .single()
  if (error) return integrationError(error.message || 'Failed to update client', 400)
  return NextResponse.json({ success: true, data: pickFields(data, CLIENT_COLUMNS) })
}

function parseIdList(value) {
  if (!value) return []
  let raw = value
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw)
    } catch {
      return []
    }
  }
  if (Array.isArray(raw)) {
    return raw
      .map((item) => (item && typeof item === 'object' ? item.id : item))
      .filter(Boolean)
  }
  return []
}

function listingSubtypeIds(listing) {
  const types = listing?.listing_types
  if (!types) return []
  const parsed = typeof types === 'string' ? safeJson(types) : types
  return parseIdList(parsed?.database)
}

function safeJson(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

async function fetchNameMap(table, ids) {
  const unique = [...new Set(ids.filter(Boolean))]
  if (unique.length === 0) return {}
  const { data } = await supabaseAdmin.from(table).select('id, name').in('id', unique)
  const map = {}
  ;(data || []).forEach((row) => {
    map[row.id] = row.name
  })
  return map
}

function namedList(ids, map) {
  return ids.map((id) => ({ id, name: map[id] || null })).filter((item) => item.id)
}

async function attachClassifications(rows) {
  const purposeIds = []
  const typeIds = []
  const categoryIds = []
  const subtypeIds = []
  rows.forEach((row) => {
    purposeIds.push(...parseIdList(row.purposes))
    typeIds.push(...parseIdList(row.types))
    categoryIds.push(...parseIdList(row.categories))
    subtypeIds.push(...listingSubtypeIds(row))
  })
  const [purposes, types, categories, subtypes] = await Promise.all([
    fetchNameMap('property_purposes', purposeIds),
    fetchNameMap('property_types', typeIds),
    fetchNameMap('property_categories', categoryIds),
    fetchNameMap('property_subtypes', subtypeIds)
  ])
  return rows.map((row) => ({
    ...row,
    purposes: namedList(parseIdList(row.purposes), purposes),
    types: namedList(parseIdList(row.types), types),
    categories: namedList(parseIdList(row.categories), categories),
    subtypes: namedList(listingSubtypeIds(row), subtypes)
  }))
}

function shapeLead(row) {
  return {
    ...pickFields(row, LEAD_COLUMNS),
    lead_source: normalizeLeadSourceKey(row.lead_source, row.lead_source || null)
  }
}

function shapeChargeable(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    default_amount: parseFloat(row.default_amount) || 0,
    default_interval_value: row.default_interval_value,
    default_interval_unit: row.default_interval_unit,
    is_default: !!row.is_default,
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}

async function shapeRows(resource, rows, detail) {
  if (resource === 'properties') {
    const picked = rows.map((row) => ({
      ...pickFields(row, detail ? PROPERTY_DETAIL_COLUMNS : PROPERTY_LIST_COLUMNS),
      listing_status: row.listing_status || null,
      visibility: row.visibility !== false,
      admin_status: row.admin_status || null,
    }))
    return attachClassifications(picked)
  }
  if (resource === 'developments') {
    const picked = rows.map((row) => pickFields(row, DEVELOPMENT_COLUMNS))
    return attachClassifications(picked)
  }
  if (resource === 'leads') return rows.map(shapeLead)
  if (resource === 'chargeables') return rows.map(shapeChargeable)
  if (resource === 'appointments') return rows.map((row) => pickFields(row, APPOINTMENT_COLUMNS))
  if (resource === 'clients') return rows.map((row) => pickFields(row, CLIENT_COLUMNS))
  if (resource === 'agents') return rows.map((row) => pickFields(row, AGENT_COLUMNS))
  return rows
}
