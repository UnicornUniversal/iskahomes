import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { captureAuditEvent } from '@/lib/auditLogger'

export async function GET(request, { params }) {
  try {
    // Await params if it's a Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams

    if (!id) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      )
    }

    console.log('Fetching listing for end user:', id)

    // Fetch the listing for end users - only display fields, no analytics
    const { data: listing, error } = await supabase
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
        3d_model,
        listing_status,
        listing_condition
      `)
      .eq('id', id)
      .eq('listing_status', 'active')
      .eq('listing_condition', 'completed')
      .single()

    if (error) {
      console.error('Error fetching listing:', error)
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Fetch owner (developer, agent, or agency) based on listing.account_type
    let developer = null
    let agent = null
    let agency = null

    if (listing.user_id) {
      if (listing.account_type === 'developer' || (listing.listing_type === 'unit' && !listing.account_type)) {
        const { data: devData, error: devError } = await supabase
          .from('developers')
          .select(`
            id,
            developer_id,
            name,
            slug,
            profile_image,
            email,
            phone,
            secondary_email,
            secondary_phone,
            tertiary_email,
            tertiary_phone,
            website,
            description,
            total_developments,
            total_units,
            social_media,
            customer_care,
            specialization,
            company_size,
            founded_year,
            license_number,
            verified,
            city,
            region,
            country,
            address,
            postal_code
          `)
          .eq('developer_id', listing.user_id)
          .single()

        if (!devError) developer = devData
      } else if (listing.account_type === 'agent') {
        const { data: agentData, error: agentError } = await supabase
          .from('agents')
          .select(`
            id,
            agent_id,
            agency_id,
            name,
            slug,
            profile_image,
            email,
            phone,
            secondary_email,
            secondary_phone,
            address,
            city,
            region,
            state,
            country,
            website,
            social_media
          `)
          .eq('agent_id', listing.user_id)
          .single()

        if (!agentError && agentData) {
          agent = agentData
          // If agent belongs to agency, fetch agency for cover/fallback
          if (agentData.agency_id) {
            const { data: agencyData, error: agencyError } = await supabase
              .from('agencies')
              .select('agency_id, name, slug, profile_image, phone, email, social_media')
              .eq('agency_id', agentData.agency_id)
              .single()
            if (!agencyError) agency = agencyData
          }
        }
      } else if (listing.account_type === 'agency') {
        const { data: agencyData, error: agencyError } = await supabase
          .from('agencies')
          .select(`
            agency_id,
            name,
            slug,
            profile_image,
            email,
            phone,
            website,
            social_media,
            city,
            country,
            address
          `)
          .eq('agency_id', listing.user_id)
          .single()

        if (!agencyError) agency = agencyData
      }
    }

    // Fetch property subtypes for listing_types.database in a single query
    let propertySubtypes = []
    if (listing.listing_types?.database?.length > 0) {
      const { data: subtypes, error: subtypesError } = await supabase
        .from('property_subtypes')
        .select('id, name, description')
        .in('id', listing.listing_types.database)

      if (!subtypesError) {
        propertySubtypes = subtypes || []
      }
    }

    // Fetch related listings by the same owner (developer or agent)
    let relatedListings = []
    if (listing.user_id) {
      const { data: related, error: relatedError } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          slug,
          listing_type,
          price,
          currency,
          price_type,
          duration,
          media,
          specifications,
          city,
          state,
          country
        `)
        .eq('user_id', listing.user_id)
        .neq('id', id)
        .limit(6)

      if (!relatedError) {
        relatedListings = related || []
      }
    }

    // Fetch social amenities for this listing
    let socialAmenities = null
    const { data: amenitiesData, error: amenitiesError } = await supabase
      .from('social_amenities')
      .select('*')
      .eq('listing_id', id)
      .single()

    if (!amenitiesError && amenitiesData) {
      socialAmenities = amenitiesData
    }

    console.log('Listing fetched successfully for end user')
    captureAuditEvent('listing_viewed', {
      user_id: listing.user_id || 'anonymous',
      user_type: listing.account_type || 'public',
      timestamp: new Date().toISOString(),
      success: true,
      api_route: '/api/get-listing/[id]',
      metadata: {
        listing_id: listing.id,
        listing_type: listing.listing_type
      }
    }, listing.user_id || 'anonymous')

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
    console.error('Get listing error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
