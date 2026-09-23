import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { formatLeadSourceLabel, normalizeLeadSourceKey } from '@/lib/leadSource'
import {
  buildAnalyticsStageOrder,
  resolveLeadStatusForPipeline,
} from '@/lib/leadsPipelineHelper'

function isUUID(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

async function resolveListerId(listerId, listerType) {
  if (listerType === 'developer' && !isUUID(listerId)) {
    const { data: developer } = await supabaseAdmin
      .from('developers')
      .select('developer_id')
      .eq('slug', listerId)
      .maybeSingle()
    return developer?.developer_id || null
  }
  return listerId
}

async function fetchPipelineStages(userId, userType) {
  const { data, error } = await supabaseAdmin
    .from('leads_pipeline')
    .select('status, value, sort_order')
    .eq('user_id', userId)
    .eq('user_type', userType)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data || []
}

async function fetchLeadRows(listerType, listerId) {
  const pageSize = 1000
  const rows = []
  let from = 0

  while (true) {
    let query = supabaseAdmin.from('leads').select('lead_source, status')
    if (listerType === 'agency') {
      query = query.eq('agency_id', listerId)
    } else {
      query = query.eq('lister_id', listerId).eq('lister_type', listerType)
    }

    const { data, error } = await query.range(from, from + pageSize - 1)
    if (error) throw error
    const batch = data || []
    rows.push(...batch)
    if (batch.length < pageSize) break
    from += pageSize
  }

  return rows
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const listerId = searchParams.get('lister_id')
    const listerType = (searchParams.get('lister_type') || 'developer').toLowerCase()

    if (!listerId) {
      return NextResponse.json({ error: 'lister_id is required' }, { status: 400 })
    }
    if (!['developer', 'agent', 'agency'].includes(listerType)) {
      return NextResponse.json({ error: 'Invalid lister_type' }, { status: 400 })
    }

    const finalId = await resolveListerId(listerId, listerType)
    if (!finalId) {
      return NextResponse.json({ error: 'Lister not found' }, { status: 404 })
    }

    const [stages, leads] = await Promise.all([
      fetchPipelineStages(finalId, listerType),
      fetchLeadRows(listerType, finalId),
    ])

    const statusOrder = buildAnalyticsStageOrder(stages)
    const sourceKeys = new Set()
    const matrix = {}

    statusOrder.forEach((stage) => {
      matrix[stage.status] = { total: 0, sources: {} }
    })

    leads.forEach((lead) => {
      const sourceKey = normalizeLeadSourceKey(lead.lead_source, lead.lead_source || 'unknown')
      const statusKey = resolveLeadStatusForPipeline(lead.status, stages)
      sourceKeys.add(sourceKey)
      if (!matrix[statusKey]) {
        matrix[statusKey] = { total: 0, sources: {} }
      }
      matrix[statusKey].total += 1
      matrix[statusKey].sources[sourceKey] = (matrix[statusKey].sources[sourceKey] || 0) + 1
    })

    const sources = [...sourceKeys]
      .map((key) => ({ key, label: formatLeadSourceLabel(key) || key }))
      .sort((a, b) => a.label.localeCompare(b.label))

    const statuses = statusOrder
      .map((stage) => {
        const row = matrix[stage.status] || { total: 0, sources: {} }
        return {
          key: stage.status,
          label: stage.label,
          total: row.total,
          sources: Object.fromEntries(
            sources.map((source) => [source.key, row.sources[source.key] || 0])
          ),
        }
      })
      .filter((status) => status.total > 0)

    return NextResponse.json({
      success: true,
      data: {
        statuses,
        sources,
        total: leads.length,
        lister_id: finalId,
        lister_type: listerType,
      },
    })
  } catch (error) {
    console.error('GET /api/leads/status-by-source:', error)
    return NextResponse.json(
      { error: 'Failed to load status analytics', details: error.message },
      { status: 500 }
    )
  }
}
