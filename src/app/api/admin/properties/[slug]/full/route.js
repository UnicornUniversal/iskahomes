import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/admin/properties/[slug]/full
 * Full listing details - same as public get-listing but by slug, no status filter
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
        city,
        state,
        country,
        town,
        full_address,
        latitude,
        longitude,
        location_additional_information,
        amenities,
        available_from,
        available_until,
        is_featured,
        is_verified,
        is_premium,
        cancellation_policy,
        is_negotiable,
        security_requirements,
        flexible_terms,
        acquisition_rules,
        additional_information,
        size,
        status,
        pricing,
        user_id,
        account_type,
        development_id,
        purposes,
        types,
        categories,
        listing_types,
        floor_plan,
        listing_status,
        listing_condition
      `)
      .eq('slug', slug)
      .single()

    if (error || !listing) {
      return NextResponse.json({ error: 'Listing not found', details: error?.message }, { status: 404 })
    }

    const id = listing.id

    let developer = null
    let agent = null
    let agency = null

    if (listing.user_id) {
      if (listing.account_type === 'developer' || (listing.listing_type === 'unit' && !listing.account_type)) {
        const { data: devData } = await supabaseAdmin
          .from('developers')
          .select('id, developer_id, name, slug, profile_image, email, phone, secondary_email, secondary_phone, tertiary_email, tertiary_phone, website, description, total_developments, total_units, social_media, customer_care, specialization, company_size, founded_year, license_number, verified, city, region, country, address, postal_code')
          .eq('developer_id', listing.user_id)
          .single()
        developer = devData
      } else if (listing.account_type === 'agent') {
        const { data: agentData } = await supabaseAdmin
          .from('agents')
          .select('id, agent_id, agency_id, name, slug, profile_image, email, phone, secondary_email, secondary_phone, address, city, region, state, country, website, social_media')
          .eq('agent_id', listing.user_id)
          .single()
        agent = agentData
        if (agentData?.agency_id) {
          const { data: agencyData } = await supabaseAdmin
            .from('agencies')
            .select('agency_id, name, slug, profile_image, phone, email, social_media')
            .eq('agency_id', agentData.agency_id)
            .single()
          agency = agencyData
        }
      } else if (listing.account_type === 'agency') {
        const { data: agencyData } = await supabaseAdmin
          .from('agencies')
          .select('agency_id, name, slug, profile_image, email, phone, website, social_media, city, country, address')
          .eq('agency_id', listing.user_id)
          .single()
        agency = agencyData
      }
    }

    const listingTypesParsed = typeof listing.listing_types === 'string' ? (() => { try { return JSON.parse(listing.listing_types || '{}') } catch { return {} } })() : (listing.listing_types || {})
    let propertySubtypes = []
    if (listingTypesParsed?.database?.length > 0) {
      const { data: subtypes } = await supabaseAdmin
        .from('property_subtypes')
        .select('id, name, description')
        .in('id', listingTypesParsed.database)
      propertySubtypes = subtypes || []
    }

    let relatedListings = []
    if (listing.user_id) {
      const { data: related } = await supabaseAdmin
        .from('listings')
        .select('id, title, slug, listing_type, price, currency, price_type, duration, media, specifications, city, state, country')
        .eq('user_id', listing.user_id)
        .neq('id', id)
        .limit(6)
      relatedListings = related || []
    }

    let socialAmenities = null
    const { data: amenitiesData } = await supabaseAdmin
      .from('social_amenities')
      .select('*')
      .eq('listing_id', id)
      .single()
    socialAmenities = amenitiesData

    return NextResponse.json({
      success: true,
      data: {
        ...listing,
        developers: developer,
        agent,
        agency,
        propertySubtypes,
        relatedListings,
        socialAmenities
      }
    })
  } catch (error) {
    console.error('Admin property full error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
