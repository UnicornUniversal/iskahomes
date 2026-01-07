import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const typeId = searchParams.get('type_id')

    if (!typeId) {
      return NextResponse.json(
        { error: 'type_id parameter is required' },
        { status: 400 }
      )
    }

    // Fetch listings that contain this type_id in their types array
    const { data: listings, error } = await supabase
      .from('listings')
      .select(`
        id,
        title,
        slug,
        description,
        price,
        currency,
        price_type,
        duration,
        listing_type,
        specifications,
        types,
        purposes,
        categories,
        media,
        city,
        state,
        country,
        town,
        full_address,
        status,
        is_featured,
        is_verified,
        is_premium,
        available_from,
        created_at
      `)
      .eq('listing_status', 'active')
      .eq('listing_condition', 'completed')
      .filter('types', 'cs', `["${typeId}"]`) // Contains operator for JSONB array
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Error fetching listings by type:', error)
      return NextResponse.json(
        { error: 'Failed to fetch listings', details: error.message },
        { status: 500 }
      )
    }

    // Fetch purpose names for the listings
    const purposeIds = new Set()
    listings?.forEach(listing => {
      if (listing.purposes) {
        let ids = []
        if (Array.isArray(listing.purposes)) {
          ids = listing.purposes
        } else if (typeof listing.purposes === 'string') {
          try {
            ids = JSON.parse(listing.purposes)
          } catch (e) {
            // Ignore parse errors
          }
        }
        ids.forEach(id => purposeIds.add(id))
      }
    })

    let purposesMap = {}
    if (purposeIds.size > 0) {
      const { data: purposes, error: purposesError } = await supabase
        .from('property_purposes')
        .select('id, name')
        .in('id', Array.from(purposeIds))

      if (!purposesError && purposes) {
        purposes.forEach(purpose => {
          purposesMap[purpose.id] = purpose.name
        })
      }
    }

    // Process listings to include purpose_name
    const processedListings = (listings || []).map(listing => {
      // Get first purpose name
      let purposeName = null
      let purposeNames = []
      
      if (listing.purposes) {
        let ids = []
        if (Array.isArray(listing.purposes)) {
          ids = listing.purposes
        } else if (typeof listing.purposes === 'string') {
          try {
            ids = JSON.parse(listing.purposes)
          } catch (e) {
            // Ignore
          }
        }
        
        purposeNames = ids.map(id => purposesMap[id]).filter(Boolean)
        purposeName = purposeNames[0] || null
      }

      return {
        ...listing,
        purpose_name: purposeName,
        purpose_names: purposeNames
      }
    })

    return NextResponse.json({
      success: true,
      data: processedListings,
      count: processedListings.length
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

