import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/listings/slug/[slug]?listing_type=unit
function isUUID(value) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
    value
  )
}

export async function GET(request, { params }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const { slug: slugOrId } = resolvedParams || {}

    if (!slugOrId) {
      return NextResponse.json(
        { error: 'Listing slug is required' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const listingType = searchParams.get('listing_type')
    const accountType = searchParams.get('account_type')
    const status = searchParams.get('status')

    const searchField = isUUID(slugOrId) ? 'id' : 'slug'

    // Fetch all listing fields
    let query = supabaseAdmin
      .from('listings')
      .select('*')
      .eq(searchField, slugOrId)
      .limit(1)
      .maybeSingle()

    if (listingType) {
      query = query.eq('listing_type', listingType)
    }

    if (accountType) {
      query = query.eq('account_type', accountType)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: listing, error } = await query

    if (error) {
      console.error('Error fetching listing by slug:', error)
      return NextResponse.json(
        { error: 'Failed to fetch listing metadata', details: error.message },
        { status: 500 }
      )
    }

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Fetch social amenities for this listing
    let socialAmenities = null
    const { data: amenitiesData, error: amenitiesError } = await supabaseAdmin
      .from('social_amenities')
      .select('*')
      .eq('listing_id', listing.id)
      .single()

    if (!amenitiesError && amenitiesData) {
      socialAmenities = amenitiesData
    }

    return NextResponse.json({
      success: true,
      data: {
        ...listing,
        social_amenities: socialAmenities
      }
    })
  } catch (error) {
    console.error('Error in GET /api/listings/slug/[slug]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

