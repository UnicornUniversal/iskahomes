import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  buildCommissionSummary,
  calculateSaleCommission,
  fetchActiveListingsForCommission
} from '@/lib/salesAnalytics'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const agencyId = searchParams.get('agency_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    if (!agencyId) {
      return NextResponse.json({ error: 'agency_id is required' }, { status: 400 })
    }

    const { data: agencyListings, error: listingsError } = await supabaseAdmin
      .from('listings')
      .select('id, user_id, title')
      .eq('listing_agency_id', agencyId)

    if (listingsError) {
      return NextResponse.json(
        { error: 'Failed to fetch agency listings', details: listingsError.message },
        { status: 500 }
      )
    }

    if (!agencyListings?.length) {
      return NextResponse.json({
        success: true,
        data: {
          summary: { totalSales: 0, totalRevenue: 0, averageSalePrice: 0 },
          commission: {
            totalCommissionPaid: 0,
            totalCommissionPendingOnSales: 0,
            totalCommissionExpectedOnActive: 0,
            totalCommissionToBePaid: 0
          },
          topAgents: [],
          saleTypeBreakdown: [],
          topProperties: []
        }
      })
    }

    const listingsMap = agencyListings.reduce((acc, listing) => {
      acc[listing.id] = listing
      return acc
    }, {})
    const listingIds = agencyListings.map((listing) => listing.id)

    let salesQuery = supabaseAdmin
      .from('sales_listings')
      .select('id, listing_id, user_id, sale_price, sale_type, sale_date, commission_rate, commission_amount')
      .in('listing_id', listingIds)
      .not('sale_date', 'is', null)

    if (dateFrom) salesQuery = salesQuery.gte('sale_date', dateFrom)
    if (dateTo) salesQuery = salesQuery.lte('sale_date', dateTo)

    const { data: sales, error: salesError } = await salesQuery.order('sale_date', { ascending: false })

    if (salesError) {
      return NextResponse.json(
        { error: 'Failed to fetch sales', details: salesError.message },
        { status: 500 }
      )
    }

    const salesRows = sales || []
    const agentIds = [...new Set(
      salesRows
        .map((sale) => listingsMap[sale.listing_id]?.user_id || sale.user_id)
        .filter(Boolean)
    )]

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

    const agentStats = {}
    const saleTypeStats = {}
    const propertyStats = {}

    salesRows.forEach((sale) => {
      const listing = listingsMap[sale.listing_id]
      const agentId = listing?.user_id || sale.user_id || 'unknown'
      const salePrice = Number(sale.sale_price) || 0
      const saleType = sale.sale_type || 'other'

      if (!agentStats[agentId]) {
        const agent = agentsMap[agentId]
        agentStats[agentId] = {
          agent_id: agentId,
          name: agent?.name || 'Unknown Agent',
          sales_count: 0,
          total_revenue: 0
        }
      }
      agentStats[agentId].sales_count += 1
      agentStats[agentId].total_revenue += salePrice

      if (!saleTypeStats[saleType]) {
        saleTypeStats[saleType] = { sale_type: saleType, count: 0, revenue: 0 }
      }
      saleTypeStats[saleType].count += 1
      saleTypeStats[saleType].revenue += salePrice

      if (sale.listing_id) {
        if (!propertyStats[sale.listing_id]) {
          propertyStats[sale.listing_id] = {
            listing_id: sale.listing_id,
            title: listing?.title || 'Unknown Property',
            sales_count: 0,
            total_revenue: 0
          }
        }
        propertyStats[sale.listing_id].sales_count += 1
        propertyStats[sale.listing_id].total_revenue += salePrice
      }
    })

    const totalSales = salesRows.length
    const totalRevenue = salesRows.reduce((sum, sale) => sum + (Number(sale.sale_price) || 0), 0)

    const activeListings = await fetchActiveListingsForCommission({
      accountType: 'agency',
      accountId: agencyId
    })
    const commission = buildCommissionSummary(salesRows, activeListings)

    const topAgents = Object.values(agentStats)
      .map((agent) => {
        const agentSales = salesRows.filter((sale) => {
          const listing = listingsMap[sale.listing_id]
          return (listing?.user_id || sale.user_id) === agent.agent_id
        })
        const agentCommission = agentSales.reduce(
          (sum, sale) => sum + calculateSaleCommission(sale).paid + calculateSaleCommission(sale).pending,
          0
        )
        return { ...agent, total_commission: agentCommission }
      })
      .sort((a, b) => b.sales_count - a.sales_count || b.total_revenue - a.total_revenue)
      .slice(0, 5)

    const topProperties = Object.values(propertyStats)
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 5)

    const saleTypeBreakdown = Object.values(saleTypeStats)
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalSales,
          totalRevenue,
          averageSalePrice: totalSales > 0 ? totalRevenue / totalSales : 0
        },
        commission,
        topAgents,
        saleTypeBreakdown,
        topProperties
      }
    })
  } catch (error) {
    console.error('Agency sales analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
