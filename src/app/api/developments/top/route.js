import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const developerId = searchParams.get('developer_id')
    const limit = parseInt(searchParams.get('limit') || '7', 10)

    if (!developerId) {
      return NextResponse.json(
        { error: 'Developer ID is required' },
        { status: 400 }
      )
    }

    // Optimized query: JOIN development_analytics with developments in one query
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('development_analytics')
      .select(`
        development_id,
        total_views,
        total_sales,
        sales_value,
        developments!inner(
          id,
          slug,
          title,
          banner,
          city,
          state,
          country,
          total_units,
          units_sold,
          total_revenue,
          total_estimated_revenue,
          status,
          development_status
        )
      `)
      .eq('developer_id', developerId)

    if (analyticsError) {
      return NextResponse.json(
        { error: 'Failed to fetch development analytics', details: analyticsError?.message },
        { status: 500 }
      )
    }

    if (!analyticsData || analyticsData.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Aggregate analytics by development_id and join with development data
    const developmentMap = new Map()

    analyticsData.forEach(record => {
      const devId = record.development_id
      const dev = record.developments

      // Skip if development not found or not active
      if (!dev || dev.development_status !== 'active') return

      if (!developmentMap.has(devId)) {
        developmentMap.set(devId, {
          id: dev.id,
          slug: dev.slug,
          title: dev.title,
          banner: dev.banner,
          city: dev.city,
          state: dev.state,
          country: dev.country,
          status: dev.status,
          total_units: dev.total_units || 0,
          units_sold: dev.units_sold || 0,
          total_revenue: parseFloat(dev.total_revenue || 0),
          total_estimated_revenue: parseFloat(dev.total_estimated_revenue || 0),
          total_views: 0,
          total_sales: 0,
          sales_value: 0
        })
      }

      const development = developmentMap.get(devId)
      development.total_views += record.total_views || 0
      development.total_sales += record.total_sales || 0
      development.sales_value += parseFloat(record.sales_value || 0)
    })

    // Convert map to array
    const topDevelopments = Array.from(developmentMap.values())
      // Sort by: total_views (desc), then units_sold (desc), then total_estimated_revenue (desc)
      .sort((a, b) => {
        // First by views
        if (b.total_views !== a.total_views) {
          return b.total_views - a.total_views
        }
        // Then by units sold
        if (b.units_sold !== a.units_sold) {
          return b.units_sold - a.units_sold
        }
        // Finally by revenue
        return b.total_estimated_revenue - a.total_estimated_revenue
      })
      .slice(0, limit)

    return NextResponse.json({
      success: true,
      data: topDevelopments
    })

  } catch (error) {
    console.error('Error fetching top developments:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

