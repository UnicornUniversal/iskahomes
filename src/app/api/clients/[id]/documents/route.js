import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateRequest } from '@/lib/apiPermissionMiddleware'
import { getDeveloperId } from '@/lib/developerIdHelper'
import { captureAuditEvent } from '@/lib/auditLogger'

async function verifyClientAccess(clientId, developerId) {
  const { data } = await supabaseAdmin
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('developer_id', developerId)
    .single()
  return !!data
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
      .from('client_documents')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Documents fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    const docs = (data || []).map(d => ({
      id: d.id,
      fileName: d.file_name,
      fileUrl: d.file_url,
      createdAt: d.created_at
    }))

    captureAuditEvent('client_document_listed', {
      user_id: userInfo.user_id,
      user_type: userInfo.user_type || userInfo.organization_type || 'developer',
      timestamp: new Date().toISOString(),
      success: true,
      api_route: '/api/clients/[id]/documents',
      metadata: { client_id: clientId, result_count: docs.length }
    }, userInfo.user_id)

    return NextResponse.json({ success: true, data: docs })
  } catch (err) {
    console.error('Documents get error:', err)
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
    const { fileName, fileUrl } = body

    if (!fileName?.trim() || !fileUrl?.trim()) {
      return NextResponse.json({ error: 'fileName and fileUrl are required' }, { status: 400 })
    }

    const insert = {
      client_id: clientId,
      file_name: fileName.trim(),
      file_url: fileUrl.trim()
    }

    const { data, error } = await supabaseAdmin
      .from('client_documents')
      .insert(insert)
      .select()
      .single()

    if (error) {
      console.error('Document create error:', error)
      return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
    }

    captureAuditEvent('client_document_uploaded', {
      user_id: userInfo.user_id,
      user_type: userInfo.user_type || userInfo.organization_type || 'developer',
      timestamp: new Date().toISOString(),
      success: true,
      api_route: '/api/clients/[id]/documents',
      metadata: { client_id: clientId, document_id: data?.id }
    }, userInfo.user_id)

    return NextResponse.json({ success: true, data: { id: data.id, fileName: data.file_name, fileUrl: data.file_url } })
  } catch (err) {
    console.error('Document create error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
