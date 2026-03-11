import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/admin/properties/[slug]
 * Get single listing by slug - public info only
 */
export async function GET(request, { params }) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json({ error: 'Slug required' }, { status: 400 })
    }

    const { data: listing, error } = await supabaseAdmin
      .from('listings')
      .select(`
        id,
        slug,
        listing_type,
        title,
        description,
        price,
        currency,
        price_type,
        duration,
        media,
        specifications,
        types,
        city,
        state,
        country,
        town,
        full_address,
        purposes,
        status,
        is_featured,
        is_verified,
        is_premium,
        available_from,
        user_id,
        listing_agency_id,
        development_id,
        listing_status,
        listing_condition,
        created_at
      `)
      .eq('slug', slug)
      .single()

    if (error || !listing) {
      return NextResponse.json({ error: 'Listing not found', details: error?.message }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: listing })
  } catch (error) {
    console.error('Admin property detail error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/properties/[slug]
 * Update listing status (listing_status, listing_condition)
 */
export async function PATCH(request, { params }) {
  try {
    const { slug } = await params
    if (!slug) return NextResponse.json({ error: 'Slug required' }, { status: 400 })

    const body = await request.json()
    const { listing_status, listing_condition } = body
    const updateData = {}
    if (listing_status !== undefined) updateData.listing_status = listing_status
    if (listing_condition !== undefined) updateData.listing_condition = listing_condition

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('listings')
      .update(updateData)
      .eq('slug', slug)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Admin property update error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
