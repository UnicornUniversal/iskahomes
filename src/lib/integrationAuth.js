import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { captureAuditEvent } from '@/lib/auditLogger'
import { verifySecretKey } from '@/lib/apiKeyCrypto'

export function getPlatformSource(request) {
  const explicit = request.headers.get('x-platform-source')
  if (explicit) return explicit.trim().slice(0, 500)
  const origin = request.headers.get('origin')
  if (origin) return origin.trim().slice(0, 500)
  const referer = request.headers.get('referer')
  if (referer) return referer.trim().slice(0, 500)
  return null
}

function methodToAction(method) {
  switch (method) {
    case 'GET':
      return 'read'
    case 'POST':
      return 'write'
    case 'PUT':
    case 'PATCH':
      return 'edit'
    case 'DELETE':
      return 'delete'
    default:
      return null
  }
}

export async function authenticateIntegrationKey(request, { resource, action } = {}) {
  const authHeader = request.headers.get('authorization') || ''
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  const publishableHeader = request.headers.get('x-publishable-key')?.trim() || ''
  const token = bearer || publishableHeader

  if (!token) {
    return { error: 'API key required', status: 401 }
  }

  const platformSource = getPlatformSource(request)
  let row = null
  let keyType = null

  if (token.startsWith('pk_')) {
    keyType = 'publishable'
    const { data } = await supabaseAdmin
      .from('api_keys')
      .select('*')
      .eq('publishable_key', token)
      .maybeSingle()
    row = data
  } else if (token.startsWith('sk_')) {
    keyType = 'secret'
    const prefix = token.slice(0, 20)
    const { data: matches } = await supabaseAdmin
      .from('api_keys')
      .select('*')
      .eq('secret_key_prefix', prefix)
    const list = matches || []
    for (const candidate of list) {
      if (await verifySecretKey(token, candidate.secret_key_hash)) {
        row = candidate
        break
      }
    }
  } else {
    return { error: 'Invalid API key', status: 401 }
  }

  if (!row) {
    return { error: 'Invalid API key', status: 401 }
  }

  if (row.status !== 'active' || row.revoked_at) {
    return { error: 'API key is inactive', status: 403 }
  }

  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return { error: 'API key has expired', status: 403 }
  }

  const resolvedAction = action || methodToAction(request.method)
  if (resource && resolvedAction) {
    const allowed = !!row.permissions?.[resource]?.[resolvedAction]
    if (!allowed) {
      return { error: `Missing permission: ${resource}.${resolvedAction}`, status: 403 }
    }
  }

  if (keyType === 'publishable') {
    const method = request.method
    const publishableOk =
      method === 'GET' || (method === 'POST' && resource === 'leads')
    if (!publishableOk) {
      return { error: 'Publishable keys cannot perform this action. Use the secret key.', status: 403 }
    }
  }

  const updates = {
    last_used_at: new Date().toISOString()
  }
  if (platformSource) updates.last_platform_source = platformSource
  await supabaseAdmin.from('api_keys').update(updates).eq('id', row.id)

  captureAuditEvent('integration_api_request', {
    user_id: row.organization_id,
    user_type: row.organization_type,
    api_key_id: row.id,
    resource,
    action: resolvedAction,
    method: request.method,
    platform_source: platformSource,
    key_type: keyType,
    timestamp: new Date().toISOString()
  }, row.id)

  let ownerUserId = row.organization_id
  if (row.organization_type === 'developer') {
    const { data: developer } = await supabaseAdmin
      .from('developers')
      .select('id, developer_id')
      .eq('id', row.organization_id)
      .maybeSingle()
    ownerUserId = developer?.developer_id || row.organization_id
  } else if (row.organization_type === 'agency') {
    const { data: agency } = await supabaseAdmin
      .from('agencies')
      .select('id, agency_id')
      .eq('id', row.organization_id)
      .maybeSingle()
    ownerUserId = agency?.agency_id || row.organization_id
  }

  return {
    key: row,
    keyType,
    platformSource,
    organizationType: row.organization_type,
    organizationId: row.organization_id,
    ownerUserId,
    permissions: row.permissions || {}
  }
}

export function withCors(request, response) {
  const origin = request.headers.get('origin') || '*'
  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS')
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type, X-Publishable-Key, X-Platform-Source'
  )
  response.headers.set('Access-Control-Max-Age', '86400')
  response.headers.set('Vary', 'Origin')
  return response
}

export function corsPreflight(request) {
  return withCors(request, new NextResponse(null, { status: 204 }))
}

export function integrationError(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export { methodToAction }
