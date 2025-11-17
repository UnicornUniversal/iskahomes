import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const developerId = searchParams.get('developer_id')

    if (!developerId) {
      return NextResponse.json(
        { error: 'Developer ID is required' },
        { status: 400 }
      )
    }

    // Fetch all development_analytics records for this developer
    // Aggregate across all developments and all time periods
    const { data: analytics, error: analyticsError } = await supabase
      .from('development_analytics')
      .select('*')
      .eq('developer_id', developerId)

    if (analyticsError) {
      return NextResponse.json(
        { error: 'Failed to fetch development analytics', details: analyticsError?.message },
        { status: 500 }
      )
    }

    if (!analytics || analytics.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          development: {
            total_views: 0,
            total_leads: 0,
            total_sales: 0,
            sales_value: 0
          },
          stats: {
            views: [],
            leads: [],
            sales: []
          }
        }
      })
    }

    // Aggregate analytics metrics across all developments
    const aggregated = {
      total_views: 0,
      unique_views: 0,
      logged_in_views: 0,
      anonymous_views: 0,
      views_from_home: 0,
      views_from_explore: 0,
      views_from_search: 0,
      views_from_direct: 0,
      total_leads: 0,
      phone_leads: 0,
      message_leads: 0,
      email_leads: 0,
      appointment_leads: 0,
      website_leads: 0,
      unique_leads: 0,
      total_sales: 0,
      sales_value: 0,
      total_shares: 0,
      saved_count: 0,
      social_media_clicks: 0
    }

    // Track unique developments
    const developmentIds = new Set()

    analytics.forEach(record => {
      developmentIds.add(record.development_id)
      
      aggregated.total_views += record.total_views || 0
      aggregated.unique_views += record.unique_views || 0
      aggregated.logged_in_views += record.logged_in_views || 0
      aggregated.anonymous_views += record.anonymous_views || 0
      aggregated.views_from_home += record.views_from_home || 0
      aggregated.views_from_explore += record.views_from_explore || 0
      aggregated.views_from_search += record.views_from_search || 0
      aggregated.views_from_direct += record.views_from_direct || 0
      aggregated.total_leads += record.total_leads || 0
      aggregated.phone_leads += record.phone_leads || 0
      aggregated.message_leads += record.message_leads || 0
      aggregated.email_leads += record.email_leads || 0
      aggregated.appointment_leads += record.appointment_leads || 0
      aggregated.website_leads += record.website_leads || 0
      aggregated.unique_leads += record.unique_leads || 0
      aggregated.total_sales += record.total_sales || 0
      aggregated.sales_value += parseFloat(record.sales_value || 0)
      aggregated.total_shares += record.total_shares || 0
      aggregated.saved_count += record.saved_count || 0
      aggregated.social_media_clicks += record.social_media_clicks || 0
    })

    // Calculate percentages for leads breakdown
    const leadTotal = aggregated.total_leads
    const leadBreakdown = [
      {
        name: 'Phone Leads',
        label: 'Phone',
        value: aggregated.phone_leads,
        percentage: leadTotal > 0 ? parseFloat(((aggregated.phone_leads / leadTotal) * 100).toFixed(2)) : 0
      },
      {
        name: 'Message Leads',
        label: 'Message',
        value: aggregated.message_leads,
        percentage: leadTotal > 0 ? parseFloat(((aggregated.message_leads / leadTotal) * 100).toFixed(2)) : 0
      },
      {
        name: 'Email Leads',
        label: 'Email',
        value: aggregated.email_leads,
        percentage: leadTotal > 0 ? parseFloat(((aggregated.email_leads / leadTotal) * 100).toFixed(2)) : 0
      },
      {
        name: 'Appointment Leads',
        label: 'Appointment',
        value: aggregated.appointment_leads,
        percentage: leadTotal > 0 ? parseFloat(((aggregated.appointment_leads / leadTotal) * 100).toFixed(2)) : 0
      },
      {
        name: 'Website Leads',
        label: 'Website',
        value: aggregated.website_leads,
        percentage: leadTotal > 0 ? parseFloat(((aggregated.website_leads / leadTotal) * 100).toFixed(2)) : 0
      }
    ].filter(item => item.value > 0)

    // Calculate percentages for views breakdown
    const viewTotal = aggregated.total_views
    const viewsBreakdown = [
      {
        name: 'Home Page',
        label: 'Home',
        value: aggregated.views_from_home,
        percentage: viewTotal > 0 ? parseFloat(((aggregated.views_from_home / viewTotal) * 100).toFixed(2)) : 0
      },
      {
        name: 'Explore Page',
        label: 'Explore',
        value: aggregated.views_from_explore,
        percentage: viewTotal > 0 ? parseFloat(((aggregated.views_from_explore / viewTotal) * 100).toFixed(2)) : 0
      },
      {
        name: 'Search Results',
        label: 'Search',
        value: aggregated.views_from_search,
        percentage: viewTotal > 0 ? parseFloat(((aggregated.views_from_search / viewTotal) * 100).toFixed(2)) : 0
      },
      {
        name: 'Direct URL',
        label: 'Direct',
        value: aggregated.views_from_direct,
        percentage: viewTotal > 0 ? parseFloat(((aggregated.views_from_direct / viewTotal) * 100).toFixed(2)) : 0
      }
    ].filter(item => item.value > 0)

    // Calculate conversion rate
    const conversionRate = aggregated.total_views > 0 
      ? parseFloat(((aggregated.total_leads / aggregated.total_views) * 100).toFixed(2))
      : 0

    // Calculate lead to sale rate
    const leadToSaleRate = aggregated.total_leads > 0
      ? parseFloat(((aggregated.total_sales / aggregated.total_leads) * 100).toFixed(2))
      : 0

    return NextResponse.json({
      success: true,
      data: {
        development: {
          total_views: aggregated.total_views,
          total_leads: aggregated.total_leads,
          total_sales: aggregated.total_sales,
          sales_value: aggregated.sales_value,
          conversion_rate: conversionRate,
          lead_to_sale_rate: leadToSaleRate,
          total_developments: developmentIds.size
        },
        stats: {
          views: viewsBreakdown,
          leads: leadBreakdown,
          engagement: [
            {
              name: 'Total Shares',
              label: 'Shares',
              value: aggregated.total_shares,
              percentage: 0
            },
            {
              name: 'Saved Count',
              label: 'Saved',
              value: aggregated.saved_count,
              percentage: 0
            },
            {
              name: 'Social Media Clicks',
              label: 'Social Clicks',
              value: aggregated.social_media_clicks,
              percentage: 0
            }
          ].filter(item => item.value > 0)
        }
      }
    })

  } catch (error) {
    console.error('Error fetching development stats:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

