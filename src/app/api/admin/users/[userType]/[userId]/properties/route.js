import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/admin/users/[userType]/[userId]/properties
 * Get user's properties/listings - public info only
 * Developers: listings where user_id = developer_id, or developments
 * Agents: listings where user_id = agent_id
 * Agencies: listings where listing_agency_id = agency_id
 * Property seekers: no properties (return empty)
 */
export async function GET(request, { params }) {
  try {
    const { userType, userId } = await params

    if (userType === 'property_seeker') {
      return NextResponse.json({ success: true, data: [] })
    }

    const publicFields = 'id, slug, listing_type, title, description, price, currency, price_type, duration, media, specifications, types, city, state, country, purposes, status, is_featured, is_verified, is_premium, available_from, created_at'

    if (userType === 'agent') {
      const { data, error } = await supabaseAdmin
        .from('listings')
        .select(publicFields)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      return NextResponse.json({ success: true, data: data || [] })
    }

    if (userType === 'agency') {
      const { data, error } = await supabaseAdmin
        .from('listings')
        .select(publicFields)
        .eq('listing_agency_id', userId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      return NextResponse.json({ success: true, data: data || [] })
    }

    if (userType === 'developer') {
      // Developer: listings with user_id = developer_id, or from developments
      const { data: directListings, error: directError } = await supabaseAdmin
        .from('listings')
        .select(publicFields)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (directError) throw directError

      // Also get developments (developer's projects)
      const { data: developments, error: devError } = await supabaseAdmin
        .from('developments')
        .select('id, slug, title, description, city, state, country, development_status, total_units, created_at')
        .eq('developer_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (!devError && developments?.length) {
        return NextResponse.json({
          success: true,
          data: directListings || [],
          developments: developments
        })
      }

      return NextResponse.json({ success: true, data: directListings || [], developments: [] })
    }

    return NextResponse.json({ success: true, data: [] })
  } catch (error) {
    console.error('Admin user properties error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
