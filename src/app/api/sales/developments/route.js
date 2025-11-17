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

    // Fetch all developments for this developer
    const { data: developments, error: devError } = await supabaseAdmin
      .from('developments')
      .select('id, title, slug, banner, development_status, total_units, units_sold, total_revenue')
      .eq('developer_id', finalUserId)
      .order('created_at', { ascending: false })

    if (devError) {
      console.error('Error fetching developments:', devError)
      return NextResponse.json(
        { error: 'Failed to fetch developments', details: devError.message },
        { status: 500 }
      )
    }

    if (!developments || developments.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Fetch listings for each development to get images and calculate revenue
    const developmentIds = developments.map(d => d.id)
    
    const { data: listings, error: listingsError } = await supabaseAdmin
      .from('listings')
      .select('id, development_id, media, listing_status, estimated_revenue, global_price')
      .in('development_id', developmentIds)
      .eq('account_type', 'developer')
      .eq('user_id', finalUserId)

    if (listingsError) {
      console.error('Error fetching listings:', listingsError)
    }

    // Fetch sales for revenue calculation
    const { data: sales, error: salesError } = await supabaseAdmin
      .from('sales_listings')
      .select('listing_id, sale_price')
      .eq('user_id', finalUserId)

    if (salesError) {
      console.error('Error fetching sales:', salesError)
    }

    // Create maps for quick lookup
    const listingsByDevelopment = {}
    const salesByListing = {}
    
    if (listings) {
      listings.forEach(listing => {
        if (!listingsByDevelopment[listing.development_id]) {
          listingsByDevelopment[listing.development_id] = []
        }
        listingsByDevelopment[listing.development_id].push(listing)
      })
    }

    if (sales) {
      sales.forEach(sale => {
        salesByListing[sale.listing_id] = (salesByListing[sale.listing_id] || 0) + (sale.sale_price || 0)
      })
    }

    // Process each development
    const developmentsBySale = developments.map(development => {
      const devListings = listingsByDevelopment[development.id] || []
      
      // Get first image from listings
      let coverImage = development.banner?.url || null
      if (!coverImage && devListings.length > 0) {
        // Try to get image from first listing
        for (const listing of devListings) {
          const img = getFirstImage(listing.media)
          if (img) {
            coverImage = img
            break
          }
        }
      }

      // Calculate units sold from sales_listings (most accurate)
      const soldListingIds = new Set()
      if (sales) {
        sales.forEach(sale => {
          const listing = devListings.find(l => l.id === sale.listing_id)
          if (listing) {
            soldListingIds.add(sale.listing_id)
          }
        })
      }
      
      // Also check listing_status as fallback
      const soldListingsByStatus = devListings.filter(l => 
        ['sold', 'rented'].includes(l.listing_status?.toLowerCase())
      )
      
      // Use sales_listings count first, then fallback to listing_status
      const unitsSoldFromSales = soldListingIds.size
      const unitsSoldFromStatus = soldListingsByStatus.length
      const unitsSold = unitsSoldFromSales > 0 ? unitsSoldFromSales : (development.units_sold || unitsSoldFromStatus)
      
      let calculatedRevenue = 0
      soldListingIds.forEach(listingId => {
        const saleRevenue = salesByListing[listingId] || 0
        if (saleRevenue > 0) {
          calculatedRevenue += saleRevenue
        } else {
          // Fallback to estimated revenue from listing
          const listing = devListings.find(l => l.id === listingId)
          if (listing) {
            const revenue = listing.global_price?.estimated_revenue || 
                           listing.estimated_revenue?.estimated_revenue || 
                           listing.estimated_revenue?.price || 0
            calculatedRevenue += revenue
          }
        }
      })
      const totalUnits = development.total_units || devListings.length
      const unitsLeft = Math.max(0, totalUnits - unitsSold)
      const revenue = development.total_revenue || calculatedRevenue

      // Map development_status to readable status
      const statusMap = {
        'planning': 'Planning',
        'pre_construction': 'Pre-Construction',
        'under_construction': 'Under Construction',
        'ready_for_occupancy': 'Ready for Occupancy',
        'completed': 'Completed'
      }
      const status = statusMap[development.development_status] || development.development_status || 'Unknown'

      return {
        id: development.id,
        developmentName: development.title,
        slug: development.slug,
        coverImage: coverImage,
        unitsSold: unitsSold,
        unitsLeft: unitsLeft,
        totalUnits: totalUnits,
        revenue: Math.round(revenue),
        status: status,
        currency: primaryCurrency
      }
    })

    // Sort by revenue descending
    developmentsBySale.sort((a, b) => b.revenue - a.revenue)

    return NextResponse.json({
      success: true,
      data: developmentsBySale
    })

  } catch (error) {
    console.error('Developments by sale fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

