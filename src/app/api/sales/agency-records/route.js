import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  getCommissionAmount,
  getListingImageFromMedia,
  listingHasCategoryId,
  resolveImageUrl
} from '@/lib/salesAnalytics'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const agencyId = searchParams.get('agency_id')
    const agentId = searchParams.get('agent_id')
    const purposeId = searchParams.get('purpose_id')
    const typeId = searchParams.get('type_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('page_size') || '20', 10), 1), 100)

    if (!agencyId) {
      return NextResponse.json({ error: 'agency_id is required' }, { status: 400 })
    }

    const { data: agencyListings, error: listingsError } = await supabaseAdmin
      .from('listings')
      .select('id, user_id, title, slug, media, purposes, types, listing_types')
      .eq('listing_agency_id', agencyId)

    if (listingsError) {
      return NextResponse.json(
        { error: 'Failed to fetch listings', details: listingsError.message },
        { status: 500 }
      )
    }

    const allListings = agencyListings || []
    const listingsMap = allListings.reduce((acc, listing) => {
      acc[listing.id] = listing
      return acc
    }, {})

    let filteredListings = allListings
    if (agentId) {
      filteredListings = filteredListings.filter((listing) => listing.user_id === agentId)
    }
    if (purposeId) {
      filteredListings = filteredListings.filter((listing) =>
        listingHasCategoryId(listing, 'purposes', purposeId)
      )
    }
    if (typeId) {
      filteredListings = filteredListings.filter((listing) =>
        listingHasCategoryId(listing, 'types', typeId)
      )
    }

    const filteredListingIds = filteredListings.map((listing) => listing.id)

    if (!filteredListingIds.length) {
      const filterOptions = await buildFilterOptions(agencyId, allListings)
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        page,
        pageSize,
        filters: filterOptions
      })
    }

    let salesQuery = supabaseAdmin
      .from('sales_listings')
      .select(
        'id, listing_id, user_id, sale_price, currency, sale_type, sale_date, commission_rate, commission_amount',
        { count: 'exact' }
      )
      .in('listing_id', filteredListingIds)
      .not('sale_date', 'is', null)

    if (dateFrom) salesQuery = salesQuery.gte('sale_date', dateFrom)
    if (dateTo) salesQuery = salesQuery.lte('sale_date', dateTo)

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data: sales, error: salesError, count } = await salesQuery
      .order('sale_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (salesError) {
      return NextResponse.json(
        { error: 'Failed to fetch sales', details: salesError.message },
        { status: 500 }
      )
    }

    const agentIds = [
      ...new Set(
        (sales || [])
          .map((sale) => listingsMap[sale.listing_id]?.user_id || sale.user_id)
          .filter(Boolean)
      )
    ]

    let agentsMap = {}
    if (agentIds.length > 0) {
      const { data: agents } = await supabaseAdmin
        .from('agents')
        .select('agent_id, name, profile_image')
        .in('agent_id', agentIds)

      agentsMap = (agents || []).reduce((acc, agent) => {
        acc[agent.agent_id] = agent
        return acc
      }, {})
    }

    const records = (sales || []).map((sale) => {
      const listing = listingsMap[sale.listing_id] || {}
      const agentKey = listing.user_id || sale.user_id
      const agent = agentsMap[agentKey]

      return {
        id: sale.id,
        listing_id: sale.listing_id,
        property_name: listing.title || 'Unknown Property',
        property_slug: listing.slug || null,
        property_image: getListingImageFromMedia(listing.media),
        agent_id: agentKey || null,
        agent_name: agent?.name || 'Unassigned',
        agent_image: resolveImageUrl(agent?.profile_image),
        sale_price: Number(sale.sale_price) || 0,
        currency: sale.currency || 'GHS',
        commission_amount: getCommissionAmount(sale),
        sale_date: sale.sale_date,
        sale_type: sale.sale_type || 'sold'
      }
    })

    const filterOptions = await buildFilterOptions(agencyId, allListings)

    return NextResponse.json({
      success: true,
      data: records,
      total: count || 0,
      page,
      pageSize,
      filters: filterOptions
    })
  } catch (error) {
    console.error('Agency sales records error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

async function buildFilterOptions(agencyId, listings) {
  const purposeIds = new Set()
  const typeIds = new Set()

  listings.forEach((listing) => {
    ;(listing.purposes || []).forEach((item) => {
      const id = typeof item === 'object' ? item.id : item
      if (id) purposeIds.add(id)
    })
    ;(listing.types || []).forEach((item) => {
      const id = typeof item === 'object' ? item.id : item
      if (id) typeIds.add(id)
    })
  })

  const [agentsResult, purposesResult, typesResult] = await Promise.all([
    supabaseAdmin
      .from('agents')
      .select('agent_id, name, profile_image')
      .eq('agency_id', agencyId)
      .eq('account_status', 'active')
      .order('name', { ascending: true }),
    purposeIds.size > 0
      ? supabaseAdmin.from('property_purposes').select('id, name').in('id', [...purposeIds])
      : Promise.resolve({ data: [] }),
    typeIds.size > 0
      ? supabaseAdmin.from('property_types').select('id, name').in('id', [...typeIds])
      : Promise.resolve({ data: [] })
  ])

  return {
    agents: (agentsResult.data || []).map((agent) => ({
      agent_id: agent.agent_id,
      name: agent.name || 'Agent',
      profile_image: resolveImageUrl(agent.profile_image)
    })),
    purposes: purposesResult.data || [],
    types: typesResult.data || []
  }
}
