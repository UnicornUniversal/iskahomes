import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requirePermission } from '@/lib/apiPermissionMiddleware'
import { generateApiKeyPair, hashSecretKey, isValidGeneratedKeyPair, publicKeyPayload } from '@/lib/apiKeyCrypto'
import { constrainApiPermissions, emptyActions, getApiPermissionResources } from '@/lib/apiIntegrations'

function defaultPermissions(organizationType) {
  return getApiPermissionResources(organizationType).reduce((acc, resource) => {
    acc[resource.id] = emptyActions()
    return acc
  }, {})
}

export async function GET(request) {
  const { userInfo, error: authError, status } = await requirePermission(request, 'api.view')
  if (authError) return NextResponse.json({ error: authError }, { status })

  const organizationType = userInfo.organization_type
  if (organizationType !== 'developer' && organizationType !== 'agency') {
    return NextResponse.json({ error: 'API keys are only available for developers and agencies' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .select('id, name, description, status, environment, publishable_key, secret_key_prefix, permissions, last_platform_source, last_used_at, created_at, updated_at, revoked_at')
    .eq('organization_type', organizationType)
    .eq('organization_id', userInfo.organization_id)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('List api keys error:', error)
    return NextResponse.json({ error: 'Failed to load API keys' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    data: (data || []).map((row) => publicKeyPayload(row))
  })
}

export async function POST(request) {
  const { userInfo, error: authError, status } = await requirePermission(request, 'api.create')
  if (authError) return NextResponse.json({ error: authError }, { status })

  const organizationType = userInfo.organization_type
  if (organizationType !== 'developer' && organizationType !== 'agency') {
    return NextResponse.json({ error: 'API keys are only available for developers and agencies' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const name = (body.name || '').trim()
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const environment = body.environment === 'test' ? 'test' : 'live'
  let publishableKey = body.publishable_key
  let secretKey = body.secret_key
  if (publishableKey && secretKey) {
    if (!isValidGeneratedKeyPair(publishableKey, secretKey, organizationType, environment)) {
      return NextResponse.json({ error: 'Invalid API key pair' }, { status: 400 })
    }
  } else {
    ;({ publishableKey, secretKey } = generateApiKeyPair(organizationType, environment))
  }
  const secretKeyPrefix = secretKey.slice(0, 20)
  const secretKeyHash = await hashSecretKey(secretKey)
  const permissions = constrainApiPermissions(
    body.permissions || defaultPermissions(organizationType),
    organizationType
  )

  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .insert({
      organization_type: organizationType,
      organization_id: userInfo.organization_id,
      name,
      description: (body.description || '').trim() || null,
      status: body.status === 'inactive' ? 'inactive' : 'active',
      environment,
      publishable_key: publishableKey,
      secret_key_prefix: secretKeyPrefix,
      secret_key_hash: secretKeyHash,
      permissions,
      created_by: userInfo.user_id
    })
    .select('*')
    .single()

  if (error) {
    console.error('Create api key error:', error)
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    data: publicKeyPayload(data, { includeSecret: true, secretKey })
  }, { status: 201 })
}
