import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requirePermission } from '@/lib/apiPermissionMiddleware'
import { publicKeyPayload } from '@/lib/apiKeyCrypto'
import { constrainApiPermissions } from '@/lib/apiIntegrations'

async function loadOwnedKey(userInfo, id) {
  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .select('*')
    .eq('id', id)
    .eq('organization_type', userInfo.organization_type)
    .eq('organization_id', userInfo.organization_id)
    .maybeSingle()

  if (error || !data) return null
  return data
}

export async function GET(request, { params }) {
  const { userInfo, error: authError, status } = await requirePermission(request, 'api.view')
  if (authError) return NextResponse.json({ error: authError }, { status })

  const { id } = await params
  const row = await loadOwnedKey(userInfo, id)
  if (!row || row.revoked_at) return NextResponse.json({ error: 'API key not found' }, { status: 404 })

  return NextResponse.json({ success: true, data: publicKeyPayload(row) })
}

export async function PATCH(request, { params }) {
  const { userInfo, error: authError, status } = await requirePermission(request, 'api.edit')
  if (authError) return NextResponse.json({ error: authError }, { status })

  const { id } = await params
  const row = await loadOwnedKey(userInfo, id)
  if (!row || row.revoked_at) return NextResponse.json({ error: 'API key not found' }, { status: 404 })

  const body = await request.json().catch(() => ({}))
  const updates = {}
  if (typeof body.name === 'string') updates.name = body.name.trim()
  if (typeof body.description === 'string') updates.description = body.description.trim()
  if (body.status === 'active' || body.status === 'inactive') updates.status = body.status
  if (body.permissions && typeof body.permissions === 'object') {
    updates.permissions = constrainApiPermissions(body.permissions, userInfo.organization_type)
  }

  if (updates.name === '') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('Update api key error:', error)
    return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: publicKeyPayload(data) })
}

export async function DELETE(request, { params }) {
  const { userInfo, error: authError, status } = await requirePermission(request, 'api.delete')
  if (authError) return NextResponse.json({ error: authError }, { status })

  const { id } = await params
  const row = await loadOwnedKey(userInfo, id)
  if (!row) return NextResponse.json({ error: 'API key not found' }, { status: 404 })

  const { error } = await supabaseAdmin
    .from('api_keys')
    .update({
      status: 'inactive',
      revoked_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('Delete api key error:', error)
    return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
