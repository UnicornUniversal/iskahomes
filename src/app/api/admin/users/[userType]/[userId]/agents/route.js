import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/admin/users/agency/[agencyId]/agents
 * Agency's agents only
 */
export async function GET(request, { params }) {
  try {
    const { userType, userId } = await params

    if (userType !== 'agency') {
      return NextResponse.json({ success: true, data: [] })
    }

    const { data, error } = await supabaseAdmin
      .from('agents')
      .select('id, agent_id, name, email, phone, profile_image, bio, slug, account_status, agent_status, verified, total_listings, created_at')
      .eq('agency_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Admin agency agents error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
