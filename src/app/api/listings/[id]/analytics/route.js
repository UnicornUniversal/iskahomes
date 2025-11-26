import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/listings/[id]/analytics - Fetch analytics for a specific listing
export async function GET(request, { params }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const listingId = resolvedParams.id
    
    if (!listingId) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const groupBy = searchParams.get('group_by') || 'day' // day, week, month

    // Build query
    let query = supabaseAdmin
      .from('listing_analytics')
      .select('*')
      .eq('listing_id', listingId)
      .order('date', { ascending: true })

    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }

    const { data: analytics, error } = await query

    if (error) {
      console.error('Error fetching listing analytics:', error)
      return NextResponse.json(
        { error: 'Failed to fetch analytics', details: error.message },
        { status: 500 }
      )
    }

    // Calculate totals
    const totals = analytics?.reduce(
      (acc, record) => {
        acc.total_views += record.total_views || 0
        acc.unique_views += record.unique_views || 0
        acc.logged_in_views += record.logged_in_views || 0
        acc.anonymous_views += record.anonymous_views || 0
        acc.views_from_home += record.views_from_home || 0
        acc.views_from_explore += record.views_from_explore || 0
        acc.views_from_search += record.views_from_search || 0
        acc.views_from_direct += record.views_from_direct || 0
        acc.total_impressions += record.total_impressions || 0
        acc.impression_social_media += record.impression_social_media || 0
        acc.impression_website_visit += record.impression_website_visit || 0
        acc.impression_share += record.impression_share || 0
        acc.impression_saved_listing += record.impression_saved_listing || 0
        acc.total_leads += record.total_leads || 0
        acc.phone_leads += record.phone_leads || 0
        acc.message_leads += record.message_leads || 0
        acc.email_leads += record.email_leads || 0
        acc.appointment_leads += record.appointment_leads || 0
        acc.website_leads += record.website_leads || 0
        acc.unique_leads += record.unique_leads || 0
        return acc
      },
      {
        total_views: 0,
        unique_views: 0,
        logged_in_views: 0,
        anonymous_views: 0,
        views_from_home: 0,
        views_from_explore: 0,
        views_from_search: 0,
        views_from_direct: 0,
        total_impressions: 0,
        impression_social_media: 0,
        impression_website_visit: 0,
        impression_share: 0,
        impression_saved_listing: 0,
        total_leads: 0,
        phone_leads: 0,
        message_leads: 0,
        email_leads: 0,
        appointment_leads: 0,
        website_leads: 0,
        unique_leads: 0
      }
    ) || {}

    // Fetch listing meta (appointments, saved, etc.)
    const { data: listingMeta, error: metaError } = await supabaseAdmin
      .from('listings')
      .select('id, title, total_appointments, total_saved')
      .eq('id', listingId)
      .maybeSingle()

    if (metaError) {
      console.error('Error fetching listing meta:', metaError)
    }

    // Calculate conversion rate
    const conversion_rate = totals.total_views > 0 
      ? ((totals.total_leads / totals.total_views) * 100).toFixed(2)
      : 0

    return NextResponse.json({
      success: true,
      data: {
        time_series: analytics || [],
        totals: {
          ...totals,
          conversion_rate: parseFloat(conversion_rate)
        },
        meta: {
          title: listingMeta?.title || null,
          total_appointments: listingMeta?.total_appointments || 0,
          total_saved: listingMeta?.total_saved || 0
        }
      }
    })
  } catch (error) {
    console.error('Error in GET /api/listings/[id]/analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

