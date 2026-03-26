import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit')) || 10
    const scope = searchParams.get('scope') || 'listings'

    if (!query || query.trim().length < 1) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    const searchTerm = query.toLowerCase().trim()

    const locationMap = new Map()

    const addLocationsToMap = (rows = []) => {
      rows.forEach((row) => {
        if (row.country && row.country.toLowerCase().includes(searchTerm)) {
          const key = `country-${row.country}`
          if (!locationMap.has(key)) {
            locationMap.set(key, {
              value: row.country,
              type: 'country',
              label: row.country
            })
          }
        }

        if (row.state && row.state.toLowerCase().includes(searchTerm)) {
          const key = `state-${row.state}`
          if (!locationMap.has(key)) {
            locationMap.set(key, {
              value: row.state,
              type: 'state',
              label: row.state
            })
          }
        }

        if (row.city && row.city.toLowerCase().includes(searchTerm)) {
          const key = `city-${row.city}`
          if (!locationMap.has(key)) {
            locationMap.set(key, {
              value: row.city,
              type: 'city',
              label: row.city
            })
          }
        }

        if (row.town && row.town.toLowerCase().includes(searchTerm)) {
          const key = `town-${row.town}`
          if (!locationMap.has(key)) {
            locationMap.set(key, {
              value: row.town,
              type: 'town',
              label: row.town
            })
          }
        }
      })
    }

    const shouldSearchListings = scope === 'listings' || scope === 'all'
    const shouldSearchDevelopments = scope === 'developments' || scope === 'all'

    if (shouldSearchListings) {
      const { data: listings, error } = await supabase
        .from('listings')
        .select('country, state, city, town')
        .eq('listing_status', 'active')
        .or(`country.ilike.%${searchTerm}%,state.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,town.ilike.%${searchTerm}%`)
        .limit(100)

      if (error) {
        console.error('Error searching listing locations:', error)
        return NextResponse.json(
          { error: 'Failed to search locations', details: error.message },
          { status: 500 }
        )
      }

      addLocationsToMap(listings)
    }

    if (shouldSearchDevelopments) {
      const { data: developments, error } = await supabase
        .from('developments')
        .select('country, state, city, town')
        .eq('development_status', 'active')
        .or(`country.ilike.%${searchTerm}%,state.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,town.ilike.%${searchTerm}%,full_address.ilike.%${searchTerm}%`)
        .limit(100)

      if (error) {
        console.error('Error searching development locations:', error)
        return NextResponse.json(
          { error: 'Failed to search locations', details: error.message },
          { status: 500 }
        )
      }

      addLocationsToMap(developments)
    }

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

