import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit')) || 10

    if (!query || query.trim().length < 1) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    const searchTerm = query.toLowerCase().trim()

    // Search across all location fields in listings
    const { data: listings, error } = await supabase
      .from('listings')
      .select('country, state, city, town')
      .eq('listing_status', 'active')
      .or(`country.ilike.%${searchTerm}%,state.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,town.ilike.%${searchTerm}%`)
      .limit(100) // Get more results to deduplicate

    if (error) {
      console.error('Error searching locations:', error)
      return NextResponse.json(
        { error: 'Failed to search locations', details: error.message },
        { status: 500 }
      )
    }

    // Deduplicate and format results
    const locationMap = new Map()
    
    listings?.forEach(listing => {
      // Add country
      if (listing.country && listing.country.toLowerCase().includes(searchTerm)) {
        const key = `country-${listing.country}`
        if (!locationMap.has(key)) {
          locationMap.set(key, {
            value: listing.country,
            type: 'country',
            label: listing.country
          })
        }
      }

      // Add state
      if (listing.state && listing.state.toLowerCase().includes(searchTerm)) {
        const key = `state-${listing.state}`
        if (!locationMap.has(key)) {
          locationMap.set(key, {
            value: listing.state,
            type: 'state',
            label: listing.state
          })
        }
      }

      // Add city
      if (listing.city && listing.city.toLowerCase().includes(searchTerm)) {
        const key = `city-${listing.city}`
        if (!locationMap.has(key)) {
          locationMap.set(key, {
            value: listing.city,
            type: 'city',
            label: listing.city
          })
        }
      }

      // Add town
      if (listing.town && listing.town.toLowerCase().includes(searchTerm)) {
        const key = `town-${listing.town}`
        if (!locationMap.has(key)) {
          locationMap.set(key, {
            value: listing.town,
            type: 'town',
            label: listing.town
          })
        }
      }
    })

    // Convert to array and sort by type priority (country > state > city > town)
    const results = Array.from(locationMap.values())
      .sort((a, b) => {
        const typeOrder = { country: 0, state: 1, city: 2, town: 3 }
        return typeOrder[a.type] - typeOrder[b.type]
      })
      .slice(0, limit)

    return NextResponse.json({
      success: true,
      data: results
    })

  } catch (error) {
    console.error('Location search error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

