import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateRequest, requirePermission } from '@/lib/apiPermissionMiddleware'
import { getLeadsPipelineOwner, toPipelineStatusKey } from '@/lib/leadsPipelineHelper'

async function getOwnedStage(id, owner) {
  const { data, error } = await supabaseAdmin
    .from('leads_pipeline')
    .select('*')
    .eq('id', id)
    .eq('user_id', owner.user_id)
    .eq('user_type', owner.user_type)
    .maybeSingle()

  if (error) throw error
  return data
}

// GET /api/leads-pipeline/[id]
export async function GET(request, { params }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams

    const { userInfo, error: authError, status } = await authenticateRequest(request)
    if (authError) {
      return NextResponse.json({ error: authError }, { status: status || 401 })
    }

    const owner = getLeadsPipelineOwner(userInfo)
    if (!owner) {
      return NextResponse.json({ error: 'Unable to resolve pipeline owner' }, { status: 403 })
    }

    const stage = await getOwnedStage(id, owner)
    if (!stage) {
      return NextResponse.json({ error: 'Pipeline stage not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: stage })
  } catch (error) {
    console.error('GET /api/leads-pipeline/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// PUT /api/leads-pipeline/[id]
export async function PUT(request, { params }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams

    const { userInfo, error: authError, status } = await requirePermission(
      request,
      'leads.update_status'
    )
    if (authError) {
      return NextResponse.json({ error: authError }, { status })
    }

    const owner = getLeadsPipelineOwner(userInfo)
    if (!owner) {
      return NextResponse.json({ error: 'Unable to resolve pipeline owner' }, { status: 403 })
    }

    const existing = await getOwnedStage(id, owner)
    if (!existing) {
      return NextResponse.json({ error: 'Pipeline stage not found' }, { status: 404 })
    }

    const body = await request.json()
    const { value, status: statusKey, sort_order, is_default } = body
    const updateData = { updated_at: new Date().toISOString() }

    if (value !== undefined) {
      if (!value || !String(value).trim()) {
        return NextResponse.json({ error: 'Display label cannot be empty' }, { status: 400 })
      }
      updateData.value = String(value).trim()
    }

    if (statusKey !== undefined) {
      const nextStatus =
        (statusKey && String(statusKey).trim()) ||
        toPipelineStatusKey(updateData.value || existing.value)
      if (!nextStatus) {
        return NextResponse.json({ error: 'Invalid status key' }, { status: 400 })
      }
      if (nextStatus !== existing.status) {
        const { data: conflict } = await supabaseAdmin
          .from('leads_pipeline')
          .select('id')
          .eq('user_id', owner.user_id)
          .eq('user_type', owner.user_type)
          .eq('status', nextStatus)
          .neq('id', id)
          .maybeSingle()

        if (conflict) {
          return NextResponse.json(
            { error: 'A pipeline stage with this status key already exists' },
            { status: 400 }
          )
        }

        const { count: leadsUsingStatus } = await supabaseAdmin
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('lister_id', owner.user_id)
          .eq('lister_type', owner.user_type)
          .eq('status', existing.status)

        if (leadsUsingStatus > 0) {
          return NextResponse.json(
            {
              error:
                'Cannot change status key while leads are using this stage. Create a new stage instead.',
            },
            { status: 400 }
          )
        }

        updateData.status = nextStatus
      }
    }

    if (sort_order !== undefined) updateData.sort_order = sort_order
    if (is_default !== undefined) updateData.is_default = is_default

    const { data: updated, error } = await supabaseAdmin
      .from('leads_pipeline')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update pipeline stage', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Pipeline stage updated successfully',
    })
  } catch (error) {
    console.error('PUT /api/leads-pipeline/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/leads-pipeline/[id]
export async function DELETE(request, { params }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams

    const { userInfo, error: authError, status } = await requirePermission(
      request,
      'leads.update_status'
    )
    if (authError) {
      return NextResponse.json({ error: authError }, { status })
    }

    const owner = getLeadsPipelineOwner(userInfo)
    if (!owner) {
      return NextResponse.json({ error: 'Unable to resolve pipeline owner' }, { status: 403 })
    }

    const existing = await getOwnedStage(id, owner)
    if (!existing) {
      return NextResponse.json({ error: 'Pipeline stage not found' }, { status: 404 })
    }

    const { count: leadsCount } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('lister_id', owner.user_id)
      .eq('lister_type', owner.user_type)
      .eq('status', existing.status)

    if (leadsCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete this stage — ${leadsCount} lead(s) are currently using it.`,
        },
        { status: 400 }
      )
    }

    const { count: stageCount } = await supabaseAdmin
      .from('leads_pipeline')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', owner.user_id)
      .eq('user_type', owner.user_type)

    if (stageCount <= 1) {
      return NextResponse.json(
        { error: 'You must keep at least one pipeline stage' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin.from('leads_pipeline').delete().eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to delete pipeline stage', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Pipeline stage deleted successfully',
    })
  } catch (error) {
    console.error('DELETE /api/leads-pipeline/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
