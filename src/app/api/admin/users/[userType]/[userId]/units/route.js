import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/admin/users/developer/[userId]/units
 * Developer units only - listings where listing_type=unit, user_id=developer_id
 */
export async function GET(request, { params }) {
  try {
    const { userType, userId } = await params

    if (userType !== 'developer') {
      return NextResponse.json({ success: true, data: [] })
    }

    const publicFields = 'id, slug, listing_type, title, description, price, currency, price_type, duration, media, specifications, types, city, state, country, purposes, status, development_id, is_featured, is_verified, is_premium, available_from, created_at'

    const { data, error } = await supabaseAdmin
      .from('listings')
      .select(publicFields)
      .eq('user_id', userId)
      .eq('listing_type', 'unit')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Admin developer units error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
