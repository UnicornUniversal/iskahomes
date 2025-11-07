import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract filter parameters
    const purposeId = searchParams.get('purpose_id')
    const propertyTypeId = searchParams.get('property_type_id')
    const categoryId = searchParams.get('category_id')
    const subtypeId = searchParams.get('subtype_id')
    const country = searchParams.get('country')
    const state = searchParams.get('state')
    const city = searchParams.get('city')
    const town = searchParams.get('town')
    const priceMin = searchParams.get('price_min')
    const priceMax = searchParams.get('price_max')
    const bedrooms = searchParams.get('bedrooms')
    const bathrooms = searchParams.get('bathrooms')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    const offset = (page - 1) * limit

    // Build the query - simple fetch without foreign keys
    let query = supabase
      .from('listings')
      .select(`
        id,
        title,
        slug,
        description,
        price,
        currency,
        duration,
        price_type,
        listing_type,
        specifications,
        country,
        state,
        city,
        town,
        latitude,
        longitude,
        media,
        listing_status,
        is_featured,
        is_verified,
        is_premium,
        created_at,
        purposes,
        types,
        categories,
        listing_types
      `)
      .eq('listing_status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (purposeId) {
      query = query.contains('purposes', [purposeId])
    }
    
    if (propertyTypeId) {
      query = query.contains('types', [propertyTypeId])
    }
    
    if (categoryId) {
      query = query.contains('categories', [categoryId])
    }
    
    if (subtypeId) {
      query = query.contains('listing_types.database', [subtypeId])
    }
    
    if (country) {
      query = query.eq('country', country)
    }
    
    if (state) {
      query = query.eq('state', state)
    }
    
    if (city) {
      query = query.eq('city', city)
    }
    
    if (town) {
      query = query.eq('town', town)
    }
    
    if (priceMin) {
      query = query.gte('price', parseFloat(priceMin))
    }
    
    if (priceMax) {
      query = query.lte('price', parseFloat(priceMax))
    }
    
    if (bedrooms) {
      query = query.gte('specifications->bedrooms', parseInt(bedrooms))
    }
    
    if (bathrooms) {
      query = query.gte('specifications->bathrooms', parseInt(bathrooms))
    }

    const { data: listings, error, count } = await query

    if (error) {
      console.error('Error fetching listings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch listings', details: error.message },
        { status: 500 }
      )
    }

    // Transform the data to match the expected format
    const transformedListings = listings?.map(listing => ({
      id: listing.id,
      slug: listing.slug,
      propertyName: listing.title,
      description: listing.description,
      price: parseFloat(listing.price) || 0,
      currency: listing.currency || 'GHS',
      duration: listing.duration || 'monthly',
      priceType: listing.price_type || 'rent',
      listingType: listing.listing_type,
      categorization: {
        purpose: 'Rent', // Default purpose since we're not joining
        type: 'Property', // Default type
        category: 'Residential', // Default category
        subtype: 'Apartment' // Default subtype
      },
      details: {
        bedrooms: listing.specifications?.bedrooms || 0,
        washrooms: listing.specifications?.bathrooms || 0,
        areaSqFt: listing.specifications?.property_size || 0,
        areaSqm: Math.round((listing.specifications?.property_size || 0) * 0.092903),
        area: listing.specifications?.property_size || 0,
        floorArea: listing.specifications?.property_size || 0
      },
      address: {
        state: listing.state || '',
        city: listing.city || '',
        neighborhood: listing.town || '',
        country: listing.country || ''
      },
      latitude: listing.latitude,
      longitude: listing.longitude,
      projectImages: listing.media?.mediaFiles?.map(file => file.url) || [],
      isFeatured: listing.is_featured || false,
      isVerified: listing.is_verified || false,
      isPremium: listing.is_premium || false,
      createdAt: listing.created_at
    })) || []

    return NextResponse.json({
      success: true,
      data: transformedListings,
      pagination: {
        page,
        limit,
        total: count || transformedListings.length,
        hasMore: transformedListings.length === limit
      }
    })

  } catch (error) {
    console.error('Listings fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
