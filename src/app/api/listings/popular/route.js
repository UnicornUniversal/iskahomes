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

    // Fetch popular listings for the user, sorted by total_views
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('id, title, slug, price, currency, media, total_views, city, state, country, town, full_address, listing_status, listing_type')
      .eq('user_id', userId)
      .eq('listing_status', 'active')
      .order('total_views', { ascending: false })
      .limit(limit)

    if (listingsError) {
      console.error('Error fetching popular listings:', listingsError)
      return NextResponse.json(
        { error: 'Failed to fetch popular listings', details: listingsError.message },
        { status: 500 }
      )
    }

    // Transform the data to include image URL
    const transformedListings = listings?.map(listing => {
      let imageUrl = null
      if (listing.media) {
        try {
          const media = typeof listing.media === 'string' ? JSON.parse(listing.media) : listing.media
          
          // Handle new media structure with albums
          if (media && typeof media === 'object') {
            // Check for albums array
            if (media.albums && Array.isArray(media.albums) && media.albums.length > 0) {
              // Get the first album (usually the default one)
              const firstAlbum = media.albums[0]
              if (firstAlbum.images && Array.isArray(firstAlbum.images) && firstAlbum.images.length > 0) {
                // Get the first image from the first album
                imageUrl = firstAlbum.images[0].url
              }
            }
            // Fallback: check for direct url property
            else if (media.url) {
              imageUrl = media.url
            }
            // Fallback: check if media itself is an array
            else if (Array.isArray(media) && media.length > 0) {
              imageUrl = media[0].url || media[0]
            }
          }
        } catch {
          // If parsing fails, try to use media directly as string
          imageUrl = typeof listing.media === 'string' ? listing.media : null
        }
      }

      return {
        id: listing.id,
        title: listing.title,
        slug: listing.slug,
        price: listing.price,
        currency: listing.currency,
        image: imageUrl,
        total_views: listing.total_views || 0,
        city: listing.city,
        state: listing.state,
        country: listing.country,
        town: listing.town,
        full_address: listing.full_address,
        listing_status: listing.listing_status,
        listing_type: listing.listing_type
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: transformedListings
    })

  } catch (error) {
    console.error('Error fetching popular listings:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

