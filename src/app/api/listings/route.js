import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 12
    const search = searchParams.get('search') || ''
    const listingType = searchParams.get('listing_type') || ''
    const purpose = searchParams.get('purpose') || ''
    const category = searchParams.get('category') || ''
    const location = searchParams.get('location') || ''
    const priceMin = searchParams.get('price_min') || ''
    const priceMax = searchParams.get('price_max') || ''
    const priceType = searchParams.get('price_type') || ''
    const offset = (page - 1) * limit

    // Build query for listings
    let query = supabase
      .from('listings')
      .select('*')
      .eq('listing_status', 'published')
      .order('created_at', { ascending: false })

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (listingType) {
      query = query.eq('listing_type', listingType)
    }

    if (purpose) {
      query = query.contains('purposes', [purpose])
    }

    if (category) {
      query = query.contains('categories', [category])
    }

    if (location) {
      query = query.or(`city.ilike.%${location}%,state.ilike.%${location}%,country.ilike.%${location}%`)
    }

    if (priceMin) {
      query = query.gte('price', priceMin)
    }

    if (priceMax) {
      query = query.lte('price', priceMax)
    }

    if (priceType) {
      query = query.eq('price_type', priceType)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: listings, error } = await query

    if (error) {
      console.error('Error fetching listings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch listings' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('listing_status', 'published')

    // Apply same filters for count
    if (search) {
      countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }
    if (listingType) {
      countQuery = countQuery.eq('listing_type', listingType)
    }
    if (purpose) {
      countQuery = countQuery.contains('purposes', [purpose])
    }
    if (category) {
      countQuery = countQuery.contains('categories', [category])
    }
    if (location) {
      countQuery = countQuery.or(`city.ilike.%${location}%,state.ilike.%${location}%,country.ilike.%${location}%`)
    }
    if (priceMin) {
      countQuery = countQuery.gte('price', priceMin)
    }
    if (priceMax) {
      countQuery = countQuery.lte('price', priceMax)
    }
    if (priceType) {
      countQuery = countQuery.eq('price_type', priceType)
    }

    const { count: totalCount } = await countQuery

    return NextResponse.json({ 
      success: true,
      data: listings || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Get listings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}