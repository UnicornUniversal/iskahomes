import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listing_id') || null
    const seekerId = searchParams.get('seeker_id') || null
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = supabaseAdmin
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (listingId) {
      query = query.eq('listing_id', listingId)
    }
    if (seekerId) {
      query = query.eq('seeker_id', seekerId)
    }

    const { data: leads, error } = await query

    if (error) {
      console.error('Error fetching leads:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    // Group by listing_id and aggregate
    const summaryByListing = {}
    const summaryBySeeker = {}
    const allActions = []

    leads.forEach(lead => {
      const listingId = lead.listing_id
      const seekerId = lead.seeker_id

      // Group by listing
      if (!summaryByListing[listingId]) {
        summaryByListing[listingId] = {
          listing_id: listingId,
          lister_id: lead.lister_id,
          lister_type: lead.lister_type,
          total_lead_records: 0,
          unique_seekers: new Set(),
          total_actions: 0,
          action_types: {},
          date_range: {
            earliest: lead.first_action_date,
            latest: lead.last_action_date
          },
          status_breakdown: {},
          leads: []
        }
      }

      const listingSummary = summaryByListing[listingId]
      listingSummary.total_lead_records++
      listingSummary.unique_seekers.add(seekerId)
      listingSummary.total_actions += lead.total_actions || 0
      listingSummary.leads.push(lead)

      // Update date range
      if (lead.first_action_date && lead.first_action_date < listingSummary.date_range.earliest) {
        listingSummary.date_range.earliest = lead.first_action_date
      }
      if (lead.last_action_date && lead.last_action_date > listingSummary.date_range.latest) {
        listingSummary.date_range.latest = lead.last_action_date
      }

      // Count status
      const status = lead.status || 'unknown'
      listingSummary.status_breakdown[status] = (listingSummary.status_breakdown[status] || 0) + 1

      // Count action types
      if (lead.lead_actions && Array.isArray(lead.lead_actions)) {
        lead.lead_actions.forEach(action => {
          const actionType = action.action_type || 'unknown'
          listingSummary.action_types[actionType] = (listingSummary.action_types[actionType] || 0) + 1
          allActions.push({
            ...action,
            listing_id: listingId,
            seeker_id: seekerId,
            lister_id: lead.lister_id
          })
        })
      }

      // Group by seeker
      if (!summaryBySeeker[seekerId]) {
        summaryBySeeker[seekerId] = {
          seeker_id: seekerId,
          total_lead_records: 0,
          unique_listings: new Set(),
          total_actions: 0,
          action_types: {},
          leads: []
        }
      }

      const seekerSummary = summaryBySeeker[seekerId]
      seekerSummary.total_lead_records++
      seekerSummary.unique_listings.add(listingId)
      seekerSummary.total_actions += lead.total_actions || 0
      seekerSummary.leads.push(lead)

      if (lead.lead_actions && Array.isArray(lead.lead_actions)) {
        lead.lead_actions.forEach(action => {
          const actionType = action.action_type || 'unknown'
          seekerSummary.action_types[actionType] = (seekerSummary.action_types[actionType] || 0) + 1
        })
      }
    })

    // Convert Sets to arrays for JSON serialization
    Object.values(summaryByListing).forEach(summary => {
      summary.unique_seekers = summary.unique_seekers.size
      summary.leads = summary.leads.slice(0, 10) // Limit for response size
    })

    Object.values(summaryBySeeker).forEach(summary => {
      summary.unique_listings = summary.unique_listings.size
      summary.leads = summary.leads.slice(0, 10) // Limit for response size
    })

    return NextResponse.json({
      success: true,
      summary: {
        total_lead_records: leads.length,
        unique_listings: Object.keys(summaryByListing).length,
        unique_seekers: Object.keys(summaryBySeeker).length,
        total_actions: allActions.length,
        filtered_by_listing_id: listingId || null,
        filtered_by_seeker_id: seekerId || null
      },
      by_listing: Object.values(summaryByListing).map(summary => ({
        listing_id: summary.listing_id,
        lister_id: summary.lister_id,
        lister_type: summary.lister_type,
        total_lead_records: summary.total_lead_records,
        unique_seekers: summary.unique_seekers,
        total_actions: summary.total_actions,
        action_types: summary.action_types,
        status_breakdown: summary.status_breakdown,
        date_range: summary.date_range,
        sample_leads: summary.leads.slice(0, 5)
      })),
      by_seeker: Object.values(summaryBySeeker).map(summary => ({
        seeker_id: summary.seeker_id,
        total_lead_records: summary.total_lead_records,
        unique_listings: summary.unique_listings,
        total_actions: summary.total_actions,
        action_types: summary.action_types,
        sample_leads: summary.leads.slice(0, 5)
      })),
      recent_actions: allActions
        .sort((a, b) => new Date(b.action_timestamp) - new Date(a.action_timestamp))
        .slice(0, 20),
      raw_data: (listingId || seekerId) ? leads.slice(0, 20) : [] // Only include raw data if filtered
    })

  } catch (error) {
    console.error('❌ Leads summary test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

