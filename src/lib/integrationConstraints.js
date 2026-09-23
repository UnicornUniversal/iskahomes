/** Partner /api/integrations constraints: methods, permission actions, pagination, payloads. */

export const INTEGRATION_DEFAULT_LIMIT = 20
export const INTEGRATION_MAX_LIMIT = 100
export const INTEGRATION_MIN_LIMIT = 1

export const RESOURCE_CONSTRAINTS = {
  properties: {
    name: 'Properties',
    summary: 'Public listing page fields, including listing_status and visibility. Read only.',
    methods: ['GET'],
    actions: ['read'],
    queryParams: ['page', 'limit', 'search', 'city', 'listing_type', 'price_type', 'listing_status', 'visibility']
  },
  developments: {
    name: 'Developments',
    summary: 'Public development fields. Read only. Developer keys only.',
    methods: ['GET'],
    actions: ['read']
  },
  agents: {
    name: 'Agents',
    summary: 'Public agent profiles. Read only. Agency keys only.',
    methods: ['GET'],
    actions: ['read']
  },
  chargeables: {
    name: 'Chargeables',
    summary: 'Chargeable types. Read only.',
    methods: ['GET'],
    actions: ['read']
  },
  leads: {
    name: 'Leads',
    summary: 'Read, create, and narrowly update. Writes use lead_source only.',
    methods: ['GET', 'POST', 'PATCH'],
    actions: ['read', 'write', 'edit']
  },
  appointments: {
    name: 'Appointments',
    summary: 'Read, create, and update viewings.',
    methods: ['GET', 'POST', 'PATCH'],
    actions: ['read', 'write', 'edit']
  },
  clients: {
    name: 'Clients',
    summary: 'Read, create, and update client records. Developer keys only.',
    methods: ['GET', 'POST', 'PATCH'],
    actions: ['read', 'write', 'edit']
  }
}

export const PROPERTY_LIST_COLUMNS = [
  'id',
  'slug',
  'listing_type',
  'title',
  'description',
  'price',
  'currency',
  'price_type',
  'duration',
  'media',
  'specifications',
  'types',
  'purposes',
  'categories',
  'listing_types',
  'city',
  'state',
  'country',
  'town',
  'status',
  'listing_status',
  'visibility',
  'admin_status',
  'listing_condition',
  'is_featured',
  'is_verified',
  'is_premium',
  'available_from',
  'size',
  'created_at'
]

export const PROPERTY_DETAIL_COLUMNS = [
  ...PROPERTY_LIST_COLUMNS,
  'full_address',
  'latitude',
  'longitude',
  'location_additional_information',
  'amenities',
  'available_until',
  'cancellation_policy',
  'is_negotiable',
  'security_requirements',
  'flexible_terms',
  'acquisition_rules',
  'additional_information',
  'pricing',
  'development_id',
  'floor_plan',
  '3d_model'
]

export const DEVELOPMENT_COLUMNS = [
  'id',
  'slug',
  'title',
  'description',
  'status',
  'development_status',
  'city',
  'country',
  'banner',
  'number_of_buildings',
  'total_units',
  'purposes',
  'types',
  'categories',
  'unit_types',
  'created_at'
]

export const AGENT_COLUMNS = [
  'id',
  'agent_id',
  'name',
  'slug',
  'profile_image',
  'bio',
  'email',
  'phone',
  'account_status',
  'agent_status',
  'total_listings',
  'created_at'
]

export const CHARGEABLE_COLUMNS = [
  'id',
  'name',
  'description',
  'default_amount',
  'default_interval_value',
  'default_interval_unit',
  'is_default',
  'created_at',
  'updated_at'
]

export const LEAD_COLUMNS = [
  'id',
  'listing_id',
  'development_id',
  'context_type',
  'lead_name',
  'lead_email',
  'lead_phone',
  'lead_type',
  'lead_source',
  'lead_origin',
  'lead_classification',
  'status',
  'notes',
  'total_actions',
  'lead_score',
  'first_action_date',
  'last_action_date',
  'last_action_type',
  'assigned_user',
  'created_at',
  'updated_at'
]

export const APPOINTMENT_COLUMNS = [
  'id',
  'listing_id',
  'appointment_date',
  'appointment_time',
  'duration',
  'appointment_type',
  'meeting_location',
  'client_name',
  'client_email',
  'client_phone',
  'notes',
  'status',
  'created_at',
  'updated_at'
]

export const CLIENT_COLUMNS = [
  'id',
  'name',
  'client_code',
  'client_type',
  'status',
  'source_channel',
  'emails',
  'phones',
  'address',
  'notes',
  'tags',
  'first_contact_date',
  'created_at',
  'updated_at'
]

export const LEAD_WRITE_FIELDS = [
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
]

export const LEAD_PATCH_FIELDS = [
  'status',
  'notes',
  'lead_classification',
  'assigned_user',
  'lead_name',
  'lead_email',
  'lead_phone',
  'lead_source'
]

export const APPOINTMENT_WRITE_FIELDS = [
  'listing_id',
  'appointment_date',
  'appointment_time',
  'duration',
  'appointment_type',
  'meeting_location',
  'client_name',
  'name',
  'client_email',
  'email',
  'client_phone',
  'phone',
  'notes'
]

export const APPOINTMENT_PATCH_FIELDS = [
  'listing_id',
  'appointment_date',
  'appointment_time',
  'duration',
  'appointment_type',
  'meeting_location',
  'client_name',
  'client_email',
  'client_phone',
  'notes',
  'status'
]

export const CLIENT_WRITE_FIELDS = [
  'name',
  'client_code',
  'client_type',
  'status',
  'emails',
  'email',
  'phones',
  'phone',
  'address',
  'notes',
  'tags',
  'first_contact_date'
]

export const CLIENT_PATCH_FIELDS = CLIENT_WRITE_FIELDS

export function isKnownIntegrationResource(resource) {
  return Object.prototype.hasOwnProperty.call(RESOURCE_CONSTRAINTS, resource)
}

export function getResourceConstraint(resource) {
  return RESOURCE_CONSTRAINTS[resource] || null
}

export function resourceAllowsMethod(resource, method) {
  const constraint = getResourceConstraint(resource)
  return !!constraint?.methods.includes(method)
}

export function allowedActionsForResource(resource) {
  return getResourceConstraint(resource)?.actions || ['read']
}

export function parsePagination(searchParams) {
  const rawPage = parseInt(searchParams.get('page') || '1', 10)
  const rawLimit = parseInt(searchParams.get('limit') || searchParams.get('per_page') || String(INTEGRATION_DEFAULT_LIMIT), 10)
  const page = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1
  const limit = Number.isFinite(rawLimit)
    ? Math.min(INTEGRATION_MAX_LIMIT, Math.max(INTEGRATION_MIN_LIMIT, rawLimit))
    : INTEGRATION_DEFAULT_LIMIT
  return {
    page,
    limit,
    offset: (page - 1) * limit
  }
}

export function paginationPayload({ page, limit, total }) {
  const safeTotal = Number(total) || 0
  const totalPages = Math.max(1, Math.ceil(safeTotal / limit) || 1)
  return {
    page,
    limit,
    total: safeTotal,
    total_pages: safeTotal === 0 ? 0 : totalPages,
    has_more: page * limit < safeTotal
  }
}

export function pickFields(row, columns) {
  if (!row || typeof row !== 'object') return row
  const out = {}
  columns.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      out[key] = row[key]
    }
  })
  return out
}

export function pickAllowedBody(body, allowedKeys) {
  const source = body && typeof body === 'object' && !Array.isArray(body) ? body : {}
  const out = {}
  allowedKeys.forEach((key) => {
    if (source[key] !== undefined) out[key] = source[key]
  })
  return out
}

export function selectList(columns) {
  return columns.map((column) => (column === '3d_model' ? '"3d_model"' : column)).join(', ')
}

export function parseVisibilityParam(value) {
  const raw = String(value ?? '').trim().toLowerCase()
  if (raw === 'true' || raw === '1' || raw === 'visible') return true
  if (raw === 'false' || raw === '0' || raw === 'non-visible' || raw === 'hidden') return false
  return null
}

export function sanitizeSearchTerm(value) {
  return String(value || '')
    .replace(/[%_,.()]/g, ' ')
    .trim()
    .slice(0, 80)
}
