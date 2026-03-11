import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/admin/properties?search=&status=&page=1&limit=20
 * List all listings - public info only
 * No auth for now
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page')) || 1
    const limit = Math.min(parseInt(searchParams.get('limit')) || 20, 100)
    const offset = (page - 1) * limit

    const publicFields = 'id, slug, listing_type, title, description, price, currency, price_type, duration, media, specifications, types, city, state, country, purposes, status, is_featured, is_verified, is_premium, available_from, created_at, user_id, listing_agency_id'

    let query = supabaseAdmin
      .from('listings')
      .select(publicFields, { count: 'exact' })
      .eq('listing_status', 'active')
      .eq('listing_condition', 'completed')
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%`)
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        pages: Math.ceil((count ?? 0) / limit)
      }
    })
  } catch (error) {
    console.error('Admin properties error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
