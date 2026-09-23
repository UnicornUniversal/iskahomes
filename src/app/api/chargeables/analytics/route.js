import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { listingCover, listingLocation, mapChargeableEntry } from '@/lib/chargeables'
import { buildChargeableAnalytics } from '@/lib/chargeableAnalytics'
import { requireChargeableOwner } from '../_auth'

const PAGE_SIZE = 1000
const MAX_ROWS = 5000

async function fetchEntries(owner, unitId) {
  const rows = []
  let from = 0
  while (from < MAX_ROWS) {
    let query = supabaseAdmin
      .from('chargeable_entries')
      .select('*')
      .eq('user_id', owner.userId)
      .eq('user_type', owner.userType)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)

    if (unitId) query = query.eq('unit_id', unitId)

    const { data, error } = await query
    if (error) throw error
    rows.push(...(data || []))
    if (!data || data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  return rows
}

async function enrichEntries(rows) {
  const typeIds = [...new Set(rows.map((row) => row.chargeable_type).filter(Boolean))]
  const unitIds = [...new Set(rows.map((row) => row.unit_id).filter(Boolean))]
  const clientIds = [...new Set(rows.map((row) => row.client_id).filter(Boolean))]

  const [typesRes, listingsRes, clientsRes] = await Promise.all([
    typeIds.length
      ? supabaseAdmin.from('chargeable_types').select('id, name').in('id', typeIds)
      : Promise.resolve({ data: [] }),
    unitIds.length
      ? supabaseAdmin.from('listings').select('id, title, media, town, city, state, full_address').in('id', unitIds)
      : Promise.resolve({ data: [] }),
    clientIds.length
      ? supabaseAdmin.from('clients').select('id, name').in('id', clientIds)
      : Promise.resolve({ data: [] })
  ])

  const typeMap = Object.fromEntries((typesRes.data || []).map((type) => [type.id, type.name]))
  const listingMap = Object.fromEntries((listingsRes.data || []).map((listing) => [listing.id, listing]))
  const clientMap = Object.fromEntries((clientsRes.data || []).map((client) => [client.id, client.name]))

  return rows.map((row) => {
    const listing = listingMap[row.unit_id]
    return mapChargeableEntry(row, {
      typeName: typeMap[row.chargeable_type] || 'Chargeable',
      unitName: listing?.title || 'Unit',
      unitCover: listingCover(listing),
      unitLocation: listingLocation(listing),
      clientName: row.client_id ? clientMap[row.client_id] || 'Client' : 'Unassigned'
    })
  })
}

export async function GET(request) {
  try {
    const auth = await requireChargeableOwner(request)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || 'all'
    const currency = searchParams.get('currency') || 'GHS'
    const unitId = searchParams.get('unitId') || null

    const [rows, typesRes] = await Promise.all([
      fetchEntries(auth.owner, unitId),
      supabaseAdmin
        .from('chargeable_types')
        .select('id, name')
        .eq('user_id', auth.owner.userId)
        .eq('user_type', auth.owner.userType)
        .order('name', { ascending: true })
    ])

    const entries = await enrichEntries(rows)
    const analytics = buildChargeableAnalytics(entries, {
      currency,
      types: typesRes.data || [],
      range,
      today: new Date()
    })

    return NextResponse.json({
      success: true,
      truncated: rows.length >= MAX_ROWS,
      data: analytics
    })
  } catch (err) {
    console.error('chargeable analytics GET error:', err)
    return NextResponse.json({ error: 'Failed to load chargeable analytics' }, { status: 500 })
  }
}
