import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function isUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

/**
 * GET cumulative lead_source_breakdown for a lister (developer / agent / agency).
 * Used by Lead Source analytics UI; data matches listings/leads attribution rollups.
 */
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

    let finalId = listerId

    if (listerType === 'developer' && !isUUID(listerId)) {
      const { data: developer, error } = await supabaseAdmin
        .from('developers')
        .select('developer_id')
        .eq('slug', listerId)
        .single()

      if (error || !developer?.developer_id) {
        return NextResponse.json({ error: 'Developer not found' }, { status: 404 })
      }
      finalId = developer.developer_id
    }

    const table = listerType === 'developer' ? 'developers' : listerType === 'agency' ? 'agencies' : 'agents'
    const idColumn = listerType === 'developer' ? 'developer_id' : listerType === 'agency' ? 'agency_id' : 'agent_id'

    const { data: row, error: fetchError } = await supabaseAdmin
      .from(table)
      .select('lead_source_breakdown')
      .eq(idColumn, finalId)
      .maybeSingle()

    if (fetchError) {
      console.error('source-breakdown fetch:', fetchError)
      return NextResponse.json(
        { error: 'Failed to load breakdown', details: fetchError.message },
        { status: 500 }
      )
    }

    const raw = row?.lead_source_breakdown
    const breakdown =
      raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}

    return NextResponse.json({
      success: true,
      data: {
        breakdown,
        lister_id: finalId,
        lister_type: listerType
      }
    })
  } catch (e) {
    console.error('GET /api/leads/source-breakdown:', e)
    return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 })
  }
}
