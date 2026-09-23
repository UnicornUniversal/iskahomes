import { RESOURCE_CONSTRAINTS, allowedActionsForResource } from '@/lib/integrationConstraints'

export const PERMISSION_ACTIONS = [
  { id: 'read', label: 'Read' },
  { id: 'write', label: 'Write' },
  { id: 'edit', label: 'Edit' },
  { id: 'delete', label: 'Delete' }
]

const compactId = (value) =>
  String(value || 'account')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 16)
    .toLowerCase() || 'account'

const accountPrefix = (accountType) => {
  if (accountType === 'agency') return 'ag'
  if (accountType === 'agent') return 'at'
  return 'dv'
}

export function getAccountUserId(user, accountType) {
  const profile = user?.profile || {}
  if (accountType === 'agency') {
    return profile.agency_id || profile.organization_id || user?.id || 'agency'
  }
  if (accountType === 'agent') {
    return profile.agent_id || user?.id || 'agent'
  }
  return profile.developer_id || profile.organization_id || user?.id || 'developer'
}

export function deriveApiCredentials({ userId, accountType, apiId }) {
  const prefix = accountPrefix(accountType)
  const compactUser = compactId(userId)
  const compactApi = compactId(apiId)

  return {
    publishableKey: `pk_live_${prefix}_${compactUser}_${compactApi}`,
    secretKey: `sk_live_${prefix}_${compactUser}_${compactApi}`,
    publishableLink: `https://api.iskahomes.com/v1/${accountType}/${userId}/${apiId}`
  }
}

export function generateBrowserApiKeyPair(accountType = 'developer', environment = 'live') {
  const type = accountType === 'agency' ? 'ag' : 'dv'
  const env = environment === 'test' ? 'test' : 'live'
  const randomHex = (bytes) => {
    const values = new Uint8Array(bytes)
    crypto.getRandomValues(values)
    return Array.from(values, (byte) => byte.toString(16).padStart(2, '0')).join('')
  }
  const publishableKey = `pk_${env}_${type}_${randomHex(16)}`
  const secretKey = `sk_${env}_${type}_${randomHex(24)}`
  return {
    publishableKey,
    secretKey,
    secretKeyPrefix: secretKey.slice(0, 20)
  }
}

export function emptyActions() {
  return { read: false, write: false, edit: false, delete: false }
}

export function normalizeActions(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return {
      read: !!value.read,
      write: !!value.write,
      edit: !!value.edit,
      delete: !!value.delete
    }
  }

  if (value === 'crud') return { read: true, write: true, edit: true, delete: true }
  if (value === 'read_write') return { read: true, write: true, edit: false, delete: false }
  if (value === 'read') return { read: true, write: false, edit: false, delete: false }
  return emptyActions()
}

export function countEnabledActions(value) {
  return Object.values(normalizeActions(value)).filter(Boolean).length
}

const readOnly = { read: true, write: false, edit: false, delete: false }
const readWriteEdit = { read: true, write: true, edit: true, delete: false }
const none = emptyActions()

const DEVELOPER_APIS = [
  {
    id: 'properties',
    name: 'Properties API',
    description: 'Public listing fields. GET only.',
    permissions: {
      properties: readOnly,
      developments: readOnly,
      leads: none,
      clients: none,
      chargeables: readOnly,
      appointments: none
    }
  },
  {
    id: 'developments',
    name: 'Developments API',
    description: 'Public development fields. GET only.',
    permissions: {
      properties: readOnly,
      developments: readOnly,
      leads: none,
      clients: none,
      chargeables: none,
      appointments: none
    }
  },
  {
    id: 'leads',
    name: 'Leads API',
    description: 'GET, POST, and narrow PATCH. Writes use lead_source only.',
    permissions: {
      properties: readOnly,
      developments: readOnly,
      leads: readWriteEdit,
      clients: readWriteEdit,
      chargeables: none,
      appointments: readOnly
    }
  },
  {
    id: 'clients',
    name: 'Clients API',
    description: 'GET, POST, and PATCH client records.',
    permissions: {
      properties: readOnly,
      developments: readOnly,
      leads: readOnly,
      clients: readWriteEdit,
      chargeables: readOnly,
      appointments: none
    }
  },
  {
    id: 'chargeables',
    name: 'Chargeables API',
    description: 'Chargeable types. GET only.',
    permissions: {
      properties: readOnly,
      developments: readOnly,
      leads: none,
      clients: readOnly,
      chargeables: readOnly,
      appointments: none
    }
  },
  {
    id: 'appointments',
    name: 'Appointments API',
    description: 'GET, POST, and PATCH viewings.',
    permissions: {
      properties: readOnly,
      developments: readOnly,
      leads: { read: true, write: true, edit: false, delete: false },
      clients: readOnly,
      chargeables: none,
      appointments: readWriteEdit
    }
  }
]

const AGENCY_APIS = [
  {
    id: 'properties',
    name: 'Properties API',
    description: 'Public listing fields. GET only.',
    permissions: {
      properties: readOnly,
      leads: none,
      clients: none,
      chargeables: readOnly,
      appointments: none,
      agents: readOnly
    }
  },
  {
    id: 'leads',
    name: 'Leads API',
    description: 'GET, POST, and narrow PATCH. Writes use lead_source only.',
    permissions: {
      properties: readOnly,
      leads: readWriteEdit,
      clients: none,
      chargeables: none,
      appointments: readOnly,
      agents: readOnly
    }
  },
  {
    id: 'clients',
    name: 'Clients API',
    description: 'Clients are available on developer keys only.',
    permissions: {
      properties: readOnly,
      leads: readOnly,
      clients: none,
      chargeables: readOnly,
      appointments: none,
      agents: none
    }
  },
  {
    id: 'chargeables',
    name: 'Chargeables API',
    description: 'Chargeable types. GET only.',
    permissions: {
      properties: readOnly,
      leads: none,
      clients: none,
      chargeables: readOnly,
      appointments: none,
      agents: none
    }
  },
  {
    id: 'appointments',
    name: 'Appointments API',
    description: 'GET, POST, and PATCH viewings.',
    permissions: {
      properties: readOnly,
      leads: { read: true, write: true, edit: false, delete: false },
      clients: none,
      chargeables: none,
      appointments: readWriteEdit,
      agents: readOnly
    }
  }
]

export function getApiCatalog(accountType) {
  return accountType === 'agency' ? AGENCY_APIS : DEVELOPER_APIS
}

export function getApiPermissionResources(accountType) {
  const ids =
    accountType === 'agency'
      ? ['properties', 'leads', 'chargeables', 'appointments', 'agents']
      : ['properties', 'developments', 'leads', 'clients', 'chargeables', 'appointments']

  return ids.map((id) => {
    const constraint = RESOURCE_CONSTRAINTS[id]
    return {
      id,
      name: constraint?.name || id,
      summary: constraint?.summary || '',
      methods: constraint?.methods || ['GET'],
      allowedActions: constraint?.actions || ['read']
    }
  })
}

export function constrainApiPermissions(permissions = {}, accountType) {
  const resources = getApiPermissionResources(accountType)
  const out = {}
  resources.forEach((resource) => {
    const allowed = new Set(allowedActionsForResource(resource.id))
    const current = normalizeActions(permissions[resource.id])
    out[resource.id] = {
      read: allowed.has('read') && !!current.read,
      write: allowed.has('write') && !!current.write,
      edit: allowed.has('edit') && !!current.edit,
      delete: false
    }
  })
  return out
}

export function getApiStorageKey(accountType, slug) {
  return `iska_api_store_${accountType}_${slug}`
}

function emptyStore() {
  return { records: {}, deletedIds: [] }
}

export function loadApiStore(storageKey) {
  if (typeof window === 'undefined') return emptyStore()
  try {
    const saved = localStorage.getItem(storageKey)
    if (!saved) return emptyStore()
    const parsed = JSON.parse(saved)
    if (parsed?.records) {
      return {
        records: parsed.records || {},
        deletedIds: parsed.deletedIds || []
      }
    }

    const records = {}
    Object.entries(parsed || {}).forEach(([id, value]) => {
      if (!value || typeof value !== 'object') return
      records[id] = {
        name: value.name,
        description: value.description,
        status: value.status || 'active',
        permissions: value.permissions || value
      }
    })
    return { records, deletedIds: [] }
  } catch {
    return emptyStore()
  }
}

export function saveApiStore(storageKey, store) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(storageKey, JSON.stringify(store))
  } catch (error) {
    console.error('Error saving API store:', error)
  }
}

export function mergeApiRecord(api, record = {}) {
  return {
    ...api,
    name: record.name || api.name,
    description: record.description || api.description,
    status: record.status || 'active',
    permissions: normalizeApiPermissions(record.permissions || api.permissions)
  }
}

export function normalizeApiPermissions(permissions = {}) {
  return Object.fromEntries(
    Object.entries(permissions).map(([key, value]) => [key, normalizeActions(value)])
  )
}

export function loadApiPermissionOverrides(storageKey) {
  return loadApiStore(storageKey).records
}

export function saveApiPermissionOverrides(storageKey, records) {
  const store = loadApiStore(storageKey)
  saveApiStore(storageKey, { ...store, records })
}

