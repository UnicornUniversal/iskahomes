import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const slug = searchParams.get('slug')

    if (!userId && !slug) {
      return NextResponse.json(
        { error: 'User ID or slug is required' },
        { status: 400 }
      )
    }

    let finalUserId = userId
    let primaryCurrency = 'USD' // Default fallback

    if (slug && !userId) {
      const { data: developer, error: devError } = await supabaseAdmin
        .from('developers')
        .select('developer_id, company_locations, default_currency')
        .eq('slug', slug)
        .single()

      if (devError || !developer) {
        return NextResponse.json(
          { error: 'Developer not found' },
          { status: 404 }
        )
      }

      finalUserId = developer.developer_id
      
      // Get primary currency
      if (developer.company_locations && Array.isArray(developer.company_locations)) {
        const primaryLocation = developer.company_locations.find(
          loc => loc.primary_location === true || loc.primary_location === 'true'
        )
        if (primaryLocation?.currency) {
          primaryCurrency = primaryLocation.currency
        }
      }
      
      if (primaryCurrency === 'USD' && developer.default_currency) {
        let defaultCurrency = developer.default_currency
        if (typeof defaultCurrency === 'string') {
          try {
            defaultCurrency = JSON.parse(defaultCurrency)
          } catch (e) {
            // Ignore parse error
          }
        }
        if (defaultCurrency?.code) {
          primaryCurrency = defaultCurrency.code
        }
      }
    } else if (userId) {
      // Get primary currency for user_id
      const { data: developer } = await supabaseAdmin
        .from('developers')
        .select('company_locations, default_currency')
        .eq('developer_id', userId)
        .single()
      
      if (developer) {
        if (developer.company_locations && Array.isArray(developer.company_locations)) {
          const primaryLocation = developer.company_locations.find(
            loc => loc.primary_location === true || loc.primary_location === 'true'
          )
          if (primaryLocation?.currency) {
            primaryCurrency = primaryLocation.currency
          }
        }
        
        if (primaryCurrency === 'USD' && developer.default_currency) {
          let defaultCurrency = developer.default_currency
          if (typeof defaultCurrency === 'string') {
            try {
              defaultCurrency = JSON.parse(defaultCurrency)
            } catch (e) {
              // Ignore parse error
            }
          }
          if (defaultCurrency?.code) {
            primaryCurrency = defaultCurrency.code
          }
        }
      }
    }

    // Fetch sales with listing location data
    const { data: sales, error: salesError } = await supabaseAdmin
      .from('sales_listings')
      .select('id, listing_id, sale_price, sale_date, sale_type')
      .eq('user_id', finalUserId)

    if (salesError) {
      console.error('Error fetching sales:', salesError)
      return NextResponse.json(
        { error: 'Failed to fetch sales', details: salesError.message },
        { status: 500 }
      )
    }

    if (!sales || sales.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          locations: [],
          byCountry: [],
          byState: [],
          byCity: [],
          byTown: []
        }
      })
    }

    // Fetch listings with location data
    const listingIds = sales.map(s => s.listing_id).filter(Boolean)
    const { data: listings, error: listingsError } = await supabaseAdmin
      .from('listings')
      .select('id, country, state, city, town, latitude, longitude, full_address')
      .in('id', listingIds)

    if (listingsError) {
      console.error('Error fetching listings:', listingsError)
    }

    // Create maps for quick lookup
    const listingsMap = {}
    if (listings) {
      listings.forEach(listing => {
        listingsMap[listing.id] = listing
      })
    }

    // Aggregate by location
    const locationsMap = {}
    const byCountry = {}
    const byState = {}
    const byCity = {}
    const byTown = {}

    sales.forEach(sale => {
      const listing = listingsMap[sale.listing_id]
      if (!listing) return

      const country = listing.country || 'Unknown'
      const state = listing.state || 'Unknown'
      const city = listing.city || 'Unknown'
      const town = listing.town || 'Unknown'
      const locationKey = `${country}|${state}|${city}|${town}`

      // Aggregate by location key
      if (!locationsMap[locationKey]) {
        locationsMap[locationKey] = {
          country,
          state,
          city,
          town,
          latitude: listing.latitude ? parseFloat(listing.latitude) : null,
          longitude: listing.longitude ? parseFloat(listing.longitude) : null,
          full_address: listing.full_address,
          sales_count: 0,
          revenue: 0,
          sales: []
        }
      }

      locationsMap[locationKey].sales_count++
      locationsMap[locationKey].revenue += (sale.sale_price || 0)
      locationsMap[locationKey].sales.push({
        id: sale.id,
        sale_price: sale.sale_price,
        sale_date: sale.sale_date,
        sale_type: sale.sale_type
      })

      // Aggregate by country
      if (!byCountry[country]) {
        byCountry[country] = { name: country, sales_count: 0, revenue: 0 }
      }
      byCountry[country].sales_count++
      byCountry[country].revenue += (sale.sale_price || 0)

      // Aggregate by state
      const stateKey = `${country}|${state}`
      if (!byState[stateKey]) {
        byState[stateKey] = { country, state, sales_count: 0, revenue: 0 }
      }
      byState[stateKey].sales_count++
      byState[stateKey].revenue += (sale.sale_price || 0)

      // Aggregate by city
      const cityKey = `${country}|${state}|${city}`
      if (!byCity[cityKey]) {
        byCity[cityKey] = { country, state, city, sales_count: 0, revenue: 0 }
      }
      byCity[cityKey].sales_count++
      byCity[cityKey].revenue += (sale.sale_price || 0)

      // Aggregate by town
      const townKey = `${country}|${state}|${city}|${town}`
      if (!byTown[townKey]) {
        byTown[townKey] = { country, state, city, town, sales_count: 0, revenue: 0 }
      }
      byTown[townKey].sales_count++
      byTown[townKey].revenue += (sale.sale_price || 0)
    })

    // Convert to arrays and sort
    const locations = Object.values(locationsMap)
      .filter(loc => loc.latitude && loc.longitude)
      .sort((a, b) => b.revenue - a.revenue)

    const countryArray = Object.values(byCountry)
      .sort((a, b) => b.revenue - a.revenue)

    const stateArray = Object.values(byState)
      .sort((a, b) => b.revenue - a.revenue)

    const cityArray = Object.values(byCity)
      .sort((a, b) => b.revenue - a.revenue)

    const townArray = Object.values(byTown)
      .filter(t => t.town !== 'Unknown')
      .sort((a, b) => b.revenue - a.revenue)

    return NextResponse.json({
      success: true,
      data: {
        locations,
        byCountry: countryArray,
        byState: stateArray,
        byCity: cityArray,
        byTown: townArray,
        currency: primaryCurrency
      }
    })

  } catch (error) {
    console.error('Sales by location fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

