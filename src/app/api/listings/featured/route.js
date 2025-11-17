import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    // Step 1: Get Infinity Plan package ID
    const { data: infinityPlan, error: packageError } = await supabase
      .from('subscriptions_package')
      .select('id, name, features')
      .eq('name', 'Infinity Plan')
      .eq('is_active', true)
      .single()

    if (packageError || !infinityPlan) {
      console.error('Error fetching Infinity Plan:', packageError)
      return NextResponse.json({ data: [] })
    }

    // Step 2: Get active subscriptions with Infinity Plan
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('user_id, package_id')
      .eq('package_id', infinityPlan.id)
      .eq('status', 'active')
      .eq('user_type', 'developer')

    if (subError) {
      console.error('Error fetching subscriptions:', subError)
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions', details: subError.message },
        { status: 500 }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Extract user IDs
    const userIds = subscriptions.map(sub => sub.user_id)

    // Step 3: Fetch listings for these users
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select(`
        id,
        title,
        media,
        price,
        currency,
        price_type,
        duration,
        purposes,
        user_id,
        city,
        state,
        country,
        town,
        full_address,
        specifications,
        listing_type
      `)
      .eq('listing_status', 'active')
      .eq('status', 'Available')
      .in('user_id', userIds)
      .limit(20) // Fetch more to account for filtering

    if (listingsError) {
      console.error('Error fetching listings:', listingsError)
      return NextResponse.json(
        { error: 'Failed to fetch listings', details: listingsError.message },
        { status: 500 }
      )
    }

    if (!listings || listings.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Step 4: Extract purpose IDs and fetch purpose names
    const purposeIds = new Set()
    listings.forEach(listing => {
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

    // Fetch purpose names from property_purposes table
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

    // Step 5: Extract rank from package features
    let rank = 0
    if (infinityPlan.features && Array.isArray(infinityPlan.features)) {
      const rankFeature = infinityPlan.features.find(
        f => f.feature_name && f.feature_name.toLowerCase().includes('rank')
      )
      if (rankFeature && rankFeature.feature_value) {
        rank = parseInt(rankFeature.feature_value) || 0
      }
    }

    // Step 6: Process listings and format response
    const processedListings = listings.map(listing => {
      // Get first purpose name
      let purposeName = null
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
        if (ids.length > 0 && purposesMap[ids[0]]) {
          purposeName = purposesMap[ids[0]]
        }
      }

      return {
        id: listing.id,
        name: listing.title,
        media: listing.media,
        price: listing.price,
        currency: listing.currency,
        price_type: listing.price_type,
        duration: listing.duration,
        purpose: purposeName,
        rank: rank,
        city: listing.city,
        state: listing.state,
        country: listing.country,
        town: listing.town,
        full_address: listing.full_address,
        specifications: listing.specifications,
        listing_type: listing.listing_type
      }
    })

    // Step 7: Sort by rank (descending - higher rank first) and limit to 5
    processedListings.sort((a, b) => b.rank - a.rank)
    const finalListings = processedListings.slice(0, 5)

    return NextResponse.json({ data: finalListings })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

