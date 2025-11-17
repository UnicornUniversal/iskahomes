import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const limit = parseInt(searchParams.get('limit')) || 7

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Fetch recent sales for the developer/agent
    const { data: sales, error: salesError } = await supabase
      .from('sales_listings')
      .select('id, listing_id, sale_price, currency, sale_type, sale_date, sale_timestamp, created_at')
      .eq('user_id', userId)
      .order('sale_timestamp', { ascending: false })
      .limit(limit)

    if (salesError) {
      console.error('Error fetching recent sales:', salesError)
      return NextResponse.json(
        { error: 'Failed to fetch recent sales', details: salesError.message },
        { status: 500 }
      )
    }

    // Fetch listings separately if we have listing_ids
    const listingIds = sales?.filter(s => s.listing_id).map(s => s.listing_id) || []
    let listingsMap = {}
    
    if (listingIds.length > 0) {
      const { data: listings, error: listingsError } = await supabase
        .from('listings')
        .select('id, title, slug, price, currency, media')
        .in('id', listingIds)

      if (!listingsError && listings) {
        listingsMap = listings.reduce((acc, listing) => {
          acc[listing.id] = listing
          return acc
        }, {})
      }
    }

    // Transform the data
    const transformedSales = sales?.map(sale => {
      const listing = listingsMap[sale.listing_id] || null
      return {
        id: sale.id,
        listingId: sale.listing_id,
        salePrice: sale.sale_price,
        currency: sale.currency || listing?.currency || 'GHS',
        saleType: sale.sale_type,
        saleDate: sale.sale_date,
        saleTimestamp: sale.sale_timestamp,
        createdAt: sale.created_at,
        listing: listing ? {
          id: listing.id,
          title: listing.title || 'Unknown Property',
          slug: listing.slug,
          price: listing.price,
          image: listing.media?.banner?.url || 
                 listing.media?.mediaFiles?.[0]?.url || 
                 null
        } : null
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: transformedSales,
      total: transformedSales.length
    })

  } catch (error) {
    console.error('Recent sales fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

