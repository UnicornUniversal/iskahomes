import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Featured developer plans (strong IDs, not names)
const FEATURED_DEVELOPER_PACKAGE_IDS = [
  'cc8a96fb-0a20-41af-9aa1-d68f5d1752ce', // Infinite (top-tier)
  'b6668135-af4d-42cb-a776-06a1f1c9e21f'  // Platinum (mid-tier)
]

export async function GET(request) {
  try {
    // Step 1: Get featured developer packages by ID (stronger than name matching)
    const { data: featuredPlans, error: packageError } = await supabase
      .from('subscriptions_package')
      .select('id, name, features')
      .eq('is_active', true)
      .eq('user_type', 'developers')
      .in('id', FEATURED_DEVELOPER_PACKAGE_IDS)

    if (packageError || !featuredPlans?.length) {
      if (packageError) console.error('Error fetching featured plans:', packageError)
      return NextResponse.json({ data: [] })
    }

    const packageIds = featuredPlans.map((p) => p.id)
    // Prefer "Infinite" for rank; fallback to first plan
    const rankPlan =
      featuredPlans.find((p) => p.id === FEATURED_DEVELOPER_PACKAGE_IDS[0]) ||
      featuredPlans[0]

    // Step 2: Get active subscriptions on any of these plans (main package only)
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('user_id, package_id')
      .in('package_id', packageIds)
      .eq('subscriptions_type', 'package')
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
      .eq('listing_condition', 'completed')
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

    // Step 5: Extract rank from package features (use top plan e.g. Infinite for priority)
    let rank = 0
    if (rankPlan.features && Array.isArray(rankPlan.features)) {
      const rankFeature = rankPlan.features.find(
        (f) => f.feature_name && f.feature_name.toLowerCase().includes('rank')
      )
      if (rankFeature && rankFeature.feature_value) {
        rank = parseInt(rankFeature.feature_value, 10) || 0
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

