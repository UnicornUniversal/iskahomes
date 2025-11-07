import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listing_id') || null
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabaseAdmin
      .from('listing_analytics')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit)

    if (listingId) {
      query = query.eq('listing_id', listingId)
    }

    const { data: analytics, error } = await query

    if (error) {
      console.error('Error fetching listing analytics:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    // Group by listing_id and aggregate
    const summaryByListing = {}
    
    analytics.forEach(record => {
      const id = record.listing_id
      if (!summaryByListing[id]) {
        summaryByListing[id] = {
          listing_id: id,
          total_records: 0,
          date_range: {
            earliest: record.date,
            latest: record.date
          },
          totals: {
            total_views: 0,
            unique_views: 0,
            total_impressions: 0,
            total_leads: 0,
            phone_leads: 0,
            message_leads: 0,
            email_leads: 0,
            appointment_leads: 0,
            website_leads: 0,
            unique_leads: 0,
            total_sales: 0,
            sales_value: 0,
            impression_share: 0,
            impression_saved_listing: 0,
            impression_social_media: 0,
            impression_website_visit: 0
          },
          averages: {
            conversion_rate: 0,
            lead_to_sale_rate: 0,
            avg_sale_price: 0
          },
          records: []
        }
      }

      const summary = summaryByListing[id]
      summary.total_records++
      summary.records.push(record)

      // Update date range
      if (record.date < summary.date_range.earliest) {
        summary.date_range.earliest = record.date
      }
      if (record.date > summary.date_range.latest) {
        summary.date_range.latest = record.date
      }

      // Aggregate totals
      summary.totals.total_views += record.total_views || 0
      summary.totals.unique_views += record.unique_views || 0
      summary.totals.total_impressions += record.total_impressions || 0
      summary.totals.total_leads += record.total_leads || 0
      summary.totals.phone_leads += record.phone_leads || 0
      summary.totals.message_leads += record.message_leads || 0
      summary.totals.email_leads += record.email_leads || 0
      summary.totals.appointment_leads += record.appointment_leads || 0
      summary.totals.website_leads += record.website_leads || 0
      summary.totals.unique_leads += record.unique_leads || 0
      summary.totals.total_sales += record.total_sales || 0
      summary.totals.sales_value += record.sales_value || 0
      summary.totals.impression_share += record.impression_share || 0
      summary.totals.impression_saved_listing += record.impression_saved_listing || 0
      summary.totals.impression_social_media += record.impression_social_media || 0
      summary.totals.impression_website_visit += record.impression_website_visit || 0

      // Calculate averages (simple average across records)
      summary.averages.conversion_rate += record.conversion_rate || 0
      summary.averages.lead_to_sale_rate += record.lead_to_sale_rate || 0
      summary.averages.avg_sale_price += record.avg_sale_price || 0
    })

    // Calculate final averages
    Object.values(summaryByListing).forEach(summary => {
      const count = summary.total_records
      if (count > 0) {
        summary.averages.conversion_rate = Number((summary.averages.conversion_rate / count).toFixed(2))
        summary.averages.lead_to_sale_rate = Number((summary.averages.lead_to_sale_rate / count).toFixed(2))
        summary.averages.avg_sale_price = Number((summary.averages.avg_sale_price / count).toFixed(2))
      }
    })

    return NextResponse.json({
      success: true,
      summary: {
        total_records: analytics.length,
        unique_listings: Object.keys(summaryByListing).length,
        filtered_by_listing_id: listingId || null
      },
      by_listing: Object.values(summaryByListing).map(summary => ({
        ...summary,
        records: summary.records.slice(0, 10) // Only include first 10 records for response size
      })),
      raw_data: listingId ? analytics.slice(0, 20) : [] // Only include raw data if filtered
    })

  } catch (error) {
    console.error('❌ Listing analytics test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

