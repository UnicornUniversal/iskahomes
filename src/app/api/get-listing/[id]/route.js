import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

    // Fetch the listing for end users (no developer joins, just basic listing data)
    const { data: listing, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching listing:', error)
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // If it's a unit, fetch developer details separately for end users
    let developer = null
    if (listing.listing_type === 'unit' && listing.user_id) {
      const { data: devData, error: devError } = await supabase
        .from('developers')
        .select(`
          id,
          developer_id,
          name,
          slug,
          profile_image,
          cover_image,
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

      if (!devError) {
        developer = devData
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

    // Fetch related listings by the same developer (for units)
    let relatedListings = []
    if (listing.listing_type === 'unit' && listing.user_id) {
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

    return NextResponse.json({
      success: true,
      data: {
        ...listing,
        developers: developer,
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
