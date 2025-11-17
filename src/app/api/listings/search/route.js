import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Debug: Log all query parameters
    console.log('🔍 Search API - Query Parameters:', Object.fromEntries(searchParams.entries()))
    
    // Extract filter parameters
    // Support both single values and arrays
    const purposeId = searchParams.get('purpose_id')
    const purposeIds = searchParams.getAll('purpose_id')
    const propertyTypeId = searchParams.get('property_type_id')
    const categoryId = searchParams.get('category_id')
    const subtypeId = searchParams.get('subtype_id')
    const subtypeIds = searchParams.getAll('subtype_id')
    const country = searchParams.get('country')
    const state = searchParams.get('state')
    const city = searchParams.get('city')
    const town = searchParams.get('town')
    const priceMin = searchParams.get('price_min')
    const priceMax = searchParams.get('price_max')
    const specificationsParam = searchParams.get('specifications') // JSON string of specifications object
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 15
    const offset = (page - 1) * limit
    
    // Parse specifications object if provided
    let specifications = {}
    if (specificationsParam) {
      try {
        specifications = JSON.parse(specificationsParam)
        console.log('📋 Parsed specifications:', specifications)
      } catch (e) {
        console.error('Error parsing specifications:', e)
      }
    }

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
        status,
        is_featured,
        is_verified,
        is_premium,
        created_at,
        available_from,
        purposes,
        types,
        categories,
        listing_types
      `, { count: 'exact' })
      .eq('listing_status', 'active')

    // Apply filters - purposes, types, categories are JSONB arrays of UUID strings
    // Use Supabase's contains method to check if array contains the UUID
    
    if (purposeIds.length > 0) {
      console.log('🎯 Filtering by purpose IDs:', purposeIds)
      // Use filter with PostgREST cs (contains) operator for JSONB arrays
      // Format: purposes.cs.["uuid"]
      const purposeIdToUse = purposeIds[0] // Use first one for now
      query = query.filter('purposes', 'cs', `["${purposeIdToUse}"]`)
    } else if (purposeId) {
      console.log('🎯 Filtering by single purpose ID:', purposeId)
      // Single purpose filter - use filter with cs operator
      query = query.filter('purposes', 'cs', `["${purposeId}"]`)
    }
    
    if (propertyTypeId) {
      console.log('🎯 Filtering by property type ID:', propertyTypeId)
      query = query.filter('types', 'cs', `["${propertyTypeId}"]`)
    }
    
    if (categoryId) {
      console.log('🎯 Filtering by category ID:', categoryId)
      query = query.filter('categories', 'cs', `["${categoryId}"]`)
    }
    
    // listing_types.database is an array of UUID strings within a JSONB object
    if (subtypeIds.length > 0) {
      console.log('🎯 Filtering by subtype IDs:', subtypeIds)
      // Use filter with cs operator for nested JSONB array
      const subtypeIdToUse = subtypeIds[0]
      query = query.filter('listing_types->database', 'cs', `["${subtypeIdToUse}"]`)
    } else if (subtypeId) {
      console.log('🎯 Filtering by single subtype ID:', subtypeId)
      // Single subtype filter - use filter with cs operator
      query = query.filter('listing_types->database', 'cs', `["${subtypeId}"]`)
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
    
    // Filter by specifications object if provided
    if (specifications && Object.keys(specifications).length > 0) {
      console.log('🎯 Filtering by specifications:', specifications)
      Object.entries(specifications).forEach(([key, value]) => {
        // Skip empty values
        if (value === undefined || value === null || value === '') return
        
        // Handle numeric specifications (use gte for >= comparison)
        if (typeof value === 'number') {
          query = query.gte(`specifications->${key}`, value)
        } 
        // Handle string specifications (exact match)
        else if (typeof value === 'string') {
          query = query.eq(`specifications->${key}`, value)
        }
      })
    }

    // Apply ordering and pagination AFTER all filters
    query = query.order('created_at', { ascending: false })
    query = query.range(offset, offset + limit - 1)

    const { data: listings, error, count } = await query

    if (error) {
      console.error('Error fetching listings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch listings', details: error.message },
        { status: 500 }
      )
    }

    // Collect all unique IDs for joins
    const purposeIdsSet = new Set()
    const typeIdsSet = new Set()
    const subtypeIdsSet = new Set()

    listings?.forEach(listing => {
      // Collect purpose IDs
      if (Array.isArray(listing.purposes)) {
        listing.purposes.forEach(id => purposeIdsSet.add(id))
      }
      // Collect type IDs
      if (Array.isArray(listing.types)) {
        listing.types.forEach(id => typeIdsSet.add(id))
      }
      // Collect subtype IDs from listing_types.database
      if (listing.listing_types?.database && Array.isArray(listing.listing_types.database)) {
        listing.listing_types.database.forEach(id => subtypeIdsSet.add(id))
      }
    })

    // Fetch purpose names
    const purposeIdsArray = Array.from(purposeIdsSet)
    let purposeNames = {}
    if (purposeIdsArray.length > 0) {
      const { data: purposes } = await supabase
        .from('property_purposes')
        .select('id, name')
        .in('id', purposeIdsArray)
      
      if (purposes) {
        purposeNames = purposes.reduce((acc, purpose) => {
          acc[purpose.id] = purpose.name
          return acc
        }, {})
      }
    }

    // Fetch type names
    const typeIdsArray = Array.from(typeIdsSet)
    let typeNames = {}
    if (typeIdsArray.length > 0) {
      const { data: types } = await supabase
        .from('property_types')
        .select('id, name')
        .in('id', typeIdsArray)
      
      if (types) {
        typeNames = types.reduce((acc, type) => {
          acc[type.id] = type.name
          return acc
        }, {})
      }
    }

    // Fetch subtype names
    const subtypeIdsArray = Array.from(subtypeIdsSet)
    let subtypeNames = {}
    if (subtypeIdsArray.length > 0) {
      const { data: subtypes } = await supabase
        .from('property_subtypes')
        .select('id, name')
        .in('id', subtypeIdsArray)
      
      if (subtypes) {
        subtypeNames = subtypes.reduce((acc, subtype) => {
          acc[subtype.id] = subtype.name
          return acc
        }, {})
      }
    }

    // Transform the data to match the expected format
    const transformedListings = (listings || []).map(listing => {
      // Get purpose names
      const purposeNamesList = Array.isArray(listing.purposes) 
        ? listing.purposes.map(id => purposeNames[id]).filter(Boolean)
        : []
      const primaryPurpose = purposeNamesList[0] || null

      // Get type names
      const typeNamesList = Array.isArray(listing.types)
        ? listing.types.map(id => typeNames[id]).filter(Boolean)
        : []
      const primaryType = typeNamesList[0] || null

      // Get subtype names
      const subtypeNamesList = listing.listing_types?.database && Array.isArray(listing.listing_types.database)
        ? listing.listing_types.database.map(id => subtypeNames[id]).filter(Boolean)
        : []
      const primarySubtype = subtypeNamesList[0] || null

      return {
        id: listing.id,
        slug: listing.slug,
        propertyName: listing.title,
        description: listing.description,
        price: parseFloat(listing.price) || 0,
        currency: listing.currency || 'GHS',
        duration: listing.duration || 'monthly',
        priceType: listing.price_type || 'rent',
        listingType: listing.listing_type,
        purposes: listing.purposes || [],
        purpose_names: purposeNamesList,
        purpose_name: primaryPurpose,
        types: listing.types || [],
        type_names: typeNamesList,
        type_name: primaryType,
        subtypes: listing.listing_types?.database || [],
        subtype_names: subtypeNamesList,
        subtype_name: primarySubtype,
        categorization: {
          purpose: primaryPurpose || 'Rent',
          type: primaryType || 'Property',
          category: 'Residential', // Categories would need similar join if needed
          subtype: primarySubtype || 'Apartment'
        },
        specifications: listing.specifications || {},
        details: {
          bedrooms: listing.specifications?.bedrooms || 0,
          washrooms: listing.specifications?.bathrooms || 0,
          areaSqFt: listing.specifications?.property_size || listing.specifications?.size || 0,
          areaSqm: Math.round((listing.specifications?.property_size || listing.specifications?.size || 0) * 0.092903),
          area: listing.specifications?.property_size || listing.specifications?.size || 0,
          floorArea: listing.specifications?.property_size || listing.specifications?.size || 0
        },
        address: {
          state: listing.state || '',
          city: listing.city || '',
          neighborhood: listing.town || '',
          country: listing.country || ''
        },
        latitude: listing.latitude,
        longitude: listing.longitude,
        projectImages: listing.media?.albums?.flatMap(album => 
          album?.images?.map(img => img.url) || []
        ) || [],
        isFeatured: listing.is_featured || false,
        isVerified: listing.is_verified || false,
        isPremium: listing.is_premium || false,
        createdAt: listing.created_at,
        status: listing.status || 'Available',
        available_from: listing.available_from || null
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: transformedListings,
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: (offset + limit) < (count || 0)
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
