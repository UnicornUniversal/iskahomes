import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Helper function to get first image from media
function getFirstImage(media) {
  if (!media) return null
  
  try {
    const mediaObj = typeof media === 'string' ? JSON.parse(media) : media
    
    // Check albums array
    if (mediaObj.albums && Array.isArray(mediaObj.albums) && mediaObj.albums.length > 0) {
      const firstAlbum = mediaObj.albums[0]
      if (firstAlbum.images && Array.isArray(firstAlbum.images) && firstAlbum.images.length > 0) {
        return firstAlbum.images[0].url || null
      }
    }
    
    // Fallback to banner
    if (mediaObj.banner?.url) {
      return mediaObj.banner.url
    }
    
    // Fallback to mediaFiles
    if (mediaObj.mediaFiles && Array.isArray(mediaObj.mediaFiles) && mediaObj.mediaFiles.length > 0) {
      return mediaObj.mediaFiles[0].url || null
    }
    
    return null
  } catch (error) {
    console.error('Error parsing media:', error)
    return null
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const slug = searchParams.get('slug')
    const limit = parseInt(searchParams.get('limit')) || 10

    if (!userId && !slug) {
      return NextResponse.json(
        { error: 'User ID or slug is required' },
        { status: 400 }
      )
    }

    let finalUserId = userId
    let primaryCurrency = 'USD' // Default fallback

    // If slug provided, get user_id from developers table
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

    // Fetch sales
    const { data: sales, error: salesError } = await supabaseAdmin
      .from('sales_listings')
      .select('id, listing_id, sale_price, currency, sale_type, sale_date, sale_timestamp')
      .eq('user_id', finalUserId)
      .order('sale_price', { ascending: false })
      .limit(limit)

    if (salesError) {
      console.error('Error fetching top properties:', salesError)
      return NextResponse.json(
        { error: 'Failed to fetch top properties', details: salesError.message },
        { status: 500 }
      )
    }

    if (!sales || sales.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0
      })
    }

    // Fetch listings separately with location data
    const listingIds = sales.map(s => s.listing_id).filter(Boolean)
    let listingsMap = {}
    
    if (listingIds.length > 0) {
      const { data: listings, error: listingsError } = await supabaseAdmin
        .from('listings')
        .select('id, title, slug, price, currency, media, created_at, listing_status, city, state, country, full_address')
        .in('id', listingIds)

      if (!listingsError && listings) {
        listingsMap = listings.reduce((acc, listing) => {
          acc[listing.id] = listing
          return acc
        }, {})
      }
    }

    // Fetch listing analytics for views and leads
    let analyticsMap = {}

    if (listingIds.length > 0) {
      const { data: analytics, error: analyticsError } = await supabaseAdmin
        .from('listing_analytics')
        .select('listing_id, total_views, total_leads')
        .in('listing_id', listingIds)

      if (!analyticsError && analytics) {
        // Sum up analytics per listing (in case of multiple records)
        analytics.forEach(a => {
          if (!analyticsMap[a.listing_id]) {
            analyticsMap[a.listing_id] = { total_views: 0, total_leads: 0 }
          }
          analyticsMap[a.listing_id].total_views += a.total_views || 0
          analyticsMap[a.listing_id].total_leads += a.total_leads || 0
        })
      }
    }

    // Transform the data
    const topProperties = sales.map(sale => {
      const listing = listingsMap[sale.listing_id]
      const analytics = analyticsMap[sale.listing_id] || { total_views: 0, total_leads: 0 }
      
      // Calculate days on market
      const listedDate = listing?.created_at ? new Date(listing.created_at) : null
      const soldDate = sale.sale_date ? new Date(sale.sale_date) : null
      let daysOnMarket = null
      if (listedDate && soldDate) {
        const diffTime = Math.abs(soldDate - listedDate)
        daysOnMarket = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      }

      // Get location string
      const locationParts = []
      if (listing?.city) locationParts.push(listing.city)
      if (listing?.state) locationParts.push(listing.state)
      if (listing?.country) locationParts.push(listing.country)
      const location = locationParts.length > 0 ? locationParts.join(', ') : listing?.full_address || 'Location not available'

      return {
        id: sale.id,
        listingId: sale.listing_id,
        propertyName: listing?.title || 'Unknown Property',
        slug: listing?.slug,
        price: sale.sale_price || listing?.price || 0,
        currency: sale.currency || listing?.currency || primaryCurrency,
        dateListed: listing?.created_at ? new Date(listing.created_at).toISOString().split('T')[0] : null,
        dateSold: sale.sale_date,
        revenue: sale.sale_price || 0,
        totalViews: analytics.total_views,
        totalLeads: analytics.total_leads,
        daysOnMarket: daysOnMarket,
        saleType: sale.sale_type,
        image: getFirstImage(listing?.media),
        location: location
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: topProperties,
      total: topProperties.length
    })

  } catch (error) {
    console.error('Top properties fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

