import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateRequest, requirePermission } from '@/lib/apiPermissionMiddleware'
import {
  getLeadsPipelineOwner,
  toPipelineStatusKey,
  DEFAULT_PIPELINE_STAGES,
  isSystemPipelineStatus,
} from '@/lib/leadsPipelineHelper'

async function fetchStages(owner) {
  const { data, error } = await supabaseAdmin
    .from('leads_pipeline')
    .select('*')
    .eq('user_id', owner.user_id)
    .eq('user_type', owner.user_type)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

async function seedDefaultStages(owner) {
  const rows = DEFAULT_PIPELINE_STAGES.map((stage) => ({
    user_id: owner.user_id,
    user_type: owner.user_type,
    status: stage.status,
    value: stage.value,
    sort_order: stage.sort_order,
    is_default: true,
  }))

  const { data, error } = await supabaseAdmin
    .from('leads_pipeline')
    .insert(rows)
    .select()

  if (error) throw error
  return data || []
}

// GET /api/leads-pipeline?seed_defaults=true
export async function GET(request) {
  try {
    const { userInfo, error: authError, status } = await authenticateRequest(request)
    if (authError) {
      return NextResponse.json({ error: authError }, { status: status || 401 })
    }

    const owner = getLeadsPipelineOwner(userInfo)
    if (!owner) {
      return NextResponse.json({ error: 'Unable to resolve pipeline owner' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const seedDefaults = searchParams.get('seed_defaults') === 'true'

    let stages = await fetchStages(owner)

    if (stages.length === 0 && seedDefaults) {
      stages = await seedDefaultStages(owner)
    }

    return NextResponse.json({ success: true, data: stages })
  } catch (error) {
    console.error('GET /api/leads-pipeline error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pipeline stages', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/leads-pipeline
export async function POST(request) {
  try {
    const { userInfo, error: authError, status: httpStatus } = await requirePermission(
      request,
      'leads.update_status'
    )
    if (authError) {
      return NextResponse.json({ error: authError }, { status: httpStatus })
    }

    const owner = getLeadsPipelineOwner(userInfo)
    if (!owner) {
      return NextResponse.json({ error: 'Unable to resolve pipeline owner' }, { status: 403 })
    }

    const body = await request.json()
    const { value, status: statusKey, sort_order, is_default } = body

    if (!value || typeof value !== 'string' || !value.trim()) {
      return NextResponse.json({ error: 'Display label (value) is required' }, { status: 400 })
    }

    const stageStatus =
      (statusKey && String(statusKey).trim()) || toPipelineStatusKey(value)
    if (isSystemPipelineStatus(stageStatus)) {
      return NextResponse.json(
        { error: 'New and Unspecified are reserved system stages and cannot be created' },
        { status: 400 }
      )
    }
    if (!stageStatus) {
      return NextResponse.json(
        { error: 'Could not derive a valid status key from the label' },
        { status: 400 }
      )
    }

    const { data: existing } = await supabaseAdmin
      .from('leads_pipeline')
      .select('id')
      .eq('user_id', owner.user_id)
      .eq('user_type', owner.user_type)
      .eq('status', stageStatus)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'A pipeline stage with this status key already exists' },
        { status: 400 }
      )
    }

    let nextSortOrder = sort_order
    if (nextSortOrder === undefined || nextSortOrder === null) {
      const { count } = await supabaseAdmin
        .from('leads_pipeline')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', owner.user_id)
        .eq('user_type', owner.user_type)
      nextSortOrder = count ?? 0
    }

    const { data: created, error } = await supabaseAdmin
      .from('leads_pipeline')
      .insert({
        user_id: owner.user_id,
        user_type: owner.user_type,
        status: stageStatus,
        value: value.trim(),
        sort_order: nextSortOrder,
        is_default: is_default ?? false,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create pipeline stage', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: created,
      message: 'Pipeline stage created successfully',
    })
  } catch (error) {
    console.error('POST /api/leads-pipeline error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
