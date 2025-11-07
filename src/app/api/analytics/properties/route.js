import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEventCounts, getEventsGroupedBy } from '@/lib/posthog'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const developerId = searchParams.get('developerId')
    const timeRange = searchParams.get('timeRange') || '7d'

    if (!developerId) {
      return NextResponse.json({ error: 'Developer ID is required' }, { status: 400 })
    }

    // Verify developer exists
    const { data: developer, error: developerError } = await supabaseAdmin
      .from('developers')
      .select('developer_id')
      .eq('developer_id', developerId)
      .single()

    if (developerError || !developer) {
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 })
    }

    // Get properties and developments from Supabase
    const { data: properties, error: propertiesError } = await supabaseAdmin
      .from('listings')
      .select('id, title, price, currency, listing_status, created_at')
      .eq('user_id', developerId)

    const { data: developments, error: developmentsError } = await supabaseAdmin
      .from('developments')
      .select('id, title, price, currency, development_status, created_at')
      .eq('developer_id', developerId)

    if (propertiesError || developmentsError) {
      console.error('Error fetching properties:', propertiesError || developmentsError)
      return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
    }

    // Combine properties and developments
    const allProperties = [
      ...(properties || []).map(p => ({ ...p, type: 'listing' })),
      ...(developments || []).map(d => ({ ...d, type: 'development', listing_status: d.development_status }))
    ]

    // Get analytics data for each property
    const propertyAnalytics = await Promise.all(
      allProperties.map(async (property) => {
        const [views, shares, saves, leads] = await Promise.all([
          getEventCounts(['property_view'], { listing_id: property.id }, timeRange),
          getEventCounts(['impression_share'], { listing_id: property.id }, timeRange),
          getEventCounts(['impression_saved_listing'], { listing_id: property.id }, timeRange),
          getEventCounts(['lead_phone', 'lead_message', 'lead_appointment'], { listing_id: property.id }, timeRange)
        ])

        const totalViews = Object.values(views).reduce((sum, count) => sum + count, 0)
        const totalShares = Object.values(shares).reduce((sum, count) => sum + count, 0)
        const totalSaves = Object.values(saves).reduce((sum, count) => sum + count, 0)
        const totalLeads = Object.values(leads).reduce((sum, count) => sum + count, 0)
        const conversion = totalViews > 0 ? (totalLeads / totalViews) * 100 : 0

        return {
          id: property.id,
          title: property.title,
          price: property.price,
          currency: property.currency,
          status: property.listing_status,
          created_at: property.created_at,
          type: property.type,
          metrics: {
            views: totalViews,
            shares: totalShares,
            saves: totalSaves,
            leads: totalLeads,
            conversion: parseFloat(conversion.toFixed(1))
          }
        }
      })
    )

    // Calculate overview metrics
    const totalProperties = propertyAnalytics.length
    const totalViews = propertyAnalytics.reduce((sum, p) => sum + p.metrics.views, 0)
    const totalShares = propertyAnalytics.reduce((sum, p) => sum + p.metrics.shares, 0)
    const totalSaves = propertyAnalytics.reduce((sum, p) => sum + p.metrics.saves, 0)
    const totalLeads = propertyAnalytics.reduce((sum, p) => sum + p.metrics.leads, 0)
    const overallConversion = totalViews > 0 ? (totalLeads / totalViews) * 100 : 0

    // Get views by source (this would need to be tracked in PostHog events)
    const viewsBySource = await getEventsGroupedBy('property_view', 'source', { developer_id: developerId }, timeRange)

    const propertyData = {
      overview: {
        totalProperties,
        totalViews,
        totalShares,
        totalSaves,
        totalLeads,
        overallConversion: parseFloat(overallConversion.toFixed(2))
      },
      viewsBySource: viewsBySource || {
        'Direct': 0,
        'Search': 0,
        'Social Media': 0,
        'Referral': 0
      },
      properties: propertyAnalytics.sort((a, b) => b.metrics.views - a.metrics.views),
      timeRange,
      developerId
    }

    return NextResponse.json(propertyData)

  } catch (error) {
    console.error('Error fetching property analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}