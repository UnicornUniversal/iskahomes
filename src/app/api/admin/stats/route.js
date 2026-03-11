import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/admin/stats
 * Returns platform totals - public counts only, no analytics
 * No auth for now - will add later
 */
export async function GET() {
  try {
    // Run count queries in parallel
    const [
      developersResult,
      agentsResult,
      agenciesResult,
      seekersResult,
      listingsResult
    ] = await Promise.all([
      supabaseAdmin.from('developers').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('agents').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('agencies').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('property_seekers').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('listing_status', 'active')
        .eq('listing_condition', 'completed')
    ])

    const stats = {
      total_developers: developersResult.count ?? 0,
      total_agents: agentsResult.count ?? 0,
      total_agencies: agenciesResult.count ?? 0,
      total_property_seekers: seekersResult.count ?? 0,
      total_listings: listingsResult.count ?? 0,
      total_users: (developersResult.count ?? 0) + (agentsResult.count ?? 0) + (agenciesResult.count ?? 0) + (seekersResult.count ?? 0)
    }

    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error.message },
      { status: 500 }
    )
  }
}
